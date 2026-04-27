/**
 * stripe-webhook — Handles Stripe events and keeps Supabase DB in sync.
 *
 * JWT verification is disabled (Stripe cannot send JWTs).
 * All DB writes use the service role key to bypass RLS.
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendNotification } from '../_shared/notify.ts';
import { sendEmail } from '../_shared/email/index.ts';
import type {
  SubscriptionConfirmedEmailData,
  PaymentSucceededEmailData,
  PaymentFailedEmailData,
  SubscriptionCanceledEmailData,
  PlanChangedEmailData,
  RenewalReminderEmailData,
  PaymentMethodUpdatedEmailData,
  BillingInfoUpdatedEmailData,
} from '../_shared/email/index.ts';

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

  console.log(`[webhook] received event: ${event.type} (id=${event.id})`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(admin, stripe, session);
      break;
    }
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(admin, stripe, sub);
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(admin, stripe, sub, event);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(admin, stripe, sub);
      break;
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await upsertInvoice(admin, stripe, invoice, 'paid');
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await upsertInvoice(admin, stripe, invoice, invoice.status ?? 'open');
      break;
    }
    case 'invoice.upcoming': {
      const invoice = event.data.object as Stripe.Invoice;
      await handleInvoiceUpcoming(admin, stripe, invoice);
      break;
    }
    case 'customer.source.updated':
    case 'payment_method.attached':
    case 'payment_method.updated':
    case 'payment_method.detached': {
      const paymentMethod = event.data.object as Stripe.PaymentMethod;
      await handlePaymentMethodUpdated(admin, stripe, paymentMethod);
      break;
    }
    case 'customer.updated': {
      const customer = event.data.object as Stripe.Customer;
      await handleCustomerUpdated(admin, customer);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

// ─── checkout.session.completed ──────────────────────────────────────────────

async function handleCheckoutCompleted(
  admin: ReturnType<typeof createClient>,
  stripe: Stripe,
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

  // Send subscription confirmed email
  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', profileId)
      .single();

    if (profile && session.amount_total) {
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const priceId = subscription.items.data[0]?.price?.id ?? '';
      const planTier = await resolvePlanTier(stripe, priceId);

      const emailData: SubscriptionConfirmedEmailData = {
        type: 'subscription_confirmed',
        to: profile.email,
        subject: 'Subscription Confirmed - Inspector Gnome',
        recipientName: profile.full_name || 'there',
        planName: planTier.charAt(0).toUpperCase() + planTier.slice(1),
        amount: session.amount_total,
        currency: session.currency || 'usd',
      };

      sendEmail(emailData).catch((err) => {
        console.error('Failed to send subscription confirmed email:', err);
      });
    }
  } catch (err) {
    console.error('Error preparing subscription confirmed email:', err);
  }
}

// ─── customer.subscription.* ─────────────────────────────────────────────────

async function upsertSubscription(
  admin: ReturnType<typeof createClient>,
  stripe: Stripe,
  sub: Stripe.Subscription,
  event?: Stripe.Event,
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

  // Get previous subscription data for plan change detection
  const { data: prevSub } = await admin
    .from('subscriptions')
    .select('plan_tier, status')
    .eq('stripe_subscription_id', sub.id)
    .single();

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

  // Send email notifications
  if (customer.profile_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', customer.profile_id)
      .single();

    if (profile) {
      const recipientName = profile.full_name || 'there';

      // Subscription canceled
      if (sub.status === 'canceled' || (prevSub && prevSub.status !== 'canceled' && sub.cancel_at_period_end)) {
        const emailData: SubscriptionCanceledEmailData = {
          type: 'subscription_canceled',
          to: profile.email,
          subject: 'Subscription Canceled - Inspector Gnome',
          recipientName,
          endDate: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000).toLocaleDateString(),
        };

        sendEmail(emailData).catch((err) => {
          console.error('Failed to send subscription canceled email:', err);
        });
      }
      // Plan changed
      else if (prevSub && prevSub.plan_tier !== planTier) {
        const emailData: PlanChangedEmailData = {
          type: 'plan_changed',
          to: profile.email,
          subject: 'Plan Changed - Inspector Gnome',
          recipientName,
          oldPlan: prevSub.plan_tier.charAt(0).toUpperCase() + prevSub.plan_tier.slice(1),
          newPlan: planTier.charAt(0).toUpperCase() + planTier.slice(1),
          effectiveDate: new Date().toLocaleDateString(),
        };

        sendEmail(emailData).catch((err) => {
          console.error('Failed to send plan changed email:', err);
        });
      }
    }

    // Send subscription notification
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
  stripe: Stripe,
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
    .select('id, profile_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (custErr || !customer) {
    console.warn(`upsertInvoice: no customer found for ${stripeCustomerId}`);
    return;
  }

  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : (invoice.subscription as Stripe.Subscription | null)?.id ?? null;

  // Resolve plan_tier from our subscriptions table so it is frozen on the invoice
  let planTier: string | null = null;
  if (subscriptionId) {
    const { data: sub } = await admin
      .from('subscriptions')
      .select('plan_tier')
      .eq('stripe_subscription_id', subscriptionId)
      .maybeSingle();
    planTier = sub?.plan_tier ?? null;
  }

  const { error } = await admin.from('invoices').upsert(
    {
      customer_id: customer.id,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscriptionId,
      amount_paid: invoice.amount_paid ?? 0,
      currency: invoice.currency ?? 'usd',
      status,
      plan_tier: planTier,
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

  // Send email notifications
  if (customer.profile_id) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', customer.profile_id)
      .single();

    if (profile && invoice.amount_due) {
      const recipientName = profile.full_name || 'there';

      if (status === 'paid') {
        const emailData: PaymentSucceededEmailData = {
          type: 'payment_succeeded',
          to: profile.email,
          subject: 'Payment Successful - Inspector Gnome',
          recipientName,
          amount: invoice.amount_paid ?? 0,
          currency: invoice.currency ?? 'usd',
          invoiceUrl: invoice.hosted_invoice_url ?? undefined,
        };

        sendEmail(emailData).catch((err) => {
          console.error('Failed to send payment succeeded email:', err);
        });
      } else if (status === 'open' || status === 'uncollectible') {
        const nextPaymentAttempt = invoice.next_payment_attempt
          ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
          : undefined;

        const emailData: PaymentFailedEmailData = {
          type: 'payment_failed',
          to: profile.email,
          subject: 'Payment Failed - Inspector Gnome',
          recipientName,
          amount: invoice.amount_due,
          currency: invoice.currency ?? 'usd',
          retryDate: nextPaymentAttempt,
        };

        sendEmail(emailData).catch((err) => {
          console.error('Failed to send payment failed email:', err);
        });
      }
    }
  }
}

// ─── invoice.upcoming ────────────────────────────────────────────────────────

async function handleInvoiceUpcoming(
  admin: ReturnType<typeof createClient>,
  stripe: Stripe,
  invoice: Stripe.Invoice,
): Promise<void> {
  const stripeCustomerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : (invoice.customer as Stripe.Customer | null)?.id;

  if (!stripeCustomerId || !invoice.amount_due) return;

  const { data: customer } = await admin
    .from('customers')
    .select('profile_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (!customer?.profile_id) return;

  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', customer.profile_id)
    .single();

  if (!profile) return;

  const renewalDate = invoice.period_end
    ? new Date(invoice.period_end * 1000).toLocaleDateString()
    : 'soon';

  const emailData: RenewalReminderEmailData = {
    type: 'renewal_reminder',
    to: profile.email,
    subject: 'Subscription Renewal Reminder - Inspector Gnome',
    recipientName: profile.full_name || 'there',
    renewalDate,
    amount: invoice.amount_due,
    currency: invoice.currency ?? 'usd',
  };

  sendEmail(emailData).catch((err) => {
    console.error('Failed to send renewal reminder email:', err);
  });
}

// ─── payment_method.updated ──────────────────────────────────────────────────

async function handlePaymentMethodUpdated(
  admin: ReturnType<typeof createClient>,
  stripe: Stripe,
  paymentMethod: Stripe.PaymentMethod,
): Promise<void> {
  const stripeCustomerId = typeof paymentMethod.customer === 'string'
    ? paymentMethod.customer
    : (paymentMethod.customer as Stripe.Customer | null)?.id;

  if (!stripeCustomerId) {
    console.log('handlePaymentMethodUpdated: payment method has no customer attached, skipping');
    return;
  }

  const { data: customer } = await admin
    .from('customers')
    .select('profile_id')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (!customer?.profile_id) {
    console.log(`handlePaymentMethodUpdated: no local customer for ${stripeCustomerId} (likely a CLI-generated test event)`);
    return;
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', customer.profile_id)
    .single();

  if (!profile) {
    console.log(`handlePaymentMethodUpdated: no profile for ${customer.profile_id}`);
    return;
  }

  const emailData: PaymentMethodUpdatedEmailData = {
    type: 'payment_method_updated',
    to: profile.email,
    subject: 'Payment Method Updated - Inspector Gnome',
    recipientName: profile.full_name || 'there',
    last4: paymentMethod.card?.last4,
    brand: paymentMethod.card?.brand,
  };

  sendEmail(emailData).catch((err) => {
    console.error('Failed to send payment method updated email:', err);
  });
}

// ─── customer.updated ────────────────────────────────────────────────────────

async function handleCustomerUpdated(
  admin: ReturnType<typeof createClient>,
  customer: Stripe.Customer,
): Promise<void> {
  const { data: dbCustomer } = await admin
    .from('customers')
    .select('profile_id')
    .eq('stripe_customer_id', customer.id)
    .single();

  if (!dbCustomer?.profile_id) return;

  const { data: profile } = await admin
    .from('profiles')
    .select('email, full_name')
    .eq('id', dbCustomer.profile_id)
    .single();

  if (!profile) return;

  const emailData: BillingInfoUpdatedEmailData = {
    type: 'billing_info_updated',
    to: profile.email,
    subject: 'Billing Information Updated - Inspector Gnome',
    recipientName: profile.full_name || 'there',
  };

  sendEmail(emailData).catch((err) => {
    console.error('Failed to send billing info updated email:', err);
  });
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
