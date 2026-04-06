-- Enable pg_net extension for async HTTP calls from Postgres
create extension if not exists pg_net with schema extensions;

-- Function that calls the analyze-scan Edge Function after a scan is inserted
create or replace function public.trigger_analyze_scan()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_function_url text;
  service_role_key  text;
begin
  -- These settings must be configured via:
  --   supabase secrets set APP_EDGE_FUNCTION_URL=... APP_SERVICE_ROLE_KEY=...
  -- For local dev, they are set automatically by Supabase CLI.
  edge_function_url := coalesce(
    current_setting('app.settings.edge_function_url', true),
    'http://host.docker.internal:54321/functions/v1'
  );
  service_role_key := coalesce(
    current_setting('app.settings.service_role_key', true),
    current_setting('supabase.anon_key', true)
  );

  perform net.http_post(
    url     := edge_function_url || '/analyze-scan',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body    := jsonb_build_object('record', row_to_json(NEW))
  );

  return NEW;
end;
$$;

-- Trigger: fires after every INSERT on public.scans
create trigger on_scan_created
  after insert on public.scans
  for each row
  execute function public.trigger_analyze_scan();
