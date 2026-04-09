-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE public.subscription_status AS ENUM (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete',
  'incomplete_expired',
  'paused'
);

CREATE TYPE public.plan_tier AS ENUM ('free', 'home', 'pro');

-- ─── customers ───────────────────────────────────────────────────────────────
-- Links a profile to a Stripe customer ID. Created on first checkout attempt.

CREATE TABLE public.customers (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id         uuid        NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  stripe_customer_id text        NOT NULL UNIQUE,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_stripe_id ON public.customers(stripe_customer_id);

-- ─── subscriptions ───────────────────────────────────────────────────────────
-- One active subscription per customer at a time; all states are tracked here.

CREATE TABLE public.subscriptions (
  id                      uuid                       PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id             uuid                       NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stripe_subscription_id  text                       NOT NULL UNIQUE,
  stripe_price_id         text                       NOT NULL,
  plan_tier               public.plan_tier           NOT NULL DEFAULT 'free',
  status                  public.subscription_status NOT NULL,
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  cancel_at_period_end    boolean                    NOT NULL DEFAULT false,
  canceled_at             timestamptz,
  created_at              timestamptz                NOT NULL DEFAULT now(),
  updated_at              timestamptz                NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_customer  ON public.subscriptions(customer_id);
CREATE INDEX idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- ─── invoices ────────────────────────────────────────────────────────────────
-- Append-only record of all Stripe invoices for a customer.

CREATE TABLE public.invoices (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id            uuid        NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  stripe_invoice_id      text        NOT NULL UNIQUE,
  stripe_subscription_id text,
  amount_paid            integer     NOT NULL,  -- in cents
  currency               text        NOT NULL DEFAULT 'usd',
  status                 text        NOT NULL,  -- 'paid' | 'open' | 'void' | 'uncollectible'
  invoice_url            text,
  period_start           timestamptz,
  period_end             timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_customer ON public.invoices(customer_id);

-- ─── updated_at triggers ─────────────────────────────────────────────────────

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices      ENABLE ROW LEVEL SECURITY;

-- Users may read their own customer record.
CREATE POLICY "Users can view own customer record"
  ON public.customers FOR SELECT
  USING (profile_id = auth.uid());

-- Users may read their own subscriptions.
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = subscriptions.customer_id
        AND c.profile_id = auth.uid()
    )
  );

-- Users may read their own invoices.
CREATE POLICY "Users can view own invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.customers c
      WHERE c.id = invoices.customer_id
        AND c.profile_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE for authenticated users.
-- All writes are performed by Edge Functions using the service role key.

-- ─── Helper functions ────────────────────────────────────────────────────────

-- Returns number of scans created by the user in the current calendar month.
CREATE OR REPLACE FUNCTION public.get_monthly_scan_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT count(*)::integer
  FROM public.scans
  WHERE user_id = p_user_id
    AND created_at >= date_trunc('month', now())
    AND created_at <  date_trunc('month', now()) + interval '1 month';
$$;

-- Returns the user's current plan tier; defaults to 'free' if no active subscription.
CREATE OR REPLACE FUNCTION public.get_user_plan_tier(p_user_id uuid)
RETURNS public.plan_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(
    (
      SELECT s.plan_tier
      FROM public.subscriptions s
      JOIN public.customers c ON c.id = s.customer_id
      WHERE c.profile_id = p_user_id
        AND s.status IN ('active', 'trialing')
      ORDER BY s.created_at DESC
      LIMIT 1
    ),
    'free'::public.plan_tier
  );
$$;
