import Stripe from 'stripe';
import type { InvoicePaymentMethod } from '../_shared/pdf/types.ts';

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-04-10',
    });
  }
  return _stripe;
}

export async function getPaymentMethodSummary(
  stripeCustomerId: string,
): Promise<InvoicePaymentMethod | null> {
  try {
    const customer = await getStripe().customers.retrieve(stripeCustomerId, {
      expand: ['invoice_settings.default_payment_method'],
    });

    if (customer.deleted) return null;

    const pm = customer.invoice_settings?.default_payment_method;
    if (!pm || typeof pm === 'string') return null;
    if (pm.type !== 'card' || !pm.card) return null;

    return {
      brand: pm.card.brand ?? 'card',
      last4: pm.card.last4 ?? '****',
    };
  } catch (err) {
    console.error('Failed to fetch payment method from Stripe:', err);
    return null;
  }
}
