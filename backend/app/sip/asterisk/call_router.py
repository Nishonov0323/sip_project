import logging
from dataclasses import dataclass

from app.core.exceptions import SipProviderError
from app.sip.asterisk.client import AriClient
from app.sip.events import SipEvent, SipEventHandler, SipEventType

logger = logging.getLogger(__name__)


@dataclass(slots=True)
class _Leg:
    bridge_id: str
    caller_id: str
    callee_id: str | None = None
    caller_number: str = ""
    callee_number: str = ""
    answered: bool = False


class CallRouter:
    """Dialplan'dan Stasis'ga tushgan qo'ng'iroqlarni ulaydi (bridge) va hodisalar chiqaradi.

    Oqim:
      1. Dialplan: Stasis(sip_app,dial,<raqam>)  -> kiruvchi kanal Stasis'ga tushadi.
      2. Bridge yaratiladi, chaquvchi unga qo'shiladi, qabul qiluvchiga originate qilinadi.
      3. Qabul qiluvchi javob bersa: "dialed" sifatida Stasis'ga tushadi va bridge'ga qo'shiladi.
      4. Istalgan tomon tugatsa: ikkinchi kanal uziladi, bridge o'chiriladi.
    """

    def __init__(self, client: AriClient, emit: SipEventHandler) -> None:
        self._client = client
        self._emit = emit
        self._by_bridge: dict[str, _Leg] = {}
        self._by_channel: dict[str, _Leg] = {}

    async def handle(self, event: dict) -> None:
        etype = event.get("type")
        if etype == "StasisStart":
            args = event.get("args") or []
            channel = event["channel"]
            if args[:1] == ["dial"] and len(args) > 1:
                await self._start_dial(channel, callee=args[1])
            elif args[:1] == ["dialed"] and len(args) > 1:
                await self._join_callee(channel, bridge_id=args[1])
        elif etype in ("StasisEnd", "ChannelDestroyed"):
            await self._teardown(event["channel"]["id"])

    async def _start_dial(self, channel: dict, callee: str) -> None:
        caller_number = channel.get("caller", {}).get("number", "")
        bridge = await self._client.create_bridge()
        leg = _Leg(
            bridge_id=bridge["id"],
            caller_id=channel["id"],
            caller_number=caller_number,
            callee_number=callee,
        )
        self._by_bridge[leg.bridge_id] = leg
        self._by_channel[leg.caller_id] = leg

        await self._client.add_to_bridge(leg.bridge_id, leg.caller_id)
        await self._client.ring(leg.caller_id)
        await self._emit(
            SipEvent(SipEventType.CALL_STARTED, leg.caller_id, caller_number, callee)
        )

        try:
            outgoing = await self._client.originate_into_app(
                endpoint=f"PJSIP/{callee}",
                app_args=f"dialed,{leg.bridge_id}",
                caller_id=caller_number,
            )
        except SipProviderError:
            logger.exception("Qabul qiluvchiga qo'ng'iroq qilib bo'lmadi: %s", callee)
            await self._teardown(leg.caller_id)
            return
        leg.callee_id = outgoing["id"]
        self._by_channel[leg.callee_id] = leg

    async def _join_callee(self, channel: dict, bridge_id: str) -> None:
        leg = self._by_bridge.get(bridge_id)
        if leg is None:
            await self._client.hangup(channel["id"])
            return
        await self._client.add_to_bridge(bridge_id, channel["id"])
        await self._client.answer(leg.caller_id)
        leg.answered = True
        await self._emit(
            SipEvent(
                SipEventType.CALL_ANSWERED, leg.caller_id, leg.caller_number, leg.callee_number
            )
        )

    async def _teardown(self, channel_id: str) -> None:
        leg = self._by_channel.pop(channel_id, None)
        if leg is None:
            return
        self._by_bridge.pop(leg.bridge_id, None)
        other = leg.callee_id if channel_id == leg.caller_id else leg.caller_id
        if other:
            self._by_channel.pop(other, None)
            try:
                await self._client.hangup(other)
            except SipProviderError:
                pass
        try:
            await self._client.destroy_bridge(leg.bridge_id)
        except SipProviderError:
            pass
        await self._emit(
            SipEvent(SipEventType.CALL_ENDED, leg.caller_id, leg.caller_number, leg.callee_number)
        )
