import { ahoraCDMX, estaAbiertoAhora, hhmmToMin, minutosAHHMM, minutosParaCerrar, type DiaHorario } from './horario';
import type { Patio } from './patios';

export type PatioCardPrice = {
  label: string;
  accessibilityLabel: string;
  /**
   * menu-day: el «Precio del menú» que pone el negocio (comida corrida);
   * menu: el precio típico de su menú; patio: precio publicado en su perfil.
   */
  source: 'menu-day' | 'menu' | 'patio' | 'missing';
  /** El número que representa al lugar al ordenar y comparar. */
  value: number | null;
};

export type PatioCardInfoData = {
  name: string;
  area: string;
  verified: boolean;
  open: boolean | null;
  openLabel: string;
  closingSoon: boolean;
  closingLabel: string | null;
  closingAccessibilityLabel: string | null;
  menuLabel: string;
  price: PatioCardPrice;
  publicRating: string;
  publicRatingValue: number | null;
  publicRatingAccessibilityLabel: string;
  personalRating: string;
  personalRatingValue: number | null;
  personalRatingAccessibilityLabel: string;
  distance: string;
  distanceAccessibilityLabel: string;
};

export type PatioCardInfoOptions = {
  distanceLabel?: string | null;
  personalRating?: number | null;
  includePersonalRating?: boolean;
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

function rangeLabel(min: number, max: number): string {
  return min === max ? `$${amountLabel(min)}` : `$${amountLabel(min)}–${amountLabel(max)}`;
}

// Secciones que acompañan (bebidas, extras): no dicen lo que cuesta comer,
// salvo que sean la mayoría del menú (un café o una juguería).
const SIDE_SECTION = /^(bebidas?|aguas?|refrescos?|jugos?|licuados?|cervezas?|extras?|adicionales?|complementos?|guarnicion(es)?|acompanamientos?|tortillas?|salsas?)\b/;

function isSideSection(name: string): boolean {
  return SIDE_SECTION.test(name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase());
}

/** The middle published amount (the upper one on even counts): always a real menu price. */
function middleAmount(amounts: number[]): number {
  const sorted = [...amounts].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function amountsOf(price?: string | null): number[] {
  const range = numericPriceRange(price);
  return !range ? [] : range[0] === range[1] ? [range[0]] : range;
}

/**
 * Un solo precio típico, tomado siempre de lo que el negocio publicó (nunca
 * un estimado de gasto): el «Precio del menú» si lo puso; si no, el precio de
 * en medio de su menú, sin bebidas ni extras. El rango del más barato al más
 * caro lo dicen el menú y la etiqueta de accesibilidad: sus extremos suelen
 * ser un agua y un platillo para compartir (auditoría 2026-11-08).
 */
export function patioCardPrice(patio: Pick<Patio, 'price' | 'menu'>): PatioCardPrice {
  // El editor guarda el «Precio del menú» en una sola sección; varias
  // secciones con precio son precios por sección (menús leídos de foto).
  const pricedSections = patio.menu.filter((section) => amountsOf(section.price).length);
  if (pricedSections.length === 1) {
    const [low, high = low] = amountsOf(pricedSections[0].price);
    return {
      label: rangeLabel(low, high),
      source: 'menu-day',
      value: (low + high) / 2,
      accessibilityLabel: low === high
        ? `Precio del menú, ${amountLabel(low)} pesos`
        : `Precio del menú, de ${amountLabel(low)} a ${amountLabel(high)} pesos`,
    };
  }

  const entries = patio.menu.flatMap((section) => {
    const side = isSideSection(section.section);
    return [...amountsOf(section.price), ...section.items.flatMap((item) => amountsOf(item.price))]
      .map((amount) => ({ amount, side }));
  });
  if (entries.length) {
    const main = entries.filter((entry) => !entry.side);
    const typical = middleAmount((main.length * 2 >= entries.length ? main : entries).map((entry) => entry.amount));
    const all = entries.map((entry) => entry.amount);
    const low = Math.min(...all);
    const high = Math.max(...all);
    return {
      label: `$${amountLabel(typical)}`,
      source: 'menu',
      value: typical,
      accessibilityLabel: low === high
        ? `Precio típico, ${amountLabel(typical)} pesos`
        : `Precio típico, ${amountLabel(typical)} pesos. En el menú, de ${amountLabel(low)} a ${amountLabel(high)} pesos`,
    };
  }

  const published = numericPriceRange(patio.price);
  if (published) {
    const [low, high] = published;
    return {
      label: rangeLabel(low, high),
      source: 'patio',
      value: (low + high) / 2,
      accessibilityLabel: low === high
        ? `Precio publicado, ${amountLabel(low)} pesos`
        : `Precios publicados, de ${amountLabel(low)} a ${amountLabel(high)} pesos`,
    };
  }
  return { label: 'Sin precio', accessibilityLabel: 'Sin precios publicados', source: 'missing', value: null };
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

function compactReviewCount(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(count);
}

export function getPatioCardInfo(patio: Patio, options: PatioCardInfoOptions = {}): PatioCardInfoData {
  const now = options.now ?? new Date();
  const current = ahoraCDMX(now);
  const open = patioCardOpenState(patio, now);
  const remaining = open ? minutosParaCerrar(patio.weeklyHours, current) : null;
  const closingSoon = remaining !== null && remaining <= 30;
  const today = patio.weeklyHours?.find((day) => day.dia === current.dia);
  const yesterday = patio.weeklyHours?.find((day) => day.dia === (current.dia + 6) % 7);
  const activeDay = [today, yesterday].find((day) => {
    const start = hhmmToMin(day?.abre ?? null);
    const end = hhmmToMin(day?.cierra ?? null);
    if (!day || day.cerrado || start === null || end === null) return false;
    return day === today
      ? current.minutos >= start && (end <= start || current.minutos < end)
      : end <= start && current.minutos < end;
  });
  const allDay = remaining !== null && !!activeDay && hhmmToMin(activeDay.abre) === hhmmToMin(activeDay.cierra);
  const closingTime = remaining === null ? null : minutosAHHMM((current.minutos + remaining) % 1440);
  const closingLabel = closingTime === null ? null : allDay ? 'Abierto 24 h' : `Cierra ${closingTime}`;
  const rating = validRating(patio.rating);
  const ownRating = validRating(options.personalRating);
  const count = patio.ratingCount != null && Number.isInteger(patio.ratingCount) && patio.ratingCount > 0
    ? patio.ratingCount : null;
  const distance = options.distanceLabel?.trim() || null;
  return {
    name: patio.name,
    area: patio.area.trim(),
    verified: patio.isVerifiedBusiness === true,
    open,
    closingSoon,
    closingLabel,
    closingAccessibilityLabel: closingTime === null ? null : allDay ? 'Horario publicado, abierto 24 horas' : `Horario publicado, cierra a las ${closingTime}`,
    openLabel: open === true ? (closingSoon ? 'Cierra pronto' : 'Abierto') : open === false ? 'Cerrado' : 'Sin horario',
    menuLabel: patio.hasTodayMenu === true ? 'Menú de hoy' : patio.hasTodayMenu === false ? 'Sin menú hoy' : 'Menú sin datos',
    price: patioCardPrice(patio),
    publicRating: rating === null ? '—' : `${rating.toFixed(1)}${count === null ? '' : ` (${compactReviewCount(count)})`}`,
    publicRatingValue: rating,
    publicRatingAccessibilityLabel: rating === null ? 'Sin calificaciones públicas'
      : `Calificación pública, ${rating.toFixed(1)} de 5${count === null ? '' : `, ${count} ${count === 1 ? 'reseña' : 'reseñas'}`}`,
    personalRating: ownRating === null ? 'Tu calificación: —' : `Tu calificación: ${ownRating.toFixed(1)}`,
    personalRatingValue: ownRating,
    personalRatingAccessibilityLabel: ownRating === null ? 'Sin calificación propia' : `Tu calificación, ${ownRating.toFixed(1)} de 5`,
    distance: distance ?? '—',
    distanceAccessibilityLabel: distance ? `Distancia, ${distance}` : 'Distancia no disponible',
  };
}

/** A navigable card groups its children for VoiceOver/TalkBack. Include the
 * meaning of the color dot and the full text hidden by the compact layout. */
export function patioCardAccessibilityLabel(patio: Patio, options: PatioCardInfoOptions = {}): string {
  const info = getPatioCardInfo(patio, options);
  return [
    `Abrir ${info.name}`, info.area,
    info.verified ? 'Negocio verificado' : '', info.openLabel, info.closingAccessibilityLabel,
    info.price.accessibilityLabel, info.publicRatingAccessibilityLabel,
    options.distanceLabel?.trim() ? info.distanceAccessibilityLabel : '',
    options.includePersonalRating || validRating(options.personalRating) !== null ? info.personalRatingAccessibilityLabel : '',
  ].filter(Boolean).join('. ');
}
