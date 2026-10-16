# SIP Telefoniya — Frontend

React + TypeScript bilan yozilgan boshqaruv paneli: jonli qo'ng'iroqlar, dialpad, avto-qo'ng'iroq, audio kutubxona, yozuvlarni tinglash va transkripsiya.

> Umumiy tavsif va ishga tushirish uchun [ildizdagi README](../README.md) ga qarang.

## Texnologiyalar

React 19 · TypeScript 6 · Vite 8 · React Router 7 · TanStack Query 5 · CSS Modules · Oxlint

Qo'shimcha UI kutubxonasi yo'q: ikonkalar (`shared/ui/Icon.tsx`), pleer, avatar va boshqa komponentlar loyihaning o'zida yozilgan.

## Ishga tushirish

```bash
cd frontend
cp .env.example .env     # kerak bo'lsa API manzilini o'zgartiring
npm install
npm run dev              # http://localhost:5173
```

| Buyruq | Vazifasi |
|---|---|
| `npm run dev` | Dev server (HMR) |
| `npm run build` | Tip tekshiruvi (`tsc -b`) + production build |
| `npm run preview` | Build'ni lokal ko'rish |
| `npm run lint` | Oxlint |

### Sozlamalar (`.env`)

| O'zgaruvchi | Standart |
|---|---|
| `VITE_API_URL` | `http://localhost:8000/api/v1` |
| `VITE_WS_URL` | `ws://localhost:8000/api/v1/ws/events` |

Docker Compose'da backend `8002` portda, shuning uchun qiymatlar `docker-compose.yml` ichida berilgan.

> **Docker + Windows:** bind-mount'da Vite fayl o'zgarishlarini ko'rmasligi mumkin. O'zgartirgandan keyin `docker compose restart frontend` qiling.

## Sahifalar

| Yo'l | Sahifa | Mazmuni |
|---|---|---|
| `/` | Bosh sahifa | Statistika, faol qo'ng'iroqlar, so'nggi qo'ng'iroqlar |
| `/dialer` | Qo'ng'iroq | Tab: oddiy qo'ng'iroq (dialpad) yoki avto-qo'ng'iroq (audio). `?tab=auto&audio=<id>` |
| `/audio` | Audio | Yuklash (drag & drop), ro'yxat, tinglash, o'chirish |
| `/history` | Tarix | Qidiruv (raqam, audio nomi, matn), holat/tur/yozuv va sana filtrlari; sahifalangan jadval; qatorni bossangiz yozuv pleeri va transkripsiya |
| `/extensions` | SIP hisoblar | Extension'lar boshqaruvi |
| `/contacts` | Kontaktlar | Guruh/kasb/qidiruv filtri, belgilash, guruhga o'tkazish, CSV import, tanlanganlarga audio bilan qo'ng'iroq |
| `/campaigns`, `/campaigns/:id` | Ommaviy qo'ng'iroqlar | Progress, har bir kontakt holati, yozuv va transkripsiya |

## Papka tuzilmasi

```
src/
├── app/                 # App, providers (Query + WebSocket), router, navigation
├── config/env.ts        # VITE_* o'zgaruvchilari
├── features/            # Biznes mantiq bo'yicha modullar
│   ├── calls/           # api · hooks · lib (status, statistika) · components
│   │                    #   Dialer, PlaybackCallForm, ActiveCalls,
│   │                    #   CallHistoryTable, CallDetails, CallStatsGrid
│   ├── audio/           # AudioUploader, AudioLibrary
│   ├── extensions/      # ExtensionForm, ExtensionGrid
│   └── realtime/        # WebSocket provider, applyEvent, ConnectionIndicator
├── pages/               # Marshrutlarga mos sahifalar
├── shared/
│   ├── api/http.ts      # fetch o'rami, ApiError
│   ├── hooks/           # useTheme, useElapsed, useWaveform, usePersistentState
│   ├── lib/             # format, validation, theme
│   ├── layout/          # AppLayout (sidebar, mobil tab-bar)
│   └── ui/              # Button, Card, Badge, Avatar, Icon, AudioPlayer, ...
└── styles/              # tokens.css (ranglar, dark rejim), base.css
```

### Qoidalar
- Har bir `feature` o'z ichida `api / hooks / components` ga bo'lingan va tashqariga faqat `index.ts` orqali chiqadi. Featurelar bir-birining ichki fayllarini import qilmaydi.
- `shared/` featurelarga bog'liq bo'lmaydi.
- Import uchun `@/` aliasi (`@/shared/ui`, `@/features/calls`).
- Server holati TanStack Query'da (`useQuery` / `useMutation`), komponent holati `useState` da.
- Jonli hodisalar `CallEventsProvider` orqali keladi; har bir hodisada `callKeys.all` bekor qilinadi (tarix va statistika yangilanadi). `realtime` feature `calls` ni import qilmaydi: bog'lanish `app/providers.tsx` da.

## Dizayn tizimi

- Ranglar, radius va soyalar `src/styles/tokens.css` dagi CSS o'zgaruvchilarida. Qorong'i rejim `:root[data-theme='dark']` bilan; tanlov `localStorage`da saqlanadi va render'dan oldin qo'llanadi.
- Shrift: Inter (Google Fonts).
- Komponent stillari — yonidagi `*.module.css`.
- Mobil (≤ 860px): sidebar yuqori panelga, navigatsiya pastki tab-bar'ga aylanadi.

## Realtime

`CallEventsProvider` backend `WS /ws/events` ga ulanadi (uzilsa, 1 s dan 15 s gacha oshib boruvchi kutish bilan qayta ulanadi). Hodisalar `applyEvent` (sof funksiya) orqali "faol qo'ng'iroqlar" ro'yxatiga qo'llanadi. Hodisa turlari: `call_started`, `call_answered`, `call_ended`, `recording_ready`, `transcript_updated`, `campaign_updated`.

## Audio pleer

`shared/ui/AudioPlayer.tsx` — maxsus pleer: play/pause, to'lqin shakli (`useWaveform` Web Audio API bilan `decodeAudioData` qiladi va natijani keshlaydi), bosib o'tkazish, klaviatura (←/→) va yuklab olish. Bo'sh yozuvda to'lqin o'rniga oddiy chiziq chiqadi. Har bir `src` uchun alohida pleer (`key`) ishlatilishi kutiladi.

## Ma'lum cheklovlar

- Sahifa ichida brauzer ovozi (WebRTC softphone) yo'q: gaplashish tashqi SIP telefon orqali.
- Frontend uchun testlar yozilmagan.
- Autentifikatsiya yo'q (backend ham shunday).
