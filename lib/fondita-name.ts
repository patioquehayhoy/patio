import { supabase } from '@/lib/supabase';

export const MAX_NOMBRE_LENGTH = 30;

// Letras (con acentos/ñ), números, espacios y la puntuación mínima real en
// nombres de negocio: apóstrofo, guion y ampersand ("Doña Lupita's",
// "Tacos & Mariscos"). Todo lo demás (emoji, símbolos) se descarta al vuelo
// mientras la persona escribe.
const NOMBRE_ALLOWED = /[^\p{L}\p{N}\s'’.\-&]/gu;

export function sanitizeNombreInput(value: string): string {
  return value.replace(NOMBRE_ALLOWED, '').slice(0, MAX_NOMBRE_LENGTH);
}

// Disponibilidad estilo "nombre de negocio", no "@usuario": compara
// exacto (sin distinguir mayúsculas) contra fonditas existentes. Si Supabase
// falla por red, no bloqueamos el alta — se vuelve a intentar al guardar.
export async function nombreDisponible(nombre: string, excludeId?: string | number): Promise<boolean> {
  const normalizado = nombre.trim();
  if (!normalizado) return true;

  let query = supabase.from('fonditas').select('id').ilike('nombre', normalizado);
  if (excludeId != null) query = query.neq('id', excludeId);

  const { data, error } = await query.limit(1);
  if (error) return true;
  return !data || data.length === 0;
}
