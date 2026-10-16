import os
from pathlib import Path

from app.sip.base import SipAccount

HEADER = "; Avtomatik yaratiladi (backend, SIP hisoblar sahifasi). Qo'lda tahrirlamang.\n"

_TEMPLATE = """
[{number}](endpoint-template)
auth = {number}
aors = {number}
callerid = "{name}" <{number}>

[{number}](auth-template)
username = {number}
password = {password}

[{number}](aor-template)
"""


def render(accounts: list[SipAccount]) -> str:
    blocks = [
        _TEMPLATE.format(
            number=a.number,
            name=a.display_name.replace('"', "").replace("\n", " ").replace(";", " "),
            password=a.password,
        )
        for a in accounts
    ]
    return HEADER + "".join(blocks)


def write_atomic(path: str, content: str) -> None:
    """Asterisk yarim yozilgan faylni o'qib qolmasligi uchun avval vaqtinchalik faylga yozamiz."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    tmp = target.with_suffix(".tmp")
    tmp.write_text(content, encoding="utf-8")
    tmp.chmod(0o644)
    os.replace(tmp, target)
