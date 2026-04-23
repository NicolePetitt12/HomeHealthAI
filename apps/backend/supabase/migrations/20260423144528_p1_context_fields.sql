-- P1 context inputs for vNext.1 triage engine
-- Per-scan fields unlock decision tree branches and multiple_indicators_count.
-- Per-user occupant_sensitivity feeds the IAQ sensitivity_score component.

CREATE TYPE public.yes_no_unknown AS ENUM ('yes', 'no', 'unknown');
CREATE TYPE public.occupant_sensitivity_level AS ENUM
  ('standard', 'sensitive', 'highly_sensitive', 'unknown');

ALTER TABLE public.scans
  ADD COLUMN recurring_issue            public.yes_no_unknown NOT NULL DEFAULT 'unknown',
  ADD COLUMN musty_odor_present         public.yes_no_unknown NOT NULL DEFAULT 'unknown',
  ADD COLUMN recent_water_event         public.yes_no_unknown NOT NULL DEFAULT 'unknown',
  ADD COLUMN occupant_symptoms_reported public.yes_no_unknown NOT NULL DEFAULT 'unknown';

ALTER TABLE public.profiles
  ADD COLUMN occupant_sensitivity public.occupant_sensitivity_level NOT NULL DEFAULT 'unknown';

COMMENT ON COLUMN public.scans.recurring_issue IS
  'vNext.1 context: has this issue appeared in this area before?';
COMMENT ON COLUMN public.scans.musty_odor_present IS
  'vNext.1 context: musty or earthy smell detected in the area?';
COMMENT ON COLUMN public.scans.recent_water_event IS
  'vNext.1 context: recent leak, flood, or water buildup in this area?';
COMMENT ON COLUMN public.scans.occupant_symptoms_reported IS
  'vNext.1 context: respiratory or allergy symptoms reported by occupants?';
COMMENT ON COLUMN public.profiles.occupant_sensitivity IS
  'vNext.1 user context: occupant vulnerability profile (feeds sensitivity_score in IAQ engine).';
