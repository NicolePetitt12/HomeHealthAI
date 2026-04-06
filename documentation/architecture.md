# Architecture

## Overview

Inspector Gnome is a **Turborepo monorepo** with three packages that share TypeScript types via a dedicated shared package. The mobile app communicates directly with Supabase for all operations. AI analysis is handled by a Supabase Edge Function triggered automatically when a scan is created.

## System Architecture

```mermaid
graph TB
    subgraph Mobile["Mobile App (Expo React Native)"]
        A[App.tsx<br/>Providers]
        B[Screens]
        C[Redux Store]
        D[React Query]
        E[Supabase Client<br/>anon key]
    end

    subgraph Supabase["Supabase (local: Docker)"]
        J[Auth<br/>:54321/auth]
        K[REST API<br/>:54321/rest]
        L[Storage<br/>scan-images bucket]
        M[PostgreSQL<br/>:54322]
        N[Studio<br/>:54323]
        O[Edge Functions<br/>:54321/functions/v1]
    end

    E -->|auth + storage upload| J
    E -->|direct queries RLS enforced| K
    E -->|image upload| L
    M -->|pg_net trigger on INSERT| O
    O -->|service role INSERT| M
    D -->|manages server state| B
    C -->|manages local state| B
```

## Data Flow — Scan Submission

```mermaid
sequenceDiagram
    participant User
    participant Mobile as Mobile App
    participant Storage as Supabase Storage
    participant DB as PostgreSQL
    participant Fn as Edge Function<br/>analyze-scan

    User->>Mobile: Take / upload photo
    Mobile->>Storage: Upload image to scan-images<br/>{user_id}/{timestamp}.jpg
    Storage-->>Mobile: image_path
    Mobile->>DB: INSERT into scans<br/>{ user_id, image_path, location, notes, status: pending }
    DB->>Fn: pg_net trigger fires automatically
    Fn->>DB: UPDATE scans SET status = 'processing'
    Fn->>Fn: Run AI analysis (LLM call)
    Fn->>DB: INSERT into analysis_results<br/>{ risk_level, confidence, findings, next_steps }
    Fn->>DB: UPDATE scans SET status = 'completed'
    Mobile->>DB: Poll analysis_results WHERE scan_id = ?
    DB-->>Mobile: analysis result
    Mobile->>User: Display risk level + findings + next steps
```

## Monorepo Package Relationships

```mermaid
graph LR
    shared["packages/shared<br/>@inspector-gnome/shared<br/><br/>Zod schemas<br/>TypeScript types"]
    backend["apps/backend<br/>@inspector-gnome/backend<br/><br/>Supabase config<br/>Edge Functions (Deno)"]
    mobile["apps/mobile<br/>@inspector-gnome/mobile<br/><br/>Expo React Native<br/>Supabase anon key"]

    shared -->|types + schemas| mobile
    shared -.->|reference only| backend
```

The `shared` package must be **built before** `mobile` can consume it. Turborepo handles this automatically via `"dependsOn": ["^build"]` in `turbo.json`.

## Tech Stack Details

### Mobile (`apps/mobile/`)

| Library | Role |
|---------|------|
| Expo 55 / React Native 0.83 | Runtime and native API access |
| React Navigation 7 (Native Stack) | Screen navigation |
| Redux Toolkit 2 | Local/UI state (current scan, loading, errors) |
| TanStack React Query 5 | Server state, caching, background refetching |
| React Native Paper 5 | Material Design 3 UI components |
| `@supabase/supabase-js` | Auth sessions + direct Storage uploads + DB queries |
| Zod 3 | Runtime validation |
| expo-camera | Photo capture |
| AsyncStorage | Session persistence |

Navigation stack: **Home → Camera → PhotoReview → Results** / **History**

### Edge Functions (`apps/backend/supabase/functions/`)

| Function | Trigger | Role |
|----------|---------|------|
| `analyze-scan` | `on_scan_created` Postgres trigger (pg_net) | Runs AI analysis, writes `analysis_results` |

Written in **Deno TypeScript**. Uses the `SUPABASE_SERVICE_ROLE_KEY` env var (auto-injected) to bypass RLS when writing analysis results.

To create a Supabase client in an Edge Function:
```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);
```

### Shared (`packages/shared/`)

Single file: `src/schemas/inspection.schema.ts` — exports all Zod schemas and TypeScript types for every domain entity:

- Enums: `RiskLevel`, `UserRole`, `ScanStatus`, `ProfessionalType`, `ReferralStatus`
- Entities: `Profile`, `Scan`, `AnalysisResult`, `Finding`, `Professional`, `Referral`
- DTOs: `CreateScan`, `CreateReferral`, `UpdateProfile`

**Always update this file when the database schema changes.**

DB columns are `snake_case`; Zod schemas use `camelCase`. The mobile app and Edge Functions each handle the mapping.
