-- Aviso al escribir el nombre, antes de guardar (docs/SUCURSALES_Y_EQUIPO_2026-11-23.md §4.3).
-- El servidor sigue rechazando al guardar (negocios_nombre_no_reservado);
-- esto solo deja que la app lo diga en el paso del nombre.
create or replace function public.nombre_reservado(p_nombre text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.marcas_reservadas r
    where r.nombre_normalizado = public.nombre_normalizado(p_nombre)
  );
$$;
revoke all on function public.nombre_reservado(text) from public;
grant execute on function public.nombre_reservado(text) to anon, authenticated;
