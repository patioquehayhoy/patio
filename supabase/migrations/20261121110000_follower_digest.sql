-- Avisos de la red (2026-11-21). Jev (docs/research/jev-avisos-red-2026-11-21.json):
-- quien sigue muchos lugares quiere UN resumen al día y, aparte, al momento
-- solo los pocos lugares que marca «Cada vez» (50 % + 41 % solo resumen; un
-- aviso por publicación 4 %). Con 5 avisos de comida al día, apagaría todo
-- (2.9 de 4). Los negocios prefieren salir en el resumen de todos y al
-- momento con sus «Cada vez» (69 %) que un aviso a todos limitado a los 3
-- primeros que publican (25 %).
--
-- Reglas:
-- · Cada lugar que sigues está en uno de tres modos, como la campana de
--   YouTube: «Cada vez» (al momento), «En tu resumen» o «Ninguno».
-- · Los primeros 3 lugares que sigues quedan en «Cada vez» (son tus lugares de
--   siempre: quien sigue pocos quiere enterarse de todo); los siguientes, en
--   «En tu resumen». Se cambia lugar por lugar.
-- · Al momento (menú, «Hoy no abrimos», promociones): solo «Cada vez».
-- · «En tu resumen»: un aviso a las 11:30 (60 % frente a 12:30 y 1:30) con
--   quién publicó, quién tiene promoción y quién no abre hoy; a las 17:30, uno
--   más solo si hubo algo nuevo después del de mediodía.

alter table public.patio_follows add column if not exists every_time boolean not null default false;

create index if not exists patio_follows_user_enabled_idx on public.patio_follows (user_id) where notifications_enabled;

-- Quien ya seguía 3 lugares o menos: esos quedan en «Cada vez» (antes le
-- llegaba todo al momento y así sigue).
update public.patio_follows f set every_time = true
where f.notifications_enabled and not f.every_time
  and (select count(*) from public.patio_follows g where g.user_id = f.user_id and g.notifications_enabled) <= 3;

-- Los primeros 3 lugares que sigues entran en «Cada vez».
create or replace function public.patio_follows_first_three() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.notifications_enabled and not new.every_time
     and (select count(*) from public.patio_follows g where g.user_id = new.user_id and g.notifications_enabled) < 3 then
    new.every_time := true;
  end if;
  return new;
end;
$$;
revoke all on function public.patio_follows_first_three() from public, anon, authenticated;
drop trigger if exists patio_follows_first_three on public.patio_follows;
create trigger patio_follows_first_three before insert on public.patio_follows
for each row execute function public.patio_follows_first_three();

-- Quién recibe al momento lo de este lugar: solo «Cada vez».
create or replace function public.realtime_followers(target_negocio uuid)
returns table (user_id uuid)
language sql stable security definer set search_path = public
as $$
  select f.user_id
  from public.patio_follows f
  where f.negocio_id = target_negocio and f.notifications_enabled and f.every_time;
$$;
revoke all on function public.realtime_followers(uuid) from public, anon, authenticated;
grant execute on function public.realtime_followers(uuid) to service_role;

-- Lo que ya salió en un resumen hoy (para que el de la tarde no repita).
create table if not exists public.follower_digest_items (
  user_id uuid not null references auth.users (id) on delete cascade,
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('menu', 'promo', 'closed')),
  created_at timestamptz not null default now(),
  primary key (user_id, negocio_id, day, kind)
);
alter table public.follower_digest_items enable row level security;
revoke all on public.follower_digest_items from public, anon, authenticated;
grant select, insert, delete on public.follower_digest_items to service_role;

-- Lo que va en el resumen de cada persona: menús publicados hoy, promociones
-- de hoy y «Hoy no abrimos», de los lugares que sigue «En tu resumen», sin lo
-- que ya salió en un resumen hoy.
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
    select a.user_id, a.negocio_id, a.nombre, 'menu'::text as kind, m.created_at as at, a.horario_semanal, null::text as body
    from audience a
    join public.menus m on m.negocio_id = a.negocio_id
    cross join today t
    where m.fecha = t.d
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

-- pg_cron llama a la función con el secreto de Vault (como el resumen del negocio).
create or replace function public.invoke_follower_digest(slot text)
returns bigint language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  base_url text;
  secret text;
begin
  if slot not in ('mediodia', 'tarde') then return null; end if;
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

do $$
begin
  if not exists (select 1 from pg_available_extensions where name = 'pg_cron')
     or not exists (select 1 from pg_available_extensions where name = 'pg_net') then
    raise notice 'pg_cron o pg_net no disponibles: el resumen de seguidores no se programó';
    return;
  end if;
  create extension if not exists pg_cron;
  perform cron.unschedule(jobname) from cron.job where jobname in ('patio-seguidores-mediodia', 'patio-seguidores-tarde');
  -- 17:30 y 23:30 UTC = 11:30 y 17:30 en la Ciudad de México (UTC−6 todo el año).
  perform cron.schedule('patio-seguidores-mediodia', '30 17 * * *', $job$ select public.invoke_follower_digest('mediodia') $job$);
  perform cron.schedule('patio-seguidores-tarde', '30 23 * * *', $job$ select public.invoke_follower_digest('tarde') $job$);
end $$;
