# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

Inspector Gnome is a mobile app for detecting mold/moisture issues via AI image analysis. This is a **Turborepo + npm workspaces monorepo** with three packages:

- `apps/backend` — NestJS REST API (`@inspector-gnome/backend`)
- `apps/mobile` — Expo React Native app (`@inspector-gnome/mobile`)
- `packages/shared` — Shared Zod schemas and TypeScript types (`@inspector-gnome/shared`)

All Supabase configuration (local dev, migrations, seed data) lives inside `apps/backend/supabase/`.

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

### Backend (`apps/backend/`)

```bash
npm run start:dev      # Start NestJS in watch mode
npm run start:prod     # Run compiled output
npm run build          # nest build → dist/
npm run test           # jest (unit tests in src/**/*.spec.ts)
npm run test:watch     # jest --watch
npm run test:cov       # jest with coverage
npm run test:e2e       # jest with test/jest-e2e.json config
npm run lint           # eslint with --fix
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
npm run build          # tsc → dist/  (must run before backend/mobile consume it)
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
```

**Local service URLs after `supabase start`:**
- API: `http://127.0.0.1:54321`
- DB (PostgreSQL): port `54322`
- Studio: `http://127.0.0.1:54323`

Auth keys are printed by `npx supabase status` — `Publishable` = anon key, `Secret` = service role key.

## Architecture

### Data Flow

```
Mobile App (Expo)
  → api.ts (fetch to NestJS)  →  NestJS Backend  →  Supabase (PostgreSQL + Storage + Auth)
  → supabase.ts (direct SDK)  →  Supabase Auth / Storage (client-side operations)
```

The mobile app communicates with the NestJS backend for business logic (AI analysis orchestration), and directly with Supabase for auth and file uploads (bypassing the backend for these).

### Database Schema

Five tables in `public` schema, all with RLS enabled:

| Table | Purpose |
|-------|---------|
| `profiles` | Extends `auth.users` (1:1); auto-created by trigger on signup |
| `scans` | Photo submission records (links to `profiles`, stores `image_path` in storage) |
| `analysis_results` | AI output per scan (risk level, confidence, JSONB findings) |
| `professionals` | Referral directory (inspector / remediation / plumber / hvac) |
| `referrals` | Connects a scan to a professional |

Postgres enums: `risk_level` (low/moderate/high), `user_role`, `scan_status`, `professional_type`.

Storage bucket: `scan-images` (private). Path convention: `{user_id}/{filename}`. RLS enforces folder = authenticated user's UUID.

### NestJS Backend

Entry: `src/main.ts` — listens on `PORT` env var (default 3000), global prefix `/api`, CORS enabled.

Key patterns:
- **Environment validation**: `src/config/env.validation.ts` uses Zod to validate `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `PORT` at startup. Invalid env = hard crash with a clear error.
- **Supabase injection**: `src/config/supabase.config.ts` provides a `SUPABASE_CLIENT` token (service role key). Inject it in services with `@Inject(SUPABASE_CLIENT) private supabase: SupabaseClient`.
- **ConfigModule** is `isGlobal: true` — inject `ConfigService` anywhere without importing `ConfigModule`.
- New domain modules go in `src/modules/<domain>/` following the NestJS module/service/controller pattern.

### Expo Mobile App

Entry: `App.tsx` (root of `apps/mobile/`) — wraps everything in Redux → React Query → React Native Paper → React Navigation.

State: Redux Toolkit with a single `inspection` slice (`apps/mobile/src/store/slices/inspectionSlice.ts`) tracking `currentScan`, `isLoading`, `error`.

Server state: React Query (TanStack) for API calls. Use `api.ts` for backend requests and `supabase.ts` for direct Supabase operations.

Metro is configured in `metro.config.js` to watch the workspace root and resolve hoisted packages — required for monorepo symlink support.

Environment variables in Expo must be prefixed `EXPO_PUBLIC_` to be accessible at runtime.

### Shared Package

`packages/shared/src/schemas/inspection.schema.ts` exports all Zod schemas and inferred TypeScript types for every domain entity. **Always update this file when the DB schema changes** — it is the single source of truth for types shared between backend and mobile.

The shared package must be **built before** other packages consume it (`npm run build` in `packages/shared/`). In CI/Turborepo this is handled automatically via `"dependsOn": ["^build"]`.

DB columns are `snake_case`; Zod schemas use `camelCase`. The NestJS service layer is responsible for mapping between them.

## Environment Setup

Copy `.env.example` to `.env` in `apps/backend/` before starting:

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<from supabase status>
SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
PORT=3000
```

Copy `apps/mobile/.env.example` to `apps/mobile/.env`:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon key>
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

**Test credentials** (after `supabase db reset`):
- Homeowner: `homeowner@test.com` / `password123`
- Professional: `pro@test.com` / `password123`

## Key Conventions

- **Risk levels**: `low | moderate | high` — do not use `medium` or `critical` (old values).
- **Migrations**: Always create via `npx supabase migration new <name>` to get a correct timestamp prefix. Write SQL directly; do not use the Supabase dashboard for schema changes.
- **RLS**: All new tables must have RLS enabled. The backend uses the service role key (bypasses RLS); the mobile Supabase client uses the anon key (subject to RLS).
- **Module resolution**: The backend's `tsconfig.json` uses `"module": "nodenext"` — use `.js` extensions in relative imports if needed, or rely on `tsconfig-paths`.
