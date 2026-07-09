/**
 * stripe-setup - Idempotent Stripe product/price/webhook configuration.
 *
 * Disabled unless STRIPE_SETUP_ENABLED=true and the caller provides
 * x-internal-admin-secret matching STRIPE_SETUP_ADMIN_SECRET.
 *
 * Invoke:
 *   curl -X POST https://<project>.supabase.co/functions/v1/stripe-setup \
 *     -H "x-internal-admin-secret: <STRIPE_SETUP_ADMIN_SECRET>"
 *
 * It is safe to run multiple times - existing resources are never duplicated.
 */

import Stripe from 'stripe';

const ADMIN_SECRET_HEADER = 'x-internal-admin-secret';
const APP_TAG = 'inspector-gnome';

const PLANS = [
  {
    appPlanId: 'home',
    productName: 'Inspector Gnome Home',
    description: 'Home plan — 20 scans per month',
    unitAmount: 999,    // $9.99 in cents
    currency: 'usd',
    interval: 'month' as const,
  },
  {
    appPlanId: 'pro',
    productName: 'Inspector Gnome Pro',
    description: 'Pro plan — unlimited scans',
    unitAmount: 2999,   // $29.99 in cents
    currency: 'usd',
    interval: 'month' as const,
  },
];

const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.upcoming',
  'customer.updated',
  'customer.source.updated',
  'payment_method.attached',
  'payment_method.updated',
  'payment_method.detached',
];

function timingSafeEqual(a: string | null, b: string | null): boolean {
  if (!a || !b || a.length !== b.length) return false;

  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function authorizeStripeSetup(req: Request): Response | null {
  if (Deno.env.get('STRIPE_SETUP_ENABLED') !== 'true') {
    return json({ error: 'Not found' }, 404);
  }

  const adminSecret = Deno.env.get('STRIPE_SETUP_ADMIN_SECRET');
  if (!adminSecret) {
    return json({ error: 'Stripe setup is not configured' }, 500);
  }

  if (!timingSafeEqual(req.headers.get(ADMIN_SECRET_HEADER), adminSecret)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  return null;
}

Deno.serve(async (req: Request) => {
  const setupAccessError = authorizeStripeSetup(req);
  if (setupAccessError) {
    return setupAccessError;
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secretKey) {
    return json({ error: 'STRIPE_SECRET_KEY is not set' }, 500);
  }

  const stripe = new Stripe(secretKey);

  // ── Products & Prices ────────────────────────────────────────────────────

  const productsCreated: string[] = [];
  const productsFound: string[] = [];

  const priceIds: Record<string, string> = {};

  for (const plan of PLANS) {
    // Search for an existing product by metadata to avoid duplicates even if
    // the product name changes in the future.
    const existing = await stripe.products.search({
      query: `metadata['app']:'${APP_TAG}' AND metadata['app_plan_id']:'${plan.appPlanId}'`,
    });

    let product: Stripe.Product;

    if (existing.data.length > 0) {
      product = existing.data[0];
      productsFound.push(product.id);
    } else {
      product = await stripe.products.create({
        name: plan.productName,
        description: plan.description,
        metadata: { app: APP_TAG, app_plan_id: plan.appPlanId },
      });
      productsCreated.push(product.id);
    }

    // Find an active price for this product matching our amount and interval.
    const prices = await stripe.prices.list({
      product: product.id,
      active: true,
    });

    const existingPrice = prices.data.find(
      (p) =>
        p.unit_amount === plan.unitAmount &&
        p.currency === plan.currency &&
        p.recurring?.interval === plan.interval,
    );

    if (existingPrice) {
      priceIds[plan.appPlanId] = existingPrice.id;
    } else {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.unitAmount,
        currency: plan.currency,
        recurring: { interval: plan.interval },
        metadata: { app: APP_TAG, app_plan_id: plan.appPlanId },
      });
      priceIds[plan.appPlanId] = price.id;
    }
  }

  // ── Webhook Endpoint ─────────────────────────────────────────────────────

  // WEBHOOK_BASE_URL overrides the default Supabase URL for webhook registration.
  // Set it to the public domain where Edge Functions are reachable, e.g.:
  //   https://hhai.subacuatica.com.mx
  const webhookBase = Deno.env.get('WEBHOOK_BASE_URL') ?? Deno.env.get('SUPABASE_URL') ?? '';
  const webhookUrl = `${webhookBase}/functions/v1/stripe-webhook`;

  const existingWebhooks = await stripe.webhookEndpoints.list();
  const existingWebhook = existingWebhooks.data.find(
    (w) => w.url === webhookUrl,
  );

  let webhookResult: { id: string; secret?: string; status: string };

  if (existingWebhook) {
    const currentEvents = new Set(existingWebhook.enabled_events);
    const targetEvents = new Set(WEBHOOK_EVENTS);
    const needsUpdate =
      currentEvents.size !== targetEvents.size ||
      [...targetEvents].some((e) => !currentEvents.has(e));

    if (needsUpdate) {
      const updated = await stripe.webhookEndpoints.update(existingWebhook.id, {
        enabled_events: WEBHOOK_EVENTS,
      });
      webhookResult = { id: updated.id, status: 'updated' };
    } else {
      webhookResult = { id: existingWebhook.id, status: 'already_exists' };
    }
  } else {
    const webhook = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: WEBHOOK_EVENTS,
      metadata: { app: APP_TAG },
    });
    webhookResult = {
      id: webhook.id,
      // secret is only returned on creation — set it as a Supabase secret
      secret: (webhook as Stripe.WebhookEndpoint & { secret?: string }).secret,
      status: 'created',
    };
  }

  return json({
    products: {
      created: productsCreated,
      found: productsFound,
    },
    prices: priceIds,
    webhook: webhookResult,
    note: webhookResult.secret
      ? 'Run: npx supabase secrets set STRIPE_WEBHOOK_SECRET=' + webhookResult.secret
      : 'Webhook signing secret was already configured.',
  });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

