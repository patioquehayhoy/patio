-- Fotos de clientes (2026-11-15): quien reseña puede subir una foto y decir
-- de qué platillo es. En la ficha sale al mantener presionado ese platillo,
-- marcada como de un cliente. En Google Maps el 82 % de las fotos de
-- platillos las suben clientes (docs/research/MENUS_REALES_2026-11-15.md).
-- Bucket público `review-photos`, en la carpeta de quien reseña; la columna
-- solo acepta fotos de esa carpeta.

alter table public.reviews add column if not exists foto_url text;
alter table public.reviews add column if not exists foto_platillo text;

alter table public.reviews drop constraint if exists reviews_foto_url_own;
alter table public.reviews add constraint reviews_foto_url_own check (
  foto_url is null or (
    char_length(foto_url) <= 600
    and position('/storage/v1/object/public/review-photos/' || user_id::text || '/' in foto_url) > 0
  )
);

alter table public.reviews drop constraint if exists reviews_foto_platillo_len;
alter table public.reviews add constraint reviews_foto_platillo_len check (
  foto_platillo is null or char_length(foto_platillo) between 1 and 120
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('review-photos', 'review-photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "review photos public" on storage.objects;
create policy "review photos public" on storage.objects for select
using (bucket_id = 'review-photos');

drop policy if exists "reviewers upload review photo" on storage.objects;
create policy "reviewers upload review photo" on storage.objects for insert to authenticated
with check (bucket_id = 'review-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "reviewers delete review photo" on storage.objects;
create policy "reviewers delete review photo" on storage.objects for delete to authenticated
using (bucket_id = 'review-photos' and (storage.foldername(name))[1] = auth.uid()::text);
