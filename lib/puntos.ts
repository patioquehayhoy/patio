// Dónde se consigue cada negocio (2026-11-21), sin dependencias nativas para
// probarlo en Node. Un solo concepto para sucursales, tianguis o sobre ruedas y
// cocinas sin local (migración 20261121130000):
// · 'local': su dirección y, si tiene, otras sucursales (puntos sin días).
// · 'itinerante': un lugar distinto según el día (puntos con días).
// · 'domicilio': sin local; en el mapa sale su zona y se pide por WhatsApp o
//   llamada.

export type Modalidad = 'local' | 'itinerante' | 'domicilio';

export type Punto = {
  id: string;
  nombre: string;
  direccion?: string;
  latitude: number;
  longitude: number;
  /** Días de la semana (0 = domingo). Sin días: todos los que abre el negocio. */
  dias?: number[];
};

export type Coordinates = { latitude: number; longitude: number };

const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAY_SHORT = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
// Lunes primero, como el editor de horario.
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

export function isModalidad(value: unknown): value is Modalidad {
  return value === 'local' || value === 'itinerante' || value === 'domicilio';
}

const validCoords = (point: Coordinates) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
  && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180
  && !(point.latitude === 0 && point.longitude === 0);

const activeOn = (punto: Punto, weekday: number) => !punto.dias?.length || punto.dias.includes(weekday);

/**
 * Dónde está hoy, en orden: el primero es el pin principal del mapa.
 * Local: su dirección y luego sus sucursales. Itinerante: solo donde está
 * hoy (ningún lugar si hoy no sale). Domicilio: su zona.
 */
export function positionsFor(
  place: Coordinates & { modalidad?: Modalidad; puntos?: Punto[] },
  weekday: number,
): Coordinates[] {
  const main = validCoords(place) ? [{ latitude: place.latitude, longitude: place.longitude }] : [];
  const puntos = (place.puntos ?? []).filter((punto) => validCoords(punto) && activeOn(punto, weekday));
  const points = puntos.map(({ latitude, longitude }) => ({ latitude, longitude }));
  if (place.modalidad === 'domicilio') return main;
  if (place.modalidad === 'itinerante') return points;
  return [...main, ...points];
}

/** Los lugares de hoy que no son el principal (para pins de más en el mapa). */
export function extraPositionsFor(place: Coordinates & { modalidad?: Modalidad; puntos?: Punto[] }, weekday: number): Coordinates[] {
  return positionsFor(place, weekday).slice(1);
}

/** «Martes y sábado» · «Lunes a viernes» · «Todos los días». */
export function diasLabel(dias: number[] | undefined): string {
  const days = [...new Set(dias ?? [])].filter((day) => day >= 0 && day <= 6);
  if (!days.length || days.length === 7) return 'Todos los días';
  const ordered = WEEK_ORDER.filter((day) => days.includes(day));
  const positions = ordered.map((day) => WEEK_ORDER.indexOf(day));
  const consecutive = positions.every((position, index) => index === 0 || position === positions[index - 1] + 1);
  const name = (day: number) => DAY_NAMES[day];
  if (ordered.length >= 3 && consecutive) {
    const label = `${name(ordered[0])} a ${name(ordered[ordered.length - 1])}`;
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const names = ordered.map(name);
  const label = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayShort(day: number): string {
  return DAY_SHORT[day] ?? '';
}

export function dayName(day: number): string {
  return DAY_NAMES[day] ?? '';
}

/** ¿Está ese lugar hoy? (para marcar «Hoy» en la ficha). */
export function isToday(punto: Punto, weekday: number): boolean {
  return activeOn(punto, weekday);
}
