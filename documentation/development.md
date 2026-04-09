# Development Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 20 | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| npm | >= 10 | Bundled with Node 20 |
| Docker | Latest | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |
| Android Studio | Latest | For Android builds and emulator |
| Xcode | Latest | For iOS builds (macOS only) |
| Stripe CLI | Latest | [stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli) — optional, for local webhook testing |

> **Why no Expo Go?** The app uses `@stripe/stripe-react-native` which includes native modules not available in Expo Go. You must use a development build (`npx expo run:android` / `npx expo run:ios`).

Verify your environment:
```bash
node --version    # >= v20.x.x
npm --version     # >= 10.x.x
docker --version  # any recent version
```

---

## Installation

From the **repository root** (`inspector-gnome/`):

```bash
npm install
```

Then build the shared types package (required before mobile can start):

```bash
cd packages/shared && npm run build && cd ../..
```

---

## Environment Variables

### Mobile (`apps/mobile/.env`)

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

| Variable | Description | How to get it |
|----------|-------------|---------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase API URL — use LAN IP, not `127.0.0.1` | `npx supabase status` → API URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase publishable/anon key | `npx supabase status` → Publishable |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Stripe Dashboard → Developers → API keys |

> **LAN IP:** Use `ip route get 1.1.1.1 | awk '{print $7; exit}'` (Linux) or `ipconfig getifaddr en0` (macOS) to find your machine's LAN IP. Physical devices and emulators can't reach `127.0.0.1`.

### Edge Functions (`apps/backend/supabase/functions/.env`)

```bash
cp apps/backend/supabase/functions/.env.example apps/backend/supabase/functions/.env
```

| Variable | Description | How to get it |
|----------|-------------|---------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Output of `stripe-setup` function (see Stripe Setup below) |
| `WEBHOOK_BASE_URL` | Public URL where Edge Functions are reachable | Your production domain, e.g. `https://hhai.subacuatica.com.mx` |

> **Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the Supabase runtime — do not set them manually.

---

## Running Services

### 1. Local Supabase

```bash
cd apps/backend

# Start Docker containers
npx supabase start

# Show URLs and keys
npx supabase status

# Stop
npx supabase stop
```

Local keys are deterministic — they don't change between restarts.

### 2. Apply Database Migrations

```bash
cd apps/backend
npx supabase db reset
```

This wipes the local database, applies all migrations in order, and loads `seed.sql` with test accounts.

> Run this every time you add a new migration or pull changes that include migrations.

### 3. Edge Functions

```bash
cd apps/backend
npx supabase functions serve --env-file supabase/functions/.env
```

Functions are available at `http://127.0.0.1:54321/functions/v1/<function-name>`.

Keep this running in a dedicated terminal while developing.

### 4. Mobile App

```bash
cd apps/mobile

# Android (requires Android Studio + emulator or connected device)
npx expo run:android

# iOS (requires Xcode, macOS only)
npx expo run:ios
```

On the **first run**, Expo will compile the native code — this takes a few minutes. Subsequent runs are faster thanks to incremental builds.

> **Physical device:** Ensure your phone and computer are on the same Wi-Fi. Use your machine's LAN IP in `EXPO_PUBLIC_SUPABASE_URL`.

---

## Stripe Setup (one-time)

This only needs to be done once per Stripe account (test or production). The setup function is idempotent — safe to run multiple times without creating duplicates.

### 1. Add your Stripe secret key

Edit `apps/backend/supabase/functions/.env`:
```
STRIPE_SECRET_KEY=sk_test_...
```

### 2. Start Edge Functions (if not already running)

```bash
cd apps/backend
npx supabase functions serve --env-file supabase/functions/.env
```

### 3. Run the setup function

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/stripe-setup
```

The response looks like:
```json
{
  "products": { "created": ["prod_..."], "found": [] },
  "prices": { "home": "price_...", "pro": "price_..." },
  "webhook": {
    "id": "we_...",
    "secret": "whsec_...",
    "status": "created"
  },
  "note": "Run: npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_..."
}
```

### 4. Save the webhook secret

Copy the `webhook.secret` value into `apps/backend/supabase/functions/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

Then **restart** the Edge Functions process (Ctrl+C and re-run step 2).

### 5. (Optional) Forward webhooks locally with Stripe CLI

In a separate terminal:
```bash
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

This forwards Stripe events (payment success, subscription changes, etc.) to your local function during development.

### Test card numbers

| Scenario | Card number |
|----------|-------------|
| Successful payment | `4242 4242 4242 4242` |
| Payment declined | `4000 0000 0000 0002` |
| 3D Secure required | `4000 0027 6000 3184` |

Use any future expiry date and any 3-digit CVC.

---

## Edge Functions Reference

| Function | Auth | Description |
|----------|------|-------------|
| `stripe-setup` | None | One-time Stripe product/price/webhook configuration |
| `stripe-webhook` | None (Stripe signature) | Handles Stripe events, updates subscription tables |
| `get-plans` | None | Returns available plans with Stripe price IDs |
| `get-entitlement` | User JWT | Returns current plan tier and scan quota |
| `create-payment-sheet` | User JWT | Creates subscription + returns Payment Sheet params |
| `create-portal-session` | User JWT | Creates Stripe Customer Portal session URL |
| `analyze-scan` | None (internal trigger) | AI mold analysis, called via pg_net trigger |
| `delete-account` | User JWT | Cancels Stripe subscription and deletes all user data |

---

## Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Supabase API + Edge Functions | 54321 | `http://127.0.0.1:54321` |
| PostgreSQL | 54322 | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio | 54323 | `http://127.0.0.1:54323` |
| Inbucket (email testing) | 54324 | `http://127.0.0.1:54324` |

**Supabase Studio** (`http://127.0.0.1:54323`) — web UI to browse tables, run SQL, and inspect auth users.

**Inbucket** (`http://127.0.0.1:54324`) — captures all emails sent by Supabase Auth (verification, password reset).

---

## Shared Package

The `packages/shared` package contains all Zod schemas and TypeScript types. It must be compiled before being imported.

```bash
# One-time build
cd packages/shared && npm run build

# Watch mode (auto-recompile on changes)
cd packages/shared && npm run dev
```

**When to rebuild:** Any time you modify `packages/shared/src/`.
