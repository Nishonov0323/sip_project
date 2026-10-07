from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.ws.manager import ws_manager

router = APIRouter(tags=["events"])


@router.websocket("/ws/events")
async def events_socket(ws: WebSocket) -> None:
    await ws_manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # klientdan keladigan xabarlar e'tiborsiz (keepalive)
    except WebSocketDisconnect:
        ws_manager.disconnect(ws)
