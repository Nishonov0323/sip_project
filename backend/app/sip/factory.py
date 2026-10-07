from app.core.config import Settings
from app.sip.base import SipProvider


def create_sip_provider(settings: Settings) -> SipProvider:
    if settings.sip_provider == "asterisk":
        from app.sip.asterisk.provider import AsteriskProvider

        return AsteriskProvider(settings)
    raise ValueError(f"Noma'lum SIP provider: {settings.sip_provider}")
