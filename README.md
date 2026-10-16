# SIP Telefoniya

Asterisk asosidagi SIP telefoniya uchun veb-boshqaruv paneli. Ichki raqamlar o'rtasidagi qo'ng'iroqlarni jonli kuzatish, avtomatik qo'ng'iroq qilish (audio ijro etib, javobni yozib olish), suhbatlarni saytda tinglash va matnga o'tkazish imkonini beradi.

## Imkoniyatlar

- **Jonli panel** — faol qo'ng'iroqlar, taymer, uzish tugmasi, bugungi statistika (WebSocket).
- **Dialpad** — ichki raqamdan qo'ng'iroq boshlash.
- **Avto-qo'ng'iroq** — raqamga qo'ng'iroq qilib, yuklangan audioni ijro etadi va odamning javobini yozib oladi.
- **Audio kutubxona** — MP3/WAV/OGG/M4A/FLAC yuklash; avtomatik 8 kHz mono WAV ga o'tkaziladi.
- **Yozuvlar** — barcha suhbatlar (ikki tomon aralash) yoziladi, tarixda to'lqin shakli bilan tinglanadi va yuklab olinadi.
- **Transkripsiya** — yozuvni Whisper (OpenAI-mos API) orqali matnga o'tkazish.
- **SIP hisoblar (extensions)** boshqaruvi, yorug'/qorong'i rejim, mobilga moslashgan interfeys.

## Arxitektura

```
  Brauzer (React, :5173)
     │  REST + WebSocket
     ▼
  Backend (FastAPI, :8000 → compose'da :8002) ──── PostgreSQL (:5432)
     │  ARI: HTTP + WebSocket
     ▼
  Asterisk (:8088 ARI, :5060 SIP/UDP, :10000-10100 RTP)  ◄── SIP telefonlar (1001, 1002)

  Umumiy volume'lar:  sounds  (backend → Asterisk: ijro uchun audio)
                      recordings (Asterisk → backend: suhbat yozuvlari)
```

Backend Asterisk'ni **ARI** orqali boshqaradi (dialplan faqat qo'ng'iroqni `Stasis` ilovasiga uzatadi). SIP server `SipProvider` interfeysi ortida yashiringan, shuning uchun boshqa server (masalan FreeSWITCH) qo'shish mumkin.

## Tezkor boshlash

Talab: **Docker Desktop**.

```bash
cp backend/.env.example backend/.env
docker compose up --build -d
docker compose exec backend alembic upgrade head     # birinchi marta: jadvallarni yaratish
```

| Servis | Manzil |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8002/api/v1 (Swagger: `/docs`) |
| Asterisk ARI | http://localhost:8088/ari |
| SIP | `localhost:5060` (UDP) |

> Backend `8002` portda, chunki `8000` ko'pincha band bo'ladi. O'zgartirmoqchi bo'lsangiz, `docker-compose.yml` dagi `ports` va frontend'ning `VITE_API_URL` / `VITE_WS_URL` qiymatlarini birga o'zgartiring.

Tekshirish: `curl http://localhost:8002/api/v1/health` → `{"status":"ok"}`.

### Telefon ulash

Qo'ng'iroq qilish uchun SIP telefon kerak (Zoiper, Linphone, MicroSIP yoki telefondagi SIP ilova):

