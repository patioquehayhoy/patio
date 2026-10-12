import { distanceKm } from './geo';
import { patioCardPrice } from './patio-card-info';
import type { Patio } from './patios';

export type PatioSortMode = 'recent' | 'rating' | 'az' | 'price' | 'distance';
export type Coordinates = { latitude: number; longitude: number };

export function patioDistance(origin: Coordinates | null, patio: Coordinates): number | null {
  if (!origin || !Number.isFinite(patio.latitude) || !Number.isFinite(patio.longitude)
    || Math.abs(patio.latitude) > 90 || Math.abs(patio.longitude) > 180
    || (patio.latitude === 0 && patio.longitude === 0)) return null;
  const distance = distanceKm(origin, patio);
  return Number.isFinite(distance) ? distance : null;
}

/** Uses the lower bound of a real published price, never a spend estimate. */
export function patioMinimumPrice(patio: Pick<Patio, 'price' | 'menu'>): number | null {
  const price = patioCardPrice(patio);
  if (price.source === 'missing') return null;
  return Number(price.label.replace(/^\$/, '').split('–')[0].replace(/,/g, ''));
}

/** Missing values last, preserving the original order for equal/unknown values. */
export function sortPatiosByMetric<T extends Patio>(patios: T[], metric: (patio: T) => number | null): T[] {
  return patios.map((patio, index) => ({ patio, index, value: metric(patio) }))
    .sort((a, b) => a.value === null ? (b.value === null ? a.index - b.index : 1)
      : b.value === null ? -1 : a.value - b.value || a.index - b.index)
    .map(({ patio }) => patio);
}
