# Inspector Gnome

A mobile application that helps homeowners identify potential mold and moisture issues using AI-powered image analysis. Users take photos of concerning areas, receive an AI risk assessment with educational feedback, and can connect with local professionals when elevated risk is detected.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo), Redux Toolkit, React Query, React Native Paper |
| Backend | NestJS, TypeScript, Zod |
| Database & Auth | Supabase (PostgreSQL), Row Level Security |
| Storage | Supabase Storage |
| Monorepo | Turborepo + npm workspaces |

---

## Prerequisites

- **Node.js** >= 20 (`node --version`)
- **npm** >= 10 (`npm --version`)
- **Docker** (required for local Supabase) — [Install Docker](https://docs.docker.com/get-docker/)
- **Expo Go** app on your phone or an Android/iOS emulator (for mobile development)

---

## Quick Start

### 1. Install dependencies

```bash
cd inspector-gnome
npm install
```

This installs all dependencies across all workspace packages.

### 2. Build the shared package

The shared types package must be built before the backend or mobile app can use it:

```bash
cd packages/shared && npm run build && cd ../..
```

### 3. Start local Supabase

```bash
cd apps/backend
npx supabase start
```

After it starts, run `npx supabase status` to get your local keys:

```
API URL: http://127.0.0.1:54321
Publishable: sb_publishable_...    ← SUPABASE_ANON_KEY
Secret:      sb_secret_...         ← SUPABASE_SERVICE_ROLE_KEY
```

### 4. Configure environment variables

**Backend:**
```bash
cp apps/backend/.env.example apps/backend/.env
# Edit apps/backend/.env and fill in the keys from supabase status
```

**Mobile:**
```bash
cp apps/mobile/.env.example apps/mobile/.env
# Edit apps/mobile/.env and fill in the anon key from supabase status
```

See [Environment Variables](documentation/development.md#environment-variables) for the full reference.

### 5. Run database migrations and seed data

```bash
cd apps/backend
npx supabase db reset
```

This applies all migrations and loads seed data with test accounts.

### 6. Start the backend

```bash
cd apps/backend
npm run start:dev
```

The API is available at `http://localhost:3000/api`. Verify with:

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","timestamp":"..."}
```

### 7. Start the mobile app

```bash
cd apps/mobile
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `a` for Android emulator / `i` for iOS simulator.

---

## Project Structure

```
inspector-gnome/
├── apps/
│   ├── backend/         NestJS REST API + Supabase local config
│   │   └── supabase/    Migrations, seed data, config
│   └── mobile/          Expo React Native app
├── packages/
│   └── shared/          Shared Zod schemas and TypeScript types
├── documentation/       Detailed developer documentation
├── CLAUDE.md            AI assistant context file
├── turbo.json           Turborepo pipeline config
└── package.json         Workspace root
```

---

## Available Scripts

Run from the **workspace root** (`inspector-gnome/`):

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all packages in parallel (watch mode) |
| `npm run build` | Build all packages |
| `npm run lint` | Lint all packages |
| `npm run test` | Run all tests |
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without writing |

---

## Test Credentials

After running `npx supabase db reset`:

| Role | Email | Password |
|------|-------|----------|
| Homeowner | `homeowner@test.com` | `password123` |
| Professional | `pro@test.com` | `password123` |

---

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](documentation/architecture.md) | System architecture, data flow diagrams, tech stack |
| [Database](documentation/database.md) | Schema, RLS policies, ER diagram, storage |
| [Development Guide](documentation/development.md) | Env setup, running services, ports reference |
| [Migrations](documentation/migrations.md) | Creating and applying DB migrations, seed data |
| [Testing](documentation/testing.md) | Running tests, linting, type checking |
