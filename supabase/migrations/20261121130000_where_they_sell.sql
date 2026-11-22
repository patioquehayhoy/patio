-- Dónde vende cada negocio (2026-11-21): un solo concepto para sucursales,
-- tianguis o sobre ruedas y cocinas sin local (solo a domicilio).
--
-- · modalidad: 'local' (te encuentran en su dirección y, si tiene, en sus otras
--   sucursales), 'itinerante' (tianguis, mercado sobre ruedas, food truck: un
--   lugar distinto según el día) o 'domicilio' (sin local: piden por WhatsApp o
--   llamada; en el mapa sale su zona, nunca su calle).
-- · negocio_puntos: los otros lugares. Sin días = otra sucursal (abre con el
--   horario del negocio). Con días = dónde está esos días (tianguis).
-- · pedidos_hasta: hora límite para pedir («Pedidos hasta las 11 am»).

alter table public.negocios add column if not exists modalidad text not null default 'local';
alter table public.negocios drop constraint if exists negocios_modalidad_check;
alter table public.negocios add constraint negocios_modalidad_check check (modalidad in ('local', 'itinerante', 'domicilio'));

alter table public.negocios add column if not exists pedidos_hasta text;
alter table public.negocios drop constraint if exists negocios_pedidos_hasta_check;
alter table public.negocios add constraint negocios_pedidos_hasta_check check (pedidos_hasta is null or pedidos_hasta ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

grant select (modalidad, pedidos_hasta) on public.negocios to anon, authenticated;

-- Solo a domicilio: la ubicación que se guarda es la de su zona (redondeada a
-- unos 500 m), para que nadie llegue a la casa de quien cocina.
create or replace function public.negocios_domicilio_zone() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.modalidad = 'domicilio' and new.latitude is not null and new.longitude is not null then
    new.latitude := round(new.latitude * 200) / 200;
    new.longitude := round(new.longitude * 200) / 200;
  end if;
  return new;
end;
$$;
revoke all on function public.negocios_domicilio_zone() from public, anon, authenticated;
drop trigger if exists negocios_domicilio_zone on public.negocios;
create trigger negocios_domicilio_zone before insert or update of modalidad, latitude, longitude on public.negocios
for each row execute function public.negocios_domicilio_zone();
-- Quien ya estuviera así (no debería haber nadie todavía).
update public.negocios set latitude = latitude where modalidad = 'domicilio';

create table if not exists public.negocio_puntos (
  id uuid primary key default gen_random_uuid(),
  negocio_id uuid not null references public.negocios (id) on delete cascade,
  nombre text not null check (char_length(btrim(nombre)) between 1 and 60),
  direccion text check (direccion is null or char_length(direccion) <= 200),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  dias smallint[] check (dias is null or (cardinality(dias) between 1 and 7 and dias <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[])),
  orden smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists negocio_puntos_negocio_idx on public.negocio_puntos (negocio_id, orden);

alter table public.negocio_puntos enable row level security;
revoke all on public.negocio_puntos from public, anon, authenticated;
grant select on public.negocio_puntos to anon, authenticated;
grant insert, update, delete on public.negocio_puntos to authenticated;

drop policy if exists "puntos of published places readable" on public.negocio_puntos;
create policy "puntos of published places readable" on public.negocio_puntos for select to anon, authenticated
using (exists (
  select 1 from public.negocios n
  where n.id = negocio_id and n.owner_id is not null
    and length(trim(n.nombre)) > 0 and n.nombre <> 'Mi Fondita'
));

drop policy if exists "owners manage their puntos" on public.negocio_puntos;
create policy "owners manage their puntos" on public.negocio_puntos for all to authenticated
using (exists (select 1 from public.negocios n where n.id = negocio_id and n.owner_id = auth.uid()))
with check (exists (select 1 from public.negocios n where n.id = negocio_id and n.owner_id = auth.uid()));

-- Hasta 12 lugares por negocio; nombre y dirección pasan por la moderación.
create or replace function public.negocio_puntos_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.negocio_puntos where negocio_id = new.negocio_id) >= 12 then
    raise exception 'too many places';
  end if;
  perform public.moderation_assert(new.nombre, new.direccion);
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.negocio_puntos_guard() from public, anon, authenticated;
drop trigger if exists negocio_puntos_guard on public.negocio_puntos;
create trigger negocio_puntos_guard before insert or update on public.negocio_puntos
for each row execute function public.negocio_puntos_guard();
