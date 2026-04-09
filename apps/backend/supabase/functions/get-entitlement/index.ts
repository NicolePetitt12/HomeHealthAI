/**
 * get-entitlement — Returns the caller's current plan tier and scan quota.
 *
 * Returns: Entitlement (see shared schema)
 *
 * Auth: Bearer <user_access_token>
 */

import { createClient } from '@supabase/supabase-js';

const SCAN_LIMITS: Record<string, number> = {
  free: 3,
  home: 20,
  pro: -1, // -1 = unlimited
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Missing authorization header' }, 401);
  }
  const userToken = authHeader.replace('Bearer ', '');

  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data: { user }, error: authError } = await admin.auth.getUser(userToken);
  if (authError || !user) {
    return json({ error: 'Invalid or expired token' }, 401);
  }

  // ── Quota data ───────────────────────────────────────────────────────────

  const [tierResult, countResult] = await Promise.all([
    admin.rpc('get_user_plan_tier', { p_user_id: user.id }),
    admin.rpc('get_monthly_scan_count', { p_user_id: user.id }),
  ]);

  const planTier: string = tierResult.data ?? 'free';
  const scansUsed: number = countResult.data ?? 0;
  const scansAllowed: number = SCAN_LIMITS[planTier] ?? 3;
  const canScan = scansAllowed === -1 || scansUsed < scansAllowed;

  // ── Subscription details (paid) or profile anchor (free) ─────────────────

  let subscriptionStatus: string | null = null;
  let currentPeriodEnd: string | null = null;
  let cancelAtPeriodEnd = false;
  let quotaPeriodStart: string | null = null;
  let quotaPeriodEnd: string | null = null;

  if (planTier !== 'free') {
    const { data: customer } = await admin
      .from('customers')
      .select('id')
      .eq('profile_id', user.id)
      .single();

    if (customer) {
      const { data: sub } = await admin
        .from('subscriptions')
        .select('status, current_period_start, current_period_end, cancel_at_period_end')
        .eq('customer_id', customer.id)
        .in('status', ['active', 'trialing', 'past_due'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (sub) {
        subscriptionStatus = sub.status;
        currentPeriodEnd = sub.current_period_end;
        cancelAtPeriodEnd = sub.cancel_at_period_end ?? false;
        quotaPeriodStart = sub.current_period_start;
        quotaPeriodEnd = sub.current_period_end;
      }
    }
  } else {
    // Free users: compute the rolling monthly window from profile creation date
    const { data: profile } = await admin
      .from('profiles')
      .select('created_at')
      .eq('id', user.id)
      .single();

    if (profile?.created_at) {
      const createdAt = new Date(profile.created_at);
      const now = new Date();
      const msPerMonth = 1000 * 60 * 60 * 24 * 30.44; // average month in ms
      const monthsElapsed = Math.floor((now.getTime() - createdAt.getTime()) / msPerMonth);
      const periodStart = new Date(createdAt);
      periodStart.setMonth(periodStart.getMonth() + monthsElapsed);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      quotaPeriodStart = periodStart.toISOString();
      quotaPeriodEnd = periodEnd.toISOString();
    }
  }

  return json({
    planTier,
    scansUsedThisMonth: scansUsed,
    scansAllowedThisMonth: scansAllowed,
    canScan,
    subscriptionStatus,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    quotaPeriodStart,
    quotaPeriodEnd,
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
