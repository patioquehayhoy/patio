-- Patio Pro del negocio. Una fila por cuenta con Pro y hasta cuándo dura. La
-- escriben el webhook de la tienda (revenuecat-webhook) o Alejandro a mano para
-- los Fundadores (6 meses); la app solo lee la suya.
create table if not exists public.business_plans (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null check (plan = 'pro'),
  source text not null check (source in ('store', 'founder')),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
alter table public.business_plans enable row level security;
revoke all on public.business_plans from public, anon, authenticated;
grant select on public.business_plans to authenticated;
grant select, insert, update, delete on public.business_plans to service_role;
drop policy if exists "own business plan readable" on public.business_plans;
create policy "own business plan readable" on public.business_plans for select to authenticated
  using (auth.uid() = user_id);

create or replace function public.has_pro(p_user uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.business_plans where user_id = p_user and expires_at > now());
$$;
revoke all on function public.has_pro(uuid) from public, anon, authenticated;
grant execute on function public.has_pro(uuid) to service_role;

-- Lecturas con foto por plan: 20 al día en Gratis, 60 en Pro.
create or replace function public.consume_ai_request(p_user_id uuid, p_feature text)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  moment timestamptz := statement_timestamp();
  minute_limit integer;
  daily_limit integer;
  accepted integer;
begin
  if not exists (select 1 from auth.users where id = p_user_id and not is_anonymous) then
    raise exception 'unknown user' using errcode = '42501';
  end if;
  case p_feature
    when 'read-menu' then minute_limit := 2; daily_limit := case when public.has_pro(p_user_id) then 60 else 20 end;
    when 'smart-setup' then minute_limit := 3; daily_limit := 20;
    when 'search-intent' then minute_limit := 10; daily_limit := 100;
    else raise exception 'unknown feature' using errcode = '22023';
  end case;
  -- The exception block rolls back BOTH counters if either window is full.
  begin
    insert into public.ai_request_usage as usage(user_id, feature, window_kind, window_start, requests)
    values(p_user_id, p_feature, 'minute', date_trunc('minute', moment), 1)
    on conflict (user_id, feature, window_kind, window_start) do update
      set requests = usage.requests + 1 where usage.requests < minute_limit
    returning requests into accepted;
    if accepted is null then raise exception 'quota exceeded' using errcode = 'P0001'; end if;
    accepted := null;
    insert into public.ai_request_usage as usage(user_id, feature, window_kind, window_start, requests)
    values(p_user_id, p_feature, 'day', date_trunc('day', moment at time zone 'America/Mexico_City') at time zone 'America/Mexico_City', 1)
    on conflict (user_id, feature, window_kind, window_start) do update
      set requests = usage.requests + 1 where usage.requests < daily_limit
    returning requests into accepted;
    if accepted is null then raise exception 'quota exceeded' using errcode = 'P0001'; end if;
  exception when sqlstate 'P0001' then return false;
  end;
  delete from public.ai_request_usage where user_id = p_user_id and window_start < moment - interval '2 days';
  return true;
end;
$$;
revoke all on function public.consume_ai_request(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_ai_request(uuid, text) to service_role;

-- Avisos especiales: 8 al mes con Pro. Llegan a quien guardó el lugar y
-- activó Promociones, y se ven en la ficha durante 24 horas. Solo se crean
-- desde la función send-special-notice, que revisa Pro y el cupo.
create table if not exists public.special_notices (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 140),
  created_at timestamptz not null default now()
);
create index if not exists special_notices_negocio_idx on public.special_notices(negocio_id, created_at desc);
alter table public.special_notices enable row level security;
revoke all on public.special_notices from public, anon, authenticated;
grant select on public.special_notices to anon, authenticated;
grant select, insert, delete on public.special_notices to service_role;
drop policy if exists "special notices readable" on public.special_notices;
create policy "special notices readable" on public.special_notices for select to anon, authenticated
  using (true);

create or replace function public.special_notices_moderation()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  perform public.moderation_assert(new.body);
  return new;
end;
$$;
drop trigger if exists special_notices_moderation on public.special_notices;
create trigger special_notices_moderation before insert on public.special_notices
  for each row execute function public.special_notices_moderation();

-- Platillo destacado: nombre canónico del platillo que la ficha marca como
-- recomendado. Solo con Pro; quitarlo siempre se puede.
alter table public.negocios add column if not exists featured_dish text
  check (featured_dish is null or char_length(featured_dish) between 1 and 120);

create or replace function public.negocios_featured_dish_requires_pro()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if new.featured_dish is not null and new.featured_dish is distinct from old.featured_dish
     and not public.has_pro(new.owner_id) then
    raise exception 'PRO_REQUIRED' using errcode = 'P0001', hint = 'El platillo destacado es parte de Pro.';
  end if;
  return new;
end;
$$;
drop trigger if exists negocios_featured_dish_requires_pro on public.negocios;
create trigger negocios_featured_dish_requires_pro before update of featured_dish on public.negocios
  for each row execute function public.negocios_featured_dish_requires_pro();

-- Estado de Pro para el dueño: hasta cuándo y cuántos avisos le quedan este
-- mes (mes calendario de la Ciudad de México).
create or replace function public.business_pro_status(target uuid)
returns table (pro_until timestamptz, notices_left integer)
language plpgsql stable security definer set search_path = public
as $$
declare
  month_start timestamptz := date_trunc('month', now() at time zone 'America/Mexico_City') at time zone 'America/Mexico_City';
begin
  if not exists (select 1 from public.negocios n where n.id = target and n.owner_id = auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query select
    (select p.expires_at from public.business_plans p where p.user_id = auth.uid() and p.expires_at > now()),
    greatest(0, 8 - (select count(*)::integer from public.special_notices s where s.negocio_id = target and s.created_at >= month_start));
end;
$$;
revoke all on function public.business_pro_status(uuid) from public, anon;
grant execute on function public.business_pro_status(uuid) to authenticated;

-- Cuándo hay más interés: guardados y «me gusta» de los últimos 90 días por
-- día de la semana y hora (Ciudad de México). Solo totales, nunca quién.
create or replace function public.business_peak_times(target uuid)
returns table (weekday integer, hour_of_day integer, signals bigint)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.negocios n where n.id = target and n.owner_id = auth.uid())
     or not public.has_pro(auth.uid()) then
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
revoke all on function public.business_peak_times(uuid) from public, anon;
grant execute on function public.business_peak_times(uuid) to authenticated;

-- Lo que Pro agrega a la ficha pública: el platillo destacado (solo mientras
-- el dueño tenga Pro) y el aviso especial de las últimas 24 horas.
create or replace function public.patio_highlights(target uuid)
returns table (featured_dish text, notice_body text, notice_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select
    (select n.featured_dish from public.negocios n where n.id = target and public.has_pro(n.owner_id)),
    s.body, s.created_at
  from (select 1) as one
  left join lateral (
    select body, created_at from public.special_notices
    where negocio_id = target and created_at > now() - interval '24 hours'
    order by created_at desc limit 1
  ) s on true;
$$;
grant execute on function public.patio_highlights(uuid) to anon, authenticated;
