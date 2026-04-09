# Database

All database infrastructure lives in `apps/backend/supabase/`. This includes migrations, seed data, and local Supabase configuration.

## Entity Relationship Diagram

```mermaid
erDiagram
    auth_users {
        uuid id PK
        text email
        jsonb raw_user_meta_data
    }

    profiles {
        uuid id PK,FK
        text email
        text full_name
        text avatar_url
        user_role role
        text phone
        timestamptz created_at
        timestamptz updated_at
    }

    scans {
        uuid id PK
        uuid user_id FK
        text image_path
        text location
        text notes
        scan_status status
        timestamptz created_at
        timestamptz updated_at
    }

    analysis_results {
        uuid id PK
        uuid scan_id FK
        risk_level risk_level
        numeric confidence
        jsonb findings
        text explanation
        text[] next_steps
        text model_version
        timestamptz created_at
    }

    professionals {
        uuid id PK
        uuid user_id FK
        text business_name
        professional_type professional_type
        text email
        text phone
        text city
        text state
        text zip_code
        boolean is_verified
        timestamptz created_at
        timestamptz updated_at
    }

    referrals {
        uuid id PK
        uuid scan_id FK
        uuid professional_id FK
        uuid user_id FK
        text message
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    customers {
        uuid id PK
        uuid profile_id FK
        text stripe_customer_id
        timestamptz created_at
        timestamptz updated_at
    }

    subscriptions {
        uuid id PK
        uuid customer_id FK
        text stripe_subscription_id
        text stripe_price_id
        plan_tier plan_tier
        subscription_status status
        timestamptz current_period_start
        timestamptz current_period_end
        boolean cancel_at_period_end
        timestamptz canceled_at
        timestamptz created_at
        timestamptz updated_at
    }

    invoices {
        uuid id PK
        uuid customer_id FK
        text stripe_invoice_id
        text stripe_subscription_id
        integer amount_paid
        text currency
        text status
        text invoice_url
        timestamptz period_start
        timestamptz period_end
        timestamptz created_at
    }

    auth_users ||--|| profiles : "triggers auto-create"
    profiles ||--o{ scans : "user_id"
    scans ||--o| analysis_results : "scan_id"
    profiles ||--o{ referrals : "user_id"
    professionals ||--o{ referrals : "professional_id"
    scans ||--o{ referrals : "scan_id"
    profiles ||--o| professionals : "user_id (nullable)"
    profiles ||--o| customers : "profile_id (1:1)"
    customers ||--o{ subscriptions : "customer_id"
    customers ||--o{ invoices : "customer_id"
```

## Tables

### `profiles`
Extends `auth.users` in a 1:1 relationship. Created automatically when a user signs up via the `handle_new_user` trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Same as `auth.users.id` (PK + FK) |
| `email` | `text` | Copied from auth on creation |
| `full_name` | `text` | From `raw_user_meta_data.full_name` |
| `avatar_url` | `text` | Optional |
| `role` | `user_role` | Default: `homeowner` |
| `phone` | `text` | Optional |
| `created_at` / `updated_at` | `timestamptz` | Auto-managed |

