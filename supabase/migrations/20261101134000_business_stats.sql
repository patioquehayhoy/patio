-- Números públicos del negocio: cuántas personas lo guardaron (en Patio, guardar
-- es seguir), cuántos «me gusta» tienen sus platillos y cuántas reseñas tiene.
-- Solo totales: quién guardó o dio «me gusta» sigue siendo privado.
create or replace function public.business_stats(target uuid)
returns table (saves bigint, dish_likes bigint, reviews bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.saved_patios s where s.negocio_id = target),
    (select count(*) from public.dish_likes d where d.negocio_id = target),
    (select count(*) from public.reviews r where r.negocio_id = target and r.status = 'published');
$$;
grant execute on function public.business_stats(uuid) to anon, authenticated;
