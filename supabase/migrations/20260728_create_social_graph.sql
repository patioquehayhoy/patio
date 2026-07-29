create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null check (char_length(first_name) between 2 and 50),
  last_name text not null check (char_length(last_name) between 2 and 70),
  display_name text not null check (char_length(display_name) between 2 and 80),
  handle text unique,
  avatar_url text,
  bio text check (char_length(bio) <= 160),
  visibility text not null default 'public' check (visibility in ('private', 'public')),
  setup_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  description text not null default '' check (char_length(description) <= 240),
  visibility text not null default 'private' check (visibility in ('private', 'unlisted', 'public')),
  share_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_places (
  collection_id uuid not null references public.collections(id) on delete cascade,
  fondita_id uuid not null references public.fonditas(id) on delete cascade,
  note text check (char_length(note) <= 300),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (collection_id, fondita_id)
);

create table if not exists public.profile_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  followed_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, followed_id),
  check (follower_id <> followed_id)
);

alter table public.user_profiles enable row level security;
alter table public.collections enable row level security;
alter table public.collection_places enable row level security;
alter table public.profile_follows enable row level security;

create policy "profiles readable when public or own" on public.user_profiles for select
using (visibility = 'public' or auth.uid() = user_id);
create policy "profiles owned" on public.user_profiles for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "collections readable when shared or own" on public.collections for select
using (visibility in ('public', 'unlisted') or auth.uid() = owner_id);
create policy "collections owned" on public.collections for all
using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "collection places readable with collection" on public.collection_places for select
using (exists (select 1 from public.collections c where c.id = collection_id and (c.visibility in ('public','unlisted') or c.owner_id = auth.uid())));
create policy "collection places owned" on public.collection_places for all
using (exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid()))
with check (exists (select 1 from public.collections c where c.id = collection_id and c.owner_id = auth.uid()));

create policy "follows readable" on public.profile_follows for select using (true);
create policy "follows owned" on public.profile_follows for all
using (auth.uid() = follower_id) with check (auth.uid() = follower_id);
