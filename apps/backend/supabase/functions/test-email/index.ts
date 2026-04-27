/**
 * test-email — Dev-only endpoint to send any email type with sample data.
 *
 * Usage:
 *   POST /functions/v1/test-email
 *   Body: { "type": "payment_method_updated", "to": "you@example.com" }
 *
 * Returns 200 on success. Returns 400 if type is invalid or SMTP fails.
 *
 * JWT verification is disabled (see config.toml) so it can be curl-tested directly.
 */

import { sendEmail } from '../_shared/email/index.ts';
import type { AnyEmailData, EmailType } from '../_shared/email/index.ts';

const SAMPLES: Record<EmailType, (to: string) => AnyEmailData> = {
  welcome: (to) => ({
    type: 'welcome',
    to,
    subject: 'Welcome to Inspector Gnome!',
    recipientName: 'Jane Test',
  }),
  subscription_confirmed: (to) => ({
    type: 'subscription_confirmed',
    to,
    subject: 'Subscription Confirmed - Inspector Gnome',
    recipientName: 'Jane Test',
    planName: 'Home',
    amount: 999,
    currency: 'usd',
  }),
  payment_confirmation: (to) => ({
    type: 'payment_confirmation',
    to,
    subject: 'Payment Confirmation - Inspector Gnome',
    recipientName: 'Jane Test',
    amount: 999,
    currency: 'usd',
    invoiceUrl: 'https://invoice.stripe.com/test',
  }),
  renewal_reminder: (to) => ({
    type: 'renewal_reminder',
    to,
    subject: 'Subscription Renewal Reminder - Inspector Gnome',
    recipientName: 'Jane Test',
    renewalDate: new Date(Date.now() + 7 * 24 * 3600_000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    amount: 999,
    currency: 'usd',
  }),
  subscription_canceled: (to) => ({
    type: 'subscription_canceled',
    to,
    subject: 'Subscription Canceled - Inspector Gnome',
    recipientName: 'Jane Test',
    endDate: new Date(Date.now() + 30 * 24 * 3600_000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }),
  payment_failed: (to) => ({
    type: 'payment_failed',
    to,
    subject: 'Payment Failed - Inspector Gnome',
    recipientName: 'Jane Test',
    amount: 999,
    currency: 'usd',
    retryDate: new Date(Date.now() + 3 * 24 * 3600_000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }),
  payment_succeeded: (to) => ({
    type: 'payment_succeeded',
    to,
    subject: 'Payment Successful - Inspector Gnome',
    recipientName: 'Jane Test',
    amount: 999,
    currency: 'usd',
    invoiceUrl: 'https://invoice.stripe.com/test',
  }),
  plan_changed: (to) => ({
    type: 'plan_changed',
    to,
    subject: 'Plan Changed - Inspector Gnome',
    recipientName: 'Jane Test',
    oldPlan: 'Home',
    newPlan: 'Pro',
    effectiveDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }),
  payment_method_updated: (to) => ({
    type: 'payment_method_updated',
    to,
    subject: 'Payment Method Updated - Inspector Gnome',
    recipientName: 'Jane Test',
    brand: 'visa',
    last4: '4242',
  }),
  billing_info_updated: (to) => ({
    type: 'billing_info_updated',
    to,
    subject: 'Billing Information Updated - Inspector Gnome',
    recipientName: 'Jane Test',
  }),
  account_deleted: (to) => ({
    type: 'account_deleted',
    to,
    subject: 'Account Deleted - Inspector Gnome',
    recipientName: 'Jane Test',
    deletedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
  }),
};

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { type, to } = await req.json() as { type?: string; to?: string };

    if (!type || !to) {
      return new Response(
        JSON.stringify({ error: 'Missing "type" or "to" in body', availableTypes: Object.keys(SAMPLES) }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const builder = SAMPLES[type as EmailType];
    if (!builder) {
      return new Response(
        JSON.stringify({ error: `Unknown type "${type}"`, availableTypes: Object.keys(SAMPLES) }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const ok = await sendEmail(builder(to));
    if (!ok) {
      return new Response(
        JSON.stringify({ error: 'SMTP send failed — check server logs' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return new Response(
      JSON.stringify({ success: true, type, to }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('test-email error:', err);
    return new Response(
      JSON.stringify({ error: 'Invalid request', details: String(err) }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
});