| | 1001 | 1002 |
|---|---|---|
| Server | `localhost` (boshqa qurilmadan — kompyuter IP'si) | xuddi shu |
| Port / transport | 5060 / UDP | xuddi shu |
| Login / parol | `1001` / `pass1001` | `1002` / `pass1002` |

Ro'yxatdan o'tganini tekshirish: `docker compose exec asterisk asterisk -rx "pjsip show endpoints"` — `Unavailable` o'rniga `Not in use` chiqishi kerak. Boshqa qurilmadan ulansangiz, Windows firewall'da `5060/UDP` va `10000–10100/UDP` ochiq bo'lsin.

Telefon ulanmagan raqamga qo'ng'iroq qilsangiz, `409 endpoint_offline` xatosi aniq xabar bilan qaytadi.

### Telefonsiz sinash (demo)

`backend/.env` ga qo'shing va backend'ni qayta ishga tushiring:

```
SIP_DIAL_TEMPLATE=Local/{number}@demo-answer
```

Endi har qanday raqam (masalan `5555`) avtomatik javob beradi (`docker/asterisk/extensions.conf` dagi `[demo-answer]`). Avto-qo'ng'iroq va yozuv oqimini shu bilan sinash mumkin, lekin yozuv bo'sh bo'ladi (ovoz yo'q). Sinovdan keyin qatorni olib tashlang.

## Matnga o'tkazish (ixtiyoriy)

`backend/.env` da kalit kiriting:

```
STT_API_KEY=...
# STT_BASE_URL=https://api.openai.com/v1   # Groq yoki lokal Whisper bo'lsa o'zgartiring
# STT_MODEL=whisper-1
# STT_LANGUAGE=uz
```

Kalit bo'lsa, yozuv tugashi bilan matn avtomatik chiqadi; bo'lmasa tarixdagi "Matnga o'tkazish" tugmasi `503` xabari bilan javob beradi.

## Loyiha tuzilmasi

```
sip_project/
├── backend/            # FastAPI + ARI            → backend/README.md
├── frontend/           # React + Vite             → frontend/README.md
├── docker/asterisk/    # Asterisk sozlamalari (pjsip, ari, http, rtp, extensions)
├── docker-compose.yml  # postgres, asterisk, backend, frontend + volume'lar
└── README.md
```

Batafsil: [backend/README.md](backend/README.md) · [frontend/README.md](frontend/README.md)

## Asterisk sozlamalari (`docker/asterisk/`)

| Fayl | Vazifasi |
|---|---|
| `pjsip.conf` | Transport va shablonlar; hisoblarni `pjsip.d/accounts.conf` dan oladi (uni backend yozadi) |
| `ari.conf` / `http.conf` | ARI foydalanuvchisi (`sipapp`) va HTTP server |
| `extensions.conf` | `from-internal`: har qanday raqam → `Stasis(sip_app,dial,...)`; `demo-answer`: demo abonent |
| `rtp.conf` | RTP port oralig'i (10000–10100) |

Yangi SIP raqam qo'shish uchun saytdagi "SIP hisoblar" bo'limidan foydalaning: backend hisobni bazaga saqlaydi, parol yaratadi, `accounts.conf` ni yozadi va Asterisk'ni (`res_pjsip` reload) qayta yuklaydi — qo'lda hech narsa tahrirlash va qayta ishga tushirish kerak emas. Mavjud 1001/1002 parollari saqlanib qolgan.

## Tez-tez uchraydigan muammolar

| Muammo | Sabab / yechim |
|---|---|
| `Bind for 0.0.0.0:8000 failed: port is already allocated` | Port band. Backend portini o'zgartiring (yuqoridagi izoh). |
| Jadval yo'q (`relation "calls" does not exist`, 500) | `alembic upgrade head` ishga tushirilmagan. |
| `409 endpoint_offline` | Telefon shu raqam bilan ro'yxatdan o'tmagan. |
| `ARI ... Allocation failed` | Xuddi shu sabab (eski versiyalarda xom xato sifatida chiqardi). |
| Frontend o'zgarishlari ko'rinmaydi (Windows) | `docker compose restart frontend`. |
| Yozuv bo'sh / "ovoz yo'q" | Demo rejimda normal; haqiqiy telefonda RTP portlari (10000–10100/UDP) ochiq ekanini tekshiring. |
| `503 service_unavailable` (matnga o'tkazish) | `STT_API_KEY` kiritilmagan. |

## Ma'lum cheklovlar

- Autentifikatsiya yo'q: API va yozuvlar hamma uchun ochiq. Tarmoqqa chiqarishdan oldin himoyalang.
- Qo'ng'iroq holati backend xotirasida saqlanadi (bitta worker); restartdan keyin ochiq qolgan qo'ng'iroqlar `ended` bo'lmasligi mumkin.
- Parollar (`pjsip.conf`, `ari.conf`, Postgres) faqat dev uchun mos.
- Yozuvlarni tozalash siyosati va brauzerdan gaplashish (WebRTC) hali yo'q.
