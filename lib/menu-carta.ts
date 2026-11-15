import type { MenuData, Seccion } from './menu-store';

// La carta en el mismo editor que el menú del día (2026-11-15, decisión de
// Parco con su pizarrón real): arriba «MENÚ $100» con lo que cambia cada día,
// abajo «CARTA $110» con lo de siempre y solo las excepciones con precio
// propio (filete $125, arrachera $150). En el editor son secciones marcadas
// `carta`; al guardar se separan: lo de hoy se publica y la carta queda en su
// tabla para los días que siguen.

const plain = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

/** «CARTA», «A LA CARTA», «La carta», «Carta $110»: encabezado de la carta. */
export function isCartaName(name: string): boolean {
  return /^(?:la |a la )?carta\b/.test(plain(name));
}

/** Separa lo de hoy de la carta; la carta sale sin la marca. */
export function splitCarta(data: MenuData): { hoy: MenuData; carta: MenuData } {
  const hoy = data.secciones.filter((section) => !section.carta);
  const carta = data.secciones
    .filter((section) => section.carta)
    .map(({ carta: _flag, ...section }) => section);
  return { hoy: { ...data, secciones: hoy }, carta: { secciones: carta } };
}

/** Lo de hoy y, debajo, la carta guardada, marcada para el editor. */
export function joinCarta(hoy: MenuData, carta: MenuData | null): MenuData {
  const daily = hoy.secciones.filter((section) => !section.carta);
  const saved = (carta?.secciones ?? []).map((section): Seccion => ({ ...section, carta: true }));
  return { ...hoy, secciones: [...daily, ...saved] };
}

/** Firma del contenido de la carta para saber si cambió (sin ids). */
export function cartaSignature(carta: MenuData): string {
  return JSON.stringify(carta.secciones.map((section) => [
    section.nombre.trim(),
    section.precio.trim(),
    section.platillos.filter((dish) => dish.nombre.trim()).map((dish) => [dish.nombre.trim(), dish.descripcion.trim(), dish.precio.trim()]),
  ]));
}

/**
 * Una foto del pizarrón trae las dos cosas: desde el encabezado «CARTA» hacia
 * abajo todo es carta (en el pizarrón la carta va al final).
 */
export function markCartaSections(secciones: Seccion[]): Seccion[] {
  const start = secciones.findIndex((section) => isCartaName(section.nombre));
  if (start <= 0) return secciones; // Sin carta, o la foto es solo la carta: se queda como menú.
  return secciones.map((section, index) => (index >= start ? { ...section, carta: true } : section));
}
