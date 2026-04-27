import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import { BRAND, PDF_LAYOUT, hexToRgb, formatCurrency, formatDate } from './branding.ts';
import type { InvoicePayload } from './types.ts';

const { pageWidth, marginX, marginTop, lineHeight, sectionGap } = PDF_LAYOUT;

// ─── Color helpers ────────────────────────────────────────────────────────────

const colorPrimary = (() => { const c = hexToRgb(BRAND.colors.primary); return rgb(c.r, c.g, c.b); })();
const colorText    = (() => { const c = hexToRgb(BRAND.colors.text);    return rgb(c.r, c.g, c.b); })();
const colorBorder  = (() => { const c = hexToRgb(BRAND.colors.border);  return rgb(c.r, c.g, c.b); })();
const colorBg      = (() => { const c = hexToRgb(BRAND.colors.background); return rgb(c.r, c.g, c.b); })();
const colorAccent  = (() => { const c = hexToRgb(BRAND.colors.accent);  return rgb(c.r, c.g, c.b); })();

// ─── Draw primitives ─────────────────────────────────────────────────────────

function drawHRule(page: PDFPage, y: number) {
  page.drawLine({
    start: { x: marginX, y },
    end: { x: pageWidth - marginX, y },
    thickness: 0.5,
    color: colorBorder,
  });
}

function drawLabel(page: PDFPage, fonts: Fonts, label: string, value: string, x: number, y: number) {
  page.drawText(label, { x, y: y + 2, size: 9, font: fonts.bold, color: colorBorder });
  page.drawText(value, { x, y: y - lineHeight + 2, size: 10, font: fonts.regular, color: colorText });
}

// ─── Section draws ────────────────────────────────────────────────────────────

function drawHeader(page: PDFPage, fonts: Fonts, payload: InvoicePayload, y: number): number {
  page.drawText(BRAND.name, {
    x: marginX,
    y,
    size: 22,
    font: fonts.bold,
    color: colorPrimary,
  });

  page.drawText('INVOICE', {
    x: pageWidth - marginX - 80,
    y,
    size: 16,
    font: fonts.bold,
    color: colorText,
  });

  const invoiceNum = `#${payload.invoiceNumber.slice(-8).toUpperCase()}`;
  page.drawText(invoiceNum, {
    x: pageWidth - marginX - 80,
    y: y - lineHeight,
    size: 10,
    font: fonts.regular,
    color: colorBorder,
  });

  return y - lineHeight * 2 - sectionGap;
}

function drawCustomerBlock(page: PDFPage, fonts: Fonts, payload: InvoicePayload, y: number): number {
  page.drawText('BILLED TO', { x: marginX, y, size: 9, font: fonts.bold, color: colorBorder });
  const nextY = y - lineHeight;

  const name = payload.customer.fullName ?? 'Customer';
  const email = payload.customer.email ?? '';

  page.drawText(name,  { x: marginX, y: nextY,               size: 11, font: fonts.bold,    color: colorText });
  page.drawText(email, { x: marginX, y: nextY - lineHeight,   size: 10, font: fonts.regular, color: colorText });

  return nextY - lineHeight * 2 - sectionGap;
}

function drawInvoiceMeta(page: PDFPage, fonts: Fonts, payload: InvoicePayload, y: number): number {
  const col2x = pageWidth / 2;
  const rows: [string, string, number, number][] = [
    ['ISSUE DATE',   formatDate(payload.createdAt),  marginX, y],
    ['BILLING FROM', formatDate(payload.periodStart), marginX, y - lineHeight * 3],
    ['BILLING TO',   formatDate(payload.periodEnd),  marginX, y - lineHeight * 6],
    ['PLAN',         (payload.planTier ?? '—').toUpperCase(), col2x, y],
    ['STATUS',       payload.status.toUpperCase(),   col2x, y - lineHeight * 3],
  ];

  for (const [label, value, x, rowY] of rows) {
    drawLabel(page, fonts, label, value, x, rowY);
  }

  return y - lineHeight * 9 - sectionGap;
}

