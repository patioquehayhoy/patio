-- El secreto del resumen de las 18:00 vive solo en la base (Vault), 2026-11-09.
-- Se genera aquí mismo al correr `db push`: nadie lo ve, nadie lo copia y no
-- hay que guardarlo a mano. pg_cron lo manda a send-business-digest y la
-- función lo compara contra la base con `cron_secret()` (solo servidor).
-- La dirección del proyecto no es secreta (también va en la app); si este
-- archivo corre en otro proyecto, la llamada llega a producción con otro
-- secreto y se rechaza sin hacer nada.

do $$
begin
  if not exists (select 1 from pg_namespace where nspname = 'vault') then
    raise notice 'Vault no disponible: el secreto del resumen diario no se creó';
    return;
  end if;
  if not exists (select 1 from vault.secrets where name = 'patio_cron_secret') then
    -- Dos UUID aleatorios (generador criptográfico de Postgres): 64 caracteres hex.
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''), 'patio_cron_secret');
  end if;
  if not exists (select 1 from vault.secrets where name = 'patio_project_url') then
    perform vault.create_secret('https://gjfjsjlrgycrgmcbjrus.supabase.co', 'patio_project_url');
  end if;
end $$;

create or replace function public.cron_secret()
returns text language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  return (select decrypted_secret from vault.decrypted_secrets where name = 'patio_cron_secret' limit 1);
end $$;
revoke all on function public.cron_secret() from public, anon, authenticated;
grant execute on function public.cron_secret() to service_role;
