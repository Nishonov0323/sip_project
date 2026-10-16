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

    # Qabul qiluvchiga qo'ng'iroq qilish shabloni ({number} o'rniga raqam qo'yiladi)
    sip_dial_template: str = "PJSIP/{number}"

    # Audio fayllar va yozuvlar (Asterisk konteyneri bilan umumiy volume'lar)
    sounds_dir: str = "/data/sounds"
    recordings_dir: str = "/data/recordings"
    asterisk_sound_prefix: str = "custom"  # Asterisk'da: /var/lib/asterisk/sounds/custom
    max_upload_mb: int = 25
    reply_max_seconds: int = 60  # Avto-qo'ng'iroqda javobni yozish: eng ko'pi bilan
    reply_max_silence: int = 4  # shuncha soniya jimlikdan keyin yozish to'xtaydi
    call_record_max_seconds: int = 3600

    # Ommaviy qo'ng'iroq (kampaniya)
    campaign_concurrency: int = 2  # bir vaqtda nechta qo'ng'iroq
    campaign_call_timeout: int = 300  # bitta qo'ng'iroq uchun eng ko'pi bilan shuncha soniya

    # Matnga o'tkazish (OpenAI-mos /audio/transcriptions API: OpenAI, Groq, lokal Whisper server)
    stt_base_url: str = "https://api.openai.com/v1"
    stt_api_key: str = ""
    stt_model: str = "whisper-1"
    stt_language: str = "uz"

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
