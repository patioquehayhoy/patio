-- El negocio se llama «negocio» también en la base de datos. «fonditas» era el
-- nombre de los primeros días; la tabla y sus referencias pasan a `negocios`
-- y `negocio_id`. Las políticas, llaves e índices siguen a la tabla solos;
-- las funciones guardan su texto y se reescriben aquí.

alter table public.fonditas rename to negocios;

alter table public.menus rename column fondita_id to negocio_id;
alter table public.cartas rename column fondita_id to negocio_id;
alter table public.menu_sections rename column fondita_id to negocio_id;
alter table public.reviews rename column fondita_id to negocio_id;
alter table public.dish_likes rename column fondita_id to negocio_id;
alter table public.saved_patios rename column fondita_id to negocio_id;
alter table public.collection_places rename column fondita_id to negocio_id;
alter table public.patio_follows rename column fondita_id to negocio_id;
alter table public.publication_events rename column fondita_id to negocio_id;

-- Nombres de llaves e índices, para que ningún error vuelva a decir «fondita».
do $$
declare
  item record;
begin
  for item in
    select conrelid::regclass as tbl, conname from pg_constraint
    where connamespace = 'public'::regnamespace and conname like '%fondita%'
  loop
    execute format('alter table %s rename constraint %I to %I', item.tbl, item.conname,
      replace(replace(item.conname, 'fonditas', 'negocios'), 'fondita', 'negocio'));
  end loop;
  for item in
    select indexname from pg_indexes
    where schemaname = 'public' and indexname like '%fondita%'
  loop
    execute format('alter index public.%I rename to %I', item.indexname,
      replace(replace(item.indexname, 'fonditas', 'negocios'), 'fondita', 'negocio'));
  end loop;
end;
$$;

create or replace function public.delete_owned_patios_before_account()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
begin
  delete from public.negocios where owner_id = old.id;
  return old;
end;
$$;
revoke all on function public.delete_owned_patios_before_account() from public, anon, authenticated;

create or replace function public.reply_to_review(target_review_id uuid, reply_text text)
returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.reviews r join public.negocios n on n.id = r.negocio_id
    where r.id = target_review_id and n.owner_id = auth.uid()
  ) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if reply_text is null or char_length(trim(reply_text)) not between 1 and 600 then
    raise exception 'invalid reply' using errcode = '22023';
  end if;
  update public.reviews set business_reply = trim(reply_text), business_replied_at = now()
  where id = target_review_id and status = 'published';
end;
$$;
revoke all on function public.reply_to_review(uuid, text) from public;
grant execute on function public.reply_to_review(uuid, text) to authenticated;

-- El parámetro también cambia de nombre: se vuelve a crear la función.
drop function if exists public.publish_collection(uuid, text, text, text, uuid[]);
create function public.publish_collection(
  p_collection_id uuid,
  p_title text,
  p_description text,
  p_visibility text,
  p_negocio_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  caller_id uuid := auth.uid();
  saved_id uuid;
begin
  -- A still-signed JWT for a deleted account or an anonymous Auth user does
  -- not authorize publication. No caller-supplied owner is ever accepted.
  if caller_id is null or not exists (
    select 1 from auth.users u
    where u.id = caller_id and not coalesce(u.is_anonymous, false)
  ) then
    raise exception 'Sign in to publish a collection' using errcode = '42501';
  end if;

  if p_collection_id is null
    or p_title is null or char_length(trim(p_title)) not between 1 and 60
    or char_length(coalesce(p_description, '')) > 240
    or p_visibility is null or p_visibility not in ('private', 'unlisted', 'public')
    or array_position(p_negocio_ids, null) is not null
  then
    raise exception 'Invalid collection' using errcode = '22023';
  end if;

  -- The row lock acquired by this upsert serializes concurrent replacements.
  -- An ID that belongs to somebody else returns no row and fails closed.
  insert into public.collections (id, owner_id, title, description, visibility)
  values (p_collection_id, caller_id, trim(p_title), coalesce(p_description, ''), p_visibility)
  on conflict (id) do update
  set title = excluded.title,
      description = excluded.description,
      visibility = excluded.visibility,
      updated_at = now()
  where collections.owner_id = caller_id
  returning id into saved_id;

  if saved_id is null then
    raise exception 'This collection belongs to another account' using errcode = '42501';
  end if;

  delete from public.collection_places where collection_id = saved_id;
  insert into public.collection_places (collection_id, negocio_id, sort_order)
  select saved_id, place.id, (min(place.position) - 1)::integer
  from unnest(coalesce(p_negocio_ids, '{}'::uuid[])) with ordinality as place(id, position)
  group by place.id;
  -- Invalid/deleted business IDs raise a FK error. PostgreSQL rolls back
  -- metadata AND removed places; the previously published collection stays intact.
  return saved_id;
end;
$$;
revoke all on function public.publish_collection(uuid, text, text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.publish_collection(uuid, text, text, text, uuid[]) to authenticated;
