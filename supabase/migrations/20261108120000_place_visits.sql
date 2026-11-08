-- Visitas reales y anónimas para «Qué tan lleno» (DECISIONES §17 y §19).
-- Con «Pedir mi opinión» activado, el teléfono detecta la visita (8 minutos o
-- más dentro del lugar, en su horario) y manda solo: el lugar, la hora de
-- llegada, los minutos y un identificador del teléfono que cambia cada día.
-- Nunca coordenadas ni cuenta. Nadie lee la tabla: solo estas funciones.
create table if not exists public.place_visits (
  id bigint generated always as identity primary key,
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  started_at timestamptz not null,
  minutes integer not null check (minutes between 8 and 240),
  device_day text not null check (device_day ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);
create unique index if not exists place_visits_once_per_day on public.place_visits (negocio_id, device_day);
create index if not exists place_visits_by_place on public.place_visits (negocio_id, started_at);
create index if not exists place_visits_by_device on public.place_visits (device_day);
alter table public.place_visits enable row level security;
revoke all on public.place_visits from public, anon, authenticated;
grant select, insert, delete on public.place_visits to service_role;

-- Registrar una visita. Devuelve false (sin error) si algo no cuadra, para no
-- dar pistas a quien intente inflar un lugar.
create or replace function public.record_visit(p_negocio uuid, p_started_at timestamptz, p_minutes integer, p_device_day text)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_minutes is null or p_minutes < 8 or p_minutes > 240 then return false; end if;
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

-- «Qué tan lleno»: por día de la semana y hora (CDMX), de 0 a 100 contra la
-- hora pico del lugar, con las visitas de las últimas 8 semanas. Con menos de
-- 30 visitas no devuelve nada: ni inventa ni deja adivinar visitas sueltas.
-- En la fila de la hora actual: visitas que llegaron en los últimos 90 minutos
-- y cuántas suelen llegar en esa misma franja.
create or replace function public.place_busyness(target uuid)
returns table (weekday integer, hour_of_day integer, level integer, recent_visits integer, usual_visits numeric)
language plpgsql stable security definer set search_path = public
as $$
declare
  total bigint;
  now_mx timestamp := now() at time zone 'America/Mexico_City';
begin
  select count(*) into total from public.place_visits
  where negocio_id = target and started_at > now() - interval '8 weeks';
  if total < 30 then return; end if;
  return query
  with hist as (
    select extract(dow from v.started_at at time zone 'America/Mexico_City')::integer as wd,
           extract(hour from v.started_at at time zone 'America/Mexico_City')::integer as hr,
           count(*)::numeric as n
    from public.place_visits v
    where v.negocio_id = target and v.started_at > now() - interval '8 weeks'
    group by 1, 2
  ), peak as (
    select max(n) as top from hist
  ), recent as (
    select count(*)::integer as n from public.place_visits v
    where v.negocio_id = target and v.started_at > now() - interval '90 minutes'
  )
  select h.wd, h.hr, round(100 * h.n / p.top)::integer,
         case when h.wd = extract(dow from now_mx)::integer and h.hr = extract(hour from now_mx)::integer then r.n end,
         case when h.wd = extract(dow from now_mx)::integer and h.hr = extract(hour from now_mx)::integer then round(h.n / 8.0, 2) end
  from hist h cross join peak p cross join recent r
  order by 1, 2;
end;
$$;
revoke all on function public.place_busyness(uuid) from public;
grant execute on function public.place_busyness(uuid) to anon, authenticated, service_role;
