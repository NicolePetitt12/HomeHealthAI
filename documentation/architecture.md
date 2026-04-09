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

## Data Flow — Subscription Lifecycle

### New Subscription (Free → Paid)

```mermaid
sequenceDiagram
    participant User
    participant Mobile as Mobile App
    participant Sheet as Stripe Payment Sheet
    participant BE as Edge Function<br/>create-payment-sheet
    participant Stripe
    participant WH as Edge Function<br/>stripe-webhook
    participant DB as PostgreSQL

    User->>Mobile: Tap "Get started" on Home/Pro plan
    Mobile->>BE: POST /create-payment-sheet { priceId }
    BE->>Stripe: Create subscription + ephemeral key
    BE-->>Mobile: { clientSecret, ephemeralKey, customerId }
    Mobile->>Sheet: Present native Payment Sheet
    User->>Sheet: Enter card details & confirm
    Sheet->>Stripe: Process payment
    Stripe-->>Mobile: Payment result
    Mobile->>DB: invalidateQueries (poll every 3s)
    Stripe->>WH: checkout.session.completed
    WH->>DB: UPSERT customers (profile_id → stripe_customer_id)
    Stripe->>WH: customer.subscription.created
    WH->>DB: UPSERT subscriptions (plan_tier, status, period dates)
    DB-->>Mobile: entitlement updated → UI reflects new plan
```

### Upgrade / Downgrade (Paid → Paid)

```mermaid
sequenceDiagram
    participant User
    participant Mobile as Mobile App
    participant FN as Edge Function<br/>change-subscription
    participant Stripe
    participant WH as Edge Function<br/>stripe-webhook
    participant DB as PostgreSQL

    User->>Mobile: Tap "Upgrade" or "Downgrade"
    Mobile->>FN: POST /change-subscription { priceId }
    Note over FN: Looks up active sub in DB<br/>Calls stripe.subscriptions.update()<br/>proration_behavior: always_invoice
    FN->>Stripe: Update subscription items
    Stripe-->>FN: Updated subscription
    FN-->>Mobile: { success: true }
    Mobile->>Mobile: Show "Processing…" banner<br/>Poll entitlement every 3s
    Stripe->>WH: customer.subscription.updated
    WH->>DB: UPSERT subscriptions (new plan_tier, new period)
    Stripe->>WH: invoice.payment_succeeded (proration charge/credit)
    WH->>DB: UPSERT invoices
    DB-->>Mobile: entitlement.planTier changed → banner auto-hides
```

### Cancel to Free

```mermaid
sequenceDiagram
    participant User
    participant Mobile as Mobile App
    participant FN as Edge Function<br/>cancel-subscription
    participant Stripe
    participant WH as Edge Function<br/>stripe-webhook
    participant DB as PostgreSQL

    User->>Mobile: Tap "Downgrade to Free"
    Mobile->>Mobile: Show confirmation dialog
    User->>Mobile: Confirm downgrade
    Mobile->>FN: POST /cancel-subscription
    FN->>Stripe: subscriptions.update({ cancel_at_period_end: true })
    Stripe-->>FN: { currentPeriodEnd }
    FN-->>Mobile: { success, currentPeriodEnd }
    Mobile->>Mobile: Show "Access until <date>" dialog
    Stripe->>WH: customer.subscription.updated
    WH->>DB: subscriptions.cancel_at_period_end = true
    Note over DB,Mobile: User stays on paid plan until period end<br/>Free card shows "Cancellation pending"
    Note over Stripe,WH: On period end, Stripe fires subscription.deleted
    WH->>DB: subscriptions.status = 'canceled', plan_tier = 'free'
```

## Scan Quota System

```mermaid
flowchart TD
    A[User taps Start Scan] --> B{checkQuota}
    B -->|canScan = true| C[Proceed to camera]
    B -->|canScan = false| D[Show quota dialog]
    D --> E[Navigate to Subscription screen]

    C --> F[Photo uploaded + scan inserted]
    F --> G[analyze-scan triggered]
    G --> H{Server-side quota check<br/>get_monthly_scan_count}
    H -->|within limit| I[Run AI analysis]
    H -->|exceeded| J[Mark scan as failed<br/>Return 403]

    subgraph Quota Window
        K{Plan type?}
        K -->|Paid| L[current_period_start<br/>from Stripe webhook]
        K -->|Free| M[Monthly anniversary<br/>of profiles.created_at]
        L --> N[Count non-failed scans<br/>in window]
        M --> N
    end
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

Written in **Deno TypeScript**. Uses the `SUPABASE_SERVICE_ROLE_KEY` env var (auto-injected) to bypass RLS when writing results or querying subscription data.

| Function | Trigger | Role |
|----------|---------|------|
| `analyze-scan` | `on_scan_created` Postgres trigger (pg_net) | Runs AI analysis, writes `analysis_results` |
| `stripe-webhook` | Stripe HTTP POST | Receives Stripe events, syncs `subscriptions` and `invoices` tables |
| `get-entitlement` | User request | Returns plan tier, scan quota used/allowed, and billing period dates |
| `get-plans` | User request | Returns available paid plans with Stripe price IDs |
| `create-payment-sheet` | User request | Creates a new Stripe subscription + returns Payment Sheet parameters |
| `change-subscription` | User request | Prorated plan upgrade/downgrade on an existing subscription |
| `cancel-subscription` | User request | Schedules subscription cancellation at period end |
| `create-portal-session` | User request | Returns a Stripe Customer Portal URL for billing management |
| `stripe-setup` | Manual (one-time) | Creates Stripe products, prices, and webhook endpoint |
| `delete-account` | User request | Cancels Stripe subscription and purges all user data |

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
