import type { HorarioSemanal } from './horario';

// ─── ID helpers ───────────────────────────────────────────────────────────────
export function makeSectionId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
export function makePlatilloId(): string {
  return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Platillo {
  id: string;
  nombre: string;
  descripcion: string;
  precio: string;
  confianza?: number;
  revision?: string;
}

export interface Seccion {
  id: string;
  nombre: string;
  precio: string;
  platillos: Platillo[];
}

export type MenuData = {
  /** Solo contexto local del editor; cleanMenu lo excluye del menú público. */
  localDraftId?: string;
  secciones: Seccion[];
};

export type MenuExtractionSnapshot = {
  menu: MenuData;
  warnings: string[];
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
const SECCION_DEFAULTS: Record<string, string[]> = {
  fondita:    ['1ER TIEMPO', '2DO TIEMPO', '3ER TIEMPO', 'BEBIDAS'],
  taqueria:   ['TACOS', 'COMPLEMENTOS', 'BEBIDAS'],
  reposteria: ['PASTELES', 'PIEZAS', 'BEBIDAS'],
  mariscos:   ['ENTRADAS', 'CALDOS', 'PLATOS FUERTES', 'BEBIDAS'],
  antojitos:  ['ANTOJITOS', 'EXTRAS', 'BEBIDAS'],
  elotes:     ['ELOTES Y ESQUITES', 'BOTANAS', 'EXTRAS', 'BEBIDAS'],
  botanas:    ['DORILOCOS Y BOTANAS', 'EXTRAS', 'BEBIDAS'],
  bebidas:    ['BEBIDAS', 'TAMAÑOS', 'EXTRAS'],
  jugos:      ['JUGOS', 'LICUADOS', 'FRUTA PREPARADA'],
  restaurante:['ENTRADAS', 'PLATOS FUERTES', 'POSTRES', 'BEBIDAS'],
  otro:       ['SECCIÓN 1'],
};

// Nombres de sección típicos del giro, para sugerir mientras el fondero arma
// su menú. Con el tiempo esto puede alimentarse de su historial real.
export function seccionSugerencias(tipo?: string | null): string[] {
  return (tipo ? SECCION_DEFAULTS[tipo] : null) ?? SECCION_DEFAULTS['fondita'];
}

// Forma canónica de un nombre de sección para comparar equivalencias:
// "PRIMER TIEMPO" ≡ "1ER TIEMPO", sin acentos, sin espacios dobles. Evita
// sugerir una sección que el fondero ya escribió con otras palabras.
export function canonicalSeccion(nombre: string): string {
  return nombre
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\bPRIMERO?\b/g, '1ER')
    .replace(/\bSEGUNDO\b/g, '2DO')
    .replace(/\bTERCERO?\b/g, '3ER')
    .replace(/\bCUARTO\b/g, '4TO')
    .replace(/\s+/g, ' ');
}

// Forma canónica de un nombre de platillo para acumular likes entre
// publicaciones distintas: el "Mole con pollo" de hoy y el de la semana
// pasada deben contar como el mismo platillo, no como dos objetos sueltos
// (hoy cada Platillo nace con un id nuevo por publicación — makePlatilloId()
// — sin ninguna liga entre días). Mismo criterio que canonicalSeccion.
export function canonicalDishName(nombre: string): string {
  return nombre
    .trim()
    .toUpperCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ');
}

export function makeDefaultMenu(tipo?: string | null): MenuData {
  const nombres: string[] = (tipo ? SECCION_DEFAULTS[tipo] : null) ?? SECCION_DEFAULTS['fondita'];
  return {
    secciones: nombres.map(nombre => ({
      id: makeSectionId(),
      nombre,
      precio: '',
      platillos: [],
    })),
  };
}

// ─── Migration ────────────────────────────────────────────────────────────────
export function normalizeMenuData(raw: unknown): MenuData | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  const text = (item: unknown) => typeof item === 'string' ? item : typeof item === 'number' && Number.isFinite(item) ? String(item) : '';
  const object = (item: unknown): Record<string, unknown> | null =>
    item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null;
  const usedIds = new Set<string>();
  const uniqueId = (value: unknown, make: () => string) => {
    let id = text(value);
    if (!id || usedIds.has(id)) id = make();
    usedIds.add(id);
    return id;
  };
  const legacyDish = (item: unknown): Platillo | null => {
    if (typeof item !== 'string' || !item.trim()) return null;
    const divider = item.indexOf(' / ');
    return {
      id: makePlatilloId(),
      nombre: divider === -1 ? item : item.slice(0, divider),
      descripcion: divider === -1 ? '' : item.slice(divider + 3),
      precio: '',
    };
  };
  const section = (item: unknown): Seccion | null => {
    const sec = object(item);
    if (!sec) return null;
    let platillos: Platillo[];
    if (Array.isArray(sec.platillos)) {
      platillos = sec.platillos.flatMap((item): Platillo[] => {
        const dish = object(item);
        if (!dish) return [];
        return [{
          id: uniqueId(dish.id, makePlatilloId),
          nombre: text(dish.nombre),
          descripcion: text(dish.descripcion),
          precio: text(dish.precio),
          ...(typeof dish.confianza === 'number' && Number.isFinite(dish.confianza) ? { confianza: dish.confianza } : {}),
          ...(typeof dish.revision === 'string' ? { revision: dish.revision } : {}),
        }];
      });
    } else if (Array.isArray(sec.items)) {
      platillos = sec.items.map(legacyDish).filter((dish): dish is Platillo => dish !== null);
    } else return null;
    return { id: uniqueId(sec.id, makeSectionId), nombre: text(sec.nombre), precio: text(sec.precio), platillos };
  };

  // Normalize every section, including mixed legacy/current storage. Never
  // trust the first item as proof that all nested arrays and strings exist.
  if (Array.isArray(value.secciones)) {
    return { secciones: value.secciones.map(section).filter((sec): sec is Seccion => sec !== null) };
  }
  if (value.primerTiempo || value.segundoTiempo) {
    const legacy: [string, unknown][] = [
      ['1ER TIEMPO', value.primerTiempo], ['2DO TIEMPO', value.segundoTiempo],
      ['3ER TIEMPO', value.tercerTiempoGuisado], ['POSTRES', value.postre], ['BEBIDAS', value.aguas],
    ];
    return { secciones: legacy.flatMap(([nombre, item]) => {
      const sec = section({ ...object(item), nombre });
      return sec?.platillos.length ? [sec] : [];
    }) };
  }
  return null;
}

