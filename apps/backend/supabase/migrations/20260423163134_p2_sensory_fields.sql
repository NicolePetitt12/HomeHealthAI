ALTER TABLE public.scans
  ADD COLUMN humidity_percent real NULL
    CHECK (humidity_percent IS NULL OR (humidity_percent >= 0 AND humidity_percent <= 100)),
  ADD COLUMN temperature_f real NULL;

COMMENT ON COLUMN public.scans.humidity_percent IS
  'vNext.1 sensory input: relative humidity % from user hygrometer (0-100). Feeds iaq.humidity_score.';
COMMENT ON COLUMN public.scans.temperature_f IS
  'vNext.1 sensory input: ambient temperature in °F. Context-only today; reserved for future scoring.';

NOTIFY pgrst, 'reload schema';
