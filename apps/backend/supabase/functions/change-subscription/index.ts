/**
 * change-subscription — Switches an existing active subscription to a new price,
 * with Stripe proration (always_invoice: generates a proration invoice immediately).
 *
 * Request body: { priceId: string }
 * Returns:      { success: true, subscriptionId: string, status: string }
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

  // ── Parse request ────────────────────────────────────────────────────────

  let priceId: string;
  try {
    const body = await req.json();
    priceId = body.priceId;
    if (!priceId || typeof priceId !== 'string') throw new Error();
  } catch {
    return json({ error: 'Request body must be { priceId: string }' }, 400);
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
      return json({ error: 'No active subscription to change' }, 400);
    }

    // Retrieve the Stripe subscription to get the subscription item ID
    const stripeSub = await stripe.subscriptions.retrieve(subRow.stripe_subscription_id);
    const currentItem = stripeSub.items.data[0];

    if (!currentItem) {
      return json({ error: 'Subscription has no items' }, 500);
    }

    // Guard against no-op
    if (currentItem.price.id === priceId) {
      return json({ error: 'Already on this plan' }, 400);
    }

    // Build the update params
    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [{ id: currentItem.id, price: priceId }],
      proration_behavior: 'always_invoice',
      payment_behavior: 'error_if_incomplete',
    };

    // If the subscription was scheduled for cancellation, reinstate it first
    if (stripeSub.cancel_at_period_end) {
      updateParams.cancel_at_period_end = false;
    }

    const updated = await stripe.subscriptions.update(
      subRow.stripe_subscription_id,
      updateParams,
    );

    // The stripe-webhook will handle updating the DB when it receives
    // customer.subscription.updated and invoice.payment_succeeded events.
    return json({
      success: true,
      subscriptionId: updated.id,
      status: updated.status,
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
