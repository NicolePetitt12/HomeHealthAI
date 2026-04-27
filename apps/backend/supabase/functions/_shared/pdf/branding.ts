import { EMAIL_CONFIG } from '../email/config.ts';

export const BRAND = {
  name: 'Inspector Gnome',
  websiteUrl: EMAIL_CONFIG.websiteUrl,
  supportUrl: EMAIL_CONFIG.supportUrl,
  colors: EMAIL_CONFIG.colors,
} as const;

export const PDF_LAYOUT = {
  pageWidth: 595,
  pageHeight: 842,
  marginX: 50,
  marginTop: 60,
  lineHeight: 20,
  sectionGap: 30,
} as const;

/** Convert #RRGGBB hex to pdf-lib rgb(0-1, 0-1, 0-1) */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const int = parseInt(hex.replace('#', ''), 16);
  return {
    r: ((int >> 16) & 255) / 255,
    g: ((int >> 8) & 255) / 255,
    b: (int & 255) / 255,
  };
}

export function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
