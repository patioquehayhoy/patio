-- Resumen de las 18:00 (hora de la Ciudad de México, UTC−6 todo el año),
-- 2026-11-09. El recordatorio de las 10:00 lo programa el teléfono. pg_cron
-- llama a la función send-business-digest con el secreto que la migración
-- 20261109120000 genera y guarda en Vault (`patio_cron_secret`, junto con
-- `patio_project_url`). Sin pg_cron o pg_net (por ejemplo, en el ensayo
-- local) este paso solo avisa y no programa nada.

create or replace function public.invoke_business_digest(mode text)
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  base_url text;
  secret text;
begin
  if mode <> 'summary' then return null; end if;
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'patio_project_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'patio_cron_secret';
  if base_url is null or secret is null then
    raise notice 'Faltan patio_project_url y patio_cron_secret en Vault: no se envió el resumen';
    return null;
  end if;
  return net.http_post(
    url := rtrim(base_url, '/') || '/functions/v1/send-business-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    body := jsonb_build_object('mode', mode),
    timeout_milliseconds := 60000
  );
end $$;
revoke all on function public.invoke_business_digest(text) from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron o pg_net no disponibles: el resumen diario no se programó';
    return;
  end if;
  create extension if not exists pg_cron;
  create extension if not exists pg_net with schema extensions;
  perform cron.unschedule(jobname) from cron.job where jobname = 'patio-resumen-18';
  perform cron.schedule('patio-resumen-18', '0 0 * * *', $job$ select public.invoke_business_digest('summary') $job$);
end $$;
