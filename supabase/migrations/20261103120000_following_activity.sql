-- «De quienes sigues»: lo reciente de las personas que sigues — a qué lugar
-- empezaron a seguir, qué lista pública armaron y qué reseña dejaron. Solo
-- personas que sigues con solicitud aceptada, sin bloqueos en ningún sentido,
-- de los últimos 14 días y con respeto a la privacidad de cada perfil.
create or replace function public.following_activity()
returns table (
  kind text, actor_id uuid, display_name text, avatar_url text,
  negocio_id uuid, negocio_nombre text, collection_id uuid, collection_title text,
  stars smallint, happened_at timestamptz
)
language sql stable security definer set search_path = public
as $$
  with people as (
    select f.followed_id as id, btrim(up.display_name) as name, up.avatar_url
    from public.profile_follows f
    join public.user_profiles up on up.user_id = f.followed_id
    where f.follower_id = auth.uid() and f.status = 'accepted'
      and coalesce(btrim(up.display_name), '') <> ''
      and public.can_view_profile_content(f.followed_id)
      and not exists (
        select 1 from public.blocked_users b
        where (b.blocker_id = auth.uid() and b.blocked_user_id = f.followed_id)
           or (b.blocker_id = f.followed_id and b.blocked_user_id = auth.uid())
      )
  ), events as (
    select 'follow'::text, p.id, p.name, p.avatar_url, n.id, n.nombre, null::uuid, null::text, null::smallint, sp.created_at
    from people p
    join public.saved_patios sp on sp.user_id = p.id
    join public.negocios n on n.id = sp.negocio_id
    where sp.created_at > now() - interval '14 days' and coalesce(btrim(n.nombre), '') <> ''
    union all
    select 'list', p.id, p.name, p.avatar_url, null, null, c.id, c.title, null, c.created_at
    from people p
    join public.collections c on c.owner_id = p.id
    where c.visibility = 'public' and c.created_at > now() - interval '14 days'
    union all
    select 'review', p.id, p.name, p.avatar_url, n.id, n.nombre, null, null, r.stars, r.created_at
    from people p
    join public.reviews r on r.user_id = p.id
    join public.negocios n on n.id = r.negocio_id
    where r.status = 'published' and r.created_at > now() - interval '14 days'
      and coalesce(btrim(n.nombre), '') <> ''
  )
  select * from events order by 10 desc limit 20;
$$;
revoke all on function public.following_activity() from public, anon;
grant execute on function public.following_activity() to authenticated;
