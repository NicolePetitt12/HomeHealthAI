-- Add UI-specific fields to analysis_results so the backend stores
-- all data the mobile app needs to display results without client-side fallbacks.
ALTER TABLE public.analysis_results
  ADD COLUMN likely_issue text,
  ADD COLUMN description text,
  ADD COLUMN recommendation_title text,
  ADD COLUMN recommendations text[],
  ADD COLUMN suggested_professional_type professional_type,
  ADD COLUMN suspected_mold_type text,
  ADD COLUMN suspected_mold_description text;

-- Each scan should have at most one analysis result.
-- Remove any duplicate rows first (keep the most recent one per scan).
DELETE FROM public.analysis_results a
  USING public.analysis_results b
  WHERE a.scan_id = b.scan_id
    AND a.created_at < b.created_at;

ALTER TABLE public.analysis_results
  ADD CONSTRAINT analysis_results_scan_id_unique UNIQUE (scan_id);
