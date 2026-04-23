ALTER TABLE public.analysis_results
  ADD COLUMN IF NOT EXISTS triage_payload jsonb NULL;

COMMENT ON COLUMN public.analysis_results.triage_payload IS
  'Full vNext.1 deterministic triage output (decision_tree, iaq, final, messages, safety). Source-of-truth for the analysis.';
