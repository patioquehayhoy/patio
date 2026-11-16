-- Fotos de clientes, segunda parte (2026-11-15):
-- 1. Una frase corta del platillo junto a la foto («La salsa verde pica en
--    serio»), que sale como pie de la foto en la ficha. Pasa por la misma
--    moderación que la nota de la reseña.
-- 2. Quien subió la foto puede corregirla después: cambiar de qué platillo
--    es (subió la de lengua y dijo suadero), cambiar la frase o quitar la
--    foto. La reseña en sí (estrellas y nota) sigue sin poder reescribirse.

alter table public.reviews add column if not exists foto_nota text;

alter table public.reviews drop constraint if exists reviews_foto_nota_len;
alter table public.reviews add constraint reviews_foto_nota_len check (
  foto_nota is null or char_length(foto_nota) between 1 and 140
);

create or replace function public.moderate_reviews() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.moderation_assert(new.note, new.business_reply, new.foto_nota);
  else
    if new.note is distinct from old.note then perform public.moderation_assert(new.note); end if;
    if new.business_reply is distinct from old.business_reply then perform public.moderation_assert(new.business_reply); end if;
    if new.foto_nota is distinct from old.foto_nota then perform public.moderation_assert(new.foto_nota); end if;
  end if;
  return new;
end;
$$;

-- Corregir de qué platillo es la foto y su frase. Solo quien la subió.
create or replace function public.update_my_review_photo(
  target_review_id uuid,
  dish text,
  photo_note text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_dish text := nullif(trim(coalesce(dish, '')), '');
  clean_note text := nullif(trim(coalesce(photo_note, '')), '');
begin
  if clean_dish is not null and char_length(clean_dish) > 120 then raise exception 'invalid dish'; end if;
  if clean_note is not null and char_length(clean_note) > 140 then raise exception 'invalid note'; end if;

  update public.reviews
  set foto_platillo = clean_dish,
      foto_nota = clean_note
  where id = target_review_id
    and user_id = auth.uid()
    and foto_url is not null;

  if not found then raise exception 'not authorized'; end if;
end;
$$;

revoke all on function public.update_my_review_photo(uuid, text, text) from public, anon;
grant execute on function public.update_my_review_photo(uuid, text, text) to authenticated;

-- Quitar la foto de la reseña. El archivo lo borra la app (la política de
-- storage ya deja borrar solo lo de tu carpeta).
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
      foto_nota = null
  where id = target_review_id
    and user_id = auth.uid();

  if not found then raise exception 'not authorized'; end if;
end;
$$;

revoke all on function public.remove_my_review_photo(uuid) from public, anon;
grant execute on function public.remove_my_review_photo(uuid) to authenticated;
