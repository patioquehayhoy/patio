-- Ritmos del negocio, precios al día y «Recién salido» (2026-11-21).
--
-- 1. Ritmo del menú: 'diario' (cambia cada día: fondas, comida corrida) o
--    'carta' (casi siempre es el mismo: tacos, postres, café). Vacío = se deduce
--    del giro en la app. Con 'carta' no hay aviso diario: hay uno al mes para
--    revisar precios.
-- 2. Precios al día: la carta guarda cuándo se revisaron sus precios (al
--    cambiarla o al confirmar «Siguen igual»). La ficha dice «Precios de
--    noviembre»: el cliente sabe qué tan al día están.
-- 3. «Recién salido: Bolillo.» (tandas): aviso de operación con el nombre de un
--    platillo de su menú; hasta 3 al día, aparte del aviso del día.

alter table public.negocios add column if not exists ritmo text;
alter table public.negocios drop constraint if exists negocios_ritmo_check;
alter table public.negocios add constraint negocios_ritmo_check check (ritmo is null or ritmo in ('diario', 'carta'));
grant select (ritmo) on public.negocios to anon, authenticated;

alter table public.cartas add column if not exists precios_al timestamptz not null default now();

create or replace function public.cartas_precios_al() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.secciones is distinct from old.secciones then
    new.precios_al := now();
  end if;
  return new;
end;
$$;
revoke all on function public.cartas_precios_al() from public, anon, authenticated;
drop trigger if exists cartas_precios_al on public.cartas;
create trigger cartas_precios_al before insert or update on public.cartas
for each row execute function public.cartas_precios_al();

-- «Siguen igual»: el dueño confirma que sus precios no cambiaron.
create or replace function public.confirm_carta_prices()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.cartas c
  set precios_al = now()
  from public.negocios n
  where n.id = c.negocio_id and n.owner_id = auth.uid();
  if not found then raise exception 'no carta'; end if;
end;
$$;
revoke all on function public.confirm_carta_prices() from public, anon;
grant execute on function public.confirm_carta_prices() to authenticated;

alter table public.special_notices drop constraint if exists special_notices_kind_check;
alter table public.special_notices add constraint special_notices_kind_check check (kind in ('promo', 'operation', 'fresh'));
