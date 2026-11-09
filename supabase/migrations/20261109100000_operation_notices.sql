-- Avisos de operación (gratis, 2026-11-09): «Hoy abrimos a las 8 pm.»,
-- «Hoy cerramos a las 4 pm.», «Hoy no abrimos.», «Se acabó lo de hoy.».
-- Uno al día por lugar. El texto lo arma el servidor (send-operation-notice):
-- nadie escribe texto libre, así que no hay nada que moderar ni cómo hacer spam.
-- Viven junto a los avisos especiales de Pro, con su tipo.

alter table public.special_notices add column if not exists kind text not null default 'promo'
  check (kind in ('promo', 'operation'));
create index if not exists special_notices_kind_idx on public.special_notices(negocio_id, kind, created_at desc);

-- El cupo de 8 avisos de Pro cuenta solo promociones.
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
    greatest(0, 8 - (select count(*)::integer from public.special_notices s
      where s.negocio_id = target and s.kind = 'promo' and s.created_at >= month_start));
end;
$$;
revoke all on function public.business_pro_status(uuid) from public, anon;
grant execute on function public.business_pro_status(uuid) to authenticated;

-- La ficha: la promoción dura 24 horas; el aviso de operación, solo el día en
-- que se dio (Ciudad de México). Se agrega el tipo para elegir su ícono.
drop function if exists public.patio_highlights(uuid);
create function public.patio_highlights(target uuid)
returns table (featured_dish text, notice_body text, notice_at timestamptz, notice_kind text)
language sql stable security definer set search_path = public
as $$
  select
    (select n.featured_dish from public.negocios n where n.id = target and public.has_pro(n.owner_id)),
    s.body, s.created_at, s.kind
  from (select 1) as one
  left join lateral (
    select body, created_at, kind from public.special_notices
    where negocio_id = target
      and ((kind = 'promo' and created_at > now() - interval '24 hours')
        or (kind = 'operation'
          and (created_at at time zone 'America/Mexico_City')::date = (now() at time zone 'America/Mexico_City')::date))
    order by created_at desc limit 1
  ) s on true;
$$;
grant execute on function public.patio_highlights(uuid) to anon, authenticated;
