-- Rehearsed against the public schema inventoried on 2026-10-09.
-- Add fields required by the mobile profile/public-card queries, without
-- fabricating addresses, opening hours, business types or payment methods.
alter table public.fonditas
  add column if not exists direccion text,
  add column if not exists direccion_visible boolean not null default false,
  add column if not exists horario text,
  add column if not exists pagos_efectivo boolean,
  add column if not exists pagos_transferencia boolean,
  add column if not exists pagos_tarjeta boolean,
  add column if not exists tipo_negocio text,
  add column if not exists categorias text[] not null default '{}';

-- The app upserts cartas on fondita_id. Abort instead of discarding duplicates.
do $$ begin
  if exists(select 1 from public.cartas group by fondita_id having count(*) > 1) then
    raise exception 'Duplicate cartas per Patio: resolve explicitly before release' using errcode = '23505';
  end if;
end $$;
create unique index if not exists cartas_one_per_patio_idx on public.cartas(fondita_id);
