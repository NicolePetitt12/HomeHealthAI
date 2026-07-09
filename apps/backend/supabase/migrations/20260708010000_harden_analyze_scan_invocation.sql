-- Harden database-triggered analyze-scan Edge Function invocation.
--
-- Required hosted database settings:
--   alter database postgres set "app.settings.edge_function_url" = 'https://<project>.supabase.co/functions/v1';
--   alter database postgres set "app.settings.service_role_key" = '<service-role-jwt>';
--   alter database postgres set "app.settings.internal_function_secret" = '<random-shared-secret>';
--
-- The Edge Function compares x-internal-function-secret with the
-- INTERNAL_FUNCTION_SECRET Edge Function secret.

create or replace function public.trigger_analyze_scan()
returns trigger
language plpgsql
security definer
as $$
declare
  edge_function_url text;
  service_role_key text;
  internal_function_secret text;
begin
  edge_function_url := coalesce(
    nullif(current_setting('app.settings.edge_function_url', true), ''),
    'http://host.docker.internal:54321/functions/v1'
  );
  service_role_key := nullif(current_setting('app.settings.service_role_key', true), '');
  internal_function_secret := nullif(current_setting('app.settings.internal_function_secret', true), '');

  if service_role_key is null or internal_function_secret is null then
    raise warning 'Skipping analyze-scan trigger: configure app.settings.service_role_key and app.settings.internal_function_secret';
    return NEW;
  end if;

  perform net.http_post(
    url := edge_function_url || '/analyze-scan',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key,
      'x-internal-function-secret', internal_function_secret
    ),
    body := jsonb_build_object('scan_id', NEW.id)
  );

  return NEW;
end;
$$;

