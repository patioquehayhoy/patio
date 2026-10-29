// Etiquetas de reseña (app/resena/[id].tsx). Compartidas con lib/patio-stats.ts
// para que las reseñas sintéticas del panel de Reseñas (Fondero) usen el mismo
// vocabulario que el flujo real de escribir una reseña (Foodie).
//
// Patrón de calificación guiada (Uber): con 4–5 estrellas se pregunta qué
// destacó; con 1–3, qué faltó. Pocas y del giro del lugar —nunca un carrusel—:
// tres propias del giro más las comunes, ocho como máximo.
const COMMON_GOOD = ['Bien servido', 'Buen precio', 'Trato amable', 'Limpio'];
const COMMON_BAD = ['Tardaron mucho', 'Porción chica', 'Caro para lo que es', 'Llegó frío', 'Poco limpio', 'Mal trato'];

const BY_CATEGORY: Record<string, string[]> = {
  Fondita: ['Sazón casero', 'Caldoso', 'Recién hecho'],
  Taquería: ['Salsas ricas', 'Tortillas hechas a mano', 'Buen trompo'],
  Antojitos: ['Recién hecho', 'Salsas ricas', 'Tortillas hechas a mano'],
  Elotes: ['Bien preparado', 'Salsas ricas', 'Recién hecho'],
  Botanas: ['Bien preparado', 'Salsas ricas', 'Crujiente'],
  Postres: ['Recién horneado', 'Dulce en su punto', 'Bonita presentación'],
  Café: ['Buen café', 'Pan rico', 'Para quedarse'],
  Mariscos: ['Fresco', 'Bien sazonado', 'Buena porción'],
  Bebidas: ['Bien frío', 'Buen sabor', 'Variedad'],
  'Jugos y fruta': ['Fruta fresca', 'Recién hecho', 'Bien frío'],
  Restaurante: ['Sazón casero', 'Buen ambiente', 'Recién hecho'],
};

export const REVIEW_TAGS = [...BY_CATEGORY.Fondita, ...COMMON_GOOD];

export function reviewTags(categories: readonly string[], stars: number): { label: string; tags: string[] } {
  if (stars > 0 && stars <= 3) return { label: '¿Qué faltó?', tags: COMMON_BAD };
  const own = categories.flatMap((category) => BY_CATEGORY[category] ?? []);
  const tags = [...new Set([...(own.length ? own : BY_CATEGORY.Fondita), ...COMMON_GOOD])].slice(0, 8);
  return { label: '¿Qué destacó?', tags };
}
