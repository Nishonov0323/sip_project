import asyncio
import logging
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.exceptions import BadRequestError, ConflictError, NotFoundError
from app.db.session import SessionLocal
from app.models.call import CallStatus
from app.models.campaign import Campaign, CampaignStatus, CampaignTarget, TargetStatus
from app.repositories.audio_repository import AudioRepository
from app.repositories.campaign_repository import CampaignRepository
from app.repositories.contact_repository import ContactRepository
from app.schemas.campaign import CampaignCreate, CampaignDetail, CampaignRead, TargetRead
from app.sip.base import SipProvider
from app.ws.manager import ConnectionManager

logger = logging.getLogger(__name__)

POLL_SECONDS = 1.0


class CampaignRunner:
    """Ommaviy qo'ng'iroqlarni fonda bajaradi: kontaktlarga ketma-ket (cheklangan parallellik bilan) qo'ng'iroq qiladi.

    Holat bazada saqlanadi; xotirada faqat ishlayotgan task'lar va faol kanallar turadi.
    """

    def __init__(self, provider: SipProvider, ws: ConnectionManager, settings: Settings) -> None:
        self._provider = provider
        self._ws = ws
        self._concurrency = max(1, settings.campaign_concurrency)
        self._timeout = settings.campaign_call_timeout
        self._tasks: dict[int, asyncio.Task] = {}
        self._active: dict[int, set[str]] = {}

    async def recover(self) -> None:
        async with SessionLocal() as session:
            await CampaignRepository(session).mark_running_interrupted()

    def start(self, campaign_id: int) -> None:
        task = asyncio.create_task(self._run(campaign_id), name=f"campaign-{campaign_id}")
        self._tasks[campaign_id] = task
        task.add_done_callback(lambda _: self._tasks.pop(campaign_id, None))

    async def cancel(self, campaign_id: int) -> None:
        async with SessionLocal() as session:
            repo = CampaignRepository(session)
            campaign = await repo.get(campaign_id)
            if campaign is None:
                raise NotFoundError("Ommaviy qo'ng'iroq topilmadi")
            if campaign.status != CampaignStatus.RUNNING.value:
                raise ConflictError("Ommaviy qo'ng'iroq allaqachon tugagan")
            campaign.status = CampaignStatus.CANCELLED.value
            await repo.save(campaign)
            await repo.cancel_pending(campaign_id)
        for channel_id in list(self._active.get(campaign_id, ())):
            try:
                await self._provider.hangup(channel_id)
            except Exception:  # noqa: BLE001 — qo'ng'iroq allaqachon tugagan bo'lishi mumkin
                logger.debug("Hangup failed for %s", channel_id)
        await self._notify(campaign_id)

    async def shutdown(self) -> None:
        for task in list(self._tasks.values()):
            task.cancel()
        await asyncio.gather(*self._tasks.values(), return_exceptions=True)

    async def _run(self, campaign_id: int) -> None:
        try:
            await asyncio.gather(*(self._worker(campaign_id) for _ in range(self._concurrency)))
            async with SessionLocal() as session:
                repo = CampaignRepository(session)
                campaign = await repo.get(campaign_id)
                if campaign and campaign.status == CampaignStatus.RUNNING.value:
                    campaign.status = CampaignStatus.FINISHED.value
                    await repo.save(campaign)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("Campaign %s crashed", campaign_id)
        finally:
            self._active.pop(campaign_id, None)
            await self._notify(campaign_id)

    async def _worker(self, campaign_id: int) -> None:
        while True:
            async with SessionLocal() as session:
                repo = CampaignRepository(session)
                campaign = await repo.get(campaign_id)
                if campaign is None or campaign.status != CampaignStatus.RUNNING.value:
                    return
                target = await repo.claim_next_pending(campaign_id)
                if target is None:
                    return
                audio = (
                    await AudioRepository(session).get(campaign.audio_id)
                    if campaign.audio_id
                    else None
                )
                await self._notify(campaign_id)
                await self._dial(repo, campaign_id, target, audio)
            await self._notify(campaign_id)

    async def _dial(self, repo: CampaignRepository, campaign_id: int, target, audio) -> None:
        if audio is None:
            await self._finish(repo, target, TargetStatus.FAILED, "Audio o'chirilgan")
            return
        try:
            channel_id = await self._provider.originate_playback(
                target.phone, audio.filename, audio.name
            )
        except Exception as exc:  # noqa: BLE001 — SIP xatosi bitta qabul qiluvchini buzmasligi kerak
            message = getattr(exc, "message", None) or str(exc) or exc.__class__.__name__
            await self._finish(repo, target, TargetStatus.FAILED, message[:255])
            return

        target.channel_id = channel_id
        await repo.save(target)
        self._active.setdefault(campaign_id, set()).add(channel_id)
        try:
            answered = await self._wait_for_end(repo, channel_id)
        finally:
            self._active.get(campaign_id, set()).discard(channel_id)

        campaign = await repo.get(campaign_id)
        await repo.refresh(campaign)
        cancelled = campaign.status == CampaignStatus.CANCELLED.value
        if answered:
            status = TargetStatus.ANSWERED
        else:
            status = TargetStatus.CANCELLED if cancelled else TargetStatus.NO_ANSWER
        await self._finish(repo, target, status)

    async def _wait_for_end(self, repo: CampaignRepository, channel_id: str) -> bool:
        """Qo'ng'iroq tugaguncha kutadi. Javob berilgan bo'lsa True."""
        waited = 0.0
        while True:
            await asyncio.sleep(POLL_SECONDS)
            waited += POLL_SECONDS
            call = (await repo.calls_by_channel([channel_id])).get(channel_id)
            if call is not None:
                await repo.refresh(call)
                if call.status == CallStatus.ENDED.value:
                    return call.answered_at is not None
            if waited >= self._timeout:
                logger.warning("Campaign call %s timed out, hanging up", channel_id)
                try:
                    await self._provider.hangup(channel_id)
                except Exception:  # noqa: BLE001
                    pass
                return call is not None and call.answered_at is not None

    async def _finish(
        self, repo: CampaignRepository, target: CampaignTarget, status: TargetStatus, error=None
    ) -> None:
        target.status = status.value
        target.error = error
        await repo.save(target)

    async def _notify(self, campaign_id: int) -> None:
        await self._ws.broadcast({"type": "campaign_updated", "campaign_id": campaign_id})


