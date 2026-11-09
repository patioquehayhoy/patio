-- Foto del lugar (alta y «Editar mi negocio», 2026-11-09): la ve la gente
-- arriba de la ficha. Vive en el bucket público `place-photos`, en la carpeta
-- del dueño; la columna solo acepta fotos subidas a esa carpeta.

alter table public.negocios add column if not exists foto_url text
  check (foto_url is null or char_length(foto_url) <= 600);

-- La lectura pública de `negocios` va por columnas (20261009130000): la
-- columna nueva necesita su propio permiso.
grant select (foto_url) on public.negocios to anon, authenticated;

create or replace function public.negocios_photo_is_own()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.foto_url is null then return new; end if;
  if tg_op = 'UPDATE' and new.foto_url is not distinct from old.foto_url then return new; end if;
  if new.owner_id is null
     or position('/storage/v1/object/public/place-photos/' || new.owner_id::text || '/' in new.foto_url) = 0 then
    raise exception 'La foto del lugar se sube desde Patio.' using errcode = '22023';
  end if;
  return new;
end $$;
revoke all on function public.negocios_photo_is_own() from public, anon, authenticated;

drop trigger if exists negocios_photo_is_own on public.negocios;
create trigger negocios_photo_is_own before insert or update of foto_url on public.negocios
for each row execute function public.negocios_photo_is_own();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('place-photos', 'place-photos', true, 5242880, array['image/jpeg'])
on conflict (id) do update set public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "place photos public" on storage.objects;
create policy "place photos public" on storage.objects for select
using (bucket_id = 'place-photos');

drop policy if exists "owners upload place photo" on storage.objects;
create policy "owners upload place photo" on storage.objects for insert to authenticated
with check (bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owners update place photo" on storage.objects;
create policy "owners update place photo" on storage.objects for update to authenticated
using (bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "owners delete place photo" on storage.objects;
create policy "owners delete place photo" on storage.objects for delete to authenticated
using (bucket_id = 'place-photos' and (storage.foldername(name))[1] = auth.uid()::text);