function drawAmountTable(page: PDFPage, fonts: Fonts, payload: InvoicePayload, y: number): number {
  const tableBottom = y - lineHeight * 4;
  const planLabel = `${(payload.planTier ?? 'Subscription').charAt(0).toUpperCase()}${(payload.planTier ?? 'Subscription').slice(1)} Plan`;

  page.drawRectangle({
    x: marginX,
    y: tableBottom,
    width: pageWidth - marginX * 2,
    height: lineHeight * 4,
    color: colorBg,
    borderColor: colorBorder,
    borderWidth: 0.5,
  });

  const innerY = y - lineHeight;
  page.drawText('DESCRIPTION',               { x: marginX + 10, y: innerY,                  size: 9,  font: fonts.bold,    color: colorBorder });
  page.drawText('AMOUNT',                    { x: pageWidth - marginX - 70, y: innerY,       size: 9,  font: fonts.bold,    color: colorBorder });
  page.drawText(planLabel,                   { x: marginX + 10, y: innerY - lineHeight,      size: 10, font: fonts.regular, color: colorText });
  page.drawText(
    formatCurrency(payload.amountPaid, payload.currency),
    { x: pageWidth - marginX - 70, y: innerY - lineHeight, size: 10, font: fonts.bold, color: colorText }
  );

  return tableBottom - sectionGap;
}

function drawPaymentMethod(page: PDFPage, fonts: Fonts, payload: InvoicePayload, y: number): number {
  if (!payload.paymentMethod) return y;

  const { brand, last4 } = payload.paymentMethod;
  const value = `${brand.charAt(0).toUpperCase()}${brand.slice(1)} ending in ${last4}`;
  drawLabel(page, fonts, 'PAYMENT METHOD', value, marginX, y);

  return y - lineHeight * 2 - sectionGap;
}

function drawFooter(page: PDFPage, fonts: Fonts) {
  const y = 40;
  drawHRule(page, y + lineHeight);

  const footerText = `${BRAND.name} · ${BRAND.websiteUrl} · Support: ${BRAND.supportUrl}`;
  const textWidth = fonts.regular.widthOfTextAtSize(footerText, 8);
  page.drawText(footerText, {
    x: (pageWidth - textWidth) / 2,
    y,
    size: 8,
    font: fonts.regular,
    color: colorBorder,
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

interface Fonts {
  regular: Awaited<ReturnType<PDFDocument['embedFont']>>;
  bold:    Awaited<ReturnType<PDFDocument['embedFont']>>;
}

export async function renderInvoicePdf(payload: InvoicePayload): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PDF_LAYOUT.pageWidth, PDF_LAYOUT.pageHeight]);

  // Dark background
  page.drawRectangle({
    x: 0, y: 0,
    width: PDF_LAYOUT.pageWidth,
    height: PDF_LAYOUT.pageHeight,
    color: colorBg,
  });

  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold:    await doc.embedFont(StandardFonts.HelveticaBold),
  };

  let y = PDF_LAYOUT.pageHeight - marginTop;

  y = drawHeader(page, fonts, payload, y);
  drawHRule(page, y);
  y -= sectionGap;

  y = drawCustomerBlock(page, fonts, payload, y);
  drawHRule(page, y);
  y -= sectionGap;

  y = drawInvoiceMeta(page, fonts, payload, y);
  y = drawAmountTable(page, fonts, payload, y);

  if (payload.status === 'paid') {
    page.drawText('PAID', {
      x: pageWidth - marginX - 60,
      y: y + lineHeight,
      size: 20,
      font: fonts.bold,
      color: colorAccent,
      opacity: 0.3,
    });
  }

  y = drawPaymentMethod(page, fonts, payload, y);

  drawHRule(page, y);
  drawFooter(page, fonts);

  return doc.save();
}
