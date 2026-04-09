import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe from 'stripe';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Extract user identity from the Authorization header (anon key JWT)
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const userToken = authHeader.replace('Bearer ', '');

  // Service-role client — bypasses RLS, required for auth.admin.deleteUser
  const admin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Verify the caller and get their user id from the JWT
  const { data: { user }, error: authError } = await admin.auth.getUser(userToken);
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const userId = user.id;

  try {
    // 1. Cancel any active Stripe subscriptions and remove the customer record.
    //    The customers table CASCADE handles subscriptions + invoices rows.
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (stripeKey) {
      const { data: customerRow } = await admin
        .from('customers')
        .select('stripe_customer_id')
        .eq('profile_id', userId)
        .maybeSingle();

      if (customerRow?.stripe_customer_id) {
        const stripe = new Stripe(stripeKey);
        const subs = await stripe.subscriptions.list({
          customer: customerRow.stripe_customer_id,
          status: 'active',
          limit: 10,
        });
        for (const sub of subs.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    }

    // Remove customer row (cascades to subscriptions + invoices)
    await admin.from('customers').delete().eq('profile_id', userId);

    // 3. Delete referrals for all of this user's scans
    const { data: userScans } = await admin
      .from('scans')
      .select('id')
      .eq('user_id', userId);
    const scanIds = (userScans ?? []).map((s: { id: string }) => s.id);

    if (scanIds.length > 0) {
      await admin.from('referrals').delete().in('scan_id', scanIds);
      await admin.from('analysis_results').delete().in('scan_id', scanIds);
    }

    // 4. Delete referrals created directly by the user
    await admin.from('referrals').delete().eq('user_id', userId);

    // 5. Delete storage files in scan-images/{userId}/
    const { data: files } = await admin.storage
      .from('scan-images')
      .list(userId);
    if (files && files.length > 0) {
      const paths = files.map((f: { name: string }) => `${userId}/${f.name}`);
      await admin.storage.from('scan-images').remove(paths);
    }

    // 6. Delete scans
    await admin.from('scans').delete().eq('user_id', userId);

    // 7. Delete profile
    await admin.from('profiles').delete().eq('id', userId);

    // 8. Delete auth user (requires service role)
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('delete-account error:', err);
    return new Response(
      JSON.stringify({ error: 'Account deletion failed', details: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
