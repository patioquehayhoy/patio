import { ahoraCDMX, estaAbiertoAhora, hhmmToMin, type DiaHorario } from './horario';
import type { Patio } from './patios';

export type PatioCardPrice = {
  label: string;
  accessibilityLabel: string;
  source: 'patio' | 'menu' | 'missing';
};

export type PatioCardInfoData = {
  name: string;
  area: string;
  verified: boolean;
  open: boolean | null;
  openLabel: string;
  menuLabel: string;
  price: PatioCardPrice;
  publicRating: string;
  publicRatingAccessibilityLabel: string;
  personalRating: string;
  personalRatingAccessibilityLabel: string;
  distance: string;
  distanceAccessibilityLabel: string;
};

export type PatioCardInfoOptions = {
  distanceLabel?: string | null;
  personalRating?: number | null;
  now?: Date;
};

// Accept only complete published amounts/ranges. Text such as "desde 80",
// size variants or "$" cannot establish both ends of a reliable range.
function numericPriceRange(value?: string | null): [number, number] | null {
  const clean = value?.trim().replace(/\s*MXN\s*$/i, '') ?? '';
  const amount = '(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d{1,2})?';
  const match = clean.match(new RegExp(`^\\$?\\s*(${amount})(?:\\s*[–—-]\\s*\\$?\\s*(${amount}))?$`));
  if (!match) return null;
  const first = Number(match[1].replace(/,/g, ''));
  const last = Number((match[2] ?? match[1]).replace(/,/g, ''));
  if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0 || last <= 0) return null;
  return [Math.min(first, last), Math.max(first, last)];
}

function amountLabel(amount: number): string {
  return amount.toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

function priceInfo(min: number, max: number, source: 'patio' | 'menu'): PatioCardPrice {
  const label = min === max ? `$${amountLabel(min)}` : `$${amountLabel(min)}–${amountLabel(max)}`;
  return {
    label,
    source,
    accessibilityLabel: min === max
      ? `Precio publicado, ${amountLabel(min)} pesos`
      : `Precios publicados, de ${amountLabel(min)} a ${amountLabel(max)} pesos`,
  };
}

/** Published prices, never an estimate of average spend or price per person. */
export function patioCardPrice(patio: Pick<Patio, 'price' | 'menu'>): PatioCardPrice {
  const published = numericPriceRange(patio.price);
  if (published) return priceInfo(published[0], published[1], 'patio');

  const amounts = patio.menu.flatMap((section) => [section.price, ...section.items.map((item) => item.price)])
    .flatMap((price) => numericPriceRange(price) ?? []);
  if (amounts.length) return priceInfo(Math.min(...amounts), Math.max(...amounts), 'menu');
  return { label: 'Sin precio', accessibilityLabel: 'Sin precios publicados', source: 'missing' };
}

function knownHours(day: DiaHorario | undefined): boolean {
  return !!day && (day.cerrado || (hhmmToMin(day.abre) !== null && hhmmToMin(day.cierra) !== null));
}

/** Missing/incomplete hours stay unknown; sold-out stock does not mean closed. */
export function patioCardOpenState(patio: Pick<Patio, 'weeklyHours'>, now = new Date()): boolean | null {
  if (!patio.weeklyHours) return null;
  const current = ahoraCDMX(now);
  const open = estaAbiertoAhora(patio.weeklyHours, current);
  if (open === true) return true;
  const today = patio.weeklyHours.find((day) => day.dia === current.dia);
  const yesterday = patio.weeklyHours.find((day) => day.dia === (current.dia + 6) % 7);
  return knownHours(today) && knownHours(yesterday) ? false : null;
}

function validRating(value: string | number | undefined | null): number | null {
  if (value == null || String(value).trim() === '') return null;
  const rating = Number(value);
  return Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

export function getPatioCardInfo(patio: Patio, options: PatioCardInfoOptions = {}): PatioCardInfoData {
  const open = patioCardOpenState(patio, options.now);
  const rating = validRating(patio.rating);
  const ownRating = validRating(options.personalRating);
  const count = patio.ratingCount != null && Number.isInteger(patio.ratingCount) && patio.ratingCount > 0
    ? patio.ratingCount : null;
  const distance = options.distanceLabel?.trim() || null;
  return {
    name: patio.name,
    area: patio.area.trim() || patio.categories[0] || 'Sin ubicación',
    verified: patio.isVerifiedBusiness === true,
    open,
    openLabel: open === true ? 'Abierto' : open === false ? 'Cerrado' : 'Sin horario',
    menuLabel: patio.hasTodayMenu === true ? 'Menú de hoy' : patio.hasTodayMenu === false ? 'Sin menú hoy' : 'Menú sin datos',
    price: patioCardPrice(patio),
    publicRating: rating === null ? '—' : `${rating.toFixed(1)}${count === null ? '' : ` (${count})`}`,
    publicRatingAccessibilityLabel: rating === null ? 'Sin calificaciones públicas'
      : `Calificación pública, ${rating.toFixed(1)} de 5${count === null ? '' : `, ${count} ${count === 1 ? 'reseña' : 'reseñas'}`}`,
    personalRating: ownRating === null ? 'Tu calificación: —' : `Tu calificación: ${ownRating.toFixed(1)}`,
    personalRatingAccessibilityLabel: ownRating === null ? 'Sin calificación propia' : `Tu calificación, ${ownRating.toFixed(1)} de 5`,
    distance: distance ?? '—',
    distanceAccessibilityLabel: distance ? `Distancia, ${distance}` : 'Distancia no disponible',
  };
}
