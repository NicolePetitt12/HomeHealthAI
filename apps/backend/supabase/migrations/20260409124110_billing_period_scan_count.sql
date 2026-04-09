-- Align get_monthly_scan_count with actual billing periods instead of calendar months.
--
-- Paid users: count scans since subscriptions.current_period_start (synced from Stripe).
-- Free users: rolling 1-month window anchored to profiles.created_at ("monthly anniversary").
--
-- Function signature is unchanged — callers (get-entitlement, analyze-scan) need no updates.

CREATE OR REPLACE FUNCTION public.get_monthly_scan_count(p_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH period AS (
    SELECT COALESCE(
      -- Paid users: use Stripe billing period start
      (
        SELECT s.current_period_start
        FROM public.subscriptions s
        JOIN public.customers c ON c.id = s.customer_id
        WHERE c.profile_id = p_user_id
          AND s.status IN ('active', 'trialing', 'past_due')
        ORDER BY s.created_at DESC
        LIMIT 1
      ),
      -- Free users: rolling month from account creation date.
      -- Calculates the most recent monthly "anniversary" of created_at.
      -- Example: created March 20, today April 25 → period start = April 20.
      (
        SELECT p.created_at + (
          floor(
            extract(epoch FROM (now() - p.created_at))
            / extract(epoch FROM interval '1 month')
          )::int * interval '1 month'
        )
        FROM public.profiles p
        WHERE p.id = p_user_id
      )
    ) AS period_start
  )
  SELECT count(*)::integer
  FROM public.scans, period
  WHERE scans.user_id = p_user_id
    AND scans.status <> 'failed'
    AND scans.created_at >= period.period_start
    AND scans.created_at <  period.period_start + interval '1 month';
$$;
