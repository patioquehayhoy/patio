-- Multi-tag de categoría por fondita, modelo Google Places/Yelp: un lugar
-- puede traer varias etiquetas atómicas a la vez (ej. ['Elotes', 'Botanas'])
-- en vez de forzar una sola categoría compuesta ("Elotes y botanas"). La
-- columna vieja `tipo_negocio` se conserva intacta — sigue siendo el tag
-- PRIMARIO / fallback (perfil de lectura de menú por visión, secciones
-- sugeridas). No se borra ni se renombra: migración no destructiva.

ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS categorias text[] NOT NULL DEFAULT '{}';

-- Backfill de filas existentes a partir de `tipo_negocio`, con la misma
-- lógica que tipoLabels() en lib/patios.ts. 'elotes' es el único caso
-- especial: antes de este cambio era la ÚNICA etiqueta, compuesta,
-- "Elotes y botanas" — se expande a las dos etiquetas atómicas reales para
-- no perder significado en datos que ya existían antes del split.
-- Idempotente: solo toca filas que todavía no tienen `categorias` poblado.
UPDATE fonditas
SET categorias = CASE tipo_negocio
  WHEN 'fondita'     THEN ARRAY['Fondita']
  WHEN 'taqueria'    THEN ARRAY['Taquería']
  WHEN 'reposteria'  THEN ARRAY['Repostería']
  WHEN 'mariscos'    THEN ARRAY['Mariscos']
  WHEN 'antojitos'   THEN ARRAY['Antojitos']
  WHEN 'elotes'      THEN ARRAY['Elotes', 'Botanas']
  WHEN 'botanas'     THEN ARRAY['Botanas']
  WHEN 'bebidas'     THEN ARRAY['Bebidas']
  WHEN 'restaurante' THEN ARRAY['Restaurante']
  WHEN 'otro'        THEN ARRAY['Fondita']
  ELSE ARRAY['Fondita']
END
WHERE categorias = '{}';
