import asyncio
import json
import logging
from collections.abc import Awaitable, Callable

import websockets

logger = logging.getLogger(__name__)

AriEventCallback = Callable[[dict], Awaitable[None]]


class AriEventListener:
    """ARI WebSocket'ga ulanib, hodisalarni callback'ga uzatadi (avto-reconnect bilan)."""

    def __init__(
        self, ws_url: str, app: str, user: str, password: str, on_event: AriEventCallback
    ) -> None:
        self._url = f"{ws_url}?app={app}&api_key={user}:{password}"
        self._on_event = on_event

    async def run(self) -> None:
        delay = 1.0
        while True:
            try:
                async with websockets.connect(self._url) as ws:
                    logger.info("ARI WebSocket ulandi")
                    delay = 1.0
                    async for raw in ws:
                        try:
                            await self._on_event(json.loads(raw))
                        except Exception:
                            logger.exception("ARI hodisasini qayta ishlashda xato")
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.warning("ARI WebSocket uzildi (%s), %.0fs dan so'ng qayta uriniladi", exc, delay)
            await asyncio.sleep(delay)
            delay = min(delay * 2, 30.0)
