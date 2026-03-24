-- =============================================================
-- Migration: create_storage_buckets
-- Purpose: Storage bucket for scan images + RLS
-- =============================================================

-- Create the scan-images bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'scan-images',
  'scan-images',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
);

-- Users upload to their own folder: {user_id}/{filename}
CREATE POLICY "Users can upload scan images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'scan-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users view their own images
CREATE POLICY "Users can view own scan images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'scan-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users delete their own images
CREATE POLICY "Users can delete own scan images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'scan-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
