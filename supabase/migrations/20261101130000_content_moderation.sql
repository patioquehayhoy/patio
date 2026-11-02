-- Filtro de contenido ofensivo (Apple 1.2: las apps donde la gente publica
-- deben filtrar, permitir reportar y bloquear). El servidor rechaza textos
-- públicos con insultos, groserías fuertes, lenguaje discriminatorio, sexual
-- explícito o amenazas. La lista vive en una tabla para ajustarla sin publicar
-- otra versión de la app.
--
-- Fuera de la lista a propósito: jerga cotidiana que en México no es insulto
-- («pinche», «chingón», «cabrón») y comida que coincide con groserías
-- («panocha», «concha», «huevos», «pan mamón», cerveza Indio, mole negro).

create table if not exists public.moderation_terms (
  term text primary key check (term ~ '^[a-z0-9]+( [a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);
alter table public.moderation_terms enable row level security;
-- Sin políticas: solo las funciones del servidor la leen.

-- Minúsculas, sin acentos, sin trucos de números (p3nd3j0) ni letras
-- repetidas (pendejooo); todo lo que no es letra o número separa palabras.
create or replace function public.moderation_normalize(input text)
returns text
language sql
immutable
as $$
  select btrim(regexp_replace(regexp_replace(
    translate(lower(coalesce(input, '')),
      'áàäâãéèëêíìïîóòöôõúùüûñç0134578@$',
      'aaaaaeeeeiiiiooooouuuuncoieastbas'),
    '([a-z])\1\1+', '\1', 'g'),
    '[^a-z0-9]+', ' ', 'g'));
$$;

-- Coincidencia por palabra completa: «puta» no atrapa «computadora».
create or replace function public.moderation_text_allowed(input text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (select ' ' || public.moderation_normalize(input) || ' ' as value)
  select not exists (
    select 1 from public.moderation_terms t, normalized n
    where position(' ' || t.term || ' ' in n.value) > 0
  );
$$;
revoke all on function public.moderation_text_allowed(text) from public, anon;
grant execute on function public.moderation_text_allowed(text) to authenticated;

create or replace function public.moderation_assert(variadic inputs text[])
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  item text;
begin
  foreach item in array inputs loop
    if item is not null and not public.moderation_text_allowed(item) then
      raise exception 'CONTENT_REJECTED'
        using errcode = 'P0001', hint = 'Patio no permite insultos ni lenguaje ofensivo.';
    end if;
  end loop;
end;
$$;
revoke all on function public.moderation_assert(text[]) from public, anon, authenticated;

-- Cada tabla revisa solo lo que cambia: el contenido anterior no bloquea, por
-- ejemplo, la respuesta del negocio a una reseña vieja.
create or replace function public.moderate_reviews() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.moderation_assert(new.note, new.business_reply);
  else
    if new.note is distinct from old.note then perform public.moderation_assert(new.note); end if;
    if new.business_reply is distinct from old.business_reply then perform public.moderation_assert(new.business_reply); end if;
  end if;
  return new;
end;
$$;

create or replace function public.moderate_user_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT'
    or new.first_name is distinct from old.first_name
    or new.last_name is distinct from old.last_name
    or new.display_name is distinct from old.display_name
    or new.handle is distinct from old.handle
    or new.bio is distinct from old.bio then
    perform public.moderation_assert(new.first_name, new.last_name, new.display_name, new.handle, new.bio);
  end if;
  return new;
end;
$$;

create or replace function public.moderate_collections() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.title is distinct from old.title or new.description is distinct from old.description then
    perform public.moderation_assert(new.title, new.description);
  end if;
  return new;
end;
$$;

create or replace function public.moderate_collection_places() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.note is distinct from old.note then
    perform public.moderation_assert(new.note);
  end if;
  return new;
end;
$$;

create or replace function public.moderate_fonditas() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.nombre is distinct from old.nombre or new.descripcion is distinct from old.descripcion then
    perform public.moderation_assert(new.nombre, new.descripcion);
  end if;
  return new;
end;
$$;

-- Menú del día y carta permanente: se revisa el texto completo de las secciones.
create or replace function public.moderate_menu_sections_json() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.secciones is distinct from old.secciones then
    perform public.moderation_assert(new.secciones::text);
  end if;
  return new;
end;
$$;

drop trigger if exists moderate_reviews on public.reviews;
create trigger moderate_reviews before insert or update on public.reviews
for each row execute function public.moderate_reviews();

drop trigger if exists moderate_user_profiles on public.user_profiles;
create trigger moderate_user_profiles before insert or update on public.user_profiles
for each row execute function public.moderate_user_profiles();

drop trigger if exists moderate_collections on public.collections;
create trigger moderate_collections before insert or update on public.collections
for each row execute function public.moderate_collections();

drop trigger if exists moderate_collection_places on public.collection_places;
create trigger moderate_collection_places before insert or update on public.collection_places
for each row execute function public.moderate_collection_places();

drop trigger if exists moderate_fonditas on public.fonditas;
create trigger moderate_fonditas before insert or update on public.fonditas
for each row execute function public.moderate_fonditas();

drop trigger if exists moderate_menus on public.menus;
create trigger moderate_menus before insert or update on public.menus
for each row execute function public.moderate_menu_sections_json();

drop trigger if exists moderate_cartas on public.cartas;
create trigger moderate_cartas before insert or update on public.cartas
for each row execute function public.moderate_menu_sections_json();

-- Lista inicial. Insultos y groserías fuertes, lenguaje discriminatorio,
-- sexual explícito y amenazas; en español de México y lo más común en inglés.
insert into public.moderation_terms (term) values
  ('pendejo'), ('pendeja'), ('pendejos'), ('pendejas'),
  ('culero'), ('culera'), ('culeros'), ('culeras'),
  ('ojete'), ('ojetes'),
  ('puto'), ('puta'), ('putos'), ('putas'), ('putito'), ('putita'),
  ('hdp'), ('chinga tu madre'), ('chingue su madre'), ('chingada madre'), ('vete a la chingada'),
  ('verga'), ('vergas'), ('mierda'), ('mierdas'), ('mamada'), ('mamadas'),
  ('imbecil'), ('imbeciles'), ('idiota'), ('idiotas'),
  ('estupido'), ('estupida'), ('estupidos'), ('estupidas'),
  ('malparido'), ('malparida'), ('zorra'), ('zorras'), ('perra'), ('perras'),
  ('naco'), ('naca'), ('nacos'), ('nacas'), ('sudaca'), ('sudacas'),
  ('joto'), ('jotos'), ('maricon'), ('maricones'), ('marica'), ('lencha'), ('mayate'),
  ('culo'), ('porno'), ('pornografia'),
  ('te voy a matar'), ('los voy a matar'), ('lo voy a matar'), ('la voy a matar'),
  ('te voy a partir la madre'), ('partirte la madre'),
  ('fuck'), ('fucking'), ('motherfucker'), ('shit'), ('bitch'), ('cunt'), ('whore'), ('slut'),
  ('asshole'), ('faggot'), ('fag'), ('retard'), ('nigger'), ('niggers'), ('nigga')
on conflict (term) do nothing;
