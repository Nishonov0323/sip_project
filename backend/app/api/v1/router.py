from fastapi import APIRouter

from app.api.v1.endpoints import audio, calls, events, extensions, health

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(audio.router)
api_router.include_router(extensions.router)
api_router.include_router(calls.router)
api_router.include_router(events.router)
