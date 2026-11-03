import { MAX_NOMBRE_LENGTH } from '@/lib/fondita-name';

// Largo máximo de lo que escribe la gente, en un solo lugar. La pantalla corta
// al escribir; los datos del negocio se repiten en la base
// (supabase/migrations/20261102140000_text_limits.sql).
export const TEXT_LIMITS = {
  /** Cabe en dos renglones sobre la foto de la ficha. */
  businessName: MAX_NOMBRE_LENGTH,
  businessDescription: 80,
  address: 80,
  menuName: 60,
  sectionName: 40,
  dishName: 60,
  dishDescription: 140,
  dishPrice: 7,
  reviewNote: 600,
} as const;