class CampaignService:
    def __init__(self, session: AsyncSession, runner: CampaignRunner) -> None:
        self._repo = CampaignRepository(session)
        self._contacts = ContactRepository(session)
        self._audio = AudioRepository(session)
        self._runner = runner

    async def create(self, data: CampaignCreate) -> CampaignRead:
        audio = await self._audio.get(data.audio_id)
        if audio is None:
            raise NotFoundError("Audio topilmadi")

        if data.contact_ids:
            contacts = await self._contacts.get_many(list(set(data.contact_ids)))
        else:
            contacts = await self._contacts.find_all(data.filter)
        if not contacts:
            raise BadRequestError("Qo'ng'iroq qilish uchun kontakt tanlanmagan")

        name = (data.name or "").strip() or f"{audio.name} — {datetime.now():%d.%m %H:%M}"
        campaign = await self._repo.add(
            Campaign(name=name[:128], audio_id=audio.id, audio_name=audio.name),
            [
                CampaignTarget(contact_id=c.id, full_name=c.full_name, phone=c.phone)
                for c in contacts
            ],
        )
        self._runner.start(campaign.id)
        return await self._read(campaign)

    async def list_all(self) -> list[CampaignRead]:
        campaigns = await self._repo.list_recent()
        counts = await self._repo.counts([c.id for c in campaigns])
        return [self._summary(c, counts.get(c.id)) for c in campaigns]

    async def detail(self, campaign_id: int) -> CampaignDetail:
        campaign = await self._get(campaign_id)
        targets = await self._repo.targets(campaign_id)
        calls = await self._repo.calls_by_channel([t.channel_id for t in targets if t.channel_id])
        rows = []
        for t in targets:
            call = calls.get(t.channel_id) if t.channel_id else None
            row = TargetRead.model_validate(t)
            if call is not None:
                row.call_id = call.id
                row.has_recording = call.has_recording
                row.transcript = call.transcript
                row.duration_seconds = call.duration_seconds
            rows.append(row)
        base = await self._read(campaign)
        return CampaignDetail(**base.model_dump(), targets=rows)

    async def cancel(self, campaign_id: int) -> CampaignRead:
        await self._get(campaign_id)
        await self._runner.cancel(campaign_id)
        return await self._read(await self._get(campaign_id))

    async def _get(self, campaign_id: int) -> Campaign:
        campaign = await self._repo.get(campaign_id)
        if campaign is None:
            raise NotFoundError("Ommaviy qo'ng'iroq topilmadi")
        return campaign

    async def _read(self, campaign: Campaign) -> CampaignRead:
        counts = await self._repo.counts([campaign.id])
        return self._summary(campaign, counts.get(campaign.id))

    @staticmethod
    def _summary(campaign: Campaign, counts: tuple[int, int, int] | None) -> CampaignRead:
        total, done, answered = counts or (0, 0, 0)
        read = CampaignRead.model_validate(campaign)
        read.total, read.done, read.answered = total, done, answered
        return read
