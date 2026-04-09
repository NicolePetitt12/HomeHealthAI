/**
 * get-plans — Returns available subscription plans with their Stripe price IDs.
 *
 * No auth required — this is public information.
 * Returns: Plan[]
 */

import Stripe from 'stripe';

export interface Plan {
  appPlanId: 'home' | 'pro';
  name: string;
  description: string;
  priceId: string;
  unitAmount: number;   // cents
  currency: string;
  interval: string;
}

Deno.serve(async (req: Request) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secretKey) {
    return json({ error: 'Stripe not configured' }, 500);
  }

  const stripe = new Stripe(secretKey);

  try {
    // Find all active products tagged for this app
    const products = await stripe.products.search({
      query: `metadata['app']:'inspector-gnome' AND active:'true'`,
    });

    const plans: Plan[] = [];

    for (const product of products.data) {
      const appPlanId = product.metadata?.app_plan_id as 'home' | 'pro' | undefined;
      if (!appPlanId || !['home', 'pro'].includes(appPlanId)) continue;

      // Get the active recurring price for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        type: 'recurring',
      });

      if (prices.data.length === 0) continue;

      // Prefer the most recently created price
      const price = prices.data.sort((a, b) => b.created - a.created)[0];

      plans.push({
        appPlanId,
        name: product.name,
        description: product.description ?? '',
        priceId: price.id,
        unitAmount: price.unit_amount ?? 0,
        currency: price.currency,
        interval: price.recurring?.interval ?? 'month',
      });
    }

    // Sort: home before pro
    plans.sort((a, b) => {
      const order = { home: 0, pro: 1 };
      return order[a.appPlanId] - order[b.appPlanId];
    });

    return json(plans);
  } catch (err) {
    console.error('get-plans error:', err);
    return json({ error: 'Failed to fetch plans' }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
