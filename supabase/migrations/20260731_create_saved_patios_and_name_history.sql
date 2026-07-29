create table if not exists public.saved_patios (
  user_id uuid not null references auth.users(id) on delete cascade,
  fondita_id uuid not null references public.fonditas(id) on delete cascade,
  note text check (char_length(note) <= 300),
  status text check (status in ('want_to_go', 'visited')),
  personal_rating smallint check (personal_rating between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, fondita_id)
);

create table if not exists public.profile_name_history (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  changed_at timestamptz not null default now()
);

alter table public.user_profiles alter column visibility set default 'private';

alter table public.saved_patios enable row level security;
alter table public.profile_name_history enable row level security;

create policy "saved patios owned" on public.saved_patios for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "name history own read" on public.profile_name_history for select
using (auth.uid() = user_id);
create policy "name history own insert" on public.profile_name_history for insert
with check (auth.uid() = user_id);
