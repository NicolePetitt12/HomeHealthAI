import { SupabaseClient } from '@supabase/supabase-js';
import { getInvoiceForUser, updateInvoicePdfPath } from './repository.ts';
import { getPaymentMethodSummary } from './stripe-client.ts';
import { renderInvoicePdf } from '../_shared/pdf/invoice-template.ts';

const BUCKET = 'invoices';
const SIGNED_URL_TTL_SECONDS = 300;

export async function generateAndStoreInvoicePdf(
  admin: SupabaseClient,
  userId: string,
  invoiceId: string,
): Promise<{ url: string; expiresIn: number }> {
  const record = await getInvoiceForUser(admin, invoiceId, userId);

  if (record.pdfPath) {
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(record.pdfPath, SIGNED_URL_TTL_SECONDS);

    if (!error && data?.signedUrl) {
      return { url: data.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS };
    }
    // Signed URL creation failed (e.g., file removed); regenerate below.
  }

  const paymentMethod = await getPaymentMethodSummary(record.stripeCustomerId);
  const payload = { ...record.payload, paymentMethod };

  const pdfBytes = await renderInvoicePdf(payload);
  const pdfPath = `${userId}/${invoiceId}.pdf`;

  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(pdfPath, pdfBytes, { contentType: 'application/pdf', upsert: true });

  if (uploadError) throw new Error(`PDF upload failed: ${uploadError.message}`);

  await updateInvoicePdfPath(admin, invoiceId, pdfPath);

  const { data: signedData, error: signedError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(pdfPath, SIGNED_URL_TTL_SECONDS);

  if (signedError || !signedData?.signedUrl) {
    throw new Error('Failed to create signed URL after upload');
  }

  return { url: signedData.signedUrl, expiresIn: SIGNED_URL_TTL_SECONDS };
}
