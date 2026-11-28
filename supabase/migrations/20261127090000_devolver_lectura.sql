-- Devolver la lectura (Parco, 27 nov): si el servicio de lectura no responde
-- (saturado, caído o se acabó el tiempo) después de reintentar, la lectura no
-- cuenta. Solo regresa el contador del día; el del minuto se queda para que
-- nadie pueda repetir sin freno. Nunca baja de cero.
create or replace function public.return_ai_request(p_user_id uuid, p_feature text, p_count integer default 1)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  moment timestamptz := statement_timestamp();
begin
  if p_feature not in ('read-menu', 'smart-setup', 'search-intent') then
    raise exception 'unknown feature' using errcode = '22023';
  end if;
  if p_count is null or p_count < 1 or p_count > 6 then
    raise exception 'invalid count' using errcode = '22023';
  end if;
  update public.ai_request_usage
     set requests = greatest(0, requests - p_count)
   where user_id = p_user_id
     and feature = p_feature
     and window_kind = 'day'
     and window_start = date_trunc('day', moment at time zone 'America/Mexico_City') at time zone 'America/Mexico_City';
end;
$function$;

revoke all on function public.return_ai_request(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.return_ai_request(uuid, text, integer) to service_role;
