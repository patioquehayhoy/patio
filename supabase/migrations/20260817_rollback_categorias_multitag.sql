-- Reversión de 20260816_add_categorias_multitag.sql — red de seguridad, no
-- correr salvo que la migración original haya causado un problema real.
-- Solo quita la columna nueva `categorias`; no toca `tipo_negocio` (nunca
-- se tocó en la migración original tampoco).

ALTER TABLE fonditas DROP COLUMN IF EXISTS categorias;
