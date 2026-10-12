-- Preserve unmatched legacy synthetic rows; never guess an owner or delete data.
alter table public.fonditas add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.fonditas alter column telefono drop not null;
update public.fonditas f set owner_id = u.id from auth.users u
where f.owner_id is null and u.email_confirmed_at is not null
  and not coalesce(u.is_anonymous,false)
  and lower(trim(f.telefono))=lower(trim(u.email));
update public.fonditas f set owner_id=u.id from auth.users u
where f.owner_id is null and f.id=u.id and u.email_confirmed_at is not null
  and not coalesce(u.is_anonymous,false);
create unique index if not exists fonditas_one_per_owner_idx on public.fonditas(owner_id);
alter table public.fonditas alter column owner_id set default auth.uid();

create or replace function public.protect_patio_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is not null then
  if not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and not coalesce(is_anonymous,false)) then
   raise exception 'Verified account required' using errcode='42501';
  end if;
  if new.owner_id is distinct from auth.uid() or (tg_op='UPDATE' and new.owner_id is distinct from old.owner_id) then
   raise exception 'Cannot change Patio ownership' using errcode='42501';
  end if;
 end if;
 return new;
end $$;
revoke all on function public.protect_patio_owner() from public,anon,authenticated;
create trigger protect_patio_owner before insert or update on public.fonditas
for each row execute function public.protect_patio_owner();

-- Replace the legacy UUID-of-business = UUID-of-user policies.
drop policy if exists "Usuario ve su fondita" on public.fonditas;
drop policy if exists "Usuario ve sus menus" on public.menus;
drop policy if exists "Usuario ve su carta" on public.cartas;
create policy "owners manage their Patio" on public.fonditas for all to authenticated
using(owner_id=auth.uid()) with check(owner_id=auth.uid());
create policy "published Patios readable" on public.fonditas for select to anon,authenticated
using(owner_id is not null and length(trim(nombre))>0 and nombre<>'Mi Fondita');
create policy "owners manage their menus" on public.menus for all to authenticated
using(exists(select 1 from public.fonditas f where f.id=fondita_id and f.owner_id=auth.uid()))
with check(exists(select 1 from public.fonditas f where f.id=fondita_id and f.owner_id=auth.uid()));
create policy "published menus readable" on public.menus for select to anon,authenticated
using(exists(select 1 from public.fonditas f where f.id=fondita_id and f.owner_id is not null and length(trim(f.nombre))>0 and f.nombre<>'Mi Fondita'));
create policy "owners manage their carta" on public.cartas for all to authenticated
using(exists(select 1 from public.fonditas f where f.id=fondita_id and f.owner_id=auth.uid()))
with check(exists(select 1 from public.fonditas f where f.id=fondita_id and f.owner_id=auth.uid()));
create policy "published cartas readable" on public.cartas for select to anon,authenticated
using(exists(select 1 from public.fonditas f where f.id=fondita_id and f.owner_id is not null and length(trim(f.nombre))>0 and f.nombre<>'Mi Fondita'));

-- Public cards need business fields, never the legacy login email.
revoke select on public.fonditas from anon,authenticated;
do $$ declare cols text; begin
 select string_agg(quote_ident(column_name),',') into cols from information_schema.columns
 where table_schema='public' and table_name='fonditas' and column_name<>'telefono';
 execute 'grant select ('||cols||') on public.fonditas to anon,authenticated';
end $$;
grant insert,update,delete on public.fonditas,public.menus,public.cartas to authenticated;
grant select on public.menus,public.cartas to anon,authenticated;

create or replace function public.delete_owned_patios_before_account() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 delete from public.fonditas where owner_id=old.id;
 return old;
end $$;
revoke all on function public.delete_owned_patios_before_account() from public,anon,authenticated;

create or replace function public.reply_to_review(target_review_id uuid,reply_text text)
returns void language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null or not exists(select 1 from public.reviews r join public.fonditas f on f.id=r.fondita_id where r.id=target_review_id and f.owner_id=auth.uid()) then
  raise exception 'not authorized' using errcode='42501';
 end if;
 if reply_text is null or char_length(trim(reply_text)) not between 1 and 600 then
  raise exception 'invalid reply' using errcode='22023';
 end if;
 update public.reviews set business_reply=trim(reply_text),business_replied_at=now()
 where id=target_review_id and status='published';
end $$;
revoke all on function public.reply_to_review(uuid,text) from public,anon;
grant execute on function public.reply_to_review(uuid,text) to authenticated;
