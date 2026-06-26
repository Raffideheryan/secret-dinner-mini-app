# Secret Dinner Telegram Mini App

Version 1 of the Secret Dinner Telegram Mini App.

## Included in V1

- Home dashboard with welcome, points, referral code, and next dinner preview
- Profile view with editable phone, language, hobbies, and allergies
- Next dinner card with package prices and remaining seats
- Application flow for:
  - guest count
  - Silver / Gold / VIP package per guest
  - Custom Menu for single-guest applications
  - shared/private table preference
- My Applications list with secret key, dinner, package/menu, status, and table
- Referral copy/share actions
- Support button that opens the existing bot

## Intentionally left for V2

- Payments / checkout
- Richer push events / live refresh
- Full admin-side Mini App analytics views
- Advanced onboarding inside the Mini App
- Application editing/cancellation from Mini App

## Environment

Create `.env` from `.env.example`.

Frontend:

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`
  - local dev proxy target when `VITE_API_BASE_URL=/api`
- `VITE_TELEGRAM_INIT_DATA_OVERRIDE`
  - optional local development override when you have a captured `initData` string
- `VITE_TELEGRAM_DEV_USER_ID`
  - optional only when backend runs with `LOCAL_DEV_MODE=true` and `TELEGRAM_MINI_APP_DEV_USER_ID`

Backend requirements:

- `TELEGRAM_TOKEN`
- `TELEGRAM_BOT_USERNAME`
- `TELEGRAM_INIT_DATA_MAX_AGE_SEC`
- `TELEGRAM_MINI_APP_DEV_USER_ID` for explicit local dev bypass only

## Run locally

1. Start backend on `http://localhost:8085`
2. In the Mini App repo:

```bash
npm install
npm run dev
```

3. Open through Telegram for real auth, or use one of the local dev options:

- preferred: `VITE_TELEGRAM_INIT_DATA_OVERRIDE` with a real `initData` string
- fallback: `LOCAL_DEV_MODE=true` on backend plus matching `VITE_TELEGRAM_DEV_USER_ID`

Current local dev pairing used in this workspace:

- backend: `http://localhost:8085`
- mini app: `http://localhost:5174`
- backend `.env` must include:

```env
LOCAL_DEV_MODE=true
TELEGRAM_MINI_APP_DEV_USER_ID=698992849
TELEGRAM_TOKEN=...
TELEGRAM_BOT_USERNAME=secret_dinner_bot
```

- mini app `.env` must include:

```env
VITE_API_BASE_URL=/api
VITE_API_PROXY_TARGET=http://localhost:8085
VITE_TELEGRAM_DEV_USER_ID=698992849
```

If you change either `.env`, restart both the backend and the Vite dev server.

For Telegram mobile dev through the public Vite/ngrok URL:

- keep `VITE_API_BASE_URL=/api`
- Vite proxies `/api` to your local backend
- this avoids mobile trying to call its own `localhost:8085`

## Build

```bash
npm run build
```
