-- New reviews use the actual publication day in CDMX. Client timestamps cannot
-- evade the existing one-review-per-user/place/day unique index.
create or replace function public.set_review_server_dates()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  new.visit_date := (statement_timestamp() at time zone 'America/Mexico_City')::date;
  new.created_at := statement_timestamp();
  new.updated_at := new.created_at;
  return new;
end;
$$;
revoke all on function public.set_review_server_dates() from public, anon, authenticated;
drop trigger if exists reviews_server_dates on public.reviews;
create trigger reviews_server_dates before insert on public.reviews
for each row execute function public.set_review_server_dates();
