import asyncio
import logging

from app.core.config import Settings
from app.sip.asterisk.call_router import CallRouter
from app.sip.asterisk.client import AriClient
from app.sip.asterisk.listener import AriEventListener
from app.sip.base import ChannelInfo, SipProvider
from app.sip.events import SipEvent

logger = logging.getLogger(__name__)


class AsteriskProvider(SipProvider):
    name = "asterisk"

    def __init__(self, settings: Settings) -> None:
        super().__init__()
        self._context = settings.sip_dialplan_context
        self._client = AriClient(
            settings.ari_base_url, settings.ari_user, settings.ari_password, settings.ari_app
        )
        self._router = CallRouter(self._client, self._emit)
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

    async def originate(self, from_extension: str, to_number: str) -> str:
        channel = await self._client.originate_via_dialplan(
            endpoint=f"PJSIP/{from_extension}",
            extension=to_number,
            context=self._context,
            caller_id=from_extension,
        )
        return channel["id"]

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
