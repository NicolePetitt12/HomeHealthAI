import nodemailer from 'nodemailer';
import { EMAIL_CONFIG, validateEmailConfig } from './config.ts';
import { generateEmailHtml } from './templates.ts';
import type { AnyEmailData } from './types.ts';

/**
 * Send email via SMTP
 */
export async function sendEmail(data: AnyEmailData): Promise<boolean> {
  try {
    // Validate configuration
    if (!validateEmailConfig()) {
      console.error('SMTP configuration is incomplete');
      return false;
    }

    const { smtp, fromAddress, fromName } = EMAIL_CONFIG;

    // Generate HTML content
    const html = generateEmailHtml(data);

    // Create SMTP transporter
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: true, // Use SSL
      auth: {
        user: smtp.username,
        pass: smtp.password,
      },
    });

    // Send email
    await transporter.sendMail({
      from: `${fromName} <${fromAddress}>`,
      to: data.to,
      subject: data.subject,
      html: html,
    });

    console.log(`Email sent successfully to ${data.to}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
