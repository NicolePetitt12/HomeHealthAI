-- Add detection engine fields to analysis_results
-- - mold_candidates: top-2 mold type matches from the vision model
-- - rejection_reason: why a scan was rejected (low quality, non-mold, out-of-scope)
-- - confidence: migrate from numeric(0..1) to integer(0..100)

CREATE TYPE public.rejection_reason AS ENUM ('low_quality', 'non_mold', 'out_of_scope');

ALTER TABLE public.analysis_results
  ADD COLUMN mold_candidates jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN rejection_reason public.rejection_reason NULL;

-- Migrate confidence from numeric(5,4) with 0..1 range to integer 0..100
ALTER TABLE public.analysis_results
  DROP CONSTRAINT IF EXISTS analysis_results_confidence_check;

ALTER TABLE public.analysis_results
  ALTER COLUMN confidence TYPE integer USING ROUND(confidence * 100)::integer;

ALTER TABLE public.analysis_results
  ADD CONSTRAINT analysis_results_confidence_check
  CHECK (confidence BETWEEN 0 AND 100);
