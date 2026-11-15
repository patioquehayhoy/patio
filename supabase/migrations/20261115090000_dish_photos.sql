-- Fotos de platillos (2026-11-15): opcionales. Las sube el negocio desde el
-- editor del menú y la gente las ve en la ficha manteniendo presionado el
-- platillo. Viven en el bucket público `dish-photos`, en la carpeta del dueño;
-- la URL va dentro del menú (jsonb) y la app solo muestra fotos de este
-- bucket (lib/dish-photo-url.ts), nunca una dirección de afuera.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('dish-photos', 'dish-photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "dish photos public" on storage.objects;
create policy "dish photos public" on storage.objects for select
using (bucket_id = 'dish-photos');

drop policy if exists "owners upload dish photo" on storage.objects;
create policy "owners upload dish photo" on storage.objects for insert to authenticated
with check (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owners update dish photo" on storage.objects;
create policy "owners update dish photo" on storage.objects for update to authenticated
using (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owners delete dish photo" on storage.objects;
create policy "owners delete dish photo" on storage.objects for delete to authenticated
using (bucket_id = 'dish-photos' and (storage.foldername(name))[1] = auth.uid()::text);