// ─── In-memory store ──────────────────────────────────────────────────────────
let _menuData: MenuData | null = null;
let _cartaData: MenuData | null = null;
let _menuExtractionSnapshot: MenuExtractionSnapshot | null = null;
let _fonditaName = '';
let _fonditaDescription = '';
let _tipoNegocio: string | null = null;

export function setMenuData(data: MenuData)  { _menuData  = data; }
export function getMenuData(): MenuData | null  { return _menuData; }
export function setCartaData(data: MenuData) { _cartaData = data; }
export function getCartaData(): MenuData | null { return _cartaData; }
export function setMenuExtractionSnapshot(snapshot: MenuExtractionSnapshot | null) {
  _menuExtractionSnapshot = snapshot;
}
export function getMenuExtractionSnapshot(): MenuExtractionSnapshot | null {
  return _menuExtractionSnapshot;
}
export function clearMenuExtractionSnapshot() {
  _menuExtractionSnapshot = null;
}
export function getFonditaName(): string { return _fonditaName; }
export function setFonditaName(name: string) { _fonditaName = name; }
export function getFonditaDescription(): string { return _fonditaDescription; }
export function setFonditaDescription(desc: string) { _fonditaDescription = desc; }
export function getTipoNegocio(): string | null { return _tipoNegocio; }
export function setTipoNegocio(t: string | null) { _tipoNegocio = t; }

let _fonditaDireccion = '';
let _fonditaDireccionVisible = false;
let _fonditaHorario = '';
let _fonditaHorarioSemanal: HorarioSemanal | null = null;
let _pagosEfectivo = false;
let _pagosTrans = false;
let _pagosTarjeta = false;

export function getFonditaDireccion(): string { return _fonditaDireccion; }
export function setFonditaDireccion(d: string) { _fonditaDireccion = d; }
export function getFonditaDireccionVisible(): boolean { return _fonditaDireccionVisible; }
export function setFonditaDireccionVisible(v: boolean) { _fonditaDireccionVisible = v; }
export function getFonditaHorario(): string { return _fonditaHorario; }
export function setFonditaHorario(v: string) { _fonditaHorario = v; }
export function getFonditaHorarioSemanal(): HorarioSemanal | null { return _fonditaHorarioSemanal; }
export function setFonditaHorarioSemanal(v: HorarioSemanal | null) { _fonditaHorarioSemanal = v; }
export function getPagosEfectivo(): boolean { return _pagosEfectivo; }
export function setPagosEfectivo(v: boolean) { _pagosEfectivo = v; }
export function getPagosTrans(): boolean { return _pagosTrans; }
export function setPagosTrans(v: boolean) { _pagosTrans = v; }
export function getPagosTarjeta(): boolean { return _pagosTarjeta; }
export function setPagosTarjeta(v: boolean) { _pagosTarjeta = v; }

// Fondita DB id (kept here for backward compat)
let _fonditaId: string | null = null;
export function getFonditaId(): string | null { return _fonditaId; }
export function setFonditaId(id: string | null) { _fonditaId = id; }

// Cierre/cambio de cuenta: ningún borrador, foto ni identidad queda en RAM.
export function resetMenuStore() {
  _menuData = null;
  _cartaData = null;
  _menuExtractionSnapshot = null;
  _fonditaName = '';
  _fonditaDescription = '';
  _tipoNegocio = null;
  _fonditaDireccion = '';
  _fonditaDireccionVisible = false;
  _fonditaHorario = '';
  _fonditaHorarioSemanal = null;
  _pagosEfectivo = false;
  _pagosTrans = false;
  _pagosTarjeta = false;
  _fonditaId = null;
}
