# Email SMTP System Implementation

## Overview

This document describes the email notification system implemented for Inspector Gnome. The system sends automated emails for subscription events, payments, and user actions via GoDaddy SMTP.

## Files Created

### Email Module (`apps/backend/supabase/functions/_shared/email/`)

1. **types.ts** - TypeScript type definitions for all 10 email types:
   - `welcome` - Sent when a new user creates an account
   - `subscription_confirmed` - Sent after completing subscription checkout
   - `payment_confirmation` - Initial payment confirmation
   - `renewal_reminder` - Sent before automatic renewal
   - `subscription_canceled` - Sent when subscription is canceled
   - `payment_failed` - Sent when a payment fails
   - `payment_succeeded` - Sent for successful recurring payments
   - `plan_changed` - Sent when user upgrades/downgrades plan
   - `payment_method_updated` - Sent when payment method is changed
   - `billing_info_updated` - Sent when billing info is updated

2. **config.ts** - Email configuration including:
   - Brand colors (Primary: #C41E3A, Background: #0D0807, Text: #FFFFFF, Accent: #22C55E)
   - Sender information (configured via SMTP_USERNAME secret)
   - SMTP settings (read from environment variables)
   - Placeholder URLs for website/support/logo

3. **templates.ts** - HTML email templates:
   - Base template with header, content area, and footer
   - Individual content generators for each email type
   - Responsive design with inline styles
   - Corporate branding

4. **send.ts** - SMTP email sending logic:
   - Uses nodemailer for SMTP communication
   - SSL connection to GoDaddy (port 465)
   - Error handling (logs errors, doesn't throw)

5. **index.ts** - Module exports

### Edge Functions

**send-welcome-email/** - Triggered by database when new profile is created:
- Receives profile data from Postgres trigger
- Sends welcome email to new user
- Fire-and-forget pattern (doesn't block trigger)

### Database Migration

**migrations/20260423180000_add_welcome_email_trigger.sql**:
- Enables `pg_net` extension for HTTP requests from Postgres
- Creates `send_welcome_email()` function
- Creates `on_profile_created` trigger on profiles table
- Uses `pg_net.http_post()` to call Edge Function asynchronously

## Files Modified

### 1. `deno.json`

Added nodemailer import:
```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2",
    "stripe": "https://esm.sh/stripe@17",
    "nodemailer": "npm:nodemailer@6.9.10"
  }
}
```

### 2. `stripe-webhook/index.ts`

#### Added Imports:
- Email sending functions and types from the email module

#### Updated Event Handlers:

| Stripe Event | Handler Changes | Email Sent |
|--------------|----------------|------------|
| `checkout.session.completed` | Added `stripe` parameter, sends email | `subscription_confirmed` |
| `customer.subscription.updated` | Added event detection for plan changes | `plan_changed` or `subscription_canceled` |
| `customer.subscription.deleted` | Unchanged handler | `subscription_canceled` |
| `invoice.payment_succeeded` | Added `stripe` parameter, sends email | `payment_succeeded` |
| `invoice.payment_failed` | Added `stripe` parameter, sends email | `payment_failed` |

#### New Event Handlers:

| Stripe Event | Handler Function | Email Sent |
|--------------|------------------|------------|
| `invoice.upcoming` | `handleInvoiceUpcoming()` | `renewal_reminder` |
| `customer.source.updated` | `handlePaymentMethodUpdated()` | `payment_method_updated` |
| `payment_method.attached` | `handlePaymentMethodUpdated()` | `payment_method_updated` |
| `customer.updated` | `handleCustomerUpdated()` | `billing_info_updated` |

#### Key Implementation Details:

1. **Email sending is fire-and-forget**: All email calls use `.catch()` to log errors without blocking the webhook
2. **Stripe always receives 200 OK**: Ensures Stripe doesn't retry webhooks due to email failures
3. **Profile lookup**: Fetches user email and name from profiles table for personalization
4. **Plan detection**: Uses existing `resolvePlanTier()` helper to get plan name from Stripe price

### 3. `.env.example`

Added SMTP configuration placeholders:
```env
# SMTP Configuration (GoDaddy)
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USERNAME=test@example.com
SMTP_PASSWORD=test-password
```

### 4. `.env`

Added SMTP credentials to the local `.env` file (never commit this file):
```env
# SMTP Configuration — fill in from your email provider
SMTP_HOST=<smtp host>
SMTP_PORT=465
SMTP_USERNAME=<smtp user>
SMTP_PASSWORD=<smtp password>
```

**Note**: `.env` is already in `.gitignore` and won't be committed.

## Environment Variables

### Local Development

Variables are read from `apps/backend/supabase/functions/.env`:
- `SMTP_HOST` - SMTP server hostname (provider-specific)
- `SMTP_PORT` - SMTP port (465 for SSL)
- `SMTP_USERNAME` - Email account used as sender
- `SMTP_PASSWORD` - Email account password

### Production

Set secrets using Supabase CLI from `apps/backend/`:

```bash
npx supabase secrets set SMTP_HOST=<host>
npx supabase secrets set SMTP_PORT=465
npx supabase secrets set SMTP_USERNAME=<user>
npx supabase secrets set SMTP_PASSWORD=<password>
```

## Email Template Structure

All emails follow this structure:

```
┌─────────────────────────────────────┐
│           [LOGO]                    │  ← Header (centered)
│  ─────────────────────────────────  │
│                                     │
│  Email Title                        │  ← Dynamic content
│                                     │
│  Hello [name],                      │
│  [Type-specific message]            │
│                                     │
│  [CALL-TO-ACTION BUTTON]            │  ← Optional
│                                     │
│  ─────────────────────────────────  │
│  Website | Support                  │  ← Footer
│  Inspector Gnome - AI Mold Detection│
└─────────────────────────────────────┘
```

## Testing

### 1. Test Welcome Email

Start Supabase and create a new user account:

```bash
cd apps/backend
npx supabase start
npx supabase db reset
npx supabase functions serve
```

Then create a test account through the mobile app or Supabase dashboard.

### 2. Test Stripe Webhook Emails

Use Stripe CLI to simulate webhook events:

```bash
# Subscription confirmed
stripe trigger checkout.session.completed

# Payment succeeded
stripe trigger invoice.payment_succeeded

# Payment failed
stripe trigger invoice.payment_failed

# Subscription canceled
stripe trigger customer.subscription.deleted

# Upcoming renewal
stripe trigger invoice.upcoming
```

### 3. Verify Email Reception

Check the inbox configured as the sender (the email set in `SMTP_USERNAME`).

## Known Placeholders (TODO)

The following URLs are placeholders and should be updated:

```typescript
const EMAIL_CONFIG = {
  websiteUrl: 'https://homehealthai.com',        // TODO: Update with actual URL
  supportUrl: 'https://homehealthai.com/support', // TODO: Update with actual URL
  logoUrl: 'https://homehealthai.com/logo.png',   // TODO: Update with actual logo URL
};
```

Update these in `apps/backend/supabase/functions/_shared/email/config.ts`.

## Error Handling

- Email failures are **logged but not thrown**
- Stripe webhooks always receive `200 OK` (Stripe requirement)
- SMTP configuration is validated before attempting to send
- Missing environment variables are logged and gracefully handled
- Fire-and-forget pattern prevents blocking the main webhook flow

## Email Language

All emails are in **English** as confirmed during planning.

## Sender Information

- **From Name**: Inspector Gnome
- **From Address**: configured via `SMTP_USERNAME` secret
- **SMTP Server**: configured via `SMTP_HOST` secret
- **Port**: 465 (SSL)

## Next Steps

1. Apply the migration:
   ```bash
   cd apps/backend
   npx supabase db reset
   ```

2. Set production secrets (when deploying):
   ```bash
   npx supabase secrets set SMTP_HOST=<host>
   npx supabase secrets set SMTP_PORT=465
   npx supabase secrets set SMTP_USERNAME=<user>
   npx supabase secrets set SMTP_PASSWORD=<password>
   ```

3. Update placeholder URLs in `config.ts` with actual values

4. Test all email types using Stripe CLI and user registration

5. Monitor email delivery and adjust templates as needed
