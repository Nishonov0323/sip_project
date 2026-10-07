import logging

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    async def connect(self, ws: WebSocket) -> None:
        await ws.accept()
        self._connections.add(ws)

    def disconnect(self, ws: WebSocket) -> None:
        self._connections.discard(ws)

    async def broadcast(self, message: dict) -> None:
        for ws in list(self._connections):
            try:
                await ws.send_json(message)
            except Exception:
                logger.debug("WebSocket yuborib bo'lmadi, uziladi")
                self.disconnect(ws)


ws_manager = ConnectionManager()
