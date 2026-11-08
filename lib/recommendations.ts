import type { Patio } from './patios';

// «Parecidos cerca» después de reseñar: lugares que se parecen al que acabas
// de calificar (giros y platillos en común) y quedan cerca. Hoy es una
// similitud por palabras (giros + platillos); con más catálogo se puede pasar
// a búsqueda vectorial (embeddings en Supabase con pgvector).

type Point = { latitude: number; longitude: number };

const STOP = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'con', 'y', 'en', 'a', 'al', 'sin', 'por', 'para', 'o']);

function words(text: string): string[] {
  return text
    .toLocaleLowerCase('es-MX')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9ñ]+/)
    .filter((word) => word.length > 2 && !STOP.has(word));
}

/** Bolsa de palabras del lugar: sus giros y lo que vende. */
export function placeTerms(patio: Pick<Patio, 'categories' | 'menu'>): Set<string> {
  const terms = new Set<string>();
  for (const category of patio.categories) for (const word of words(category)) terms.add(`giro:${word}`);
  for (const section of patio.menu) {
    for (const item of section.items) {
      for (const word of words(item.name)) terms.add(word);
      for (const tag of item.tags ?? []) for (const word of words(tag)) terms.add(word);
    }
  }
  return terms;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const term of a) if (b.has(term)) shared++;
  return shared / (a.size + b.size - shared);
}

function km(a: Point, b: Point): number {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.latitude - a.latitude) * rad) / 2) ** 2
    + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(((b.longitude - a.longitude) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/**
 * Hasta `limit` lugares parecidos: 70 % parecido (giros pesan doble que un
 * platillo) y 30 % cercanía al lugar reseñado. Nunca el mismo lugar ni los que
 * ya reseñaste; solo con algo en común.
 */
export function similarPlaces(base: Patio, all: Patio[], exclude: Set<string> = new Set(), limit = 3): Patio[] {
  const baseTerms = placeTerms(base);
  const giros = new Set([...baseTerms].filter((term) => term.startsWith('giro:')));
  return all
    .filter((patio) => patio.id !== base.id && !exclude.has(patio.id) && patio.latitude && patio.longitude)
    .map((patio) => {
      const terms = placeTerms(patio);
      const sharedGiro = [...giros].some((giro) => terms.has(giro)) ? 1 : 0;
      const similarity = 0.7 * (0.5 * sharedGiro + 0.5 * Math.min(1, jaccard(baseTerms, terms) * 4));
      const nearness = 0.3 / (1 + km(base, patio));
      return { patio, similarity, score: similarity + nearness };
    })
    .filter(({ similarity }) => similarity > 0.08)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ patio }) => patio);
}
