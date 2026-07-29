create table if not exists public.saved_collections (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection_id uuid not null references public.collections(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, collection_id)
);
alter table public.saved_collections enable row level security;
create policy "saved collections owned" on public.saved_collections for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
