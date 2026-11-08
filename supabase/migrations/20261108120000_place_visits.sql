-- Visitas reales y anónimas para «Qué tan lleno» (DECISIONES §17 y §19).
-- Con «Tus visitas» activado, el teléfono vigila los lugares cercanos y manda
-- solo: el lugar, la hora de llegada, los minutos y un identificador del
-- teléfono que cambia cada día. Nunca coordenadas ni cuenta. Nadie lee las
-- tablas: solo estas funciones.
--
-- Como Google («Popular times»): historial de semanas con visitas de quien lo
-- activó, y «en vivo» con quien está dentro ahora. Los umbrales viven en
-- visit_settings para calibrarlos con datos del piloto sin publicar la app.

create table if not exists public.visit_settings (
  key text primary key,
  value numeric not null
);
alter table public.visit_settings enable row level security;
revoke all on public.visit_settings from public, anon, authenticated;
grant select, insert, update on public.visit_settings to service_role;
insert into public.visit_settings (key, value) values
  ('busy_min_minutes', 5),   -- estancia mínima que cuenta para la gráfica
  ('busy_min_visits', 10),   -- visitas en 8 semanas para mostrar la gráfica
  ('live_min_present', 2)    -- personas dentro ahora para decir «Ahora: …»
on conflict (key) do nothing;

create or replace function public.visit_setting(p_key text, p_default numeric)
returns numeric language sql stable security definer set search_path = public
as $$
  select coalesce((select value from public.visit_settings where key = p_key), p_default);
$$;
revoke all on function public.visit_setting(text, numeric) from public, anon, authenticated;
grant execute on function public.visit_setting(text, numeric) to service_role;

