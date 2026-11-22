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

/**
 * Encabezado que empieza lo de siempre en el editor: la carta («CARTA», «A LA
 * CARTA», «Carta $110») o «LO DE SIEMPRE» / «DE SIEMPRE».
 */
export function isCartaHeading(name: string): boolean {
  return isCartaName(name) || /^(?:lo )?de siempre\b/.test(plain(name));
}

/**
 * El editor es un pizarrón (2026-11-16, Parco): solo secciones con su título
 * y su precio. Desde el encabezado de la carta hacia abajo todo es carta (se
 * queda para los días que siguen); lo de arriba es lo de hoy. La marca
 * `carta` sale de la posición, nunca de un bloque aparte.
 */
export function cartaByHeading(secciones: Seccion[]): Seccion[] {
  const start = secciones.findIndex((section) => isCartaHeading(section.nombre));
  return secciones.map((section, index) => {
    // Si «CARTA» es lo primero, no hay nada de hoy arriba: todo se publica
    // como el menú (igual que una foto que solo trae la carta).
    const carta = start > 0 && index >= start;
    if (!!section.carta === carta) return section;
    if (carta) return { ...section, carta: true };
    const { carta: _flag, ...rest } = section;
    return rest;
  });
}

/**
 * Una carta guardada empieza con su encabezado. Si no lo trae (por ejemplo,
 * la leída de una foto con «ESPECIALIDADES» abajo de «CARTA»), se le pone
 * «CARTA» sin precio, para que siga siendo carta en el editor.
 */
export function withCartaHeading(carta: Seccion[], makeId: () => string): Seccion[] {
  if (!carta.length || isCartaHeading(carta[0].nombre)) return carta;
  return [{ id: makeId(), nombre: 'CARTA', precio: '', platillos: [], carta: true }, ...carta];
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

/**
 * Firma del contenido de la carta para saber si cambió (sin ids). Cuenta la
 * foto y los otros nombres del platillo: ponerle foto a un platillo de la
 * carta también es un cambio que se guarda.
 */
export function cartaSignature(carta: MenuData): string {
  return JSON.stringify(carta.secciones.map((section) => [
    section.nombre.trim(),
    section.precio.trim(),
    section.platillos.filter((dish) => dish.nombre.trim()).map((dish) => [
      dish.nombre.trim(),
      dish.descripcion.trim(),
      dish.precio.trim(),
      dish.foto ?? '',
      (dish.antes ?? []).join('|'),
      // «No» también es una respuesta guardada: no volver a preguntar al abrir.
      dish.vegetariano === true ? 'vegetariano' : dish.vegetariano === false ? 'no vegetariano' : '',
    ]),
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
