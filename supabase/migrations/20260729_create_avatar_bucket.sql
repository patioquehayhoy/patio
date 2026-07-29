insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "avatar images public"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "users upload own avatar"
on storage.objects for insert
with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "users update own avatar"
on storage.objects for update
using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
