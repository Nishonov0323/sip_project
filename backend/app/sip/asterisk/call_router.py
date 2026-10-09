import logging
from dataclasses import dataclass
from uuid import uuid4

from app.core.exceptions import SipProviderError
from app.sip.asterisk.client import AriClient
from app.sip.events import SipEvent, SipEventHandler, SipEventType

logger = logging.getLogger(__name__)

AUTO_CALLER = "Avto-qo'ng'iroq"


@dataclass(slots=True)
class _Leg:
    bridge_id: str
    caller_id: str
    callee_id: str | None = None
    caller_number: str = ""
    callee_number: str = ""
    answered: bool = False


@dataclass(slots=True)
class _Playback:
    channel_id: str
    callee_number: str
    media: str
    audio_name: str
    record_name: str
    recording: bool = False


class CallRouter:
    """Stasis'ga tushgan qo'ng'iroqlarni boshqaradi va hodisalar chiqaradi.

    1) Oddiy qo'ng'iroq (abonent -> abonent):
      - Dialplan: Stasis(sip_app,dial,<raqam>) -> kiruvchi kanal Stasis'ga tushadi.
      - Bridge yaratiladi, chaquvchi unga qo'shiladi, qabul qiluvchiga originate qilinadi.
      - Qabul qiluvchi javob bersa bridge'ga qo'shiladi va butun suhbat (ikki tomon) yoziladi.
      - Istalgan tomon tugatsa: ikkinchi kanal uziladi, bridge o'chiriladi.

    2) Avto-qo'ng'iroq (audio ijro + javobni yozish):
      - Raqamga originate qilinadi (appArgs=playback).
      - Javob berilgach audio ijro etiladi (PlaybackFinished), so'ng javob yoziladi.
      - Yozish tugagach (jimlik yoki vaqt chegarasi) qo'ng'iroq uziladi.
    """

    def __init__(
        self,
        client: AriClient,
        emit: SipEventHandler,
        *,
        dial_template: str = "PJSIP/{number}",
        call_record_max_seconds: int = 3600,
        reply_max_seconds: int = 60,
        reply_max_silence: int = 4,
    ) -> None:
        self._client = client
        self._emit = emit
        self._dial_template = dial_template
        self._call_record_max = call_record_max_seconds
        self._reply_max = reply_max_seconds
        self._reply_silence = reply_max_silence
        self._by_bridge: dict[str, _Leg] = {}
        self._by_channel: dict[str, _Leg] = {}
        self._playbacks: dict[str, _Playback] = {}
        self._recording_owner: dict[str, str] = {}  # yozuv nomi -> qo'ng'iroq channel_id

    def endpoint_for(self, number: str) -> str:
        return self._dial_template.format(number=number)

    async def handle(self, event: dict) -> None:
        etype = event.get("type")
        if etype == "StasisStart":
            args = event.get("args") or []
            channel = event["channel"]
            if args[:1] == ["dial"] and len(args) > 1:
                await self._start_dial(channel, callee=args[1])
            elif args[:1] == ["dialed"] and len(args) > 1:
                await self._join_callee(channel, bridge_id=args[1])
            elif args[:1] == ["playback"]:
                await self._on_playback_answered(channel)
        elif etype == "PlaybackFinished":
            target = event.get("playback", {}).get("target_uri", "")
            await self._record_reply(target.removeprefix("channel:"))
        elif etype == "RecordingFinished":
            await self._on_recording_done(event["recording"]["name"], ok=True)
        elif etype == "RecordingFailed":
            await self._on_recording_done(event["recording"]["name"], ok=False)
        elif etype in ("StasisEnd", "ChannelDestroyed"):
            await self._teardown(event["channel"]["id"])

    # --- avto-qo'ng'iroq -------------------------------------------------

    async def start_playback_call(self, to_number: str, media: str, audio_name: str) -> str:
        # channel_id'ni oldindan o'zimiz beramiz: hodisalar kelganda yozuv allaqachon tayyor bo'ladi.
        channel_id = f"playback-{uuid4().hex[:12]}"
        self._playbacks[channel_id] = _Playback(
            channel_id=channel_id,
            callee_number=to_number,
            media=media,
            audio_name=audio_name,
            record_name=f"reply-{channel_id}",
        )
        await self._emit(
            SipEvent(
                SipEventType.CALL_STARTED,
                channel_id,
                AUTO_CALLER,
                to_number,
                kind="playback",
                audio_name=audio_name,
            )
        )
        try:
            await self._client.originate_into_app(
                endpoint=self.endpoint_for(to_number),
                app_args="playback",
                channel_id=channel_id,
            )
        except SipProviderError:
            await self._teardown(channel_id)
            raise
        return channel_id

    async def _on_playback_answered(self, channel: dict) -> None:
        session = self._playbacks.get(channel["id"])
        if session is None:
            await self._safe_hangup(channel["id"])
            return
        await self._emit(
            SipEvent(
                SipEventType.CALL_ANSWERED,
                session.channel_id,
                AUTO_CALLER,
                session.callee_number,
                kind="playback",
                audio_name=session.audio_name,
            )
        )
        try:
            await self._client.play(session.channel_id, session.media)
        except SipProviderError:
            logger.exception("Audioni ijro etib bo'lmadi: %s", session.media)
            await self._safe_hangup(session.channel_id)

    async def _record_reply(self, channel_id: str) -> None:
        session = self._playbacks.get(channel_id)
        if session is None or session.recording:
            return
        session.recording = True
        self._recording_owner[session.record_name] = channel_id
        try:
            await self._client.record_channel(
                channel_id, session.record_name, self._reply_max, self._reply_silence
            )
        except SipProviderError:
            logger.exception("Javobni yozishni boshlab bo'lmadi")
            self._recording_owner.pop(session.record_name, None)
            await self._safe_hangup(channel_id)

    async def _on_recording_done(self, name: str, *, ok: bool) -> None:
        owner = self._recording_owner.pop(name, None)
        if owner is None:
            return
        if ok:
            await self._emit(
                SipEvent(SipEventType.RECORDING_READY, owner, recording_name=name)
            )
        else:
            logger.warning("Yozuv muvaffaqiyatsiz tugadi: %s", name)
        if owner in self._playbacks:  # avto-qo'ng'iroq: javob yozildi — uzamiz
            await self._safe_hangup(owner)

    # --- oddiy qo'ng'iroq ------------------------------------------------

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
                endpoint=self.endpoint_for(callee),
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

        # Butun suhbat (ikki tomon aralashgan holda) bridge orqali yoziladi.
        name = f"call-{leg.caller_id}"
        self._recording_owner[name] = leg.caller_id
        try:
            await self._client.record_bridge(bridge_id, name, self._call_record_max)
        except SipProviderError:
            logger.warning("Suhbatni yozishni boshlab bo'lmadi", exc_info=True)
            self._recording_owner.pop(name, None)

    # --- umumiy ----------------------------------------------------------

    async def _safe_hangup(self, channel_id: str) -> None:
        try:
            await self._client.hangup(channel_id)
        except SipProviderError:
            pass

    async def _teardown(self, channel_id: str) -> None:
        session = self._playbacks.pop(channel_id, None)
        if session is not None:
            await self._emit(
                SipEvent(
                    SipEventType.CALL_ENDED,
                    session.channel_id,
                    AUTO_CALLER,
                    session.callee_number,
                    kind="playback",
                    audio_name=session.audio_name,
                )
            )
            return

        leg = self._by_channel.pop(channel_id, None)
        if leg is None:
            return
        self._by_bridge.pop(leg.bridge_id, None)
        other = leg.callee_id if channel_id == leg.caller_id else leg.caller_id
        if other:
            self._by_channel.pop(other, None)
            await self._safe_hangup(other)
        try:
            await self._client.destroy_bridge(leg.bridge_id)
        except SipProviderError:
            pass
        await self._emit(
            SipEvent(SipEventType.CALL_ENDED, leg.caller_id, leg.caller_number, leg.callee_number)
        )
