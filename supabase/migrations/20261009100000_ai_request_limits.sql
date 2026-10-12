-- Apply and rehearse in staging before deploying the quota-aware Edge handlers.
-- These are abuse ceilings for the pilot, not subscription entitlements.
create table if not exists public.ai_request_usage (
  user_id uuid not null references auth.users(id) on delete cascade,
  feature text not null check (feature in ('read-menu', 'smart-setup', 'search-intent')),
  window_kind text not null check (window_kind in ('minute', 'day')),
  window_start timestamptz not null,
  requests integer not null check (requests > 0),
  primary key (user_id, feature, window_kind, window_start)
);
alter table public.ai_request_usage enable row level security;
revoke all on public.ai_request_usage from public, anon, authenticated;
grant select, insert, update, delete on public.ai_request_usage to service_role;

create or replace function public.consume_ai_request(p_user_id uuid, p_feature text)
returns boolean language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  moment timestamptz := statement_timestamp();
  minute_limit integer;
  daily_limit integer;
  accepted integer;
begin
  if not exists (select 1 from auth.users where id = p_user_id and not is_anonymous) then
    raise exception 'unknown user' using errcode = '42501';
  end if;
  case p_feature
    when 'read-menu' then minute_limit := 2; daily_limit := 20;
    when 'smart-setup' then minute_limit := 3; daily_limit := 20;
    when 'search-intent' then minute_limit := 10; daily_limit := 100;
    else raise exception 'unknown feature' using errcode = '22023';
  end case;
  -- The exception block rolls back BOTH counters if either window is full.
  begin
    insert into public.ai_request_usage as usage(user_id, feature, window_kind, window_start, requests)
    values(p_user_id, p_feature, 'minute', date_trunc('minute', moment), 1)
    on conflict (user_id, feature, window_kind, window_start) do update
      set requests = usage.requests + 1 where usage.requests < minute_limit
    returning requests into accepted;
    if accepted is null then raise exception 'quota exceeded' using errcode = 'P0001'; end if;
    accepted := null;
    insert into public.ai_request_usage as usage(user_id, feature, window_kind, window_start, requests)
    values(p_user_id, p_feature, 'day', date_trunc('day', moment at time zone 'America/Mexico_City') at time zone 'America/Mexico_City', 1)
    on conflict (user_id, feature, window_kind, window_start) do update
      set requests = usage.requests + 1 where usage.requests < daily_limit
    returning requests into accepted;
    if accepted is null then raise exception 'quota exceeded' using errcode = 'P0001'; end if;
  exception when sqlstate 'P0001' then return false;
  end;
  delete from public.ai_request_usage where user_id = p_user_id and window_start < moment - interval '2 days';
  return true;
end;
$$;
revoke all on function public.consume_ai_request(uuid, text) from public, anon, authenticated;
grant execute on function public.consume_ai_request(uuid, text) to service_role;
