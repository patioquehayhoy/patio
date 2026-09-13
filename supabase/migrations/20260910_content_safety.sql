-- User reports are an inbox for a human moderation workflow. A report does not
-- automatically hide a business or another person's review for everyone.
create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('review', 'profile', 'patio', 'collection')),
  target_id uuid not null,
  reason text not null check (reason in ('spam', 'abuse', 'inaccurate', 'other')),
  details text check (char_length(details) <= 500),
  status text not null default 'open' check (status in ('open', 'reviewed', 'dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists content_reports_open_idx
  on public.content_reports (created_at) where status = 'open';
create index if not exists content_reports_reporter_idx
  on public.content_reports (reporter_id, created_at desc);

alter table public.content_reports enable row level security;
revoke all on public.content_reports from anon, authenticated;
grant select, insert on public.content_reports to authenticated;
grant all on public.content_reports to service_role;

create policy "reporters read own reports"
on public.content_reports for select to authenticated
using (reporter_id = auth.uid());

create policy "reporters create open reports"
on public.content_reports for insert to authenticated
with check (reporter_id = auth.uid() and status = 'open');

create table if not exists public.blocked_users (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_user_id),
  check (blocker_id <> blocked_user_id)
);
alter table public.blocked_users enable row level security;
revoke all on public.blocked_users from anon, authenticated;
grant select, insert, delete on public.blocked_users to authenticated;
grant all on public.blocked_users to service_role;

create policy "users read own blocks"
on public.blocked_users for select to authenticated
using (blocker_id = auth.uid());
create policy "users create own blocks"
on public.blocked_users for insert to authenticated
with check (blocker_id = auth.uid());
create policy "users remove own blocks"
on public.blocked_users for delete to authenticated
using (blocker_id = auth.uid());

-- RESTRICTIVE combines these with all existing permissive visibility/ownership
-- policies using AND. It never makes private rows public or grants new reads.
-- Anonymous discovery is unchanged; blocks belong to a signed-in account.
create policy "blocked profiles hidden"
on public.user_profiles as restrictive for select to authenticated
using (not exists (
  select 1 from public.blocked_users b
  where b.blocker_id = auth.uid() and b.blocked_user_id = user_profiles.user_id
));

create policy "blocked authors reviews hidden"
on public.reviews as restrictive for select to authenticated
using (not exists (
  select 1 from public.blocked_users b
  where b.blocker_id = auth.uid() and b.blocked_user_id = reviews.user_id
));

create policy "blocked curators collections hidden"
on public.collections as restrictive for select to authenticated
using (not exists (
  select 1 from public.blocked_users b
  where b.blocker_id = auth.uid() and b.blocked_user_id = collections.owner_id
));

-- The unblock screen needs a narrow projection because normal profile reads
-- intentionally hide blocked authors. Keep private profiles private: knowing
-- an auth UUID and blocking it must not reveal a private display name.
create or replace function public.get_blocked_profiles()
returns table (user_id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.blocked_user_id as user_id,
    case when p.visibility = 'public' then p.display_name else null end as display_name
  from public.blocked_users b
  left join public.user_profiles p on p.user_id = b.blocked_user_id
  where b.blocker_id = auth.uid()
  order by b.created_at desc, b.blocked_user_id;
$$;
revoke all on function public.get_blocked_profiles() from public, anon, authenticated;
grant execute on function public.get_blocked_profiles() to authenticated;
