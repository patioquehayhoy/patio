-- Reglas de identidad aplicadas por el servidor, como Instagram:
-- * Nombre del negocio y nombre de la persona: hasta dos cambios cada 14 días.
--   El nombre provisional del alta («Mi Fondita») no cuenta.
-- * Giro del negocio: se elige en el alta; después solo soporte lo cambia
--   (como Uber Eats y Rappi). Protege el mapa y las reseñas por giro.
-- Las reglas aplican a la app (rol `authenticated`); soporte, desde SQL o
-- con la clave de servicio, puede corregir.
-- Además se elimina `telefono`: la app ya no lo usa y el aviso no lo declara.

create table if not exists public.fondita_name_history (
  id bigint generated always as identity primary key,
  fondita_id uuid not null references public.fonditas(id) on delete cascade,
  previous_name text,
  new_name text not null,
  changed_at timestamptz not null default now()
);
create index if not exists fondita_name_history_recent_idx on public.fondita_name_history (fondita_id, changed_at desc);
alter table public.fondita_name_history enable row level security;

drop policy if exists "owners read their name history" on public.fondita_name_history;
create policy "owners read their name history" on public.fondita_name_history for select to authenticated
using (exists (select 1 from public.fonditas f where f.id = fondita_id and f.owner_id = auth.uid()));

drop policy if exists "owners record their name changes" on public.fondita_name_history;
create policy "owners record their name changes" on public.fondita_name_history for insert to authenticated
with check (exists (select 1 from public.fonditas f where f.id = fondita_id and f.owner_id = auth.uid()));

create or replace function public.protect_business_identity() returns trigger
language plpgsql
set search_path = public
as $$
declare
  recent integer;
begin
  if current_user <> 'authenticated' then return new; end if;

  if coalesce(array_length(old.categorias, 1), 0) > 0 then
    new.categorias := old.categorias;
    new.tipo_negocio := old.tipo_negocio;
  end if;

  if new.nombre is distinct from old.nombre and coalesce(btrim(old.nombre), '') not in ('', 'Mi Fondita') then
    select count(*) into recent from public.fondita_name_history h
    where h.fondita_id = old.id and h.changed_at > now() - interval '14 days';
    if recent >= 2 then
      raise exception 'NAME_CHANGE_LIMIT'
        using errcode = 'P0001', hint = 'Puedes cambiar el nombre dos veces cada 14 días.';
    end if;
    insert into public.fondita_name_history (fondita_id, previous_name, new_name)
    values (old.id, old.nombre, new.nombre);
    new.nombre_updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists protect_business_identity on public.fonditas;
create trigger protect_business_identity before update on public.fonditas
for each row execute function public.protect_business_identity();

create or replace function public.limit_profile_name_changes() returns trigger
language plpgsql
set search_path = public
as $$
declare
  recent integer;
begin
  if current_user <> 'authenticated' then return new; end if;
  if new.first_name is distinct from old.first_name or new.last_name is distinct from old.last_name then
    select count(*) into recent from public.profile_name_history h
    where h.user_id = old.user_id and h.changed_at > now() - interval '14 days';
    if recent >= 2 then
      raise exception 'NAME_CHANGE_LIMIT'
        using errcode = 'P0001', hint = 'Puedes cambiar tu nombre dos veces cada 14 días.';
    end if;
    insert into public.profile_name_history (user_id, first_name, last_name)
    values (old.user_id, new.first_name, new.last_name);
  end if;
  return new;
end;
$$;
drop trigger if exists limit_profile_name_changes on public.user_profiles;
create trigger limit_profile_name_changes before update on public.user_profiles
for each row execute function public.limit_profile_name_changes();

alter table public.fonditas drop column if exists telefono;