create table if not exists public.place_visits (
  id bigint generated always as identity primary key,
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  started_at timestamptz not null,
  minutes integer not null check (minutes between 3 and 240),
  device_day text not null check (device_day ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create unique index if not exists place_visits_once_per_day on public.place_visits (negocio_id, device_day);
create index if not exists place_visits_by_place on public.place_visits (negocio_id, started_at);
create index if not exists place_visits_by_device on public.place_visits (device_day);
alter table public.place_visits enable row level security;
revoke all on public.place_visits from public, anon, authenticated;
grant select, insert, delete on public.place_visits to service_role;

-- Quién está dentro ahora (para «en vivo»): llegada al entrar, salida al salir.
create table if not exists public.place_presence (
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  device_day text not null check (device_day ~ '^[0-9a-f]{64}$'),
  arrived_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (negocio_id, device_day)
);
create index if not exists place_presence_inside on public.place_presence (negocio_id, arrived_at) where left_at is null;
create index if not exists place_presence_by_device on public.place_presence (device_day);
alter table public.place_presence enable row level security;
revoke all on public.place_presence from public, anon, authenticated;
grant select, insert, update, delete on public.place_presence to service_role;

-- Registrar una visita al salir. Devuelve false (sin error) si algo no cuadra,
-- para no dar pistas a quien intente inflar un lugar.
create or replace function public.record_visit(p_negocio uuid, p_started_at timestamptz, p_minutes integer, p_device_day text)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_minutes is null or p_minutes < 3 or p_minutes > 240 then return false; end if;
  if p_started_at is null or p_started_at > now() + interval '5 minutes' or p_started_at < now() - interval '24 hours' then return false; end if;
  if p_device_day is null or p_device_day !~ '^[0-9a-f]{64}$' then return false; end if;
  if not exists (select 1 from public.negocios where id = p_negocio) then return false; end if;
  -- Topes: 12 visitas por teléfono al día y 60 por lugar por hora.
  if (select count(*) from public.place_visits where device_day = p_device_day) >= 12 then return false; end if;
  if (select count(*) from public.place_visits where negocio_id = p_negocio and created_at > now() - interval '1 hour') >= 60 then return false; end if;
  insert into public.place_visits (negocio_id, started_at, minutes, device_day)
  values (p_negocio, p_started_at, p_minutes, p_device_day)
  on conflict (negocio_id, device_day) do nothing;
  delete from public.place_visits where negocio_id = p_negocio and started_at < now() - interval '12 weeks';
  return true;
end;
$$;
revoke all on function public.record_visit(uuid, timestamptz, integer, text) from public;
grant execute on function public.record_visit(uuid, timestamptz, integer, text) to anon, authenticated, service_role;

-- Entrar o salir de un lugar (en vivo).
create or replace function public.mark_presence(p_negocio uuid, p_device_day text, p_inside boolean)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_inside is null or p_device_day is null or p_device_day !~ '^[0-9a-f]{64}$' then return false; end if;
  if not exists (select 1 from public.negocios where id = p_negocio) then return false; end if;
  if p_inside then
    if (select count(*) from public.place_presence where device_day = p_device_day) >= 30 then return false; end if;
    insert into public.place_presence (negocio_id, device_day, arrived_at, left_at)
    values (p_negocio, p_device_day, now(), null)
    on conflict (negocio_id, device_day) do update set arrived_at = now(), left_at = null;
  else
    update public.place_presence set left_at = now()
    where negocio_id = p_negocio and device_day = p_device_day and left_at is null;
  end if;
  delete from public.place_presence where negocio_id = p_negocio and arrived_at < now() - interval '2 days';
  return true;
end;
$$;
revoke all on function public.mark_presence(uuid, text, boolean) from public;
grant execute on function public.mark_presence(uuid, text, boolean) to anon, authenticated, service_role;

-- «Qué tan lleno»: por día de la semana y hora (CDMX), de 0 a 100 contra la
-- hora pico del lugar, con las visitas de las últimas 8 semanas. Sin
-- suficientes visitas no devuelve nada. En la fila de la hora actual:
--   present_now   — personas dentro ahora (llegaron hace 3 minutos o más y no
--                   han salido; quien solo pasa ya salió);
--   usual_present — cuántas suele haber a esa hora: llegadas por hora × estancia
--                   promedio (ley de Little, L = λW).
drop function if exists public.place_busyness(uuid);
create function public.place_busyness(target uuid)
returns table (weekday integer, hour_of_day integer, level integer, present_now integer, usual_present numeric)
language plpgsql stable security definer set search_path = public
as $$
declare
  min_minutes numeric := public.visit_setting('busy_min_minutes', 5);
  min_visits numeric := public.visit_setting('busy_min_visits', 10);
  min_present numeric := public.visit_setting('live_min_present', 2);
  now_mx timestamp := now() at time zone 'America/Mexico_City';
  cur_wd integer := extract(dow from now() at time zone 'America/Mexico_City')::integer;
  cur_hr integer := extract(hour from now() at time zone 'America/Mexico_City')::integer;
  total bigint;
  inside integer;
begin
  select count(*) into total from public.place_visits v
  where v.negocio_id = target and v.started_at > now() - interval '8 weeks' and v.minutes >= min_minutes;
  if total < min_visits then return; end if;
  select count(*)::integer into inside from public.place_presence p
  where p.negocio_id = target and p.left_at is null
    and p.arrived_at between now() - interval '3 hours' and now() - interval '3 minutes';
  return query
  with hist as (
    select extract(dow from v.started_at at time zone 'America/Mexico_City')::integer as wd,
           extract(hour from v.started_at at time zone 'America/Mexico_City')::integer as hr,
           count(*)::numeric as n,
           avg(v.minutes)::numeric as stay
    from public.place_visits v
    where v.negocio_id = target and v.started_at > now() - interval '8 weeks' and v.minutes >= min_minutes
    group by 1, 2
  ), peak as (
    select max(n) as top from hist
  )
  select h.wd, h.hr, round(100 * h.n / p.top)::integer,
         case when h.wd = cur_wd and h.hr = cur_hr and inside >= min_present then inside end,
         case when h.wd = cur_wd and h.hr = cur_hr then round((h.n / 8.0) * (h.stay / 60.0), 2) end
  from hist h cross join peak p
  order by 1, 2;
end;
$$;
revoke all on function public.place_busyness(uuid) from public;
grant execute on function public.place_busyness(uuid) to anon, authenticated, service_role;
