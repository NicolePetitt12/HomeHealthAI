/**
 * Email types for the Inspector Gnome platform
 */
export type EmailType =
  | 'welcome'
  | 'subscription_confirmed'
  | 'payment_confirmation'
  | 'renewal_reminder'
  | 'subscription_canceled'
  | 'payment_failed'
  | 'payment_succeeded'
  | 'plan_changed'
  | 'payment_method_updated'
  | 'billing_info_updated'
  | 'account_deleted';

/**
 * Base email data structure
 */
export interface EmailData {
  to: string;
  subject: string;
  recipientName: string;
}

/**
 * Email data for welcome email
 */
export interface WelcomeEmailData extends EmailData {
  type: 'welcome';
}

/**
 * Email data for subscription confirmed
 */
export interface SubscriptionConfirmedEmailData extends EmailData {
  type: 'subscription_confirmed';
  planName: string;
  amount: number;
  currency: string;
}

/**
 * Email data for payment confirmation
 */
export interface PaymentConfirmationEmailData extends EmailData {
  type: 'payment_confirmation';
  amount: number;
  currency: string;
  invoiceUrl?: string;
}

/**
 * Email data for renewal reminder
 */
export interface RenewalReminderEmailData extends EmailData {
  type: 'renewal_reminder';
  renewalDate: string;
  amount: number;
  currency: string;
}

/**
 * Email data for subscription canceled
 */
export interface SubscriptionCanceledEmailData extends EmailData {
  type: 'subscription_canceled';
  endDate: string;
}

/**
 * Email data for payment failed
 */
export interface PaymentFailedEmailData extends EmailData {
  type: 'payment_failed';
  amount: number;
  currency: string;
  retryDate?: string;
}

/**
 * Email data for payment succeeded
 */
export interface PaymentSucceededEmailData extends EmailData {
  type: 'payment_succeeded';
  amount: number;
  currency: string;
  invoiceUrl?: string;
}

/**
 * Email data for plan changed
 */
export interface PlanChangedEmailData extends EmailData {
  type: 'plan_changed';
  oldPlan: string;
  newPlan: string;
  effectiveDate: string;
}

/**
 * Email data for payment method updated
 */
export interface PaymentMethodUpdatedEmailData extends EmailData {
  type: 'payment_method_updated';
  last4?: string;
  brand?: string;
}

/**
 * Email data for billing info updated
 */
export interface BillingInfoUpdatedEmailData extends EmailData {
  type: 'billing_info_updated';
}

/**
 * Email data for account deleted
 */
export interface AccountDeletedEmailData extends EmailData {
  type: 'account_deleted';
  deletedAt: string;
}

/**
 * Union type for all email data
 */
export type AnyEmailData =
  | WelcomeEmailData
  | SubscriptionConfirmedEmailData
  | PaymentConfirmationEmailData
  | RenewalReminderEmailData
  | SubscriptionCanceledEmailData
  | PaymentFailedEmailData
  | PaymentSucceededEmailData
  | PlanChangedEmailData
  | PaymentMethodUpdatedEmailData
  | BillingInfoUpdatedEmailData
  | AccountDeletedEmailData;
