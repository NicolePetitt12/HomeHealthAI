/**
 * create-checkout-session — Creates a Stripe Checkout Session for a subscription.
 *
 * Request body: { priceId: string }
 * Returns:      { url: string }
 *
 * Auth: Bearer <user_access_token>
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
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

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');

  // Retrieve or create the Stripe customer for this user
  const { data: customerRow } = await admin
    .from('customers')
    .select('stripe_customer_id')
    .eq('profile_id', user.id)
    .single();

  let stripeCustomerId: string;

  if (customerRow?.stripe_customer_id) {
    stripeCustomerId = customerRow.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_profile_id: user.id },
    });
    stripeCustomerId = customer.id;

    // Persist the mapping so we have it if the checkout is abandoned.
    await admin.from('customers').upsert(
      { profile_id: user.id, stripe_customer_id: stripeCustomerId },
      { onConflict: 'profile_id' },
    );
  }

  // Check if the user already has an active subscription for this price
  const { data: existingSub } = await admin
    .from('subscriptions')
    .select('id, status')
    .eq('stripe_price_id', priceId)
    .in('status', ['active', 'trialing'])
    .eq(
      'customer_id',
      (
        await admin
          .from('customers')
          .select('id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single()
      ).data?.id ?? '',
    )
    .maybeSingle();

  if (existingSub) {
    return json({ error: 'Already subscribed to this plan' }, 409);
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    client_reference_id: user.id,   // used by webhook to link customer → profile
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: 'inspectorgnome://subscription/success',
    cancel_url: 'inspectorgnome://subscription/cancel',
    subscription_data: {
      metadata: { supabase_profile_id: user.id },
    },
  });

  return json({ url: session.url });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
