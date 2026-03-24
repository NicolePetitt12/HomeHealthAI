-- =============================================================
-- Migration: create_schema
-- Purpose: Core tables for Inspector Gnome
-- =============================================================

-- Custom enum types
CREATE TYPE public.risk_level AS ENUM ('low', 'moderate', 'high');
CREATE TYPE public.user_role AS ENUM ('homeowner', 'property_manager', 'renter', 'professional');
CREATE TYPE public.scan_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE public.professional_type AS ENUM ('inspector', 'remediation', 'plumber', 'hvac');

-- -------------------------------------------------------
-- profiles (extends auth.users 1:1)
-- -------------------------------------------------------
CREATE TABLE public.profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text,
  full_name     text,
  avatar_url    text,
  role          public.user_role NOT NULL DEFAULT 'homeowner',
  phone         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS 'Extended user profile linked 1:1 with auth.users';

-- -------------------------------------------------------
-- scans (a photo submission for AI analysis)
-- -------------------------------------------------------
CREATE TABLE public.scans (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  image_path    text NOT NULL,
  location      text NOT NULL,
  notes         text,
  status        public.scan_status NOT NULL DEFAULT 'pending',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scans_user_id ON public.scans(user_id);
CREATE INDEX idx_scans_status  ON public.scans(status);

COMMENT ON TABLE public.scans IS 'Photo scan submissions for AI mold/moisture analysis';

-- -------------------------------------------------------
-- analysis_results (AI output per scan)
-- -------------------------------------------------------
CREATE TABLE public.analysis_results (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  risk_level      public.risk_level NOT NULL,
  confidence      numeric(5,4) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  findings        jsonb NOT NULL DEFAULT '[]'::jsonb,
  explanation     text,
  next_steps      text[],
  model_version   text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_analysis_scan_id ON public.analysis_results(scan_id);

COMMENT ON TABLE public.analysis_results IS 'AI mold detection results for each scan';

-- -------------------------------------------------------
-- professionals (referral directory)
-- -------------------------------------------------------
CREATE TABLE public.professionals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  business_name       text NOT NULL,
  professional_type   public.professional_type NOT NULL,
  email               text,
  phone               text,
  website             text,
  city                text,
  state               text,
  zip_code            text,
  description         text,
  is_verified         boolean NOT NULL DEFAULT false,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_professionals_type     ON public.professionals(professional_type);
CREATE INDEX idx_professionals_location ON public.professionals(city, state);

COMMENT ON TABLE public.professionals IS 'Directory of mold/moisture professionals for referrals';

-- -------------------------------------------------------
-- referrals (connecting a scan to a professional)
-- -------------------------------------------------------
CREATE TABLE public.referrals (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id         uuid NOT NULL REFERENCES public.scans(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message         text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'completed')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_user         ON public.referrals(user_id);
CREATE INDEX idx_referrals_professional ON public.referrals(professional_id);

COMMENT ON TABLE public.referrals IS 'Referral requests connecting users with professionals';

-- -------------------------------------------------------
-- Trigger: auto-create profile on auth.users insert
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- -------------------------------------------------------
-- Trigger: auto-update updated_at columns
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
