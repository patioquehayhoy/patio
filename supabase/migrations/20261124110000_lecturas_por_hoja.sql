-- Varias hojas de una vez (Parco, 24 nov): cada hoja cuenta como una lectura
-- y se cobran juntas, o ninguna, si no caben en el día. Una carta de cuatro
-- hojas en un minuto ya no choca con el límite por minuto (6 hojas).
-- Un primer registro de 1 hoja y un tope de 3 en el día siguen igual.
drop function if exists public.consume_ai_request(uuid, text);
create or replace function public.consume_ai_request(p_user_id uuid, p_feature text, p_count integer default 1)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  moment timestamptz := statement_timestamp();
  minute_limit integer;
  daily_limit integer;
  accepted integer;
begin
  if not exists (select 1 from auth.users where id = p_user_id and not is_anonymous) then
    raise exception 'unknown user' using errcode = '42501';
  end if;
  if p_count is null or p_count < 1 or p_count > 6 then
    raise exception 'invalid count' using errcode = '22023';
  end if;
  case p_feature
    when 'read-menu' then minute_limit := 6; daily_limit := case when public.has_pro(p_user_id) then 30 else 3 end;
    when 'smart-setup' then minute_limit := 3; daily_limit := 20;
    when 'search-intent' then minute_limit := 10; daily_limit := 100;
    else raise exception 'unknown feature' using errcode = '22023';
  end case;
  if p_count > minute_limit or p_count > daily_limit then return false; end if;
  -- The exception block rolls back BOTH counters if either window is full.
  begin
    insert into public.ai_request_usage as usage(user_id, feature, window_kind, window_start, requests)
    values(p_user_id, p_feature, 'minute', date_trunc('minute', moment), p_count)
    on conflict (user_id, feature, window_kind, window_start) do update
      set requests = usage.requests + p_count where usage.requests + p_count <= minute_limit
    returning requests into accepted;
    if accepted is null then raise exception 'quota exceeded' using errcode = 'P0001'; end if;
    accepted := null;
    insert into public.ai_request_usage as usage(user_id, feature, window_kind, window_start, requests)
    values(p_user_id, p_feature, 'day', date_trunc('day', moment at time zone 'America/Mexico_City') at time zone 'America/Mexico_City', p_count)
    on conflict (user_id, feature, window_kind, window_start) do update
      set requests = usage.requests + p_count where usage.requests + p_count <= daily_limit
    returning requests into accepted;
    if accepted is null then raise exception 'quota exceeded' using errcode = 'P0001'; end if;
  exception when sqlstate 'P0001' then return false;
  end;
  delete from public.ai_request_usage where user_id = p_user_id and window_start < moment - interval '2 days';
  return true;
end;
$function$

;

revoke all on function public.consume_ai_request(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.consume_ai_request(uuid, text, integer) to service_role;
