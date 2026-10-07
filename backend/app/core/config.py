from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "SIP Project API"
    debug: bool = False
    log_level: str = "INFO"
    api_v1_prefix: str = "/api/v1"
    cors_origins: list[str] = Field(default_factory=lambda: ["http://localhost:5173"])

    database_url: str = "postgresql+asyncpg://sip:sip@postgres:5432/sip"

    # SIP provider
    sip_provider: str = "asterisk"
    sip_dialplan_context: str = "from-internal"

    # Asterisk ARI
    ari_base_url: str = "http://asterisk:8088/ari"
    ari_ws_url: str = "ws://asterisk:8088/ari/events"
    ari_user: str = "sipapp"
    ari_password: str = "sippass"
    ari_app: str = "sip_app"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
