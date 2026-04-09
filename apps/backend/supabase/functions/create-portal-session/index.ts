/**
 * create-portal-session — Creates a Stripe Customer Portal session.
 *
 * Returns: { url: string }
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

  // ── Look up Stripe customer ──────────────────────────────────────────────

  const { data: customerRow } = await admin
    .from('customers')
    .select('stripe_customer_id')
    .eq('profile_id', user.id)
    .single();

  if (!customerRow?.stripe_customer_id) {
    return json({ error: 'No billing account found for this user' }, 404);
  }

  // ── Create portal session ────────────────────────────────────────────────

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '');

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerRow.stripe_customer_id,
    return_url: 'inspectorgnome://subscription/portal-return',
  });

  return json({ url: portalSession.url });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
