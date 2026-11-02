-- Comentarios en reseñas, guardados de verdad. Antes vivían solo en la
-- memoria del teléfono: se perdían al recargar y nadie más los veía.
-- Modelo Instagram: respuestas de un solo nivel, «me gusta» por comentario,
-- borra quien lo escribió o el autor de la reseña; el negocio comenta con su
-- nombre en las reseñas de su Patio.

-- ¿`blocker` bloqueó a `target`? Las listas de bloqueo son privadas, así que
-- las políticas lo preguntan a través de esta función.
create or replace function public.is_blocked_by(blocker uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.blocked_users b
    where b.blocker_id = blocker and b.blocked_user_id = target
  );
$$;
revoke all on function public.is_blocked_by(uuid, uuid) from public, anon;
grant execute on function public.is_blocked_by(uuid, uuid) to authenticated;

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews(id) on delete cascade,
  parent_id uuid references public.review_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 280),
  status text not null default 'published' check (status in ('published', 'hidden')),
  notified_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists review_comments_review_idx on public.review_comments (review_id, created_at);
create index if not exists review_comments_user_idx on public.review_comments (user_id);
create index if not exists review_comments_parent_idx on public.review_comments (parent_id);

create table if not exists public.review_comment_likes (
  comment_id uuid not null references public.review_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index if not exists review_comment_likes_user_idx on public.review_comment_likes (user_id);

alter table public.review_comments enable row level security;
alter table public.review_comment_likes enable row level security;

-- El servidor fija fecha, estado y nivel; responder a una respuesta cuelga
-- del comentario principal. El texto pasa por el filtro de contenido.
create or replace function public.prepare_review_comment() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  parent_review uuid;
  parent_parent uuid;
begin
  new.body := btrim(new.body);
  new.status := 'published';
  new.notified_at := null;
  new.created_at := now();
  if new.parent_id is not null then
    select review_id, parent_id into parent_review, parent_parent
    from public.review_comments where id = new.parent_id;
    if parent_review is null or parent_review <> new.review_id then
      raise exception 'INVALID_PARENT_COMMENT' using errcode = '22023';
    end if;
    if parent_parent is not null then new.parent_id := parent_parent; end if;
  end if;
  perform public.moderation_assert(new.body);
  return new;
end;
$$;
drop trigger if exists prepare_review_comment on public.review_comments;
create trigger prepare_review_comment before insert on public.review_comments
for each row execute function public.prepare_review_comment();

-- Se leen junto con su reseña: si la reseña no es visible (oculta, o su autor
-- está bloqueado), sus comentarios tampoco.
drop policy if exists "comments readable with their review" on public.review_comments;
create policy "comments readable with their review" on public.review_comments for select
using (status = 'published' and exists (select 1 from public.reviews r where r.id = review_id));

drop policy if exists "blocked commenters hidden" on public.review_comments;
create policy "blocked commenters hidden" on public.review_comments as restrictive for select to authenticated
using (not public.is_blocked_by(auth.uid(), user_id));

-- Comenta quien tiene perfil completo o el dueño del Patio reseñado; nadie
-- comenta en la reseña de alguien que lo bloqueó.
drop policy if exists "people with a profile comment" on public.review_comments;
create policy "people with a profile comment" on public.review_comments for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.reviews r
    where r.id = review_id and r.status = 'published'
      and not public.is_blocked_by(r.user_id, auth.uid())
  )
  and (
    exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.setup_completed)
    or exists (
      select 1 from public.reviews r join public.negocios n on n.id = r.negocio_id
      where r.id = review_id and n.owner_id = auth.uid()
    )
  )
);

drop policy if exists "authors and review owners delete comments" on public.review_comments;
create policy "authors and review owners delete comments" on public.review_comments for delete to authenticated
using (
  user_id = auth.uid()
  or exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
);

drop policy if exists "comment likes readable" on public.review_comment_likes;
create policy "comment likes readable" on public.review_comment_likes for select
using (exists (select 1 from public.review_comments c where c.id = comment_id));

drop policy if exists "own comment likes" on public.review_comment_likes;
create policy "own comment likes" on public.review_comment_likes for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.review_comments c where c.id = comment_id));

drop policy if exists "remove own comment likes" on public.review_comment_likes;
create policy "remove own comment likes" on public.review_comment_likes for delete to authenticated
using (user_id = auth.uid());

-- Los comentarios se pueden reportar como el resto del contenido.
alter table public.content_reports drop constraint if exists content_reports_target_type_check;
alter table public.content_reports add constraint content_reports_target_type_check
  check (target_type in ('review', 'profile', 'patio', 'collection', 'comment'));

-- Avisos: comentarios, respuestas, respuesta del negocio y seguidores.
alter table public.notification_preferences add column if not exists social_activity boolean not null default true;
alter table public.reviews add column if not exists reply_notified_at timestamptz;
