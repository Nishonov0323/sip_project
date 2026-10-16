from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.services.call_event_service import CallEventService
from app.services.campaign_service import CampaignRunner
from app.services.transcription_service import TranscriptionService
from app.sip.factory import create_sip_provider
from app.ws.manager import ws_manager


def prepare_storage() -> None:
    """Audio va yozuv papkalari. Yozuvlarni Asterisk (boshqa foydalanuvchi) yozadi — shuning uchun 777."""
    Path(settings.sounds_dir).mkdir(parents=True, exist_ok=True)
    recordings = Path(settings.recordings_dir)
    recordings.mkdir(parents=True, exist_ok=True)
    recordings.chmod(0o777)


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    prepare_storage()
    transcriber = TranscriptionService(settings, ws_manager)
    provider = create_sip_provider(settings)
    provider.subscribe(CallEventService(ws_manager, transcriber).handle)
    app.state.sip_provider = provider
    app.state.transcriber = transcriber
    runner = CampaignRunner(provider, ws_manager, settings)
    app.state.campaign_runner = runner
    await provider.start()
    await runner.recover()
    try:
        yield
    finally:
        await runner.shutdown()
        await provider.stop()


def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name, debug=settings.debug, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    register_exception_handlers(app)
    app.include_router(api_router, prefix=settings.api_v1_prefix)
    return app


app = create_app()
