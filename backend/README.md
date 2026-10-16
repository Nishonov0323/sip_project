# SIP Telefoniya — Backend

FastAPI asosidagi backend. Asterisk bilan **ARI** (Asterisk REST Interface) orqali ishlaydi: qo'ng'iroqlarni boshqaradi, suhbatlarni yozadi, audio ijro etadi va hodisalarni WebSocket orqali frontend'ga uzatadi.

> Umumiy tavsif va ishga tushirish uchun [ildizdagi README](../README.md) ga qarang.

## Texnologiyalar

| | |
|---|---|
| Til / freymvork | Python 3.12, FastAPI, Uvicorn |
| Baza | PostgreSQL 16, SQLAlchemy 2 (async, asyncpg), Alembic |
| SIP server | Asterisk 20 (ARI: HTTP + WebSocket) |
| Audio | ffmpeg (konvertatsiya), `wave` (davomiylik) |
| Matnga o'tkazish | OpenAI-mos `/audio/transcriptions` API (Whisper) |
| Asboblar | Poetry (bog'liqliklar), Ruff (lint), pytest |

## Papka tuzilmasi

```
backend/
├── app/
│   ├── main.py                 # FastAPI ilovasi, lifespan (provider, storage)
│   ├── core/                   # config.py (env), exceptions.py, logging.py
│   ├── db/                     # base.py (Base), session.py (async engine)
│   ├── models/                 # Extension, Call, AudioFile
│   ├── schemas/                # Pydantic sxemalar (request/response)
│   ├── repositories/           # Bazaga murojaat (CRUD)
│   ├── services/               # Biznes mantiq
│   │   ├── call_service.py            # originate, playback, yozuv, transkripsiya
│   │   ├── call_event_service.py      # SIP hodisalari -> baza + WebSocket
│   │   ├── audio_service.py           # yuklash + ffmpeg konvertatsiya
│   │   ├── transcription_service.py   # Whisper (fonda)
│   │   └── extension_service.py
│   ├── sip/                    # SIP provayder abstraksiyasi
│   │   ├── base.py                    # SipProvider (abstrakt interfeys)
│   │   ├── events.py                  # Provayderdan mustaqil SipEvent
│   │   ├── factory.py
│   │   └── asterisk/                  # client.py (ARI HTTP), listener.py (ARI WS),
│   │                                  # call_router.py (qo'ng'iroq oqimlari), provider.py
│   ├── api/
│   │   ├── deps.py                    # Dependency'lar (session, servislar)
│   │   └── v1/endpoints/              # health, extensions, calls, audio, events (WS)
│   └── ws/manager.py           # WebSocket ulanishlari
├── alembic/                    # Migratsiyalar (versions/0001, 0002)
├── tests/
├── Dockerfile                  # python:3.12-slim + ffmpeg + poetry
├── pyproject.toml
└── .env.example
```

Qatlamlar bir yo'nalishda: `endpoints → services → repositories → models`. SIP serverga aloqador hamma narsa `app/sip/` ichida, shuning uchun keyinchalik FreeSWITCH qo'shish uchun `SipProvider` dan meros olish yetarli.

## Ishga tushirish

Odatda butun loyiha Docker orqali ko'tariladi (ildizdagi README). Faqat backend uchun:

```bash
cd backend
cp .env.example .env          # kerak bo'lsa sozlang
poetry install
alembic upgrade head          # jadvallarni yaratish
uvicorn app.main:app --reload
```

Lokal ishga tushirganda `DATABASE_URL`, `ARI_*` manzillarini `postgres` / `asterisk` host nomlari o'rniga `localhost` ga o'zgartiring. Audio va yozuv papkalari (`SOUNDS_DIR`, `RECORDINGS_DIR`) Asterisk bilan umumiy bo'lishi kerak (Docker'da umumiy volume'lar).

- API hujjatlari (Swagger): `http://localhost:8000/docs` (compose'da: `http://localhost:8002/docs`)
- Salomatlik: `GET /api/v1/health`

## Sozlamalar (`.env`)

| O'zgaruvchi | Standart | Izoh |
|---|---|---|
| `DEBUG` | `false` | `true` bo'lsa SQL so'rovlari ham logga yoziladi |
| `LOG_LEVEL` | `INFO` | |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | JSON ro'yxat |
| `DATABASE_URL` | `postgresql+asyncpg://sip:sip@postgres:5432/sip` | |
| `SIP_PROVIDER` | `asterisk` | |
| `SIP_DIALPLAN_CONTEXT` | `from-internal` | |
| `SIP_DIAL_TEMPLATE` | `PJSIP/{number}` | Demo: `Local/{number}@demo-answer` |
| `ARI_BASE_URL` / `ARI_WS_URL` | `http://asterisk:8088/ari` / `ws://asterisk:8088/ari/events` | |
| `ARI_USER` / `ARI_PASSWORD` / `ARI_APP` | `sipapp` / `sippass` / `sip_app` | `docker/asterisk/ari.conf` bilan mos |
| `SOUNDS_DIR` | `/data/sounds` | Yuklangan audio (Asterisk: `sounds/custom`) |
| `RECORDINGS_DIR` | `/data/recordings` | Yozuvlar (Asterisk: `spool/recording`) |
| `ASTERISK_SOUND_PREFIX` | `custom` | |
| `MAX_UPLOAD_MB` | `25` | Audio fayl chegarasi |
| `REPLY_MAX_SECONDS` / `REPLY_MAX_SILENCE` | `60` / `4` | Avto-qo'ng'iroqda javobni yozish chegarasi |
| `CALL_RECORD_MAX_SECONDS` | `3600` | Oddiy suhbat yozuvi chegarasi |
| `STT_API_KEY` | _(bo'sh)_ | Bo'sh bo'lsa, transkripsiya **o'chiq** |
| `STT_BASE_URL` / `STT_MODEL` / `STT_LANGUAGE` | OpenAI / `whisper-1` / `uz` | Groq yoki lokal Whisper ham mumkin |

## Migratsiyalar

```bash
alembic upgrade head                                   # qo'llash
alembic revision --autogenerate -m "tavsif"            # model o'zgargach yangisini yaratish
```

`autogenerate` NOT NULL ustunlarga `server_default` qo'shmaydi. Jadvalda qatorlar bor bo'lsa, migratsiyani qo'lda to'g'rilang (`0002` da shunday qilingan).

## API

Prefiks: `/api/v1`. Xatolar bir xil formatda: `{"error": {"code": "...", "message": "..."}}`.

| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/health` | Salomatlik |
| GET / POST | `/extensions` | Raqamlar ro'yxati / yaratish (409 — takroriy) |
| DELETE | `/extensions/{id}` | O'chirish |
| POST | `/calls/originate` | `{from_extension, to_number}` — qo'ng'iroq boshlash |
| POST | `/calls/playback` | `{to_number, audio_id}` — avto-qo'ng'iroq |
| POST | `/calls/{channel_id}/hangup` | Uzish (404 — kanal yo'q) |
| GET | `/calls/active` | Faol kanallar |
| GET | `/calls?limit=&offset=` | Tarix |
| GET | `/calls/{id}/recording` | Yozuv (`audio/wav`, Range qo'llab-quvvatlanadi) |
| POST | `/calls/{id}/transcribe` | Matnga o'tkazishni boshlash |
| GET / POST | `/audio` | Ro'yxat / yuklash (`multipart/form-data`: `file`, `name`) |
| GET | `/audio/{id}/file` | Audioni olish |
| DELETE | `/audio/{id}` | O'chirish |
| WS | `/ws/events` | Jonli hodisalar |

Muhim xato kodlari: `endpoint_offline` (409 — telefon ro'yxatdan o'tmagan), `invalid_file` (422), `file_too_large` (413), `service_unavailable` (503 — STT sozlanmagan), `sip_provider_error` (502).

### WebSocket hodisalari

Har bir xabar JSON, `type` maydoni bilan:

| `type` | Qachon | Qo'shimcha maydonlar |
|---|---|---|
| `call_started` | Qo'ng'iroq boshlandi | `channel_id, caller, callee, kind, audio_name` |
| `call_answered` | Javob berildi | shu |
| `call_ended` | Tugadi | shu |
| `recording_ready` | Yozuv tayyor | `recording_name` |
| `transcript_updated` | Transkripsiya holati o'zgardi | faqat `channel_id` |

## Qo'ng'iroq oqimlari

Hammasi `app/sip/asterisk/call_router.py` da.

**Oddiy qo'ng'iroq (abonent → abonent).** Dialplan `Stasis(sip_app,dial,<raqam>)` orqali chaquvchini ilovaga yuboradi → bridge yaratiladi → qabul qiluvchiga originate qilinadi → javob bersa bridge'ga qo'shiladi va **butun suhbat bridge orqali yoziladi** (`call-<channel_id>.wav`) → istalgan tomon tugatsa, ikkinchisi uziladi.

**Avto-qo'ng'iroq (audio ijro + javob yozuvi).** `channel_id` oldindan beriladi → `CALL_STARTED` → raqamga originate → javob bergach audio ijro etiladi → `PlaybackFinished` da javob yozila boshlaydi (`reply-<channel_id>.wav`, jimlikda to'xtaydi) → `RecordingFinished` da qo'ng'iroq uziladi.

Yozuv tayyor bo'lgach `CallEventService` uni `Call.recording_name` ga yozadi. `STT_API_KEY` bo'lsa, `TranscriptionService` fonda matnga o'tkazadi.

## Audio va yozuvlar

- Yuklangan audio `ffmpeg` bilan **8 kHz, mono, 16-bit PCM WAV** ga o'tkaziladi (Asterisk shuni to'g'ridan-to'g'ri ijro etadi) va `SOUNDS_DIR` ga saqlanadi.
- Ruxsat etilgan formatlar: `.wav .mp3 .ogg .m4a .aac .flac .webm .opus`.
- Docker'da `sounds` va `recordings` — backend va Asterisk uchun **umumiy volume'lar**. Asterisk yozuvlarni boshqa foydalanuvchi nomidan yozgani uchun backend ishga tushganda yozuv papkasiga `chmod 777` beradi (`main.py` → `prepare_storage`).
- Yozuv yo'li bazadagi nomdan quriladi va papka ichida ekani tekshiriladi (path traversal'dan himoya).

## Sinash va sifat

```bash
pytest                 # testlar (tests/)
ruff check .           # lint
ruff format .          # format
```

Hozircha faqat `/health` testi bor; servislar va router uchun testlar yozilishi kerak.

## Cheklovlar

- **Autentifikatsiya yo'q** — hamma endpoint (jumladan yozuvlar) ochiq.
- `CallRouter` holati (`_by_bridge`, `_playbacks`, ...) xotirada saqlanadi: bir nechta worker yoki qayta ishga tushirishda yo'qoladi. Restartdan keyin `ringing`/`answered` holatdagi yozuvlar `ended` bo'lmay qolishi mumkin.
- `Extension` jadvali Asterisk'ning `pjsip.conf` fayli bilan sinxronlanmaydi.
- Yozuvlarni eskirgach tozalash siyosati yo'q.
