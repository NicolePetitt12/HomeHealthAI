-- Fix get_monthly_scan_count to only count non-failed scans.
-- Failed scans should not consume quota since no analysis was produced.

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
    AND status <> 'failed'
    AND created_at >= date_trunc('month', now())
    AND created_at <  date_trunc('month', now()) + interval '1 month';
$$;
