-- Private bucket for custom-generated invoice PDFs
-- Path convention: invoices/{user_id}/{invoice_id}.pdf
-- Only the backend (service role) writes; authenticated users read their own files.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  5242880,
  ARRAY['application/pdf']
);

-- Users can download their own invoice PDFs
CREATE POLICY "Users can view own invoice PDFs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
