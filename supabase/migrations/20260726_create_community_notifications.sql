-- Patio community loop: follow -> publish -> notify -> return.
-- Push tokens and delivery logs never live in the public business/menu tables.

create extension if not exists pgcrypto;

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  patio_publications boolean not null default true,
  business_activity boolean not null default true,
  product_updates boolean not null default false,
  quiet_start time,
  quiet_end time,
  timezone text not null default 'America/Mexico_City',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.patio_follows (
  user_id uuid not null references auth.users(id) on delete cascade,
  fondita_id uuid not null references public.fonditas(id) on delete cascade,
  notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, fondita_id)
);

create table if not exists public.push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('ios', 'android')),
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.publication_events (
  id uuid primary key default gen_random_uuid(),
  fondita_id uuid not null references public.fonditas(id) on delete cascade,
  menu_date date not null,
  version integer not null default 1,
  kind text not null default 'menu_published'
    check (kind in ('menu_published', 'availability_changed')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (fondita_id, menu_date, kind)
);

create table if not exists public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.publication_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  push_device_id uuid not null references public.push_devices(id) on delete cascade,
  expo_ticket_id text,
  status text not null default 'queued'
    check (status in ('queued', 'sent', 'error', 'device_unregistered')),
  error_code text,
  error_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, push_device_id)
);

create index if not exists patio_follows_fondita_idx
  on public.patio_follows(fondita_id) where notifications_enabled;
create index if not exists push_devices_user_active_idx
  on public.push_devices(user_id) where active;
create index if not exists notification_deliveries_event_idx
  on public.notification_deliveries(event_id);

alter table public.notification_preferences enable row level security;
alter table public.patio_follows enable row level security;
alter table public.push_devices enable row level security;
alter table public.publication_events enable row level security;
alter table public.notification_deliveries enable row level security;

create policy "Users manage their notification preferences"
  on public.notification_preferences for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their Patio follows"
  on public.patio_follows for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users manage their push devices"
  on public.push_devices for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Clients may inspect their own delivery history. Events and delivery writes
-- remain server-only (service_role bypasses RLS).
create policy "Users read their notification deliveries"
  on public.notification_deliveries for select
  using (auth.uid() = user_id);

create or replace function public.create_notification_preferences()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_create_notification_preferences on auth.users;
create trigger on_auth_user_create_notification_preferences
  after insert on auth.users
  for each row execute procedure public.create_notification_preferences();

-- Backfill accounts that existed before this migration.
insert into public.notification_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;
