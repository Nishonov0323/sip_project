import asyncio
import logging

from app.core.config import Settings
from app.core.exceptions import EndpointOfflineError, SipNotFoundError
from app.sip.asterisk.call_router import CallRouter
from app.sip.asterisk.client import AriClient
from app.sip.asterisk.listener import AriEventListener
from app.sip.asterisk import accounts as pjsip_accounts
from app.sip.base import ChannelInfo, SipAccount, SipProvider
from app.sip.events import SipEvent

logger = logging.getLogger(__name__)


class AsteriskProvider(SipProvider):
    name = "asterisk"

    def __init__(self, settings: Settings) -> None:
        super().__init__()
        self._context = settings.sip_dialplan_context
        self._sound_prefix = settings.asterisk_sound_prefix
        self._accounts_file = settings.pjsip_accounts_file
        self._client = AriClient(
            settings.ari_base_url, settings.ari_user, settings.ari_password, settings.ari_app
        )
        self._router = CallRouter(
            self._client,
            self._emit,
            dial_template=settings.sip_dial_template,
            call_record_max_seconds=settings.call_record_max_seconds,
            reply_max_seconds=settings.reply_max_seconds,
            reply_max_silence=settings.reply_max_silence,
        )
        self._listener = AriEventListener(
            settings.ari_ws_url,
            settings.ari_app,
            settings.ari_user,
            settings.ari_password,
            self._router.handle,
        )
        self._task: asyncio.Task | None = None

    async def _emit(self, event: SipEvent) -> None:
        for handler in self._handlers:
            try:
                await handler(event)
            except Exception:
                logger.exception("SIP event handler xatosi")

    async def start(self) -> None:
        self._task = asyncio.create_task(self._listener.run(), name="ari-listener")

    async def stop(self) -> None:
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        await self._client.close()

    async def _ensure_online(self, extension: str) -> None:
        """Telefon ro'yxatdan o'tmagan bo'lsa, ARI'ning tushunarsiz xatosi o'rniga aniq xabar beradi."""
        try:
            endpoint = await self._client.get_endpoint("PJSIP", extension)
        except SipNotFoundError as exc:
            raise SipNotFoundError(
                f"{extension} raqami Asterisk'da sozlanmagan (SIP hisoblar sahifasidan qo'shing)"
            ) from exc
        if endpoint.get("state") != "online":
            raise EndpointOfflineError(
                f"{extension} raqami hozir offlayn. SIP telefonni shu raqam bilan "
                "ro'yxatdan o'tkazing (server: localhost:5060)"
            )

    async def originate(self, from_extension: str, to_number: str) -> str:
        await self._ensure_online(from_extension)
        channel = await self._client.originate_via_dialplan(
            endpoint=f"PJSIP/{from_extension}",
            extension=to_number,
            context=self._context,
            caller_id=from_extension,
        )
        return channel["id"]

    async def originate_playback(self, to_number: str, audio_key: str, audio_name: str) -> str:
        # Faqat PJSIP abonentlari uchun oldindan tekshiramiz (demo/Local kanallarda emas).
        if self._router.endpoint_for(to_number).startswith("PJSIP/"):
            await self._ensure_online(to_number)
        media = f"sound:{self._sound_prefix}/{audio_key}"
        return await self._router.start_playback_call(to_number, media, audio_name)

    async def hangup(self, channel_id: str) -> None:
        await self._client.hangup(channel_id)

    async def list_active_channels(self) -> list[ChannelInfo]:
        return [
            ChannelInfo(
                channel_id=ch["id"],
                state=ch.get("state", ""),
                caller=ch.get("caller", {}).get("number", ""),
                callee=ch.get("connected", {}).get("number", ""),
            )
            for ch in await self._client.list_channels()
        ]

    async def sync_accounts(self, accounts: list[SipAccount]) -> None:
        """Abonentlarni pjsip konfiguratsiya fayliga yozadi va Asterisk'ga qayta yuklashni buyuradi."""
        await asyncio.to_thread(
            pjsip_accounts.write_atomic, self._accounts_file, pjsip_accounts.render(accounts)
        )
        await self._client.reload_module("res_pjsip.so")

    async def online_numbers(self) -> set[str]:
        endpoints = await self._client.list_endpoints("PJSIP")
        return {e["resource"] for e in endpoints if e.get("state") == "online"}
