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

export type PatioStatsSnapshot = {
  views: number;
  ratingAvg: number;
  ratingCount: number;
  reviews: DemoReview[];
};

const DEMO_NOTES: { note: string; author: string }[] = [
  { note: 'Rico y bien servido, como siempre.', author: 'Ana' },
  { note: 'Rápido y a buen precio.', author: 'Luis' },
  { note: 'El mejor de la cuadra.', author: 'Vale' },
  { note: 'Las tortillas hechas a mano se sienten.', author: 'Diego' },
  { note: 'Buen trato y porciones generosas.', author: 'Marisol' },
];

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
  return { views: 8 + (hash % 40), ratingAvg, ratingCount, reviews };
}
