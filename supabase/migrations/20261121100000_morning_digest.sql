-- El resumen «N personas vieron tu menú» pasa a la mañana siguiente (2026-11-21).
-- Jev (docs/research/jev-publicar-avisos-2026-11-21.json): «Ayer 37 personas
-- vieron tu menú» junto con «¿Ya publicaste lo de hoy?» da más ganas de
-- volver a publicar (61 %) que a las 6 pm (22 %) o a las 9 pm (17 %).
-- Cada hora de 7 a 12 (Ciudad de México) la función manda el resumen a los
-- negocios cuyo aviso de publicar cae en esa hora (una hora antes de abrir,
-- la misma regla del teléfono, lib/local-reminders.ts).

create or replace function public.business_digest_for(day_offset integer)
returns table (negocio_id uuid, owner_id uuid, nombre text, views_today integer, published_today boolean, active_month boolean, horario_semanal jsonb)
language sql stable security definer set search_path = public
as $$
  with today as (select (now() at time zone 'America/Mexico_City')::date as d)
  select n.id, n.owner_id, n.nombre,
    (select count(*)::integer from public.patio_views v, today t where v.negocio_id = n.id and v.day = t.d - greatest(day_offset, 0)),
    exists (select 1 from public.menus m, today t where m.negocio_id = n.id and m.fecha = t.d),
    exists (select 1 from public.menus m, today t where m.negocio_id = n.id and m.fecha > t.d - 30),
    to_jsonb(n.horario_semanal)
  from public.negocios n
  where n.owner_id is not null and length(btrim(coalesce(n.nombre, ''))) > 0 and n.nombre <> 'Mi Fondita';
$$;
revoke all on function public.business_digest_for(integer) from public, anon, authenticated;
grant execute on function public.business_digest_for(integer) to service_role;

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron o pg_net no disponibles: el resumen diario no se programó';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobname) from cron.job where jobname in ('patio-resumen-18', 'patio-resumen-manana');
  -- 13:00–18:00 UTC = 7:00–12:00 en la Ciudad de México (UTC−6 todo el año).
  perform cron.schedule('patio-resumen-manana', '0 13-18 * * *', $job$ select public.invoke_business_digest('summary') $job$);
end $$;
