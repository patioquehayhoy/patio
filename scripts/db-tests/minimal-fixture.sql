-- Test-only fixture for missing baseline schema. This is NOT a production
-- migration, schema dump, or evidence that the real project restores cleanly.
create role anon;
create role authenticated;
create role service_role bypassrls;
create role supabase_auth_admin;
create schema auth;
grant usage on schema public, auth to anon, authenticated, service_role;
grant usage on schema auth to supabase_auth_admin;

create table auth.users (
  id uuid primary key,
  email text unique,
  email_confirmed_at timestamptz,
  is_anonymous boolean not null default false
);
grant select, delete on auth.users to supabase_auth_admin;
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

create table public.fonditas (
  id uuid primary key,
  telefono text not null,
  nombre text not null
);
create table public.menus (
  fondita_id uuid not null references public.fonditas(id),
  fecha date not null default current_date,
  secciones jsonb not null default '{}',
  primary key (fondita_id, fecha)
);
create table public.cartas (
  fondita_id uuid primary key references public.fonditas(id),
  secciones jsonb not null default '{}'
);
