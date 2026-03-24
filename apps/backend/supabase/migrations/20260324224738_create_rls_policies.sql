-- =============================================================
-- Migration: create_rls_policies
-- Purpose: Row Level Security for all public tables
-- =============================================================

ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals        ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- profiles
-- -------------------------------------------------------
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- -------------------------------------------------------
-- scans
-- -------------------------------------------------------
CREATE POLICY "Users can view own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scans"
  ON public.scans FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own scans"
  ON public.scans FOR DELETE
  USING (auth.uid() = user_id);

-- -------------------------------------------------------
-- analysis_results (read-only for users; INSERT via service role only)
-- -------------------------------------------------------
CREATE POLICY "Users can view own analysis results"
  ON public.analysis_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.scans
      WHERE scans.id = analysis_results.scan_id
        AND scans.user_id = auth.uid()
    )
  );

-- -------------------------------------------------------
-- professionals (public directory — all authenticated users can read)
-- -------------------------------------------------------
CREATE POLICY "Authenticated users can view professionals"
  ON public.professionals FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Professionals can update own listing"
  ON public.professionals FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- -------------------------------------------------------
-- referrals
-- -------------------------------------------------------
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Professionals can view referrals directed to them"
  ON public.referrals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = referrals.professional_id
        AND professionals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can update referral status"
  ON public.referrals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = referrals.professional_id
        AND professionals.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.professionals
      WHERE professionals.id = referrals.professional_id
        AND professionals.user_id = auth.uid()
    )
  );
