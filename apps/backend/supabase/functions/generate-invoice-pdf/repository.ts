import { SupabaseClient } from '@supabase/supabase-js';
import { NotFoundError } from '../_shared/supabase.ts';
import type { InvoicePayload } from '../_shared/pdf/types.ts';

interface InvoiceRow {
  id: string;
  stripe_invoice_id: string;
  amount_paid: number;
  currency: string;
  status: string;
  plan_tier: string | null;
  pdf_path: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  customer: {
    id: string;
    stripe_customer_id: string;
    profile: {
      full_name: string | null;
      email: string | null;
    };
  };
}

export interface InvoiceRecord {
  payload: InvoicePayload;
  pdfPath: string | null;
  stripeCustomerId: string;
}

export async function getInvoiceForUser(
  admin: SupabaseClient,
  invoiceId: string,
  userId: string,
): Promise<InvoiceRecord> {
  const { data, error } = await admin
    .from('invoices')
    .select(`
      id,
      stripe_invoice_id,
      amount_paid,
      currency,
      status,
      plan_tier,
      pdf_path,
      period_start,
      period_end,
      created_at,
      customer:customers!invoices_customer_id_fkey (
        id,
        stripe_customer_id,
        profile:profiles!customers_profile_id_fkey (
          full_name,
          email
        )
      )
    `)
    .eq('id', invoiceId)
    .single<InvoiceRow>();

  // Defense-in-depth: verify the invoice belongs to the requesting user by
  // joining customer → profile and matching the profile id to the JWT user.
  // We do this with a second targeted query to avoid a complex nested filter.
  if (error || !data) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }

  const { data: ownerCheck } = await admin
    .from('customers')
    .select('id')
    .eq('id', data.customer.id)
    .eq('profile_id', userId)
    .maybeSingle();

  if (!ownerCheck) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }

  const profile = data.customer.profile;

  const payload: InvoicePayload = {
    invoiceId: data.id,
    invoiceNumber: data.stripe_invoice_id,
    createdAt: data.created_at,
    periodStart: data.period_start,
    periodEnd: data.period_end,
    amountPaid: data.amount_paid,
    currency: data.currency,
    status: data.status,
    planTier: data.plan_tier,
    customer: {
      fullName: profile.full_name,
      email: profile.email,
      stripeCustomerId: data.customer.stripe_customer_id,
    },
    paymentMethod: null,
  };

  return {
    payload,
    pdfPath: data.pdf_path,
    stripeCustomerId: data.customer.stripe_customer_id,
  };
}

export async function updateInvoicePdfPath(
  admin: SupabaseClient,
  invoiceId: string,
  pdfPath: string,
): Promise<void> {
  const { error } = await admin
    .from('invoices')
    .update({ pdf_path: pdfPath })
    .eq('id', invoiceId);

  if (error) throw new Error(`Failed to update pdf_path: ${error.message}`);
}
