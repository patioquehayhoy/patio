alter table public.fonditas add column if not exists logo_url text;
insert into storage.buckets (id, name, public)
values ('business-logos', 'business-logos', true)
on conflict (id) do update set public = true;
create policy "business logos public" on storage.objects for select
using (bucket_id = 'business-logos');
create policy "business owners upload logo" on storage.objects for insert
with check (bucket_id = 'business-logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "business owners update logo" on storage.objects for update
using (bucket_id = 'business-logos' and (storage.foldername(name))[1] = auth.uid()::text);
