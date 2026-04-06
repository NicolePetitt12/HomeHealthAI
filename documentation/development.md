# Development Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | >= 20 | [nodejs.org](https://nodejs.org) or `nvm install 20` |
| npm | >= 10 | Bundled with Node 20 |
| Docker | Latest | [docs.docker.com/get-docker](https://docs.docker.com/get-docker/) |
| Expo Go | Latest | App Store / Play Store (for physical device) |

Verify your environment:
```bash
node --version   # >= v20.x.x
npm --version    # >= 10.x.x
docker --version # any recent version
```

## Installation

From the **repository root** (`inspector-gnome/`):

```bash
npm install
```

This installs all dependencies for every workspace package simultaneously using npm workspaces.

Then build the shared types package (required before mobile can start):

```bash
cd packages/shared && npm run build && cd ../..
```

## Environment Variables

### Mobile (`apps/mobile/.env`)

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Local Supabase API URL — use LAN IP, not localhost | `http://192.168.1.x:54321` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Publishable key (from `supabase status`) | `sb_publishable_...` |

> **Note:** Mobile env vars must be prefixed `EXPO_PUBLIC_` to be accessible at runtime in Expo. Use your machine's LAN IP (not `127.0.0.1`) so physical devices and emulators can reach local Supabase.

### Getting Supabase Keys

After starting local Supabase (`npx supabase start`), run:

```bash
cd apps/backend
npx supabase status
```

Output:
```
API URL: http://127.0.0.1:54321
Publishable: sb_publishable_XXXX    ← use as EXPO_PUBLIC_SUPABASE_ANON_KEY
Secret:      sb_secret_XXXX         ← used internally by Edge Functions (auto-injected)
```

Local keys are deterministic — they do not change between restarts, so you only need to do this once.

## Running Services

### 1. Local Supabase

```bash
cd apps/backend

# Start (launches Docker containers)
npx supabase start

# Check running services and keys
npx supabase status

# Stop
npx supabase stop

# Stop and wipe all data
npx supabase stop --no-backup
```

### 2. Edge Functions (optional — for local AI pipeline testing)

```bash
cd apps/backend
npx supabase functions serve
```

Edge Functions run at `http://127.0.0.1:54321/functions/v1`. They are also served automatically when `supabase start` is running. To test the `analyze-scan` function manually:

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/analyze-scan \
  -H "Authorization: Bearer <service_role_key>" \
  -H "Content-Type: application/json" \
  -d '{"record": {"id": "...", "user_id": "...", "location": "Basement", "image_path": "...", "status": "pending"}}'
```

### 3. Mobile (Expo)

```bash
cd apps/mobile

# Start the Expo dev server
npx expo start

# Target a specific platform
npx expo start --android
npx expo start --ios
```

- Scan the QR code with **Expo Go** on your device
- Press `a` to open in Android emulator
- Press `i` to open in iOS simulator (macOS only)

> **On physical device:** Make sure your phone and development machine are on the same Wi-Fi network. Use your machine's LAN IP in `EXPO_PUBLIC_SUPABASE_URL` (e.g., `http://192.168.1.x:54321`).

### 4. Run Everything Together

From the workspace root, Turborepo starts all services in parallel:

```bash
npm run dev
```

This runs the `dev` task for all packages concurrently (mobile Expo server + shared package watcher).

## Ports Reference

| Service | Port | URL |
|---------|------|-----|
| Supabase API + Edge Functions | 54321 | `http://127.0.0.1:54321` |
| PostgreSQL | 54322 | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Supabase Studio | 54323 | `http://127.0.0.1:54323` |
| Inbucket (email testing) | 54324 | `http://127.0.0.1:54324` |

**Supabase Studio** is a web-based database UI — open `http://127.0.0.1:54323` to browse tables, run SQL, and inspect auth users during development.

**Inbucket** captures all emails sent by Supabase Auth (verification, password reset) — open `http://127.0.0.1:54324` to view them.

## Shared Package

The `packages/shared` package contains all Zod schemas and TypeScript types shared between Edge Functions and mobile. It must be compiled to `dist/` before being imported.

```bash
# One-time build
cd packages/shared && npm run build

# Watch mode (auto-recompile on changes)
cd packages/shared && npm run dev
```

When running `npm run dev` from the workspace root, the shared package watcher starts automatically.

**When to rebuild:** Any time you modify `packages/shared/src/`, run `npm run build` in that directory (or restart `npm run dev` from the root).
