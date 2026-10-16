from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.call import Call
from app.models.campaign import Campaign, CampaignStatus, CampaignTarget, TargetStatus

_FINISHED = (
    TargetStatus.ANSWERED.value,
    TargetStatus.NO_ANSWER.value,
    TargetStatus.FAILED.value,
    TargetStatus.CANCELLED.value,
)


class CampaignRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get(self, campaign_id: int) -> Campaign | None:
        return await self._session.get(Campaign, campaign_id)

    async def list_recent(self, limit: int = 50) -> list[Campaign]:
        result = await self._session.execute(
            select(Campaign).order_by(Campaign.id.desc()).limit(limit)
        )
        return list(result.scalars())

    async def counts(self, campaign_ids: list[int]) -> dict[int, tuple[int, int, int]]:
        """campaign_id -> (jami, yakunlangan, javob bergan)."""
        if not campaign_ids:
            return {}
        stmt = (
            select(
                CampaignTarget.campaign_id,
                func.count(CampaignTarget.id),
                func.count(CampaignTarget.id).filter(CampaignTarget.status.in_(_FINISHED)),
                func.count(CampaignTarget.id).filter(
                    CampaignTarget.status == TargetStatus.ANSWERED.value
                ),
            )
            .where(CampaignTarget.campaign_id.in_(campaign_ids))
            .group_by(CampaignTarget.campaign_id)
        )
        rows = (await self._session.execute(stmt)).all()
        return {cid: (t, d, a) for cid, t, d, a in rows}

    async def add(self, campaign: Campaign, targets: list[CampaignTarget]) -> Campaign:
        self._session.add(campaign)
        await self._session.flush()
        for t in targets:
            t.campaign_id = campaign.id
        self._session.add_all(targets)
        await self._session.commit()
        await self._session.refresh(campaign)
        return campaign

    async def targets(self, campaign_id: int) -> list[CampaignTarget]:
        result = await self._session.execute(
            select(CampaignTarget)
            .where(CampaignTarget.campaign_id == campaign_id)
            .order_by(CampaignTarget.id)
        )
        return list(result.scalars())

    async def claim_next_pending(self, campaign_id: int) -> CampaignTarget | None:
        """Keyingi kutayotgan qabul qiluvchini olib, "calling" holatiga o'tkazadi."""
        result = await self._session.execute(
            select(CampaignTarget)
            .where(
                CampaignTarget.campaign_id == campaign_id,
                CampaignTarget.status == TargetStatus.PENDING.value,
            )
            .order_by(CampaignTarget.id)
            .limit(1)
            .with_for_update(skip_locked=True)
        )
        target = result.scalar_one_or_none()
        if target is not None:
            target.status = TargetStatus.CALLING.value
            await self._session.commit()
            await self._session.refresh(target)
        return target

    async def calls_by_channel(self, channel_ids: list[str]) -> dict[str, Call]:
        if not channel_ids:
            return {}
        result = await self._session.execute(select(Call).where(Call.channel_id.in_(channel_ids)))
        return {c.channel_id: c for c in result.scalars()}

    async def save(self, obj) -> None:
        await self._session.commit()
        await self._session.refresh(obj)

    async def cancel_pending(self, campaign_id: int) -> None:
        for t in await self.targets(campaign_id):
            if t.status == TargetStatus.PENDING.value:
                t.status = TargetStatus.CANCELLED.value
        await self._session.commit()

    async def mark_running_interrupted(self) -> None:
        """Server qayta ishga tushganda: davom etayotgan kampaniyalar to'xtab qolgan hisoblanadi."""
        running = await self._session.execute(
            select(Campaign).where(Campaign.status == CampaignStatus.RUNNING.value)
        )
        for c in running.scalars():
            c.status = CampaignStatus.INTERRUPTED.value
        calling = await self._session.execute(
            select(CampaignTarget).where(CampaignTarget.status == TargetStatus.CALLING.value)
        )
        for t in calling.scalars():
            t.status = TargetStatus.FAILED.value
            t.error = "Server qayta ishga tushdi"
        await self._session.commit()

    async def refresh(self, obj) -> None:
        await self._session.refresh(obj)
