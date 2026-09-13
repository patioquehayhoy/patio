-- Deploy before delete-account. Business ownership is currently the verified
-- email in fonditas.telefono; migrate to owner_id in a separate audited change.
-- Running within auth.admin.deleteUser's transaction prevents orphaned Patios
-- or partially deleted SQL data if any FK prevents account deletion.
create or replace function public.delete_owned_patios_before_account()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.email is not null and old.email_confirmed_at is not null then
    delete from public.menus
    where fondita_id in (
      select id from public.fonditas where lower(telefono) = lower(old.email)
    );
    delete from public.cartas
    where fondita_id in (
      select id from public.fonditas where lower(telefono) = lower(old.email)
    );
    delete from public.fonditas where lower(telefono) = lower(old.email);
  end if;
  return old;
end;
$$;

revoke all on function public.delete_owned_patios_before_account() from public, anon, authenticated;
drop trigger if exists delete_owned_patios_before_account on auth.users;
create trigger delete_owned_patios_before_account
before delete on auth.users
for each row execute function public.delete_owned_patios_before_account();

create or replace function public.account_deletion_ready()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from pg_catalog.pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'delete_owned_patios_before_account'
      and tgfoid = 'public.delete_owned_patios_before_account()'::regprocedure
      and tgtype = 11 -- FOR EACH ROW + BEFORE + DELETE
      and tgenabled in ('O', 'A')
  );
$$;
revoke all on function public.account_deletion_ready() from public, anon, authenticated;
grant execute on function public.account_deletion_ready() to service_role;

-- The mobile app may create a review, but cannot impersonate a business reply
-- or choose moderation state on INSERT. Immutable reviews still cascade on
-- account deletion; they are immutable only to ordinary client writes.
drop policy if exists "verified users create reviews" on public.reviews;
create policy "verified users create reviews"
on public.reviews for insert to authenticated
with check (
  auth.uid() = user_id
  and status = 'published'
  and business_reply is null
  and business_replied_at is null
  and exists (
    select 1 from public.user_profiles p
    where p.user_id = auth.uid() and p.setup_completed
  )
);
