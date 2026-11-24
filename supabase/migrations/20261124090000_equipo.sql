-- Equipo, fase 1 de docs/SUCURSALES_Y_EQUIPO_2026-11-23.md (§3, §7 y §8).
--
-- Cada persona entra con su propio correo; nunca se comparte la cuenta. El
-- dueño invita con un rol (Propietario o Administrador) y un alcance (todo el
-- negocio, un grupo o algunas sucursales). Todo lo que se publica o cambia
-- queda en el Registro de actividad con quién y a qué hora.
--
-- Nombres: `negocios` sigue siendo el lugar del mapa (en la app, la
-- sucursal). `marcas` es el negocio de la app. Cada negocio de hoy recibe su
-- marca, con su dueño como propietario principal.
--
-- Fase 1: una persona está en un solo equipo y cada dueño tiene un solo
-- negocio (`fonditas_one_per_owner_idx` se queda hasta la fase 2).

-- ── Marcas, grupos y sucursales ────────────────────────────────────────────
create table if not exists public.marcas (
  id uuid primary key default gen_random_uuid(),
  nombre text,
  propietario_principal uuid not null references auth.users(id) on delete cascade,
  verificada_at timestamptz,
  sucursales_ponen_precio boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.marcas enable row level security;

create table if not exists public.grupos (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid not null references public.marcas(id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  created_at timestamptz not null default now()
);
alter table public.grupos enable row level security;

alter table public.negocios add column if not exists marca_id uuid references public.marcas(id) on delete set null;
alter table public.negocios add column if not exists grupo_id uuid references public.grupos(id) on delete set null;
alter table public.negocios add column if not exists nombre_interno text check (nombre_interno is null or char_length(nombre_interno) <= 60);
create index if not exists negocios_marca_idx on public.negocios(marca_id);

insert into public.marcas (propietario_principal)
select distinct n.owner_id from public.negocios n
where n.owner_id is not null and n.marca_id is null
  and not exists (select 1 from public.marcas m where m.propietario_principal = n.owner_id);
update public.negocios n set marca_id = m.id
from public.marcas m
where n.marca_id is null and m.propietario_principal = n.owner_id;

-- Un negocio nuevo nace con su marca.
create or replace function public.negocios_nace_con_marca()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.marca_id is null and new.owner_id is not null then
    insert into public.marcas (propietario_principal) values (new.owner_id) returning id into new.marca_id;
  end if;
  return new;
end $$;
drop trigger if exists negocios_nace_con_marca on public.negocios;
create trigger negocios_nace_con_marca before insert on public.negocios
  for each row execute function public.negocios_nace_con_marca();

-- La marca y el grupo de una sucursal no se cambian desde la app.
create or replace function public.negocios_protege_marca()
returns trigger language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null
     and (new.marca_id is distinct from old.marca_id or new.grupo_id is distinct from old.grupo_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return new;
end $$;
drop trigger if exists negocios_protege_marca on public.negocios;
create trigger negocios_protege_marca before update on public.negocios
  for each row execute function public.negocios_protege_marca();

-- ── Equipo e invitaciones ──────────────────────────────────────────────────
create table if not exists public.equipo (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid not null references public.marcas(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rol text not null check (rol in ('propietario', 'administrador')),
  alcance text not null default 'todo' check (alcance in ('todo', 'grupo', 'sucursales')),
  grupo_id uuid references public.grupos(id) on delete cascade,
  invitado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (marca_id, user_id),
  check ((alcance = 'grupo') = (grupo_id is not null))
);
-- Fase 1: un solo equipo por persona (la fase 4 trae «Cambiar de cuenta»).
create unique index if not exists equipo_un_equipo_por_persona on public.equipo(user_id);
alter table public.equipo enable row level security;

create table if not exists public.equipo_sucursales (
  equipo_id uuid not null references public.equipo(id) on delete cascade,
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  primary key (equipo_id, negocio_id)
);
alter table public.equipo_sucursales enable row level security;

create table if not exists public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid not null references public.marcas(id) on delete cascade,
  correo text not null check (correo = lower(btrim(correo)) and correo ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  rol text not null check (rol in ('propietario', 'administrador')),
  alcance text not null default 'todo' check (alcance in ('todo', 'grupo', 'sucursales')),
  grupo_id uuid references public.grupos(id) on delete cascade,
  negocio_ids uuid[] not null default '{}',
  invitado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  vence_at timestamptz not null default now() + interval '7 days',
  aceptada_at timestamptz,
  cancelada_at timestamptz
);
create unique index if not exists invitaciones_una_pendiente
  on public.invitaciones(marca_id, correo) where aceptada_at is null and cancelada_at is null;
alter table public.invitaciones enable row level security;

-- ── Registro de actividad ──────────────────────────────────────────────────
create table if not exists public.registro_actividad (
  id bigint generated always as identity primary key,
  marca_id uuid not null references public.marcas(id) on delete cascade,
  negocio_id uuid references public.negocios(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  accion text not null,
  detalle jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists registro_actividad_marca_idx on public.registro_actividad(marca_id, created_at desc);
alter table public.registro_actividad enable row level security;

-- ── Nombres reservados ─────────────────────────────────────────────────────
-- Solo se bloquea el nombre idéntico (decisión de Parco, 23 nov):
-- «Samborcito» y «Starbucksito» pasan; «STARBUCKS» y «Starbucks Coffee», no.
create or replace function public.nombre_normalizado(p text)
returns text language sql immutable set search_path = '' as $$
  select regexp_replace(
    regexp_replace(
      lower(translate(coalesce(p, ''), 'ÁÀÄÂÉÈËÊÍÌÏÎÓÒÖÔÚÙÜÛÑáàäâéèëêíìïîóòöôúùüûñ', 'AAAAEEEEIIIIOOOOUUUUNaaaaeeeeiiiioooouuuun')),
      '\m(cafe|coffee|restaurante|restaurant|cafeteria|taqueria|sucursal|the|el|la|los|las)\M', '', 'g'),
    '[^a-z0-9]', '', 'g');
$$;

create table if not exists public.marcas_reservadas (
  nombre_normalizado text primary key check (nombre_normalizado <> ''),
  nombre text not null
);
alter table public.marcas_reservadas enable row level security;

-- Nombres distintivos de cadenas nacionales. Los de palabras comunes («El
-- Portón», «La Casa de Toño») nunca se reservan: hay fondas con ese nombre.
insert into public.marcas_reservadas (nombre_normalizado, nombre)
select public.nombre_normalizado(n), n from unnest(array[
  'Starbucks', 'Toks', 'Sanborns', 'Vips', 'Potzollcalli', 'Cielito Querido Café',
  'Punta del Cielo', 'The Italian Coffee Company', 'Juan Valdez Café', 'Tim Hortons',
  'Dunkin''', 'Krispy Kreme', 'McDonald''s', 'Burger King', 'KFC', 'Kentucky Fried Chicken',
  'Carl''s Jr.', 'Wendy''s', 'Subway', 'Domino''s', 'Domino''s Pizza', 'Pizza Hut',
  'Little Caesars', 'Papa John''s', 'Wingstop', 'Wings Army', 'Chili''s', 'Applebee''s',
  'Italianni''s', 'Benedetti''s', 'Dairy Queen', 'Church''s', 'Popeyes', 'Panda Express',
  'Sushi Itto', 'Taco Bell', 'Hooters', 'Bisquets Obregón', 'Los Bisquets Bisquets Obregón',
  'Gorditas Doña Tota', 'OXXO'
]) as n
on conflict (nombre_normalizado) do nothing;

create or replace function public.negocios_nombre_no_reservado()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.nombre is not distinct from old.nombre then return new; end if;
  if exists (
    select 1 from public.marcas_reservadas r
    where r.nombre_normalizado = public.nombre_normalizado(new.nombre)
  ) and not exists (
    select 1 from public.marcas m
    where m.id = new.marca_id and m.verificada_at is not null
  ) then
    raise exception 'RESERVED_NAME' using errcode = '22023';
  end if;
  return new;
end $$;
drop trigger if exists negocios_nombre_no_reservado on public.negocios;
create trigger negocios_nombre_no_reservado before insert or update of nombre on public.negocios
  for each row execute function public.negocios_nombre_no_reservado();

-- ── Permisos ───────────────────────────────────────────────────────────────
-- Acciones: operar (publicar, «Se acabó», avisos, reseñas, Hoy), marca
-- (perfil del negocio), carta, precio_local, equipo y pago.
create or replace function public.puede_persona(p_user uuid, p_negocio uuid, p_accion text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_user is not null and exists (
    select 1
    from public.negocios n
    left join public.marcas m on m.id = n.marca_id
    where n.id = p_negocio and (
      n.owner_id = p_user
      or m.propietario_principal = p_user
      or (p_accion <> 'pago' and exists (
        select 1 from public.equipo e
        where e.marca_id = n.marca_id and e.user_id = p_user
          and (e.alcance = 'todo'
               or (e.alcance = 'grupo' and e.grupo_id = n.grupo_id)
               or (e.alcance = 'sucursales' and exists (
                 select 1 from public.equipo_sucursales s where s.equipo_id = e.id and s.negocio_id = n.id)))
          and case p_accion
                when 'operar' then true
                when 'marca' then e.alcance = 'todo'
                when 'carta' then e.alcance = 'todo'
                when 'precio_local' then e.alcance = 'todo' or (e.rol = 'propietario' and coalesce(m.sucursales_ponen_precio, false))
                when 'equipo' then e.rol = 'propietario'
                else false
              end))
    )
  );
$$;
revoke all on function public.puede_persona(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.puede_persona(uuid, uuid, text) to service_role;

create or replace function public.puede(p_negocio uuid, p_accion text)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.puede_persona(auth.uid(), p_negocio, p_accion);
$$;
revoke all on function public.puede(uuid, text) from public, anon;
grant execute on function public.puede(uuid, text) to authenticated;

-- ── Políticas: de «el dueño» a «quien puede» ───────────────────────────────
-- Leer usa la lista de sucursales de la persona (una subconsulta por consulta,
-- barata en el mapa); escribir pregunta a puede() fila por fila.
create or replace function public.mis_negocios()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select n.id from public.negocios n
  where n.owner_id = auth.uid()
     or n.marca_id in (
       select m.id from public.marcas m where m.propietario_principal = auth.uid()
       union
       select e.marca_id from public.equipo e where e.user_id = auth.uid());
$$;
revoke all on function public.mis_negocios() from public, anon;
grant execute on function public.mis_negocios() to authenticated;

drop policy if exists "owners manage their Patio" on public.negocios;
drop policy if exists "team reads their Patio" on public.negocios;
drop policy if exists "owners create their Patio" on public.negocios;
drop policy if exists "team edits their Patio" on public.negocios;
drop policy if exists "owners delete their Patio" on public.negocios;
create policy "team reads their Patio" on public.negocios for select to authenticated
  using (owner_id = auth.uid() or id in (select public.mis_negocios()));
create policy "owners create their Patio" on public.negocios for insert to authenticated
  with check (owner_id = auth.uid());
create policy "team edits their Patio" on public.negocios for update to authenticated
  using (owner_id = auth.uid() or public.puede(id, 'marca'))
  with check (owner_id = auth.uid() or public.puede(id, 'marca'));
create policy "owners delete their Patio" on public.negocios for delete to authenticated
  using (owner_id = auth.uid());

drop policy if exists "owners manage their menus" on public.menus;
drop policy if exists "team reads their menus" on public.menus;
drop policy if exists "team adds menus" on public.menus;
drop policy if exists "team changes menus" on public.menus;
drop policy if exists "team removes menus" on public.menus;
create policy "team reads their menus" on public.menus for select to authenticated
  using (negocio_id in (select public.mis_negocios()));
create policy "team adds menus" on public.menus for insert to authenticated
  with check (public.puede(negocio_id, 'operar'));
create policy "team changes menus" on public.menus for update to authenticated
  using (public.puede(negocio_id, 'operar')) with check (public.puede(negocio_id, 'operar'));
create policy "team removes menus" on public.menus for delete to authenticated
  using (public.puede(negocio_id, 'operar'));

drop policy if exists "owners manage their carta" on public.cartas;
drop policy if exists "team reads their carta" on public.cartas;
drop policy if exists "team adds the carta" on public.cartas;
drop policy if exists "team changes the carta" on public.cartas;
drop policy if exists "team removes the carta" on public.cartas;
create policy "team reads their carta" on public.cartas for select to authenticated
  using (negocio_id in (select public.mis_negocios()));
create policy "team adds the carta" on public.cartas for insert to authenticated
  with check (public.puede(negocio_id, 'carta'));
create policy "team changes the carta" on public.cartas for update to authenticated
  using (public.puede(negocio_id, 'carta')) with check (public.puede(negocio_id, 'carta'));
create policy "team removes the carta" on public.cartas for delete to authenticated
  using (public.puede(negocio_id, 'carta'));

drop policy if exists "owners manage their puntos" on public.negocio_puntos;
drop policy if exists "team reads their puntos" on public.negocio_puntos;
drop policy if exists "team manages their puntos" on public.negocio_puntos;
drop policy if exists "team changes their puntos" on public.negocio_puntos;
drop policy if exists "team removes their puntos" on public.negocio_puntos;
create policy "team reads their puntos" on public.negocio_puntos for select to authenticated
  using (negocio_id in (select public.mis_negocios()));
create policy "team manages their puntos" on public.negocio_puntos for insert to authenticated
  with check (public.puede(negocio_id, 'marca'));
create policy "team changes their puntos" on public.negocio_puntos for update to authenticated
  using (public.puede(negocio_id, 'marca')) with check (public.puede(negocio_id, 'marca'));
create policy "team removes their puntos" on public.negocio_puntos for delete to authenticated
  using (public.puede(negocio_id, 'marca'));

drop policy if exists "owners read their name history" on public.negocio_name_history;
drop policy if exists "owners record their name changes" on public.negocio_name_history;
drop policy if exists "team reads the name history" on public.negocio_name_history;
drop policy if exists "team records name changes" on public.negocio_name_history;
create policy "team reads the name history" on public.negocio_name_history for select to authenticated
  using (public.puede(negocio_id, 'marca'));
create policy "team records name changes" on public.negocio_name_history for insert to authenticated
  with check (public.puede(negocio_id, 'marca'));

drop policy if exists "people with a profile comment" on public.review_comments;
create policy "people with a profile comment" on public.review_comments for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.reviews r
      where r.id = review_comments.review_id and r.status = 'published' and not public.is_blocked_by(r.user_id, auth.uid()))
    and (
      exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.setup_completed)
      or exists (
        select 1 from public.reviews r
        where r.id = review_comments.review_id and public.puede(r.negocio_id, 'operar'))));

-- ── Funciones del negocio: el equipo ve lo mismo que el dueño ─────────────
-- Pro es del dueño: quien está en su equipo usa sus beneficios.
create or replace function public.has_pro(p_user uuid)
returns boolean language sql stable security definer set search_path = 'public' as $$
  select exists (select 1 from public.business_plans where user_id = p_user and expires_at > now())
    or exists (
      select 1 from public.equipo e
      join public.marcas m on m.id = e.marca_id
      join public.business_plans b on b.user_id = m.propietario_principal and b.expires_at > now()
      where e.user_id = p_user);
$$;

create or replace function public.business_insights(target uuid)
returns table(saves bigint, saves_week bigint, dish_likes bigint, dish_likes_week bigint)
language plpgsql stable security definer set search_path = 'public' as $$
begin
  if not public.puede(target, 'operar') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query select
    (select count(*) from public.saved_patios s where s.negocio_id = target),
    (select count(*) from public.saved_patios s where s.negocio_id = target and s.created_at > now() - interval '7 days'),
    (select count(*) from public.dish_likes d where d.negocio_id = target),
    (select count(*) from public.dish_likes d where d.negocio_id = target and d.created_at > now() - interval '7 days');
end;
$$;

create or replace function public.business_peak_times(target uuid)
returns table(weekday integer, hour_of_day integer, signals bigint)
language plpgsql stable security definer set search_path = 'public' as $$
begin
  if not public.puede(target, 'operar')
     or not public.has_pro((select n.owner_id from public.negocios n where n.id = target)) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    with events as (
      select s.created_at from public.saved_patios s where s.negocio_id = target and s.created_at > now() - interval '90 days'
      union all
      select d.created_at from public.dish_likes d where d.negocio_id = target and d.created_at > now() - interval '90 days'
    )
    select extract(dow from created_at at time zone 'America/Mexico_City')::integer,
           extract(hour from created_at at time zone 'America/Mexico_City')::integer,
           count(*)
    from events group by 1, 2;
end;
$$;

create or replace function public.business_pro_status(target uuid)
returns table(pro_until timestamptz, notices_left integer)
language plpgsql stable security definer set search_path = 'public' as $$
declare
  month_start timestamptz := date_trunc('month', now() at time zone 'America/Mexico_City') at time zone 'America/Mexico_City';
begin
  if not public.puede(target, 'operar') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query select
    (select p.expires_at from public.business_plans p
      where p.user_id = (select n.owner_id from public.negocios n where n.id = target) and p.expires_at > now()),
    greatest(0, 8 - (select count(*)::integer from public.special_notices s
      where s.negocio_id = target and s.kind = 'promo' and s.created_at >= month_start));
end;
$$;

create or replace function public.business_today(target uuid)
returns table(views_today integer, views_usual numeric, views_week jsonb, followers_today integer, dish_likes_today integer, reviews_today integer, top_dishes jsonb)
language plpgsql stable security definer set search_path = 'public' as $$
declare
  today date := (now() at time zone 'America/Mexico_City')::date;
  day_start timestamptz := today::timestamp at time zone 'America/Mexico_City';
  first_day date;
begin
  if not public.puede(target, 'operar') then
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

create or replace function public.reply_to_review(target_review_id uuid, reply_text text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.reviews r
    where r.id = target_review_id and public.puede(r.negocio_id, 'operar')
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if reply_text is null or char_length(trim(reply_text)) not between 1 and 600 then
    raise exception 'invalid reply' using errcode = '22023';
  end if;
  update public.reviews set business_reply = trim(reply_text), business_replied_at = now()
  where id = target_review_id and status = 'published';
end;
$$;

create or replace function public.confirm_carta_prices()
returns void language plpgsql security definer set search_path = 'public' as $$
begin
  update public.cartas c
  set precios_al = now()
  from public.negocios n
  where n.id = c.negocio_id and n.id in (select public.mis_negocios()) and public.puede(n.id, 'carta');
  if not found then raise exception 'no carta'; end if;
end;
$$;

-- La foto del lugar la sube cualquiera del equipo (a su propia carpeta).
create or replace function public.negocios_photo_is_own()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.foto_url is null then return new; end if;
  if tg_op = 'UPDATE' and new.foto_url is not distinct from old.foto_url then return new; end if;
  if new.owner_id is null or not exists (
    select 1 from (
      select new.owner_id as uid
      union all
      select e.user_id from public.equipo e where e.marca_id = new.marca_id
    ) people
    where position('/storage/v1/object/public/place-photos/' || people.uid::text || '/' in new.foto_url) > 0
  ) then
    raise exception 'La foto del lugar se sube desde Patio.' using errcode = '22023';
  end if;
  return new;
end $$;

-- ── Registro de actividad: triggers ────────────────────────────────────────
create or replace function public.registrar(p_negocio uuid, p_user uuid, p_accion text, p_detalle jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_marca uuid;
begin
  if p_user is null or p_negocio is null then return; end if;
  select n.marca_id into v_marca from public.negocios n where n.id = p_negocio;
  if v_marca is null then return; end if;
  insert into public.registro_actividad (marca_id, negocio_id, user_id, accion, detalle)
  values (v_marca, p_negocio, p_user, p_accion, coalesce(p_detalle, '{}'::jsonb));
  -- Se guarda 180 días (número de Patio).
  delete from public.registro_actividad
  where marca_id = v_marca and created_at < now() - interval '180 days';
end $$;
revoke all on function public.registrar(uuid, uuid, text, jsonb) from public, anon, authenticated;

create or replace function public.platillos_agotados(p jsonb)
returns text[] language sql immutable set search_path = '' as $$
  select coalesce(array_agg(distinct d->>'nombre' order by d->>'nombre'), '{}')
  from jsonb_array_elements(case when jsonb_typeof(p) = 'array' then p else coalesce(p->'secciones', '[]'::jsonb) end) s,
       jsonb_array_elements(case when jsonb_typeof(s->'platillos') = 'array' then s->'platillos' else '[]'::jsonb end) d
  where d->'agotado' = 'true'::jsonb and coalesce(btrim(d->>'nombre'), '') <> '';
$$;

create or replace function public.registrar_menu()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  antes text[];
  ahora text[];
  platillo text;
begin
  if auth.uid() is null then return coalesce(new, old); end if;
  if tg_op = 'DELETE' then
    perform public.registrar(old.negocio_id, auth.uid(), 'retiro_menu', jsonb_build_object('fecha', old.fecha));
    return old;
  end if;
  if tg_op = 'INSERT' then
    perform public.registrar(new.negocio_id, auth.uid(),
      case when new.publish_at is not null and new.publish_at > now() then 'programo_menu' else 'publico_menu' end,
      jsonb_build_object('fecha', new.fecha, 'publish_at', new.publish_at));
    return new;
  end if;
  antes := public.platillos_agotados(old.secciones);
  ahora := public.platillos_agotados(new.secciones);
  if antes is distinct from ahora then
    foreach platillo in array ahora loop
      if not platillo = any(antes) then
        perform public.registrar(new.negocio_id, auth.uid(), 'se_acabo', jsonb_build_object('platillo', platillo, 'fecha', new.fecha));
      end if;
    end loop;
    foreach platillo in array antes loop
      if not platillo = any(ahora) then
        perform public.registrar(new.negocio_id, auth.uid(), 'hay_otra_vez', jsonb_build_object('platillo', platillo, 'fecha', new.fecha));
      end if;
    end loop;
  elsif new.secciones is distinct from old.secciones or new.publish_at is distinct from old.publish_at then
    perform public.registrar(new.negocio_id, auth.uid(),
      case when new.publish_at is not null and new.publish_at > now() then 'programo_menu' else 'actualizo_menu' end,
      jsonb_build_object('fecha', new.fecha, 'publish_at', new.publish_at));
  end if;
  return new;
end $$;
drop trigger if exists menus_registro on public.menus;
create trigger menus_registro after insert or update or delete on public.menus
  for each row execute function public.registrar_menu();

create or replace function public.registrar_carta()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then return new; end if;
  if tg_op = 'UPDATE' and new.secciones is not distinct from old.secciones then
    if new.precios_al is distinct from old.precios_al then
      perform public.registrar(new.negocio_id, auth.uid(), 'confirmo_precios');
    end if;
    return new;
  end if;
  perform public.registrar(new.negocio_id, auth.uid(), 'cambio_carta');
  return new;
end $$;
drop trigger if exists cartas_registro on public.cartas;
create trigger cartas_registro after insert or update on public.cartas
  for each row execute function public.registrar_carta();

create or replace function public.registrar_negocio()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  campos text[];
begin
  if auth.uid() is null then return new; end if;
  select coalesce(array_agg(k.key order by k.key), '{}') into campos
  from jsonb_each(to_jsonb(new)) k
  where k.key not in ('nombre_updated_at') and k.value is distinct from (to_jsonb(old) -> k.key);
  if cardinality(campos) > 0 then
    perform public.registrar(new.id, auth.uid(), 'edito_negocio', jsonb_build_object('campos', to_jsonb(campos)));
  end if;
  return new;
end $$;
drop trigger if exists negocios_registro on public.negocios;
create trigger negocios_registro after update on public.negocios
  for each row execute function public.registrar_negocio();

create or replace function public.registrar_aviso()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform public.registrar(new.negocio_id, coalesce(auth.uid(), new.created_by),
    case when new.kind = 'promo' then 'aviso_especial' else 'aviso' end,
    jsonb_build_object('texto', left(coalesce(new.body, ''), 120)));
  return new;
end $$;
drop trigger if exists special_notices_registro on public.special_notices;
create trigger special_notices_registro after insert on public.special_notices
  for each row execute function public.registrar_aviso();

create or replace function public.registrar_respuesta()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and new.business_reply is distinct from old.business_reply and new.business_reply is not null then
    perform public.registrar(new.negocio_id, auth.uid(), 'respondio_resena', jsonb_build_object('estrellas', new.stars));
  end if;
  return new;
end $$;
drop trigger if exists reviews_registro_respuesta on public.reviews;
create trigger reviews_registro_respuesta after update of business_reply on public.reviews
  for each row execute function public.registrar_respuesta();

-- ── RPC del equipo ─────────────────────────────────────────────────────────
-- El negocio de quien entra: el suyo, el del equipo donde está, o ninguno.
create or replace function public.mi_negocio_sin_aceptar()
returns uuid language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select n.id from public.negocios n where n.owner_id = auth.uid() order by n.created_at limit 1),
    (select n.id from public.equipo e join public.negocios n on n.marca_id = e.marca_id
      where e.user_id = auth.uid()
        and (e.alcance = 'todo'
             or (e.alcance = 'grupo' and n.grupo_id = e.grupo_id)
             or (e.alcance = 'sucursales' and exists (select 1 from public.equipo_sucursales s where s.equipo_id = e.id and s.negocio_id = n.id)))
      order by n.created_at limit 1));
$$;
revoke all on function public.mi_negocio_sin_aceptar() from public, anon;
grant execute on function public.mi_negocio_sin_aceptar() to authenticated;

-- Entrar al lado del negocio con el correo invitado acepta la invitación
-- (la persona eligió entrar con ese correo a ese negocio).
create or replace function public.mi_negocio()
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  actual uuid := public.mi_negocio_sin_aceptar();
  v_correo text;
  inv public.invitaciones;
  nuevo uuid;
  propio_vacio uuid;
begin
  if auth.uid() is null then return null; end if;
  -- Un negocio propio que nunca se llenó (sin nombre ni menús) no le gana a
  -- una invitación: quien fue invitado entra al equipo.
  select n.id into propio_vacio from public.negocios n
  where n.owner_id = auth.uid() and btrim(coalesce(n.nombre, '')) = ''
    and not exists (select 1 from public.menus x where x.negocio_id = n.id)
    and not exists (select 1 from public.cartas x where x.negocio_id = n.id);
  if actual is not null and (propio_vacio is null or actual <> propio_vacio) then return actual; end if;
  select lower(u.email) into v_correo from auth.users u where u.id = auth.uid() and u.email_confirmed_at is not null;
  if v_correo is null then return actual; end if;
  select * into inv from public.invitaciones i
  where i.correo = v_correo and i.aceptada_at is null and i.cancelada_at is null and i.vence_at > now()
  order by i.created_at desc limit 1;
  if inv.id is null then return actual; end if;
  if propio_vacio is not null then
    begin
      delete from public.negocios where id = propio_vacio;
      delete from public.marcas m where m.propietario_principal = auth.uid()
        and not exists (select 1 from public.negocios n where n.marca_id = m.id);
    exception when others then
      return actual;
    end;
  end if;
  insert into public.equipo (marca_id, user_id, rol, alcance, grupo_id, invitado_por)
  values (inv.marca_id, auth.uid(), inv.rol, inv.alcance, inv.grupo_id, inv.invitado_por)
  returning id into nuevo;
  if inv.alcance = 'sucursales' then
    insert into public.equipo_sucursales (equipo_id, negocio_id)
    select nuevo, unnest(inv.negocio_ids) on conflict do nothing;
  end if;
  update public.invitaciones set aceptada_at = now() where id = inv.id;
  actual := public.mi_negocio_sin_aceptar();
  perform public.registrar(actual, auth.uid(), 'entro_al_equipo', jsonb_build_object('rol', inv.rol));
  return actual;
end $$;
revoke all on function public.mi_negocio() from public, anon;
grant execute on function public.mi_negocio() to authenticated;

create or replace function public.mi_rol(p_negocio uuid)
returns table(rol text, alcance text, principal boolean)
language sql stable security definer set search_path = '' as $$
  select 'propietario'::text, 'todo'::text, true
  from public.negocios n left join public.marcas m on m.id = n.marca_id
  where n.id = p_negocio and (n.owner_id = auth.uid() or m.propietario_principal = auth.uid())
  union all
  select e.rol, e.alcance, false
  from public.negocios n join public.equipo e on e.marca_id = n.marca_id
  where n.id = p_negocio and e.user_id = auth.uid()
    and not exists (select 1 from public.marcas m where m.id = n.marca_id and m.propietario_principal = auth.uid())
  limit 1;
$$;
revoke all on function public.mi_rol(uuid) from public, anon;
grant execute on function public.mi_rol(uuid) to authenticated;

create or replace function public.nombre_publico(p_user uuid)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(
    nullif(btrim(p.display_name), ''),
    nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''))
  from public.user_profiles p where p.user_id = p_user;
$$;
revoke all on function public.nombre_publico(uuid) from public, anon, authenticated;

-- Nombre de alguien del equipo: su nombre público; si no tiene, el del
-- negocio para el propietario principal; para el resto, su correo (solo
-- quien maneja el equipo) o «Persona del equipo». Nunca «Tú».
create or replace function public.nombre_en_equipo(p_user uuid, p_marca uuid, p_con_correo boolean)
returns text language sql stable security definer set search_path = '' as $$
  select coalesce(
    public.nombre_publico(p_user),
    (select nullif(btrim(n.nombre), '') from public.negocios n join public.marcas m on m.id = n.marca_id
      where m.id = p_marca and m.propietario_principal = p_user order by n.created_at limit 1),
    case when p_con_correo then (select u.email::text from auth.users u where u.id = p_user) end,
    'Persona del equipo');
$$;
revoke all on function public.nombre_en_equipo(uuid, uuid, boolean) from public, anon, authenticated;

-- Personas e invitaciones pendientes. El correo solo lo ve quien maneja el equipo.
create or replace function public.equipo_del_negocio(p_negocio uuid)
returns table(tipo text, id uuid, user_id uuid, nombre text, correo text, rol text, principal boolean, desde timestamptz, vence_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_marca uuid;
  ve_correos boolean := public.puede(p_negocio, 'equipo');
begin
  if not public.puede(p_negocio, 'operar') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select n.marca_id into v_marca from public.negocios n where n.id = p_negocio;
  return query
    select 'persona'::text, m.id, m.propietario_principal, public.nombre_en_equipo(m.propietario_principal, v_marca, ve_correos),
      case when ve_correos then (select u.email::text from auth.users u where u.id = m.propietario_principal) end,
      'propietario'::text, true, m.created_at, null::timestamptz
    from public.marcas m where m.id = v_marca
    union all
    select 'persona', e.id, e.user_id, public.nombre_en_equipo(e.user_id, v_marca, ve_correos),
      case when ve_correos then (select u.email::text from auth.users u where u.id = e.user_id) end,
      e.rol, false, e.created_at, null
    from public.equipo e where e.marca_id = v_marca
    union all
    select 'invitacion', i.id, null, null, i.correo, i.rol, false, i.created_at, i.vence_at
    from public.invitaciones i
    where ve_correos and i.marca_id = v_marca and i.aceptada_at is null and i.cancelada_at is null and i.vence_at > now();
end $$;
revoke all on function public.equipo_del_negocio(uuid) from public, anon;
grant execute on function public.equipo_del_negocio(uuid) to authenticated;

create or replace function public.invitar_al_equipo(p_negocio uuid, p_correo text, p_rol text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_marca uuid;
  v_correo text := lower(btrim(coalesce(p_correo, '')));
  nueva uuid;
begin
  if not public.puede(p_negocio, 'equipo') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_rol not in ('propietario', 'administrador') then
    raise exception 'INVALID_ROLE' using errcode = '22023';
  end if;
  if v_correo !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL' using errcode = '22023';
  end if;
  select n.marca_id into v_marca from public.negocios n where n.id = p_negocio;
  if v_correo = (select lower(u.email) from auth.users u where u.id = auth.uid()) then
    raise exception 'ALREADY_IN_TEAM' using errcode = '22023';
  end if;
  if exists (
    select 1 from auth.users u
    where lower(u.email) = v_correo and (
      exists (select 1 from public.equipo e where e.user_id = u.id and e.marca_id = v_marca)
      or exists (select 1 from public.marcas m where m.id = v_marca and m.propietario_principal = u.id))
  ) then
    raise exception 'ALREADY_IN_TEAM' using errcode = '22023';
  end if;
  update public.invitaciones set cancelada_at = now()
  where marca_id = v_marca and correo = v_correo and aceptada_at is null and cancelada_at is null;
  insert into public.invitaciones (marca_id, correo, rol, invitado_por)
  values (v_marca, v_correo, p_rol, auth.uid()) returning id into nueva;
  perform public.registrar(p_negocio, auth.uid(), 'invito', jsonb_build_object('correo', v_correo, 'rol', p_rol));
  return nueva;
end $$;
revoke all on function public.invitar_al_equipo(uuid, text, text) from public, anon;
grant execute on function public.invitar_al_equipo(uuid, text, text) to authenticated;

create or replace function public.cancelar_invitacion(p_invitacion uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  inv public.invitaciones;
  v_negocio uuid;
begin
  select * into inv from public.invitaciones where id = p_invitacion;
  select n.id into v_negocio from public.negocios n where n.marca_id = inv.marca_id order by n.created_at limit 1;
  if inv.id is null or not public.puede(v_negocio, 'equipo') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  update public.invitaciones set cancelada_at = now() where id = p_invitacion and aceptada_at is null;
  perform public.registrar(v_negocio, auth.uid(), 'cancelo_invitacion', jsonb_build_object('correo', inv.correo));
end $$;
revoke all on function public.cancelar_invitacion(uuid) from public, anon;
grant execute on function public.cancelar_invitacion(uuid) to authenticated;

-- Quitar a alguien. Solo el propietario principal quita a otro propietario.
-- Cualquiera puede salirse (p_equipo = su propia fila).
create or replace function public.quitar_del_equipo(p_equipo uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  fila public.equipo;
  v_negocio uuid;
  soy_principal boolean;
begin
  select * into fila from public.equipo where id = p_equipo;
  if fila.id is null then raise exception 'not authorized' using errcode = '42501'; end if;
  select n.id into v_negocio from public.negocios n where n.marca_id = fila.marca_id order by n.created_at limit 1;
  select m.propietario_principal = auth.uid() into soy_principal from public.marcas m where m.id = fila.marca_id;
  if fila.user_id <> auth.uid() and not (
    public.puede(v_negocio, 'equipo') and (fila.rol = 'administrador' or soy_principal)
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  delete from public.equipo where id = p_equipo;
  perform public.registrar(v_negocio, auth.uid(),
    case when fila.user_id = auth.uid() then 'salio_del_equipo' else 'quito_del_equipo' end,
    jsonb_build_object('persona', public.nombre_en_equipo(fila.user_id, fila.marca_id, true), 'rol', fila.rol));
end $$;
revoke all on function public.quitar_del_equipo(uuid) from public, anon;
grant execute on function public.quitar_del_equipo(uuid) to authenticated;

-- Lo ven quienes manejan el equipo. Cada entrada lleva el nombre de quien la
-- hizo (nunca «Tú»).
create or replace function public.registro_del_negocio(p_negocio uuid, p_antes timestamptz default null, p_limite integer default 60)
returns table(id bigint, accion text, detalle jsonb, created_at timestamptz, user_id uuid, nombre text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.puede(p_negocio, 'equipo') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query
    select r.id, r.accion, r.detalle, r.created_at, r.user_id,
      case when r.user_id is null then 'Alguien que ya no está' else public.nombre_en_equipo(r.user_id, r.marca_id, true) end
    from public.registro_actividad r
    join public.negocios n on n.id = p_negocio and r.marca_id = n.marca_id
    where p_antes is null or r.created_at < p_antes
    order by r.created_at desc
    limit least(greatest(coalesce(p_limite, 60), 1), 200);
end $$;
revoke all on function public.registro_del_negocio(uuid, timestamptz, integer) from public, anon;
grant execute on function public.registro_del_negocio(uuid, timestamptz, integer) to authenticated;
