# Database Migrations

All migrations are managed with the Supabase CLI and live in `apps/backend/supabase/migrations/`. Run all migration commands from the `apps/backend/` directory.

## Current Migrations

| File | Description |
|------|-------------|
| `20260324224647_create_schema.sql` | Creates all tables, enums, indexes, and triggers |
| `20260324224738_create_rls_policies.sql` | Enables RLS and creates all row-level security policies |
| `20260324224800_create_storage_buckets.sql` | Creates the `scan-images` storage bucket and storage policies |
| `20260406000000_create_analyze_scan_webhook.sql` | Adds `pg_net` trigger on `scans` INSERT to fire `analyze-scan` Edge Function |
| `20260409011720_create_subscription_tables.sql` | Adds `customers`, `subscriptions`, `invoices` tables; `plan_tier` and `subscription_status` enums; `get_user_plan_tier` and `get_monthly_scan_count` SQL functions |
| `20260409120000_fix_monthly_scan_count.sql` | Excludes failed scans from `get_monthly_scan_count` quota calculation |
| `20260409124110_billing_period_scan_count.sql` | Rewrites `get_monthly_scan_count` to use billing period start instead of calendar month |

## Applying Migrations

### Full reset (development)

Drops and recreates the database, applies all migrations, and loads seed data:

```bash
cd apps/backend
npx supabase db reset
```

> **Warning:** This is destructive — all existing data is lost. Use only in local development.

### Check migration status

```bash
cd apps/backend
npx supabase migration list
```

Shows which migrations have been applied and which are pending.

## Creating New Migrations

Always use the CLI to create migration files — it adds a precise timestamp prefix that guarantees correct ordering:

```bash
cd apps/backend
npx supabase migration new <descriptive_name>
```

Examples:
```bash
npx supabase migration new add_scan_location_coordinates
npx supabase migration new create_notifications_table
npx supabase migration new add_index_on_analysis_risk_level
```

This creates an empty file at `supabase/migrations/{timestamp}_{name}.sql`. Edit it with your SQL, then run `npx supabase db reset` to apply it locally.

### Migration conventions

- Use `snake_case` for all SQL identifiers (tables, columns, indexes, functions)
- Always add `COMMENT ON TABLE` for new tables
- All new tables must have:
  - `id uuid PRIMARY KEY DEFAULT gen_random_uuid()`
  - `created_at timestamptz NOT NULL DEFAULT now()`
  - `updated_at timestamptz NOT NULL DEFAULT now()` (add the `set_updated_at` trigger)
- Enable RLS in the same migration or in a separate policies migration
- **Never modify existing migration files** — create new ones to alter schema

## Naming Conventions

Database columns use `snake_case`. Zod schemas (in `packages/shared`) use `camelCase`. The mobile app and Edge Functions each handle the mapping.

| Database | Zod / TypeScript |
|----------|-----------------|
| `user_id` | `userId` |
| `image_path` | `imagePath` |
| `risk_level` | `riskLevel` |
| `created_at` | `createdAt` |

## Seed Data

The seed file at `apps/backend/supabase/seed.sql` is automatically applied after migrations during `npx supabase db reset`.

**What it creates:**

| Resource | Details |
|----------|---------|
| 2 test auth users | `homeowner@test.com` and `pro@test.com` (password: `password123`) |
| 2 profiles | Auto-created by the `handle_new_user` trigger; professional's role updated to `professional` |
| 4 professionals | MoldBusters Inc. (inspector), CleanAir Remediation, ProPlumb Solutions, CoolFlow HVAC — all in Austin TX |
| 1 completed scan | "Bathroom ceiling" for the homeowner |
| 1 analysis result | Moderate risk, 78% confidence, with findings and next steps |
| 1 referral | Pending referral from the homeowner to MoldBusters Inc. |

> The seed file uses `ON CONFLICT DO NOTHING` on all inserts, so running `db reset` multiple times is safe.

## Running Ad-hoc SQL

```bash
cd apps/backend
npx supabase db query "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
```

Alternatively, use **Supabase Studio** at `http://127.0.0.1:54323` for an interactive SQL editor.
