-- One transaction for collection metadata and ordered places. The client
-- persists p_collection_id before invoking this function, so a retry after a
-- lost response updates the same collection instead of publishing a duplicate.
create or replace function public.publish_collection(
  p_collection_id uuid,
  p_title text,
  p_description text,
  p_visibility text,
  p_fondita_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = ''
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
    or array_position(p_fondita_ids, null) is not null
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
  insert into public.collection_places (collection_id, fondita_id, sort_order)
  select saved_id, place.id, (min(place.position) - 1)::integer
  from unnest(coalesce(p_fondita_ids, '{}'::uuid[])) with ordinality as place(id, position)
  group by place.id;
  -- Invalid/deleted Patio IDs raise a FK error. PostgreSQL rolls back metadata
  -- AND removed places; the previously published collection stays intact.
  return saved_id;
end;
$$;

revoke all on function public.publish_collection(uuid, text, text, text, uuid[]) from public, anon, authenticated;
grant execute on function public.publish_collection(uuid, text, text, text, uuid[]) to authenticated;
