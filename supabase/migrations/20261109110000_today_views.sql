-- «Hoy» del negocio y resumen de las 18:00 (v4 §2–3, 2026-11-09).
--
-- 1. Vistas de la ficha: cuántas personas vieron el menú de un lugar cada
--    día. Anónimas, como las visitas: un identificador del teléfono que
--    cambia cada día; nadie lee la tabla y el dueño solo ve totales.
-- 2. business_today: lo que el dueño ve en «Hoy».
-- 3. Preferencias nuevas: resumen de hoy y pausar todo. (El recordatorio
--    para publicar de las 10:00 ya lo programa el teléfono.)
-- 4. business_daily_digest: lo que lee la función programada.

create table if not exists public.patio_views (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  day date not null,
  device_day text not null check (device_day ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now(),
  primary key (negocio_id, day, device_day)
);
create index if not exists patio_views_device_idx on public.patio_views(device_day, day);
alter table public.patio_views enable row level security;
revoke all on public.patio_views from public, anon, authenticated;
grant select, insert, delete on public.patio_views to service_role;

-- Una vista por teléfono, lugar y día. El dueño no se cuenta a sí mismo.
create or replace function public.record_patio_view(p_negocio uuid, p_device_day text)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  today date := (now() at time zone 'America/Mexico_City')::date;
begin
  if p_device_day is null or p_device_day !~ '^[0-9a-f]{64}$' then return false; end if;
  if not exists (
    select 1 from public.negocios n
    where n.id = p_negocio and (auth.uid() is null or n.owner_id is distinct from auth.uid())
  ) then return false; end if;
  -- Tope: 300 lugares por teléfono al día.
  if (select count(*) from public.patio_views where device_day = p_device_day and day = today) >= 300 then return false; end if;
  insert into public.patio_views (negocio_id, day, device_day) values (p_negocio, today, p_device_day)
  on conflict do nothing;
  delete from public.patio_views where negocio_id = p_negocio and day < today - 84;
  return true;
end;
$$;
revoke all on function public.record_patio_view(uuid, text) from public;
grant execute on function public.record_patio_view(uuid, text) to anon, authenticated, service_role;

-- «Hoy»: vistas de hoy contra un día igual de las últimas cuatro semanas (solo
-- semanas con datos), los últimos 7 días, y lo demás que pasó hoy.
create or replace function public.business_today(target uuid)
returns table (
  views_today integer, views_usual numeric, views_week jsonb,
  followers_today integer, dish_likes_today integer, reviews_today integer, top_dishes jsonb
)
language plpgsql stable security definer set search_path = public
as $$
declare
  today date := (now() at time zone 'America/Mexico_City')::date;
  day_start timestamptz := today::timestamp at time zone 'America/Mexico_City';
  first_day date;
begin
  if not exists (select 1 from public.negocios n where n.id = target and n.owner_id = auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select min(v.day) into first_day from public.patio_views v where v.negocio_id = target;
  return query
  with days as (
    select (today - g)::date as day from generate_series(0, 6) as g
  ), counts as (
    select d.day, (select count(*)::integer from public.patio_views v where v.negocio_id = target and v.day = d.day) as views
    from days d
  ), usual as (
    select avg((select count(*) from public.patio_views v where v.negocio_id = target and v.day = today - 7 * w))::numeric as value
    from generate_series(1, 4) as w
    where first_day is not null and today - 7 * w >= first_day
  )
  select
    (select c.views from counts c where c.day = today),
    (select round(u.value, 1) from usual u),
    (select jsonb_agg(jsonb_build_object('day', c.day, 'views', c.views) order by c.day) from counts c),
    (select count(*)::integer from public.saved_patios s where s.negocio_id = target and s.created_at >= day_start),
    (select count(*)::integer from public.dish_likes d where d.negocio_id = target and d.created_at >= day_start),
    (select count(*)::integer from public.reviews r where r.negocio_id = target and r.created_at >= day_start and r.status = 'published'),
    (select coalesce(jsonb_agg(jsonb_build_object('name', t.display_name, 'likes', t.likes) order by t.likes desc, t.display_name), '[]'::jsonb)
       from (
         select max(d.dish_name_display) as display_name, count(*)::integer as likes
         from public.dish_likes d where d.negocio_id = target and d.created_at >= day_start
         group by d.dish_name order by count(*) desc, max(d.dish_name_display) limit 5
       ) t);
end;
$$;
revoke all on function public.business_today(uuid) from public, anon;
grant execute on function public.business_today(uuid) to authenticated;

alter table public.notification_preferences
  add column if not exists daily_summary boolean not null default true,
  add column if not exists paused boolean not null default false;

-- Para la función programada (solo servidor): por negocio con dueño, sus
-- vistas de hoy, si ya publicó hoy, si publicó en los últimos 30 días y su
-- horario semanal (la función decide si abre hoy).
create or replace function public.business_daily_digest()
returns table (negocio_id uuid, owner_id uuid, nombre text, views_today integer, published_today boolean, active_month boolean, horario_semanal jsonb)
language sql stable security definer set search_path = public
as $$
  with today as (select (now() at time zone 'America/Mexico_City')::date as d)
  select n.id, n.owner_id, n.nombre,
    (select count(*)::integer from public.patio_views v, today t where v.negocio_id = n.id and v.day = t.d),
    exists (select 1 from public.menus m, today t where m.negocio_id = n.id and m.fecha = t.d),
    exists (select 1 from public.menus m, today t where m.negocio_id = n.id and m.fecha > t.d - 30),
    to_jsonb(n.horario_semanal)
  from public.negocios n
  where n.owner_id is not null and length(btrim(coalesce(n.nombre, ''))) > 0 and n.nombre <> 'Mi Fondita';
$$;
revoke all on function public.business_daily_digest() from public, anon, authenticated;
grant execute on function public.business_daily_digest() to service_role;
