import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type { Entitlement, Subscription, Invoice, Plan } from '@inspector-gnome/shared';

// Extracts the actual error message from a Supabase Edge Function error response
async function extractFunctionError(error: unknown): Promise<Error> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      return new Error(body?.error ?? body?.message ?? error.message);
    } catch {
      return new Error(error.message);
    }
  }
  return error instanceof Error ? error : new Error(String(error));
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export async function getPlans(): Promise<Plan[]> {
  const { data, error } = await supabase.functions.invoke('get-plans', {
    method: 'GET',
  });
  if (error) throw error;
  return (data ?? []) as Plan[];
}

// ─── Entitlement ─────────────────────────────────────────────────────────────

export async function getEntitlement(): Promise<Entitlement> {
  const { data, error } = await supabase.functions.invoke('get-entitlement', {
    method: 'GET',
  });
  if (error) throw error;
  return data as Entitlement;
}

// ─── Subscription ────────────────────────────────────────────────────────────

export async function getSubscription(): Promise<Subscription | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      id,
      customer_id,
      stripe_subscription_id,
      stripe_price_id,
      plan_tier,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      canceled_at,
      created_at,
      updated_at
    `)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    customerId: data.customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    stripePriceId: data.stripe_price_id,
    planTier: data.plan_tier,
    status: data.status,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
    canceledAt: data.canceled_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export interface InvoicesPage {
  items: Invoice[];
  nextPage: number | null;
}

export async function getInvoices({
  pageParam = 0,
  pageSize = 10,
}: {
  pageParam?: number;
  pageSize?: number;
} = {}): Promise<InvoicesPage> {
  const from = pageParam * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  const items = (data ?? []).map((row) => ({
    id: row.id,
    customerId: row.customer_id,
    stripeInvoiceId: row.stripe_invoice_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    amountPaid: row.amount_paid,
    currency: row.currency,
    status: row.status,
    invoiceUrl: row.invoice_url,
    periodStart: row.period_start,
    periodEnd: row.period_end,
    createdAt: row.created_at,
    pdfPath: row.pdf_path ?? null,
    planTier: row.plan_tier ?? null,
  }));

  return {
    items,
    nextPage: items.length < pageSize ? null : pageParam + 1,
  };
}

export async function downloadInvoicePdf(invoiceId: string): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
    body: { invoice_id: invoiceId },
  });
  if (error) throw await extractFunctionError(error);
  if (!data?.url) throw new Error('No PDF URL returned');
  return { url: data.url as string };
}

// ─── Payment Sheet ───────────────────────────────────────────────────────────

export interface PaymentSheetParams {
  clientSecret: string;
  ephemeralKey: string;
  customerId: string;
  subscriptionId: string;
}

export async function createPaymentSheet(priceId: string): Promise<PaymentSheetParams> {
  const { data, error } = await supabase.functions.invoke('create-payment-sheet', {
    body: { priceId },
  });
  if (error) throw await extractFunctionError(error);
  if (!data?.clientSecret) throw new Error('No client secret returned');
  return data as PaymentSheetParams;
}

// ─── Change Subscription (upgrade / downgrade between paid plans) ────────────

export interface ChangeSubscriptionResult {
  success: boolean;
  subscriptionId: string;
  status: string;
}

export async function changeSubscription(priceId: string): Promise<ChangeSubscriptionResult> {
  const { data, error } = await supabase.functions.invoke('change-subscription', {
    body: { priceId },
  });
  if (error) throw await extractFunctionError(error);
  return data as ChangeSubscriptionResult;
}

// ─── Cancel Subscription (downgrade to free at period end) ───────────────────

export interface CancelSubscriptionResult {
  success: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}

export async function cancelSubscription(): Promise<CancelSubscriptionResult> {
  const { data, error } = await supabase.functions.invoke('cancel-subscription', {
    body: {},
  });
  if (error) throw await extractFunctionError(error);
  return data as CancelSubscriptionResult;
}

// ─── Portal ──────────────────────────────────────────────────────────────────

export async function createPortalSession(): Promise<{ url: string }> {
  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    body: {},
  });
  if (error) throw error;
  if (!data?.url) throw new Error('No portal URL returned');
  return { url: data.url };
}
