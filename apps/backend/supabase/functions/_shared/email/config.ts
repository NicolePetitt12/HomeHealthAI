/**
 * Email configuration for Inspector Gnome
 */
export const EMAIL_CONFIG = {
  // Sender configuration
  fromAddress: 'Nicole@homehealthai.com',
  fromName: 'Inspector Gnome',

  // Brand URLs (TODO: update with actual URLs)
  websiteUrl: 'https://homehealthai.com',
  supportUrl: 'https://homehealthai.com/support',
  logoUrl: 'https://homehealthai.com/logo.png',

  // Brand colors
  colors: {
    primary: '#C41E3A',
    background: '#0D0807',
    text: '#FFFFFF',
    accent: '#22C55E',
    border: '#333333',
    buttonText: '#FFFFFF',
  },

  // SMTP configuration (read from environment)
  smtp: {
    host: Deno.env.get('SMTP_HOST') || '',
    port: parseInt(Deno.env.get('SMTP_PORT') || '465', 10),
    username: Deno.env.get('SMTP_USERNAME') || '',
    password: Deno.env.get('SMTP_PASSWORD') || '',
  },
};

/**
 * Validate SMTP configuration
 */
export function validateEmailConfig(): boolean {
  const { smtp } = EMAIL_CONFIG;
  return !!(smtp.host && smtp.port && smtp.username && smtp.password);
}
