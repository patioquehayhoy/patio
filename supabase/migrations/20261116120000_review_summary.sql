-- Resumen de reseñas de un lugar calculado en el servidor (2026-11-16): la
-- ficha baja las reseñas de 20 en 20 («Ver más»), así que el promedio, el
-- total y cuántas hay de cada estrella ya no pueden salir de lo que el
-- teléfono tiene cargado. Cuenta lo mismo que la lista muestra: reseñas
-- publicadas de personas con nombre público (o las tuyas). Corre con los
-- permisos de quien pregunta, así que los autores que bloqueaste no cuentan.

create or replace function public.review_summary(target_negocio uuid)
returns table (total bigint, average numeric, stars5 bigint, stars4 bigint, stars3 bigint, stars2 bigint, stars1 bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*),
    coalesce(round(avg(r.stars)::numeric, 2), 0),
    count(*) filter (where r.stars = 5),
    count(*) filter (where r.stars = 4),
    count(*) filter (where r.stars = 3),
    count(*) filter (where r.stars = 2),
    count(*) filter (where r.stars = 1)
  from public.reviews r
  where r.negocio_id = target_negocio
    and r.status = 'published'
    and (
      r.user_id = auth.uid()
      or exists (
        select 1 from public.user_profiles p
        where p.user_id = r.user_id and btrim(coalesce(p.display_name, '')) <> ''
      )
    );
$$;

revoke all on function public.review_summary(uuid) from public;
grant execute on function public.review_summary(uuid) to anon, authenticated;

-- Las páginas se piden por lugar, de la más nueva a la más vieja.
create index if not exists reviews_negocio_published_created_idx
  on public.reviews (negocio_id, created_at desc)
  where status = 'published';
