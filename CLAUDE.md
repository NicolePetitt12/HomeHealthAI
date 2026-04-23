# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Inspector Gnome is a mobile app for detecting mold/moisture issues via AI image analysis. This is a **Turborepo + npm workspaces monorepo** with three packages:

- `apps/backend` — Supabase configuration, migrations, and Edge Functions (`@inspector-gnome/backend`)
- `apps/mobile` — Expo React Native app (`@inspector-gnome/mobile`)
- `packages/shared` — Shared Zod schemas and TypeScript types (`@inspector-gnome/shared`)

All Supabase configuration (local dev, migrations, seed data, Edge Functions) lives inside `apps/backend/supabase/`.

## Commands

### From the workspace root

```bash
npm run build          # Build all packages (respects Turborepo dep order)
npm run dev            # Start all packages in parallel (watch mode)
npm run lint           # Lint all packages
npm run test           # Run all tests
npm run format         # Format all files with Prettier
npm run format:check   # Check formatting without writing
```

### Mobile (`apps/mobile/`)

```bash
npx expo start         # Start Expo dev server (metro bundler)
npx expo start --android
npx expo start --ios
npm run build          # tsc --noEmit (type-check only, no emit)
```

### Shared package (`packages/shared/`)

```bash
npm run build          # tsc → dist/  (must run before mobile consumes it)
npm run dev            # tsc --watch
```

### Local Supabase (`apps/backend/`)

```bash
npx supabase start            # Start local Supabase (Docker)
npx supabase stop             # Stop containers
npx supabase status           # Show URLs and auth keys
npx supabase db reset         # Apply all migrations + seed (destructive)
npx supabase migration new <name>   # Create a new empty migration file
npx supabase db query "<SQL>"       # Run ad-hoc SQL against local DB
npx supabase functions serve  # Serve Edge Functions locally (Deno)
```

**Local service URLs after `supabase start`:**
- API: `http://127.0.0.1:54321`
- DB (PostgreSQL): port `54322`
- Studio: `http://127.0.0.1:54323`
- Edge Functions: `http://127.0.0.1:54321/functions/v1`

Auth keys are printed by `npx supabase status` — `Publishable` = anon key, `Secret` = service role key.

## Architecture

### Data Flow

```
Mobile App (Expo)
  → supabase.ts (direct SDK)  →  Supabase Auth / Storage / Database (client-side, RLS enforced)
  → upload.ts (Storage + DB)  →  Supabase Storage (image upload) + scans table (INSERT)
                                    ↓ pg_net trigger (automatic)
                              Edge Function: analyze-scan
                                    ↓ mock LLM (real LLM integration pending)
                              analysis_results table (INSERT, service role)
  → useAnalysisResult hook    →  analysis_results table (SELECT, polls until completed)
```

The mobile app communicates directly with Supabase for all operations. When a scan is inserted, a Postgres trigger fires the `analyze-scan` Edge Function which performs the AI analysis and writes results back to the DB.

### Database Schema

Five tables in `public` schema, all with RLS enabled:

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` (1:1); auto-created by trigger on signup |
| `scans` | Photo submission records (links to `profiles`, stores `image_path` in storage) |
| `analysis_results` | AI output per scan (risk level, confidence, JSONB findings) — written by Edge Function |
| `professionals` | Referral directory (inspector / remediation / plumber / hvac) |
| `referrals` | Connects a scan to a professional |

Postgres enums: `risk_level` (low/moderate/high), `user_role`, `scan_status`, `professional_type`.

Storage bucket: `scan-images` (private). Path convention: `{user_id}/{filename}`. RLS enforces folder = authenticated user's UUID.

### Edge Functions (`apps/backend/supabase/functions/`)

**`analyze-scan`** — Triggered by `on_scan_created` Postgres trigger via `pg_net`. Receives the new scan row, runs analysis, writes to `analysis_results`, updates `scan.status`.

- Uses `SUPABASE_SERVICE_ROLE_KEY` env var (auto-injected by Supabase runtime) to bypass RLS for writing results
- Currently uses a mock analysis generator — replace `generateMockAnalysis()` with a real LLM call when ready
- Written in Deno TypeScript; imports via `https://esm.sh/` CDN

### Expo Mobile App

Entry: `App.tsx` (root of `apps/mobile/`) — wraps everything in Redux → React Query → React Native Paper → React Navigation.

State: Redux Toolkit with a single `inspection` slice (`apps/mobile/src/store/slices/inspectionSlice.ts`) tracking `currentScan`, `isLoading`, `error`.

Server state: React Query (TanStack) for Supabase queries. Use `supabase.ts` for all Supabase operations.

Metro is configured in `metro.config.js` to watch the workspace root and resolve hoisted packages — required for monorepo symlink support.

Environment variables in Expo must be prefixed `EXPO_PUBLIC_` to be accessible at runtime.

### Shared Package

`packages/shared/src/schemas/inspection.schema.ts` exports all Zod schemas and inferred TypeScript types for every domain entity. **Always update this file when the DB schema changes** — it is the single source of truth for types shared between mobile and Edge Functions.

The shared package must be **built before** other packages consume it (`npm run build` in `packages/shared/`). In CI/Turborepo this is handled automatically via `"dependsOn": ["^build"]`.

DB columns are `snake_case`; Zod schemas use `camelCase`. The mobile app and Edge Functions are each responsible for mapping between them.

## Environment Setup

Copy `apps/mobile/.env.example` to `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=http://<LAN_IP>:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key from supabase status>
```

Use your machine's LAN IP (not `127.0.0.1`) so physical devices and emulators can reach local Supabase.

**Test credentials** (after `supabase db reset`):
- Homeowner: `homeowner@test.com` / `password123`
- Professional: `pro@test.com` / `password123`

## Key Conventions

- **Risk levels**: `low | moderate | high` — do not use `medium` or `critical` (old values).
- **Migrations**: Always create via `npx supabase migration new <name>` (run from `apps/backend/`) to get a correct timestamp prefix. Write SQL directly; do not use the Supabase dashboard for schema changes.
- **RLS**: All new tables must have RLS enabled. Edge Functions use the service role key (bypasses RLS); the mobile Supabase client uses the anon key (subject to RLS).
- **Edge Function secrets**: Set via `npx supabase secrets set KEY=value`. `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected — do not set them manually.
- **OpenAI API key** (required for `analyze-scan`): `npx supabase secrets set OPENAI_API_KEY=sk-...` (run from `apps/backend/`). Without this secret the edge function will throw on the first real scan.
- **Confidence scale**: stored as `integer 0–100` in `analysis_results.confidence`. Do not multiply/divide by 100 in the mobile app — `ConcernLevelCard` and `ConfidenceBar` receive the raw integer directly.
