-- Dejar listo el menú de otro día y que salga solo (2026-11-21). Jev
-- (docs/research/jev-avisos-red-2026-11-21.json): la fonda lo quiere 3.75 de
-- 4, lo más alto de todo; que la app publique sola el mismo menú cada día a
-- las 9, 3 %. También: el resumen de las 8:00 para desayunos y, al seguir un
-- lugar, «Personalizadas» por defecto, como la campana de YouTube.

-- 1. Al seguir un lugar, «Personalizadas» (YouTube: «Cuando te suscribas a un
--    canal, recibirás automáticamente notificaciones personalizadas»). Sale la
--    regla de «los primeros 3 en Todas»; lo que ya quedó en «Todas» se queda.
drop trigger if exists patio_follows_first_three on public.patio_follows;
drop function if exists public.patio_follows_first_three();

-- 2. A qué hora sale un menú programado. Vacío = salió al publicarse.
alter table public.menus add column if not exists publish_at timestamptz;

-- Hasta su hora, un menú programado solo lo ve su dueño (por su propia política).
drop policy if exists "published menus readable" on public.menus;
create policy "published menus readable" on public.menus for select to anon, authenticated
using (
  (publish_at is null or publish_at <= now())
  and exists (
    select 1 from public.negocios n
    where n.id = negocio_id and n.owner_id is not null
      and length(trim(n.nombre)) > 0 and n.nombre <> 'Mi Fondita'
  )
);

-- Los menús programados que ya llegaron a su hora y no se han anunciado.
create or replace function public.due_scheduled_publications()
returns table (negocio_id uuid, nombre text, horario_semanal jsonb, fecha date)
language sql stable security definer set search_path = public
as $$
  with today as (select (now() at time zone 'America/Mexico_City')::date as d)
  select m.negocio_id, n.nombre, to_jsonb(n.horario_semanal), m.fecha
  from public.menus m
  join public.negocios n on n.id = m.negocio_id
  cross join today t
  where m.fecha = t.d
    and m.publish_at is not null and m.publish_at <= now()
    and n.owner_id is not null and length(btrim(coalesce(n.nombre, ''))) > 0 and n.nombre <> 'Mi Fondita'
    and not exists (
      select 1 from public.publication_events e
      where e.negocio_id = m.negocio_id and e.menu_date = m.fecha and e.kind = 'menu_published'
    );
$$;
revoke all on function public.due_scheduled_publications() from public, anon, authenticated;
grant execute on function public.due_scheduled_publications() to service_role;

-- 3. El resumen de quien sigue solo cuenta un menú programado desde su hora.
create or replace function public.follower_digest_candidates()
returns table (user_id uuid, negocio_id uuid, nombre text, kind text, at timestamptz, horario_semanal jsonb, body text)
language sql stable security definer set search_path = public
as $$
  with today as (select (now() at time zone 'America/Mexico_City')::date as d),
  audience as (
    select f.user_id, f.negocio_id, n.nombre, to_jsonb(n.horario_semanal) as horario_semanal
    from public.patio_follows f
    join public.negocios n on n.id = f.negocio_id
    where f.notifications_enabled and not f.every_time
      and length(btrim(coalesce(n.nombre, ''))) > 0 and n.nombre <> 'Mi Fondita'
  ),
  items as (
    select a.user_id, a.negocio_id, a.nombre, 'menu'::text as kind, coalesce(m.publish_at, m.created_at) as at, a.horario_semanal, null::text as body
    from audience a
    join public.menus m on m.negocio_id = a.negocio_id
    cross join today t
    where m.fecha = t.d and (m.publish_at is null or m.publish_at <= now())
    union all
    select a.user_id, a.negocio_id, a.nombre,
      case when s.kind = 'promo' then 'promo' else 'closed' end,
      s.created_at, a.horario_semanal, s.body
    from audience a
    join public.special_notices s on s.negocio_id = a.negocio_id
    cross join today t
    where (s.created_at at time zone 'America/Mexico_City')::date = t.d
      and (s.kind = 'promo' or (s.kind = 'operation' and s.body = 'Hoy no abrimos.'))
  )
  select i.user_id, i.negocio_id, i.nombre, i.kind, i.at, i.horario_semanal, i.body
  from items i
  cross join today t
  where not exists (
    select 1 from public.follower_digest_items d
    where d.user_id = i.user_id and d.negocio_id = i.negocio_id and d.day = t.d and d.kind = i.kind
  );
$$;
revoke all on function public.follower_digest_candidates() from public, anon, authenticated;
grant execute on function public.follower_digest_candidates() to service_role;

-- 4. Resumen de las 8:00 (desayunos) además del de 11:30 y 17:30.
create or replace function public.invoke_follower_digest(slot text)
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  base_url text;
  secret text;
begin
  if slot not in ('manana', 'mediodia', 'tarde') then return null; end if;
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'patio_project_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'patio_cron_secret';
  if base_url is null or secret is null then
    raise notice 'Faltan patio_project_url y patio_cron_secret en Vault: no se envió el resumen';
    return null;
  end if;
  return net.http_post(
    url := rtrim(base_url, '/') || '/functions/v1/send-follower-digest',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    body := jsonb_build_object('slot', slot),
    timeout_milliseconds := 60000
  );
end $$;
revoke all on function public.invoke_follower_digest(text) from public, anon, authenticated;

-- 5. Anunciar los menús programados a su hora (cada 5 minutos).
create or replace function public.invoke_scheduled_publications()
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  base_url text;
  secret text;
begin
  -- Sin nada pendiente no se llama a la función.
  if not exists (select 1 from public.due_scheduled_publications()) then return null; end if;
  select decrypted_secret into base_url from vault.decrypted_secrets where name = 'patio_project_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'patio_cron_secret';
  if base_url is null or secret is null then
    raise notice 'Faltan patio_project_url y patio_cron_secret en Vault: no se anunciaron los menús programados';
    return null;
  end if;
  return net.http_post(
    url := rtrim(base_url, '/') || '/functions/v1/send-scheduled-publications',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    body := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
end $$;
revoke all on function public.invoke_scheduled_publications() from public, anon, authenticated;

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron o pg_net no disponibles: no se programaron los menús ni el resumen de la mañana';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobname) from cron.job where jobname in ('patio-seguidores-manana', 'patio-menus-programados');
  -- 14:00 UTC = 8:00 en la Ciudad de México (UTC−6 todo el año).
  perform cron.schedule('patio-seguidores-manana', '0 14 * * *', $job$ select public.invoke_follower_digest('manana') $job$);
  perform cron.schedule('patio-menus-programados', '*/5 * * * *', $job$ select public.invoke_scheduled_publications() $job$);
end $$;
