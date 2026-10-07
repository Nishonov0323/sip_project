from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import setup_logging
from app.services.call_event_service import CallEventService
from app.sip.factory import create_sip_provider
from app.ws.manager import ws_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_logging()
    provider = create_sip_provider(settings)
    provider.subscribe(CallEventService(ws_manager).handle)
    app.state.sip_provider = provider
    await provider.start()
    try:
        yield
    finally:
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
