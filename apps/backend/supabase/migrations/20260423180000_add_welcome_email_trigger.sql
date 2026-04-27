-- ─── Add Welcome Email Trigger ──────────────────────────────────────────────
--
-- This migration creates a trigger that calls the send-welcome-email Edge Function
-- whenever a new profile is created.
--

-- Enable pg_net extension if not already enabled (required for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to send welcome email via Edge Function
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  function_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Get the Edge Function URL from environment or use default local URL
  function_url := current_setting('app.settings.supabase_url', true) || '/functions/v1/send-welcome-email';

  -- Get the service role key
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- If settings are not configured, use local development defaults
  IF function_url IS NULL OR function_url = '/functions/v1/send-welcome-email' THEN
    function_url := 'http://host.docker.internal:54321/functions/v1/send-welcome-email';
  END IF;

  -- Make async HTTP request to Edge Function (fire-and-forget)
  PERFORM
    net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
      ),
      body := jsonb_build_object(
        'record', jsonb_build_object(
          'id', NEW.id,
          'email', NEW.email,
          'full_name', NEW.full_name
        )
      )
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();

-- Add comment
COMMENT ON FUNCTION public.send_welcome_email IS 'Sends welcome email via Edge Function when a new profile is created';
COMMENT ON TRIGGER on_profile_created ON public.profiles IS 'Triggers welcome email on profile creation';
