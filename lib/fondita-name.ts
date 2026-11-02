export const MAX_NOMBRE_LENGTH = 30;

// Letras (con acentos/ñ), números, espacios y la puntuación mínima real en
// nombres de negocio: apóstrofo, guion y ampersand ("Doña Lupita's",
// "Tacos & Mariscos"). Todo lo demás (emoji, símbolos) se descarta al vuelo
// mientras la persona escribe.
const NOMBRE_ALLOWED = /[^\p{L}\p{N}\s'’.\-&]/gu;

export function sanitizeNombreInput(value: string): string {
  return value.replace(NOMBRE_ALLOWED, '').slice(0, MAX_NOMBRE_LENGTH);
}
