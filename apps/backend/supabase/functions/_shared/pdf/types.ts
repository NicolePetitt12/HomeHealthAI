export interface InvoiceCustomer {
  fullName: string | null;
  email: string | null;
  stripeCustomerId: string;
}

export interface InvoicePaymentMethod {
  brand: string;
  last4: string;
}

export interface InvoicePayload {
  invoiceId: string;
  invoiceNumber: string;
  createdAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  amountPaid: number;
  currency: string;
  status: string;
  planTier: string | null;
  customer: InvoiceCustomer;
  paymentMethod: InvoicePaymentMethod | null;
}
