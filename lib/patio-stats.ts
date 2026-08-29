// Estadísticas del Patio para la pantalla de Reseñas (Fondero): vistas +
// reseñas de quienes visitaron.
//
// Hoy no existe backend real para esto: `lib/ratings.ts` guarda reseñas solo
// en el AsyncStorage de cada teléfono (nunca llegan a Supabase) y no hay
// ningún contador de vistas por fondita en ningún lado del código. Construir
// eso es trabajo de backend real (tabla + RLS + migración), pendiente en
// `docs/TASKS.md` (ciclo 2026-07-23).
//
// Mientras tanto, esta función devuelve datos sintéticos y deterministas
// (mismo seed → mismo resultado, no "saltan" entre renders) para poder
// diseñar y sentir la interacción completa de la pantalla. Nunca corre fuera
// de `__DEV__` — en producción no hay dato real que mostrar todavía, y
// mostrar números inventados a un Fondero real sería engañoso.

import { REVIEW_TAGS } from './review-tags';

export type DemoReview = {
  stars: number;
  tags: string[];
  note: string;
  author: string;
  daysAgo: number;
};

export type DemoDishLike = {
  dishName: string;
  authors: string[];
  daysAgo: number;
};

export type PatioStatsSnapshot = {
  views: number;
  ratingAvg: number;
  ratingCount: number;
  reviews: DemoReview[];
  dishLikes: DemoDishLike[];
};

const DEMO_NOTES: { note: string; author: string }[] = [
  { note: 'Rico y bien servido, como siempre.', author: 'Ana' },
  { note: 'Rápido y a buen precio.', author: 'Luis' },
  { note: 'El mejor de la cuadra.', author: 'Vale' },
  { note: 'Las tortillas hechas a mano se sienten.', author: 'Diego' },
  { note: 'Buen trato y porciones generosas.', author: 'Marisol' },
];

// Nombres genéricos de fondita mexicana — el like es una feature nueva sin
// datos reales todavía en ninguna cuenta; no hay menú real del que tomar
// nombres de platillo de forma honesta, así que se usa un pool creíble en
// vez de inventar contra el menú real de alguien.
const DEMO_DISHES = ['Mole con pollo', 'Chiles rellenos', 'Consomé de pollo', 'Milanesa de res', 'Enchiladas verdes'];
const DEMO_LIKE_AUTHORS = ['Ana', 'Luis', 'Vale', 'Diego', 'Marisol', 'Fernanda', 'Carlos'];

function seedHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return hash;
}

export function getDemoPatioStats(seed: string): PatioStatsSnapshot | null {
  if (!__DEV__ || !seed) return null;
  const hash = seedHash(seed);
  const ratingCount = 2 + (hash % 9);
  const reviews: DemoReview[] = Array.from({ length: Math.min(ratingCount, 6) }, (_, i) => {
    const h = seedHash(`${seed}-${i}`);
    const { note, author } = DEMO_NOTES[h % DEMO_NOTES.length];
    return {
      stars: 4 + (h % 2), // 4 o 5 estrellas
      tags: [REVIEW_TAGS[h % REVIEW_TAGS.length], REVIEW_TAGS[(h + 2) % REVIEW_TAGS.length]],
      note,
      author,
      daysAgo: 1 + (h % 12),
    };
  });
  const ratingAvg = Math.round((reviews.reduce((sum, r) => sum + r.stars, 0) / reviews.length) * 10) / 10;

  // 1-3 platillos con like, cada uno de 1-3 personas — para que se vea la
  // fusión real de la fila agrupada, no solo un caso trivial de una persona.
  const likeEventCount = 1 + (hash % 3);
  const dishLikes: DemoDishLike[] = Array.from({ length: likeEventCount }, (_, i) => {
    const h = seedHash(`${seed}-like-${i}`);
    const authorCount = 1 + (h % 3);
    const authors = [...new Set(Array.from({ length: authorCount }, (_, j) =>
      DEMO_LIKE_AUTHORS[seedHash(`${seed}-like-${i}-${j}`) % DEMO_LIKE_AUTHORS.length]
    ))];
    return { dishName: DEMO_DISHES[h % DEMO_DISHES.length], authors, daysAgo: h % 10 };
  });

  return { views: 8 + (hash % 40), ratingAvg, ratingCount, reviews, dishLikes };
}
