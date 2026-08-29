-- Like a una reseña — el mismo mecanismo de dish_likes (20260828), aplicado
-- al lado Foodie: reciprocidad para quien escribe una reseña, no solo para
-- el Fondero que la recibe. Requiere reviews.id (20260804), que hasta hoy
-- nunca se había aplicado — sin esa migración, reviews.id no existía y
-- ninguna reseña real llegaba a mostrarse en ningún Patio.
create table if not exists public.review_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  review_id uuid not null references public.reviews(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, review_id)
);

alter table public.review_likes enable row level security;

create policy "review likes readable" on public.review_likes for select
using (true);

create policy "own review likes" on public.review_likes for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists review_likes_review_idx on public.review_likes (review_id);
