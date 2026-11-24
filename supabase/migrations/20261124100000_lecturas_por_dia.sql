-- Lecturas con foto (decisión de Parco, 24 nov): Gratis 3 al día, Pro 30.
-- Escribir el menú a mano sigue siendo gratis y sin límite. Jev (docs/research/
-- jev-auditoria-app-2026-11-24.json): al acabarse, «dejar la app» 2.4 de 4 y
-- «pagar Pro» 1.5; por eso el aviso ofrece escribir a mano primero.

create or replace function public.consume_ai_request(p_user_id uuid, p_feature text)
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
  case p_feature
    when 'read-menu' then minute_limit := 2; daily_limit := case when public.has_pro(p_user_id) then 30 else 3 end;
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
$function$

;
