import { distanceKm } from './geo';
import { patioCardPrice } from './patio-card-info';
import type { Patio } from './patios';

export type PatioSortMode = 'recent' | 'rating' | 'az' | 'price' | 'distance';
export type Coordinates = { latitude: number; longitude: number };

export function patioDistance(origin: Coordinates | null, patio: Coordinates & { extraPositions?: Coordinates[] }): number | null {
  const one = (point: Coordinates) => {
    if (!origin || !Number.isFinite(point.latitude) || !Number.isFinite(point.longitude)
      || Math.abs(point.latitude) > 90 || Math.abs(point.longitude) > 180
      || (point.latitude === 0 && point.longitude === 0)) return null;
    const distance = distanceKm(origin, point);
    return Number.isFinite(distance) ? distance : null;
  };
  // Con varias sucursales, la que te queda más cerca (lib/puntos.ts).
  const distances = [patio, ...(patio.extraPositions ?? [])].map(one).filter((value): value is number => value !== null);
  return distances.length ? Math.min(...distances) : null;
}

/** Orders by the same typical price the card shows (2026-11-08), never by a menu extreme. */
export function patioTypicalPrice(patio: Pick<Patio, 'price' | 'menu'> & Pick<Partial<Patio>, 'menuPrices'>): number | null {
  return patioCardPrice(patio).value;
}

/** Missing values last, preserving the original order for equal/unknown values. */
export function sortPatiosByMetric<T extends Patio>(patios: T[], metric: (patio: T) => number | null): T[] {
  return patios.map((patio, index) => ({ patio, index, value: metric(patio) }))
    .sort((a, b) => a.value === null ? (b.value === null ? a.index - b.index : 1)
      : b.value === null ? -1 : a.value - b.value || a.index - b.index)
    .map(({ patio }) => patio);
}
