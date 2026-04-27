import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { downloadInvoicePdf } from '../services/subscription';

export function useInvoiceDownload() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function download(invoiceId: string): Promise<void> {
    setDownloadingId(invoiceId);
    setError(null);
    try {
      const { url } = await downloadInvoicePdf(invoiceId);
      await WebBrowser.openBrowserAsync(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  }

  return { download, downloadingId, error, clearError: () => setError(null) };
}
