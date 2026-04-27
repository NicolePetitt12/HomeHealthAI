import { EMAIL_CONFIG } from './config.ts';
import type {
  AnyEmailData,
  WelcomeEmailData,
  SubscriptionConfirmedEmailData,
  PaymentConfirmationEmailData,
  RenewalReminderEmailData,
  SubscriptionCanceledEmailData,
  PaymentFailedEmailData,
  PaymentSucceededEmailData,
  PlanChangedEmailData,
  PaymentMethodUpdatedEmailData,
  BillingInfoUpdatedEmailData,
  AccountDeletedEmailData,
} from './types.ts';

/**
 * Format currency amount
 */
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

/**
 * Base HTML template
 */
function getBaseTemplate(content: string): string {
  const { colors, websiteUrl, supportUrl } = EMAIL_CONFIG;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inspector Gnome</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${colors.background};">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${colors.background};">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: ${colors.background}; border: 1px solid ${colors.border}; border-radius: 8px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 40px 40px 20px;">
              <h2 style="margin: 0; color: ${colors.primary}; font-size: 22px; font-weight: 700; letter-spacing: 1px;">Inspector Gnome</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px 40px; color: ${colors.text};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid ${colors.border}; text-align: center;">
              <p style="margin: 0 0 10px; font-size: 14px; color: ${colors.text};">
                <a href="${websiteUrl}" style="color: ${colors.accent}; text-decoration: none; margin: 0 10px;">Website</a>
                <span style="color: ${colors.border};">|</span>
                <a href="${supportUrl}" style="color: ${colors.accent}; text-decoration: none; margin: 0 10px;">Support</a>
              </p>
              <p style="margin: 0; font-size: 12px; color: #888;">
                Inspector Gnome - AI Mold Detection
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Button component
 */
function getButton(text: string, url: string): string {
  const { colors } = EMAIL_CONFIG;

  return `
    <table cellpadding="0" cellspacing="0" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 14px 40px; background-color: ${colors.primary}; color: ${colors.buttonText}; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

/**
 * Welcome email template
 */
function getWelcomeContent(data: WelcomeEmailData): string {
  const { colors, websiteUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Welcome to Inspector Gnome!
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Thank you for joining Inspector Gnome, your AI-powered mold detection solution. We're excited to help you maintain a healthy home environment.
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Get started by exploring our platform and discovering how easy it is to detect and prevent mold issues.
    </p>
    ${getButton('Get Started', websiteUrl)}
    <p style="margin: 0; font-size: 14px; color: #888;">
      If you have any questions, our support team is here to help.
    </p>
  `;
}

/**
 * Subscription confirmed email template
 */
function getSubscriptionConfirmedContent(data: SubscriptionConfirmedEmailData): string {
  const { colors, websiteUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Subscription Confirmed
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Your subscription to <strong>${data.planName}</strong> has been confirmed. You now have full access to all premium features.
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      <strong>Amount:</strong> ${formatCurrency(data.amount, data.currency)}
    </p>
    ${getButton('Access Dashboard', websiteUrl)}
    <p style="margin: 0; font-size: 14px; color: #888;">
      Thank you for choosing Inspector Gnome!
    </p>
  `;
}

/**
 * Payment confirmation email template
 */
function getPaymentConfirmationContent(data: PaymentConfirmationEmailData): string {
  const { colors } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Payment Confirmation
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      We've received your payment of <strong>${formatCurrency(data.amount, data.currency)}</strong>.
    </p>
    ${data.invoiceUrl ? getButton('View Invoice', data.invoiceUrl) : ''}
    <p style="margin: 0; font-size: 14px; color: #888;">
      Thank you for your payment!
    </p>
  `;
}

/**
 * Renewal reminder email template
 */
function getRenewalReminderContent(data: RenewalReminderEmailData): string {
  const { colors, websiteUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Subscription Renewal Reminder
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Your subscription will automatically renew on <strong>${data.renewalDate}</strong>.
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      <strong>Renewal Amount:</strong> ${formatCurrency(data.amount, data.currency)}
    </p>
    ${getButton('Manage Subscription', websiteUrl)}
    <p style="margin: 0; font-size: 14px; color: #888;">
      No action is required. Your payment method will be charged automatically.
    </p>
  `;
}

/**
 * Subscription canceled email template
 */
function getSubscriptionCanceledContent(data: SubscriptionCanceledEmailData): string {
  const { colors, websiteUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Subscription Canceled
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Your subscription has been canceled. You'll continue to have access until <strong>${data.endDate}</strong>.
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      We're sorry to see you go. If you change your mind, you can reactivate your subscription at any time.
    </p>
    ${getButton('Reactivate Subscription', websiteUrl)}
    <p style="margin: 0; font-size: 14px; color: #888;">
      Thank you for using Inspector Gnome!
    </p>
  `;
}

/**
 * Payment failed email template
 */
function getPaymentFailedContent(data: PaymentFailedEmailData): string {
  const { colors, websiteUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Payment Failed
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      We were unable to process your payment of <strong>${formatCurrency(data.amount, data.currency)}</strong>.
    </p>
    ${data.retryDate ? `
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      We'll retry on <strong>${data.retryDate}</strong>. Please update your payment method to avoid service interruption.
    </p>
    ` : ''}
    ${getButton('Update Payment Method', websiteUrl)}
    <p style="margin: 0; font-size: 14px; color: #888;">
      If you need assistance, please contact our support team.
    </p>
  `;
}

/**
 * Payment succeeded email template
 */
function getPaymentSucceededContent(data: PaymentSucceededEmailData): string {
  const { colors } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Payment Successful
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Your payment of <strong>${formatCurrency(data.amount, data.currency)}</strong> has been processed successfully.
    </p>
    ${data.invoiceUrl ? getButton('View Invoice', data.invoiceUrl) : ''}
    <p style="margin: 0; font-size: 14px; color: #888;">
      Thank you for your continued support!
    </p>
  `;
}

/**
 * Plan changed email template
 */
function getPlanChangedContent(data: PlanChangedEmailData): string {
  const { colors, websiteUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Plan Changed
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Your subscription plan has been updated from <strong>${data.oldPlan}</strong> to <strong>${data.newPlan}</strong>.
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      This change will take effect on <strong>${data.effectiveDate}</strong>.
    </p>
    ${getButton('View Subscription', websiteUrl)}
    <p style="margin: 0; font-size: 14px; color: #888;">
      Thank you for choosing Inspector Gnome!
    </p>
  `;
}

/**
 * Payment method updated email template
 */
function getPaymentMethodUpdatedContent(data: PaymentMethodUpdatedEmailData): string {
  const { colors, websiteUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Payment Method Updated
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Your payment method has been updated successfully.
    </p>
    ${data.last4 && data.brand ? `
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      New payment method: <strong>${data.brand} ending in ${data.last4}</strong>
    </p>
    ` : ''}
    ${getButton('Manage Payment Methods', websiteUrl)}
    <p style="margin: 0; font-size: 14px; color: #888;">
      If you didn't make this change, please contact support immediately.
    </p>
  `;
}

/**
 * Billing info updated email template
 */
function getBillingInfoUpdatedContent(data: BillingInfoUpdatedEmailData): string {
  const { colors, websiteUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Billing Information Updated
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Your billing information has been updated successfully.
    </p>
    ${getButton('View Billing Details', websiteUrl)}
    <p style="margin: 0; font-size: 14px; color: #888;">
      If you didn't make this change, please contact support immediately.
    </p>
  `;
}

/**
 * Account deleted email template
 */
function getAccountDeletedContent(data: AccountDeletedEmailData): string {
  const { colors, supportUrl } = EMAIL_CONFIG;

  return `
    <h1 style="margin: 0 0 20px; color: ${colors.text}; font-size: 28px; font-weight: 700;">
      Account Deleted
    </h1>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Hello ${data.recipientName},
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      Your Inspector Gnome account was permanently deleted on <strong>${data.deletedAt}</strong>.
    </p>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      The following data has been removed:
    </p>
    <ul style="margin: 0 0 20px; padding-left: 20px; font-size: 16px; line-height: 1.8; color: ${colors.text};">
      <li>Your profile and personal information</li>
      <li>All inspection scans and analysis history</li>
      <li>Active subscriptions (canceled in Stripe)</li>
      <li>Notifications and account preferences</li>
    </ul>
    <p style="margin: 0 0 15px; font-size: 16px; line-height: 1.6; color: ${colors.text};">
      This action is irreversible. If you would like to use Inspector Gnome in the future, you will need to create a new account.
    </p>
    <p style="margin: 0; font-size: 14px; color: #888;">
      If you didn't request this deletion, please <a href="${supportUrl}" style="color: ${colors.accent}; text-decoration: none;">contact support</a> immediately.
    </p>
  `;
}

/**
 * Generate email HTML based on type
 */
export function generateEmailHtml(data: AnyEmailData): string {
  let content: string;

  switch (data.type) {
    case 'welcome':
      content = getWelcomeContent(data);
      break;
    case 'subscription_confirmed':
      content = getSubscriptionConfirmedContent(data);
      break;
    case 'payment_confirmation':
      content = getPaymentConfirmationContent(data);
      break;
    case 'renewal_reminder':
      content = getRenewalReminderContent(data);
      break;
    case 'subscription_canceled':
      content = getSubscriptionCanceledContent(data);
      break;
    case 'payment_failed':
      content = getPaymentFailedContent(data);
      break;
    case 'payment_succeeded':
      content = getPaymentSucceededContent(data);
      break;
    case 'plan_changed':
      content = getPlanChangedContent(data);
      break;
    case 'payment_method_updated':
      content = getPaymentMethodUpdatedContent(data);
      break;
    case 'billing_info_updated':
      content = getBillingInfoUpdatedContent(data);
      break;
    case 'account_deleted':
      content = getAccountDeletedContent(data);
      break;
    default:
      throw new Error(`Unknown email type: ${(data as any).type}`);
  }

  return getBaseTemplate(content);
}
