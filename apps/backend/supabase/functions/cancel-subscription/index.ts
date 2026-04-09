/**
 * cancel-subscription — Schedules the active subscription to cancel at the end
 * of the current billing period. The user retains access until then.
 *
 * Request body: {} (empty)
 * Returns:      { success: true, cancelAtPeriodEnd: true, currentPeriodEnd: string }
 *
 * Auth: Bearer <user_access_token>
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
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

  // ── Stripe ───────────────────────────────────────────────────────────────

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    return json({ error: 'Stripe is not configured' }, 503);
  }

  const stripe = new Stripe(stripeSecretKey);

  try {
    // Look up the Stripe customer for this user
    const { data: customerRow } = await admin
      .from('customers')
      .select('id, stripe_customer_id')
      .eq('profile_id', user.id)
      .single();

    if (!customerRow?.stripe_customer_id) {
      return json({ error: 'No Stripe customer found for this user' }, 400);
    }

    // Find the current active subscription
    const { data: subRow } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('customer_id', customerRow.id)
      .in('status', ['active', 'trialing', 'past_due'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!subRow?.stripe_subscription_id) {
      return json({ error: 'No active subscription to cancel' }, 400);
    }

    const updated = await stripe.subscriptions.update(subRow.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    // The stripe-webhook will handle updating cancel_at_period_end in the DB
    // when it receives the customer.subscription.updated event.
    return json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(updated.current_period_end * 1000).toISOString(),
    });
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError) {
      return json({ error: err.message, code: err.code }, 400);
    }
    const message = err instanceof Error ? err.message : String(err);
    return json({ error: message }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
