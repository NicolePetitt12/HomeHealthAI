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
| `EXPO_PUBLIC_SUPPORT_EMAIL` | Support email for Help & Support contact form | Default: `support@home-health-ai.com` |

> **LAN IP:** Use `ip route get 1.1.1.1 | awk '{print $7; exit}'` (Linux) or `ipconfig getifaddr en0` (macOS) to find your machine's LAN IP. Physical devices and emulators can't reach `127.0.0.1`.

### Edge Functions (`apps/backend/supabase/functions/.env`)

```bash
cp apps/backend/supabase/functions/.env.example apps/backend/supabase/functions/.env
```

| Variable | Description | How to get it |
|----------|-------------|---------------|
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard → Developers → API keys → Secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Output of `stripe-setup` function (see Stripe Setup below) |
| `WEBHOOK_BASE_URL` | Public URL where Edge Functions are reachable | Your production domain, e.g. `https://your-domain.com` |

> **Note:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected by the Supabase runtime — do not set them manually.

### Backend (`apps/backend/.env`)

```bash
cp apps/backend/.env.example apps/backend/.env
```

| Variable | Description | How to get it |
|----------|-------------|---------------|
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID | Google Cloud Console → Credentials → OAuth 2.0 → Web application |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET` | Google OAuth Web Client Secret | Same credential as above |

> These are read by Supabase via `env()` substitution in `config.toml`. See [Google OAuth Setup](#google-oauth-setup) for full instructions.

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
| `get-entitlement` | User JWT | Returns current plan tier, scan quota, and billing period dates |
| `create-payment-sheet` | User JWT | Creates new subscription + returns Payment Sheet params (Free → Paid) |
| `change-subscription` | User JWT | Prorated upgrade/downgrade between paid plans; no Payment Sheet needed |
| `cancel-subscription` | User JWT | Sets `cancel_at_period_end = true`; access continues until period end |
| `create-portal-session` | User JWT | Creates Stripe Customer Portal session URL |
| `analyze-scan` | None (internal trigger) | AI mold analysis, called via pg_net trigger |
| `delete-account` | User JWT | Cancels Stripe subscription and deletes all user data |

---

## Google OAuth Setup

The app supports Google sign-in via Supabase Auth. The mobile code is already wired up (`AuthContext.signInWithProvider` + Google button in `LoginScreen`). You only need to configure credentials.

### 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and select (or create) your project
2. Navigate to **APIs & Services → Library** and enable the **Google Identity** API
3. Go to **APIs & Services → OAuth consent screen**:
   - Choose **External** user type
   - Fill in app name, support email, and developer contact
   - Add scopes: `email`, `profile`, `openid`
4. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**:
   - **Web application** — Required by Supabase server-side
     - Authorized JavaScript origins: `http://127.0.0.1:54321`
     - Authorized redirect URI: `http://127.0.0.1:54321/auth/v1/callback`
5. Note the **Client ID** and **Client Secret** from the Web application credential

### 2. Local Development

Add the Google credentials to `apps/backend/.env`:

```
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<your-web-client-id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<your-web-client-secret>
```

The `config.toml` already has the Google provider enabled:

```toml
[auth.external.google]
enabled = true
client_id = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
secret = "env(SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
skip_nonce_check = true
```

> **`skip_nonce_check = true`** is required for local development with Google OAuth.

**Important:** Since the phone cannot reach `127.0.0.1` (it refers to itself), you must forward the Supabase port to the device via ADB:

```bash
adb reverse tcp:54321 tcp:54321
```

This makes `127.0.0.1:54321` on the phone point to your computer's Supabase instance. Run this every time you reconnect the device.

Then restart Supabase:

```bash
cd apps/backend
npx supabase stop && npx supabase start
```

### 3. Production Deployment

#### Google Cloud Console

1. Go to your existing OAuth 2.0 credential (or create a new one for production)
2. Add to **Authorized JavaScript origins**: `https://your-domain.com`
3. Add to **Authorized redirect URIs**: `https://your-domain.com/auth/v1/callback`

#### Supabase (self-hosted or hosted)

If using **Supabase Dashboard** (hosted):

1. Navigate to **Authentication → Providers → Google**
2. Toggle **Enable Google provider**
3. Paste the **Client ID** and **Client Secret** from Google Cloud Console
4. Copy the **Callback URL** shown by Supabase and ensure it matches the redirect URI in Google Console

If **self-hosted** (e.g., on `your-domain.com`):

1. Set the environment variables on your server:
   ```
   SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<your-client-id>
   SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<your-client-secret>
   ```
2. Ensure your reverse proxy forwards `/auth/v1/callback` to the Supabase Auth service
3. Set `GOTRUE_SITE_URL=inspectorgnome://auth/callback` so Supabase redirects back to the app after authentication
4. Set `GOTRUE_URI_ALLOW_LIST=inspectorgnome://auth/callback,https://your-domain.com/auth/v1/callback`

### How it works

```
User taps "Google"
  → expo-web-browser opens Google consent screen
  → User authorizes
  → Google redirects to Supabase callback (/auth/v1/callback)
  → Supabase exchanges code for tokens, creates/links auth user
  → Supabase redirects to app deep link (inspectorgnome://auth/callback#access_token=...)
  → AuthContext extracts tokens from URL fragment and sets session
```

### Key configuration (config.toml)

```toml
[auth]
site_url = "inspectorgnome://auth/callback"
additional_redirect_urls = ["http://127.0.0.1:54321/auth/v1/callback", "inspectorgnome://auth/callback"]
```

- `site_url` must point to the app's deep link so Supabase redirects back to the app after OAuth
- `additional_redirect_urls` must include both the Supabase callback and the app deep link

### Troubleshooting

| Issue | Solution |
|-------|----------|
| `ERR_CONNECTION_REFUSED` on phone | Run `adb reverse tcp:54321 tcp:54321` to forward Supabase port to the device |
| `redirect_uri_mismatch` from Google | Ensure redirect URI in Google Console matches exactly: `http://127.0.0.1:54321/auth/v1/callback` (local) or `https://your-domain.com/auth/v1/callback` (production) |
| Browser opens and closes instantly | Verify `site_url` in `config.toml` is `inspectorgnome://auth/callback` and restart Supabase |
| "Nonce mismatch" locally | Ensure `skip_nonce_check = true` in `config.toml` under `[auth.external.google]` |
| User authenticated but no profile | The `handle_new_user` trigger creates profiles on signup — verify it's active in the database |
| Google rejects private IP in origins/redirects | Google only allows `localhost`/`127.0.0.1` or public domains — use `adb reverse` for local dev |

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
