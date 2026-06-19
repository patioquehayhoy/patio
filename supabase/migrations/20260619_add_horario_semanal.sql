-- Horario semanal por día (base + excepciones).
-- Reemplaza el modelo viejo de un solo rango (columna `horario` text), que se
-- conserva intacta para compatibilidad y fallback de fonditas existentes.
--
-- Estructura del jsonb: array de 7 días
--   [{ "dia": 0..6, "cerrado": bool, "abre": "HH:MM"|null, "cierra": "HH:MM"|null }, ...]
--   dia 0=Domingo … 6=Sábado (alineado con Date.getDay()).
--   Si cierra <= abre, el turno cruza la medianoche.

ALTER TABLE fonditas ADD COLUMN IF NOT EXISTS horario_semanal jsonb;
