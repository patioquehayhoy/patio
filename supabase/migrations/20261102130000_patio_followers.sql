-- Seguir, como Instagram (decisión de Parco, 2026-11-02): seguir un lugar es
-- la fila de saved_patios. Quién sigue a un lugar es público, igual que los
-- seguidores de una cuenta en Instagram; también los lugares que sigue una
-- persona, salvo que su perfil sea privado y no la sigas.

create or replace function public.patio_followers(target uuid)
returns table (user_id uuid, display_name text, handle text, avatar_url text)
language sql stable security definer set search_path = public
as $$
  select sp.user_id, btrim(up.display_name), up.handle, up.avatar_url
  from public.saved_patios sp
  join public.user_profiles up on up.user_id = sp.user_id
  where sp.negocio_id = target
    and coalesce(btrim(up.display_name), '') <> ''
    and not exists (
      select 1 from public.blocked_users b
      where (b.blocker_id = auth.uid() and b.blocked_user_id = sp.user_id)
         or (b.blocker_id = sp.user_id and b.blocked_user_id = auth.uid())
    )
  order by sp.created_at desc
  limit 500;
$$;
grant execute on function public.patio_followers(uuid) to anon, authenticated;

create or replace function public.profile_followed_places(target uuid)
returns table (negocio_id uuid, nombre text)
language sql stable security definer set search_path = public
as $$
  select n.id, n.nombre
  from public.saved_patios sp
  join public.negocios n on n.id = sp.negocio_id
  where sp.user_id = target
    and public.can_view_profile_content(target)
    and coalesce(btrim(n.nombre), '') <> ''
  order by sp.created_at desc
  limit 500;
$$;
grant execute on function public.profile_followed_places(uuid) to anon, authenticated;

-- «Siguiendo» cuenta personas y lugares, como Instagram cuenta todas las cuentas.
create or replace function public.profile_stats(target uuid)
returns table (reviews bigint, likes bigint, followers bigint, following bigint)
language sql
stable
security definer
set search_path = public
as $$
  select
    (select count(*) from public.reviews r where r.user_id = target and r.status = 'published'),
    (select count(*) from public.review_likes l join public.reviews r on r.id = l.review_id
      where r.user_id = target and r.status = 'published' and l.user_id <> target),
    (select count(*) from public.profile_follows where followed_id = target and status = 'accepted'),
    (select count(*) from public.profile_follows where follower_id = target and status = 'accepted')
      + (select count(*) from public.saved_patios where user_id = target);
$$;
grant execute on function public.profile_stats(uuid) to anon, authenticated;
