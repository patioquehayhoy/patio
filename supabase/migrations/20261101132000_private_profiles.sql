-- Perfil privado, como Instagram: nombre, foto y descripción se siguen
-- viendo (y las reseñas en cada lugar), pero las listas públicas y a quién
-- sigues solo las ven las personas que apruebas. Seguir una cuenta privada
-- envía una solicitud; al volver a público, las solicitudes se aceptan.

alter table public.profile_follows add column if not exists status text not null default 'accepted';
alter table public.profile_follows drop constraint if exists profile_follows_status_check;
alter table public.profile_follows add constraint profile_follows_status_check check (status in ('pending', 'accepted'));
alter table public.profile_follows add column if not exists notified_at timestamptz;
create index if not exists profile_follows_followed_idx on public.profile_follows (followed_id, status);

create or replace function public.can_view_profile_content(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target = auth.uid()
    or exists (select 1 from public.user_profiles p where p.user_id = target and p.visibility = 'public')
    or exists (
      select 1 from public.profile_follows f
      where f.follower_id = auth.uid() and f.followed_id = target and f.status = 'accepted'
    );
$$;
grant execute on function public.can_view_profile_content(uuid) to anon, authenticated;

-- Conteos visibles para todos, como Instagram, aunque la lista sea privada.
create or replace function public.profile_follow_counts(target uuid)
returns table (followers bigint, following bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.profile_follows where followed_id = target and status = 'accepted'),
    (select count(*) from public.profile_follows where follower_id = target and status = 'accepted');
$$;
grant execute on function public.profile_follow_counts(uuid) to anon, authenticated;

-- La identidad del perfil se ve siempre; lo que se protege es el contenido.
drop policy if exists "profiles readable when public or own" on public.user_profiles;
drop policy if exists "profiles readable" on public.user_profiles;
create policy "profiles readable" on public.user_profiles for select using (true);

-- Listas: «públicas» respetan la privacidad del perfil; las de enlace
-- («unlisted») las ve quien recibió el enlace, porque su dueño lo compartió.
drop policy if exists "collections readable when shared or own" on public.collections;
drop policy if exists "collections readable by audience" on public.collections;
create policy "collections readable by audience" on public.collections for select
using (
  auth.uid() = owner_id
  or visibility = 'unlisted'
  or (visibility = 'public' and public.can_view_profile_content(owner_id))
);

drop policy if exists "collection places readable with collection" on public.collection_places;
create policy "collection places readable with collection" on public.collection_places for select
using (exists (select 1 from public.collections c where c.id = collection_id));

-- Seguir: el servidor decide si queda aceptado o pendiente.
create or replace function public.prepare_profile_follow() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.status := case
    when exists (select 1 from public.user_profiles p where p.user_id = new.followed_id and p.visibility = 'private')
      then 'pending' else 'accepted' end;
  new.notified_at := null;
  new.created_at := now();
  return new;
end;
$$;
drop trigger if exists prepare_profile_follow on public.profile_follows;
create trigger prepare_profile_follow before insert on public.profile_follows
for each row execute function public.prepare_profile_follow();

-- Aceptar una solicitud solo cambia el estado; nadie cambia quién sigue a quién.
create or replace function public.pin_profile_follow() returns trigger
language plpgsql as $$
begin
  new.follower_id := old.follower_id;
  new.followed_id := old.followed_id;
  new.created_at := old.created_at;
  return new;
end;
$$;
drop trigger if exists pin_profile_follow on public.profile_follows;
create trigger pin_profile_follow before update on public.profile_follows
for each row execute function public.pin_profile_follow();

drop policy if exists "follows owned" on public.profile_follows;
drop policy if exists "follows readable" on public.profile_follows;
drop policy if exists "follows visible to their audience" on public.profile_follows;
create policy "follows visible to their audience" on public.profile_follows for select
using (
  auth.uid() = follower_id
  or auth.uid() = followed_id
  or (status = 'accepted' and public.can_view_profile_content(followed_id))
);

drop policy if exists "people follow for themselves" on public.profile_follows;
create policy "people follow for themselves" on public.profile_follows for insert to authenticated
with check (follower_id = auth.uid() and not public.is_blocked_by(followed_id, auth.uid()));

drop policy if exists "followed people accept requests" on public.profile_follows;
create policy "followed people accept requests" on public.profile_follows for update to authenticated
using (followed_id = auth.uid())
with check (followed_id = auth.uid() and status = 'accepted');

drop policy if exists "either side ends a follow" on public.profile_follows;
create policy "either side ends a follow" on public.profile_follows for delete to authenticated
using (auth.uid() = follower_id or auth.uid() = followed_id);

create or replace function public.accept_pending_follows_when_public() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.visibility = 'private' and new.visibility = 'public' then
    update public.profile_follows set status = 'accepted'
    where followed_id = new.user_id and status = 'pending';
  end if;
  return new;
end;
$$;
drop trigger if exists accept_pending_follows_when_public on public.user_profiles;
create trigger accept_pending_follows_when_public after update of visibility on public.user_profiles
for each row execute function public.accept_pending_follows_when_public();
