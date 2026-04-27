/**
 * generate-invoice-pdf
 *
 * Request: POST { invoice_id: string }
 * Auth: Bearer JWT (Supabase user)
 * Returns: { url: string, expiresIn: number }
 */
import { getServiceClient, requireAuthUser, jsonResponse, AuthError, NotFoundError } from '../_shared/supabase.ts';
import { generateAndStoreInvoicePdf } from './service.ts';

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const admin = getServiceClient();

  try {
    const user = await requireAuthUser(req, admin);

    const body = await req.json().catch(() => ({}));
    const invoiceId: string | undefined = body?.invoice_id;

    if (!invoiceId || typeof invoiceId !== 'string') {
      return jsonResponse({ error: 'invoice_id is required' }, 400);
    }

    const result = await generateAndStoreInvoicePdf(admin, user.id, invoiceId);
    return jsonResponse(result);
  } catch (err) {
    if (err instanceof AuthError)    return jsonResponse({ error: err.message }, 401);
    if (err instanceof NotFoundError) return jsonResponse({ error: err.message }, 404);

    console.error('[generate-invoice-pdf]', err);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});
