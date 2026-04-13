# Inspector Gnome

A mobile application that helps homeowners identify potential mold and moisture issues using AI-powered image analysis. Users take photos of concerning areas, receive an AI risk assessment with educational feedback, and can connect with local professionals when elevated risk is detected.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo), Redux Toolkit, React Query, React Native Paper |
| Backend | Supabase (Edge Functions, PostgreSQL, Storage) |
| Payments | Stripe (subscriptions, native Payment Sheet) |
| Monorepo | Turborepo + npm workspaces |

---

## Prerequisites

- **Node.js** >= 20 (`node --version`)
- **npm** >= 10 (`npm --version`)
- **Docker** (required for local Supabase) — [Install Docker](https://docs.docker.com/get-docker/)
- **Android Studio** or **Xcode** — required to build the app (Expo Go is not supported because the app uses native Stripe modules)
- **Stripe account** — [dashboard.stripe.com](https://dashboard.stripe.com) (free test mode is enough)
- **Stripe CLI** (optional, for local webhook testing) — [Install Stripe CLI](https://stripe.com/docs/stripe-cli)

---

## Quick Start

### 1. Install dependencies

```bash
cd inspector-gnome
npm install
```

### 2. Build the shared package

```bash
cd packages/shared && npm run build && cd ../..
```

### 3. Start local Supabase

```bash
cd apps/backend
npx supabase start
npx supabase status   # copy the keys shown here
```

### 4. Configure environment variables

**Mobile** (`apps/mobile/.env`):
```bash
cp apps/mobile/.env.example apps/mobile/.env
```

| Variable | Where to get it |
|----------|-----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | `supabase status` → API URL (use LAN IP, not 127.0.0.1) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `supabase status` → Publishable key |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable key |

**Edge Functions** (`apps/backend/supabase/functions/.env`):
```bash
cp apps/backend/supabase/functions/.env.example apps/backend/supabase/functions/.env
```

| Variable | Where to get it |
|----------|-----------------|
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Output of `stripe-setup` (step 7 below) |
| `WEBHOOK_BASE_URL` | Your public Supabase URL (e.g. `https://your-domain.com`) |

### 5. Run database migrations

```bash
cd apps/backend
npx supabase db reset
```

This applies all migrations and loads test data.

### 6. Start Edge Functions

```bash
cd apps/backend
npx supabase functions serve --env-file supabase/functions/.env
```

Keep this running in a terminal while developing.

### 7. Configure Stripe (one-time setup)

Run the idempotent setup function to create products, prices, and the webhook endpoint in your Stripe account:

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/stripe-setup
```

Copy the `webhook.secret` from the output into `apps/backend/supabase/functions/.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

Then restart Edge Functions (Ctrl+C and re-run step 6).

### 8. (Optional) Forward Stripe webhooks locally

In a separate terminal, use the Stripe CLI to forward events to your local function:

```bash
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

### 9. Build and run the mobile app

> **Note:** The app uses `@stripe/stripe-react-native` which requires native code — Expo Go is not supported.

```bash
cd apps/mobile

# Android (requires Android Studio + emulator or device)
npx expo run:android

# iOS (requires Xcode, macOS only)
npx expo run:ios
```

---

## Project Structure

```
inspector-gnome/
├── apps/
│   ├── backend/              Supabase local config + Edge Functions
│   │   └── supabase/
│   │       ├── functions/    Edge Functions (Deno TypeScript)
│   │       ├── migrations/   SQL migrations
│   │       └── seed.sql      Test data
│   └── mobile/               Expo React Native app
├── packages/
│   └── shared/               Shared Zod schemas and TypeScript types
├── documentation/            Detailed developer documentation
├── CLAUDE.md                 AI assistant context file
└── turbo.json                Turborepo pipeline config
```

---

## Available Scripts

Run from the **workspace root** (`inspector-gnome/`):

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all packages in parallel (watch mode) |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run format` | Format all files with Prettier |

---

## Test Credentials

After running `npx supabase db reset`:

| Role | Email | Password |
|------|-------|----------|
| Homeowner | `homeowner@test.com` | `password123` |
| Professional | `pro@test.com` | `password123` |

**Stripe test card:** `4242 4242 4242 4242` — any future expiry date, any CVC.

---

## Subscription Plans

| Plan | Price | Scans/period |
|------|-------|-------------|
| Free | $0 | 3 |
| Home | $9.99/mo | 20 |
| Pro | $29.99/mo | Unlimited |

Scan quotas reset at the start of each **billing period**, not at the calendar month boundary:
- **Paid plans** — period starts on the date Stripe last renewed (e.g. subscribed April 15 → resets every 15th)
- **Free plan** — rolling monthly window anchored to account creation date

Plan changes (upgrades and downgrades) are prorated automatically: users are charged or credited for unused days in the current period.

---

## Documentation

| Document | Description |
|----------|-------------|
| [Development Guide](documentation/development.md) | Full env setup, running services, Stripe configuration |
| [Database](documentation/database.md) | Schema, RLS policies, ER diagram |
| [Migrations](documentation/migrations.md) | Creating and applying DB migrations |
| [Testing](documentation/testing.md) | Running tests, linting, type checking |
