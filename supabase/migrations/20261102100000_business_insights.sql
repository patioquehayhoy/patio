-- Tablero del negocio en Actividad: cuántas personas lo guardaron y cuántos
-- «me gusta» tienen sus platillos, en total y en los últimos 7 días. Solo el
-- dueño lo ve. Como los guardados de Instagram, nunca dice quién guardó.
create or replace function public.business_insights(target uuid)
returns table (saves bigint, saves_week bigint, dish_likes bigint, dish_likes_week bigint)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.negocios n where n.id = target and n.owner_id = auth.uid()) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  return query select
    (select count(*) from public.saved_patios s where s.negocio_id = target),
    (select count(*) from public.saved_patios s where s.negocio_id = target and s.created_at > now() - interval '7 days'),
    (select count(*) from public.dish_likes d where d.negocio_id = target),
    (select count(*) from public.dish_likes d where d.negocio_id = target and d.created_at > now() - interval '7 days');
end;
$$;
revoke all on function public.business_insights(uuid) from public, anon;
grant execute on function public.business_insights(uuid) to authenticated;

-- «Me gusta» por platillo (forma canónica, como se guardan). Público, igual
-- que los «me gusta» de las fotos: se muestra junto a cada platillo.
create or replace function public.business_dish_like_counts(target uuid)
returns table (dish_name text, display_name text, likes bigint)
language sql
stable
security definer
set search_path = public
as $$
  select d.dish_name, max(d.dish_name_display), count(*)
  from public.dish_likes d
  where d.negocio_id = target
  group by d.dish_name
  order by count(*) desc, d.dish_name;
$$;
grant execute on function public.business_dish_like_counts(uuid) to anon, authenticated;
