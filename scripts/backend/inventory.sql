-- READ ONLY. Run in Supabase SQL Editor as administrator, export results.
-- No user identities, content, credential values or application rows returned.
select current_database() as database_name, current_setting('server_version') as postgres_version;
select c.relname as table_name, c.relrowsecurity as rls_enabled, c.relforcerowsecurity as force_rls
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r' order by c.relname;
select table_name,column_name,data_type,is_nullable,column_default
from information_schema.columns where table_schema='public'
order by table_name,ordinal_position;
select tablename,policyname,roles,cmd,qual,with_check
from pg_policies where schemaname='public' order by tablename,policyname;
select table_name,grantee,privilege_type
from information_schema.role_table_grants
where table_schema='public' and grantee in ('anon','authenticated','service_role')
order by table_name,grantee,privilege_type;
select tablename,indexname,indexdef from pg_indexes where schemaname='public' order by tablename,indexname;
select c.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
from pg_constraint con join pg_class c on c.oid=con.conrelid
join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
order by c.relname,con.conname;
select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,p.prosecdef as security_definer,p.proconfig,
  has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
  has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'
order by p.proname;
select event_object_table,trigger_name,action_timing,event_manipulation,action_statement
from information_schema.triggers where event_object_schema='public'
order by event_object_table,trigger_name;
-- Aggregate only. Legacy ownership ambiguity must be resolved before backfill.
select
  count(*) as patios,
  count(*) filter(where matches=0) as without_confirmed_owner,
  count(*) filter(where matches>1) as ambiguous_owners
from (
  select f.id, (select count(*) from auth.users u
    where u.email_confirmed_at is not null and not coalesce(u.is_anonymous,false)
      and lower(trim(u.email))=lower(trim(f.telefono))) as matches
  from public.fonditas f
) ownership;
select count(*) as duplicate_owner_groups from (
  select lower(trim(telefono)) from public.fonditas group by lower(trim(telefono)) having count(*)>1
) duplicates;
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='fonditas' and column_name='owner_id') as owner_id_present;
