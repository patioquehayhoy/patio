-- Vista previa instantánea de las fotos de clientes (2026-11-15): al subir la
-- foto, el teléfono calcula su ThumbHash (~25 bytes de colores y forma) y se
-- guarda en hexadecimal junto a la reseña. La ficha lo pinta difuminado al
-- instante mientras baja la foto. Ver lib/photo-hash.ts.

alter table public.reviews add column if not exists foto_hash text;

alter table public.reviews drop constraint if exists reviews_foto_hash_format;
alter table public.reviews add constraint reviews_foto_hash_format check (
  foto_hash is null or foto_hash ~ '^([0-9a-f]{2}){10,50}$'
);

-- Quitar la foto también quita su vista previa.
create or replace function public.remove_my_review_photo(target_review_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reviews
  set foto_url = null,
      foto_platillo = null,
      foto_nota = null,
      foto_hash = null
  where id = target_review_id
    and user_id = auth.uid();

  if not found then raise exception 'not authorized'; end if;
end;
$$;

revoke all on function public.remove_my_review_photo(uuid) from public, anon;
grant execute on function public.remove_my_review_photo(uuid) to authenticated;
