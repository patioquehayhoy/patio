-- La columna ya existe en producción (se agregó fuera de las migraciones) y
-- Editar mi negocio la lee para la regla de cambiar el nombre cada 15 días.
-- Esta migración la registra para que un entorno nuevo no rompa esa pantalla.
-- En producción no cambia nada: `if not exists`.
alter table public.fonditas add column if not exists nombre_updated_at timestamptz;
