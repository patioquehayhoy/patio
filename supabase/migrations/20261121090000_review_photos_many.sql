-- Varias fotos por reseña (2026-11-21). Jev (docs/research/
-- jev-fotos-por-resena-2026-11-21.json): clientes y negocios prefieren varias
-- por visita a una sola; los clientes quieren que decir el platillo sea
-- opcional y los negocios lo quieren marcado. Queda: hasta 5 fotos por reseña,
-- cada una con su platillo opcional; en el menú solo salen las que lo tienen.
--
-- Cada foto es una fila de `review_photos`. Las columnas `reviews.foto_*`
-- quedan solo para versiones viejas de la app; esta ya no las lee ni escribe.

create table if not exists public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  negocio_id uuid not null,
  sort_order smallint not null default 0 check (sort_order between 0 and 4),
  url text not null check (char_length(url) <= 600),
  platillo text check (platillo is null or char_length(platillo) between 1 and 120),
  nota text check (nota is null or char_length(nota) between 1 and 140),
  hash text check (hash is null or hash ~ '^([0-9a-f]{2}){10,50}$'),
  created_at timestamptz not null default now(),
  -- Solo fotos de la carpeta de quien reseña.
  constraint review_photos_url_own check (
    position('/storage/v1/object/public/review-photos/' || user_id::text || '/' in url) > 0
  )
);

create index if not exists review_photos_review_idx on public.review_photos (review_id, sort_order);
create index if not exists review_photos_negocio_idx on public.review_photos (negocio_id, created_at desc);
create index if not exists review_photos_user_idx on public.review_photos (user_id, created_at desc);

-- Lo que ya había: la foto única de cada reseña pasa a ser su primera foto.
insert into public.review_photos (review_id, user_id, negocio_id, sort_order, url, platillo, nota, hash, created_at)
select r.id, r.user_id, r.negocio_id, 0, r.foto_url, r.foto_platillo, r.foto_nota, r.foto_hash, r.created_at
from public.reviews r
where r.foto_url is not null
  and position('/storage/v1/object/public/review-photos/' || r.user_id::text || '/' in r.foto_url) > 0
  and not exists (select 1 from public.review_photos p where p.review_id = r.id);

alter table public.review_photos enable row level security;

-- Se ven las fotos de las reseñas que se ven (publicadas, las tuyas, sin
-- autores bloqueados): la política de `reviews` decide.
drop policy if exists "review photos follow their review" on public.review_photos;
create policy "review photos follow their review" on public.review_photos for select
using (exists (select 1 from public.reviews r where r.id = review_id));

-- Agregar fotos solo a una reseña tuya.
drop policy if exists "reviewers add photos to own review" on public.review_photos;
create policy "reviewers add photos to own review" on public.review_photos for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.reviews r
    where r.id = review_id and r.user_id = auth.uid() and r.negocio_id = review_photos.negocio_id
  )
);

grant select on public.review_photos to anon, authenticated;
grant insert on public.review_photos to authenticated;

-- Hasta 5 por reseña y la frase pasa por la moderación de siempre.
create or replace function public.review_photos_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if (select count(*) from public.review_photos where review_id = new.review_id) >= 5 then
      raise exception 'too many photos';
    end if;
    if new.nota is not null then perform public.moderation_assert(new.nota); end if;
  elsif new.nota is distinct from old.nota and new.nota is not null then
    perform public.moderation_assert(new.nota);
  end if;
  return new;
end;
$$;
revoke all on function public.review_photos_guard() from public, anon, authenticated;
drop trigger if exists review_photos_guard on public.review_photos;
create trigger review_photos_guard before insert or update on public.review_photos
for each row execute function public.review_photos_guard();

-- Publicar la reseña y sus fotos juntas: o sale todo o no sale nada. Corre
-- como quien publica (las políticas de `reviews` y de `review_photos` aplican).
create or replace function public.publish_review(
  target_negocio_id uuid,
  review_stars integer,
  review_reasons text[],
  review_note text,
  review_photos jsonb default '[]'::jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  new_id uuid;
begin
  if jsonb_typeof(coalesce(review_photos, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(review_photos, '[]'::jsonb)) > 5 then
    raise exception 'too many photos';
  end if;

  insert into public.reviews (user_id, negocio_id, stars, reasons, note)
  values (auth.uid(), target_negocio_id, review_stars::smallint, coalesce(review_reasons, '{}'), nullif(trim(coalesce(review_note, '')), ''))
  returning id into new_id;

  insert into public.review_photos (review_id, user_id, negocio_id, sort_order, url, platillo, hash)
  select new_id, auth.uid(), target_negocio_id, (item.ord - 1)::smallint,
    item.value ->> 'url',
    nullif(left(trim(coalesce(item.value ->> 'dish', '')), 120), ''),
    nullif(item.value ->> 'hash', '')
  from jsonb_array_elements(coalesce(review_photos, '[]'::jsonb)) with ordinality as item(value, ord);

  return new_id;
end;
$$;

revoke all on function public.publish_review(uuid, integer, text[], text, jsonb) from public, anon;
grant execute on function public.publish_review(uuid, integer, text[], text, jsonb) to authenticated;

-- Corregir de qué platillo es una foto (y su frase). Solo quien la subió.
create or replace function public.update_my_review_photo_item(
  target_photo_id uuid,
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

  update public.review_photos
  set platillo = clean_dish,
      nota = clean_note
  where id = target_photo_id
    and user_id = auth.uid();

  if not found then raise exception 'not authorized'; end if;
end;
$$;

revoke all on function public.update_my_review_photo_item(uuid, text, text) from public, anon;
grant execute on function public.update_my_review_photo_item(uuid, text, text) to authenticated;

-- Quitar una foto; la reseña y las demás fotos se quedan. El archivo lo borra
-- la app (storage ya deja borrar solo lo de tu carpeta).
create or replace function public.remove_my_review_photo_item(target_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.review_photos
  where id = target_photo_id
    and user_id = auth.uid();

  if not found then raise exception 'not authorized'; end if;
end;
$$;

revoke all on function public.remove_my_review_photo_item(uuid) from public, anon;
grant execute on function public.remove_my_review_photo_item(uuid) to authenticated;
