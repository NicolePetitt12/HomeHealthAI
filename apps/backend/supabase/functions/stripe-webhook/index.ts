/**
 * stripe-webhook — Handles Stripe events and keeps Supabase DB in sync.
 *
 * JWT verification is disabled (Stripe cannot send JWTs).
 * All DB writes use the service role key to bypass RLS.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '../_shared/notify.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');

  if (!webhookSecret || !secretKey) {
    console.error('Missing STRIPE_WEBHOOK_SECRET or STRIPE_SECRET_KEY');
    return new Response('Server misconfigured', { status: 500 });
  }

  const stripe = new Stripe(secretKey);

  // Verify Stripe signature
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe signature verification failed:', err);
    return new Response(`Webhook signature invalid: ${String(err)}`, { status: 400 });
  }

  // Always return 200 to Stripe; errors are logged, not thrown.
  try {
    await handleEvent(stripe, event);
  } catch (err) {
    console.error(`Error handling event ${event.type}:`, err);
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});

// ─── Event Handler ────────────────────────────────────────────────────────────

async function handleEvent(stripe: Stripe, event: Stripe.Event): Promise<void> {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(admin, session);
      break;
    }
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(admin, stripe, sub);
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(admin, stripe, sub);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(admin, stripe, sub);
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await upsertInvoice(admin, invoice, 'paid');
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await upsertInvoice(admin, invoice, invoice.status ?? 'open');
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// ─── checkout.session.completed ──────────────────────────────────────────────

async function handleCheckoutCompleted(
  admin: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const stripeCustomerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id;

  // client_reference_id holds the Supabase profile_id (set in create-checkout-session)
  const profileId = session.client_reference_id;

  if (!stripeCustomerId || !profileId) {
    console.warn('checkout.session.completed: missing customer or client_reference_id');
    return;
  }

  const { error } = await admin.from('customers').upsert(
    {
      profile_id: profileId,
      stripe_customer_id: stripeCustomerId,
    },
    { onConflict: 'profile_id' },
  );

  if (error) throw error;
}

// ─── customer.subscription.* ─────────────────────────────────────────────────

async function upsertSubscription(
  admin: ReturnType<typeof createClient>,
  stripe: Stripe,
  sub: Stripe.Subscription,
): Promise<void> {
  const stripeCustomerId = typeof sub.customer === 'string'
    ? sub.customer
    : sub.customer.id;

  // Find our internal customer row
  const { data: customer, error: custErr } = await admin
    .from('customers')
    .select('id, profile_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (custErr || !customer) {
    console.warn(`upsertSubscription: no customer found for ${stripeCustomerId}`);
    return;
  }

  const priceId = sub.items.data[0]?.price?.id ?? '';
  const planTier = await resolvePlanTier(stripe, priceId);

  const { error } = await admin.from('subscriptions').upsert(
    {
      customer_id: customer.id,
      stripe_subscription_id: sub.id,
      stripe_price_id: priceId,
      plan_tier: planTier,
      status: sub.status,
      current_period_start: new Date((sub as unknown as { current_period_start: number }).current_period_start * 1000).toISOString(),
      current_period_end: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at
        ? new Date(sub.canceled_at * 1000).toISOString()
        : null,
    },
    { onConflict: 'stripe_subscription_id' },
  );

  if (error) throw error;

  // Send subscription notification
  if (customer.profile_id) {
    const tierLabel = planTier.charAt(0).toUpperCase() + planTier.slice(1);
    const notifMap: Record<string, { title: string; body: string }> = {
      active: { title: 'Plan Updated', body: `Your plan has been upgraded to ${tierLabel}.` },
      canceled: { title: 'Subscription Canceled', body: `Your ${tierLabel} subscription has been canceled.` },
      past_due: { title: 'Payment Issue', body: 'Your payment is past due. Please update your payment method.' },
    };
    const notif = notifMap[sub.status];
    if (notif) {
      await sendNotification(admin, {
        userId: customer.profile_id,
        type: 'subscription_changed',
        title: notif.title,
        body: notif.body,
        data: { screen: 'Subscription' },
      });
    }
  }
}

// ─── invoice.payment_* ───────────────────────────────────────────────────────

async function upsertInvoice(
  admin: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice,
  status: string,
): Promise<void> {
  if (!invoice.id) return;

  const stripeCustomerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : (invoice.customer as Stripe.Customer | null)?.id;

  if (!stripeCustomerId) return;

  const { data: customer, error: custErr } = await admin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (custErr || !customer) {
    console.warn(`upsertInvoice: no customer found for ${stripeCustomerId}`);
    return;
  }

  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : (invoice.subscription as Stripe.Subscription | null)?.id ?? null;

  const { error } = await admin.from('invoices').upsert(
    {
      customer_id: customer.id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      amount_paid: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? 'usd',
      status,
      invoice_url: invoice.hosted_invoice_url ?? null,
      period_start: invoice.period_start
        ? new Date(invoice.period_start * 1000).toISOString()
        : null,
      period_end: invoice.period_end
        ? new Date(invoice.period_end * 1000).toISOString()
        : null,
    },
    { onConflict: 'stripe_invoice_id' },
  );

  if (error) throw error;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Simple in-memory cache for price → plan_tier lookups within a single
// function invocation (avoids redundant Stripe API calls for the same price).
const priceCache = new Map<string, 'home' | 'pro' | 'free'>();

async function resolvePlanTier(
  stripe: Stripe,
  priceId: string,
): Promise<'home' | 'pro' | 'free'> {
  if (priceCache.has(priceId)) return priceCache.get(priceId)!;

  try {
    const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
    const product = price.product as Stripe.Product;
    const tier = (product.metadata?.app_plan_id ?? 'free') as 'home' | 'pro' | 'free';
    priceCache.set(priceId, tier);
    return tier;
  } catch {
    return 'free';
  }
}
