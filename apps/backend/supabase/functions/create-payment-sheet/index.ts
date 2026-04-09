/**
 * create-payment-sheet — Creates a Stripe subscription and returns the data
 * needed to initialize the native Payment Sheet.
 *
 * Request body: { priceId: string }
 * Returns:      { clientSecret, ephemeralKey, customerId, subscriptionId }
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

      await admin.from('customers').upsert(
        { profile_id: user.id, stripe_customer_id: stripeCustomerId },
        { onConflict: 'profile_id' },
      );
    }

    // Cancel any existing incomplete subscriptions for this price to avoid conflicts
    const existingSubs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      price: priceId,
      status: 'incomplete',
      limit: 5,
    });
    for (const sub of existingSubs.data) {
      await stripe.subscriptions.cancel(sub.id);
    }

    // Create an incomplete subscription — payment is collected via the Payment Sheet
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
        payment_method_types: ['card'],
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: { supabase_profile_id: user.id },
    });

    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice?.payment_intent as Stripe.PaymentIntent | null;
    const clientSecret = paymentIntent?.client_secret;

    if (!clientSecret) {
      return json({ error: 'Failed to retrieve payment intent client secret' }, 500);
    }

    // Create an ephemeral key so the Payment Sheet can manage customer payment methods
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: stripeCustomerId },
      { apiVersion: '2024-06-20' },
    );

    return json({
      clientSecret,
      ephemeralKey: ephemeralKey.secret,
      customerId: stripeCustomerId,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    // Surface the real Stripe error message
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