### `scans`
A photo submission for AI mold analysis.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` | Generated |
| `user_id` | `uuid` | FK → `profiles.id` |
| `image_path` | `text` | Storage path: `{user_id}/{filename}` |
| `location` | `text` | User-described location (e.g. "Bathroom ceiling") |
| `notes` | `text` | Optional user notes |
| `status` | `scan_status` | `pending → processing → completed / failed` |

### `analysis_results`
The AI output for a completed scan. Written exclusively by the `analyze-scan` Edge Function (service role).

| Column | Type | Notes |
|--------|------|-------|
| `scan_id` | `uuid` | FK → `scans.id` |
| `risk_level` | `risk_level` | `low`, `moderate`, or `high` |
| `confidence` | `numeric(5,4)` | Range 0.0000 – 1.0000 |
| `findings` | `jsonb` | Array of finding objects `{ type, description, location?, severity? }` |
| `explanation` | `text` | Plain-language explanation for the homeowner |
| `next_steps` | `text[]` | Ordered list of recommended actions |
| `model_version` | `text` | AI model identifier (e.g. `inspector-gnome-v1.0`) |

### `professionals`
The referral directory. `user_id` is nullable — a professional can be in the directory before having an app account.

| Column | Type | Notes |
|--------|------|-------|
| `professional_type` | `professional_type` | `inspector`, `remediation`, `plumber`, `hvac` |
| `is_verified` | `boolean` | Manually verified by admins |
| `city`, `state`, `zip_code` | `text` | Location for local matching |

### `referrals`
Connects a user's scan to a professional.

| Column | Type | Notes |
|--------|------|-------|
| `status` | `text` | `pending`, `accepted`, `declined`, `completed` |
| `message` | `text` | Optional message from the user to the professional |

### `customers`
Links a Supabase profile to a Stripe customer. Created on the user's first checkout attempt.

| Column | Type | Notes |
|--------|------|-------|
| `profile_id` | `uuid` | FK → `profiles.id` (UNIQUE — one Stripe customer per user) |
| `stripe_customer_id` | `text` | Stripe's `cus_...` identifier |

### `subscriptions`
The current subscription state for a customer. All plan changes and status transitions are reflected here via Stripe webhooks.

| Column | Type | Notes |
|--------|------|-------|
| `customer_id` | `uuid` | FK → `customers.id` |
| `stripe_subscription_id` | `text` | Stripe's `sub_...` identifier (UNIQUE) |
| `stripe_price_id` | `text` | Stripe price associated with this subscription |
| `plan_tier` | `plan_tier` | `free`, `home`, or `pro` — derived from price metadata |
| `status` | `subscription_status` | See enum below |
| `current_period_end` | `timestamptz` | Next billing date (or cancellation date) |
| `cancel_at_period_end` | `boolean` | `true` if the user has requested cancellation |

### `invoices`
Append-only record of all payments. Written exclusively by the `stripe-webhook` Edge Function.

| Column | Type | Notes |
|--------|------|-------|
| `customer_id` | `uuid` | FK → `customers.id` |
| `amount_paid` | `integer` | Amount in cents (e.g. `999` = $9.99) |
| `status` | `text` | `paid`, `open`, `void`, or `uncollectible` |
| `invoice_url` | `text` | Stripe-hosted invoice URL for the user |

---

## Enum Types

| Enum | Values |
|------|--------|
| `risk_level` | `low`, `moderate`, `high` |
| `user_role` | `homeowner`, `property_manager`, `renter`, `professional` |
| `scan_status` | `pending`, `processing`, `completed`, `failed` |
| `professional_type` | `inspector`, `remediation`, `plumber`, `hvac` |
| `plan_tier` | `free`, `home`, `pro` |
| `subscription_status` | `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `incomplete`, `incomplete_expired`, `paused` |

## Storage

**Bucket:** `scan-images`
- **Visibility:** Private (signed URLs required)
- **File size limit:** 10 MB
- **Allowed MIME types:** `image/jpeg`, `image/png`, `image/webp`, `image/heic`
- **Path convention:** `{user_id}/{filename}` — the first path segment is always the user's UUID

Also configured in `apps/backend/supabase/config.toml`:
```toml
[storage.buckets.scan-images]
public = false
file_size_limit = "10MiB"
allowed_mime_types = ["image/jpeg", "image/png", "image/webp", "image/heic"]
```

## Row Level Security (RLS)

All tables have RLS enabled. **Edge Functions use the service role key** (bypasses RLS). The **mobile Supabase client uses the anon key** (subject to RLS).

| Table | Policy Summary |
|-------|---------------|
| `profiles` | Users can view and update their own profile only |
| `scans` | Users can view, create, update, delete their own scans |
| `analysis_results` | Users can view results for their own scans; INSERT is service-role only |
| `professionals` | All authenticated users can view the directory; professionals can update their own listing |
| `referrals` | Users can view/create their own referrals; professionals can view/update referrals directed to them |
| `customers` | Users can SELECT their own row only; all writes are service-role only |
| `subscriptions` | Users can SELECT their own subscriptions (via customers join); all writes are service-role only |
| `invoices` | Users can SELECT their own invoices (via customers join); all writes are service-role only |

**Storage RLS:** Users can upload, view, and delete files only within their own `{user_id}/` folder.

## Triggers

### `handle_new_user`
Runs after every `INSERT` on `auth.users`. Auto-creates a `profiles` row with the new user's `id`, `email`, and `full_name`/`avatar_url` from `raw_user_meta_data`.

```sql
-- Defined in: 20260324224647_create_schema.sql
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### `update_updated_at`
Runs before every `UPDATE` on `profiles`, `scans`, `professionals`, and `referrals`. Sets `updated_at = now()`.

## Indexes

| Index | Table | Columns |
|-------|-------|---------|
| `idx_scans_user_id` | `scans` | `user_id` |
| `idx_scans_status` | `scans` | `status` |
| `idx_analysis_scan_id` | `analysis_results` | `scan_id` |
| `idx_professionals_type` | `professionals` | `professional_type` |
| `idx_professionals_location` | `professionals` | `city, state` |
| `idx_referrals_user` | `referrals` | `user_id` |
| `idx_referrals_professional` | `referrals` | `professional_id` |
