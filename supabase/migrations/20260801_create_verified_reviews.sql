create table if not exists public.reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  fondita_id uuid not null references public.fonditas(id) on delete cascade,
  stars smallint not null check (stars between 1 and 5),
  reasons text[] not null default '{}',
  note text check (char_length(note) <= 600),
  status text not null default 'published' check (status in ('published','hidden','flagged')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, fondita_id)
);
alter table public.reviews enable row level security;
create policy "published reviews readable" on public.reviews for select
using (status = 'published' or auth.uid() = user_id);
create policy "verified users own reviews" on public.reviews for all
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (select 1 from public.user_profiles p where p.user_id = auth.uid() and p.setup_completed)
);
