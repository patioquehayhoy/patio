-- Largo máximo de los datos del negocio, igual que en la app
-- (lib/text-limits.ts). Como la moderación, solo revisa lo que cambia: un dato
-- antiguo más largo no bloquea editar el horario o los pagos.
create or replace function public.negocios_text_limits()
returns trigger language plpgsql set search_path = public
as $$
begin
  if new.nombre is distinct from old.nombre and char_length(btrim(coalesce(new.nombre, ''))) > 30 then
    raise exception 'TEXT_TOO_LONG' using errcode = 'P0001', hint = 'El nombre puede tener hasta 30 caracteres.';
  end if;
  if new.descripcion is distinct from old.descripcion and char_length(coalesce(new.descripcion, '')) > 80 then
    raise exception 'TEXT_TOO_LONG' using errcode = 'P0001', hint = 'La descripción puede tener hasta 80 caracteres.';
  end if;
  if new.direccion is distinct from old.direccion and char_length(coalesce(new.direccion, '')) > 80 then
    raise exception 'TEXT_TOO_LONG' using errcode = 'P0001', hint = 'La dirección puede tener hasta 80 caracteres.';
  end if;
  return new;
end;
$$;

drop trigger if exists negocios_text_limits on public.negocios;
create trigger negocios_text_limits before update on public.negocios
  for each row execute function public.negocios_text_limits();
