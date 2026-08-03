-- Las reseñas son append-only: una persona puede publicar una nueva por otra
-- visita, pero nunca reescribir la observación anterior.

drop policy if exists "verified users own reviews" on public.reviews;

alter table public.reviews drop constraint if exists reviews_pkey;
alter table public.reviews add column if not exists id uuid default gen_random_uuid();
update public.reviews set id = gen_random_uuid() where id is null;
alter table public.reviews alter column id set not null;
alter table public.reviews add constraint reviews_pkey primary key (id);
alter table public.reviews add column if not exists visit_date date not null default current_date;

create index if not exists reviews_fondita_created_idx
on public.reviews (fondita_id, created_at desc)
where status = 'published';

create index if not exists reviews_user_fondita_idx
on public.reviews (user_id, fondita_id, created_at desc);

create unique index if not exists reviews_one_per_visit_day_idx
on public.reviews (user_id, fondita_id, visit_date);

drop function if exists public.reply_to_review(uuid, uuid, text);

create or replace function public.reply_to_review(
  target_review_id uuid,
  reply_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.reviews r
    join public.fonditas f on f.id = r.fondita_id
    where r.id = target_review_id
      and lower(f.telefono) = lower(auth.jwt() ->> 'email')
  ) then
    raise exception 'not authorized';
  end if;

  if char_length(trim(reply_text)) not between 1 and 600 then
    raise exception 'invalid reply';
  end if;

  update public.reviews
  set business_reply = trim(reply_text),
      business_replied_at = now()
  where id = target_review_id
    and status = 'published';
end;
$$;

revoke all on function public.reply_to_review(uuid, text) from public;
grant execute on function public.reply_to_review(uuid, text) to authenticated;

create policy "verified users create reviews"
on public.reviews
for insert
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.user_profiles p
    where p.user_id = auth.uid()
      and p.setup_completed
  )
);
