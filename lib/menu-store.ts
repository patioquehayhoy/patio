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
}

export interface Seccion {
  id: string;
  nombre: string;
  precio: string;
  platillos: Platillo[];
}

export type MenuData = {
  secciones: Seccion[];
};

// ─── Defaults ─────────────────────────────────────────────────────────────────
const SECCION_DEFAULTS: Record<string, string[]> = {
  fondita:    ['1ER TIEMPO', '2DO TIEMPO', '3ER TIEMPO', 'BEBIDAS'],
  taqueria:   ['TACOS', 'COMPLEMENTOS', 'BEBIDAS'],
  reposteria: ['PASTELES', 'PIEZAS', 'BEBIDAS'],
  mariscos:   ['ENTRADAS', 'CALDOS', 'PLATOS FUERTES', 'BEBIDAS'],
  otro:       ['SECCIÓN 1'],
};

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
export function normalizeMenuData(raw: any): MenuData | null {
  if (!raw) return null;

  // v3: new format (platillos array)
  if (Array.isArray(raw.secciones)) {
    const first = raw.secciones[0];
    if (!first || 'platillos' in first) {
      return { secciones: raw.secciones } as MenuData;
    }

    // v2: items-string format → convert to platillos
    if ('items' in first) {
      return {
        secciones: raw.secciones.map((sec: any) => ({
          id: sec.id ?? makeSectionId(),
          nombre: sec.nombre ?? '',
          precio: sec.precio ?? '',
          platillos: (sec.items ?? []).filter(Boolean).map((item: string) => {
            const si = item.indexOf(' / ');
            return {
              id: makePlatilloId(),
              nombre: si !== -1 ? item.slice(0, si) : item,
              descripcion: si !== -1 ? item.slice(si + 3) : '',
              precio: '',
            };
          }),
        })),
      };
    }
  }

  // v1: original fixed-field format
  if (raw.primerTiempo || raw.segundoTiempo) {
    const secciones: Seccion[] = [];
    const add = (nombre: string, sec: any) => {
      if (sec?.items?.some(Boolean)) {
        secciones.push({
          id: makeSectionId(),
          nombre,
          precio: '',
          platillos: sec.items.filter(Boolean).map((item: string) => {
            const si = item.indexOf(' / ');
            return {
              id: makePlatilloId(),
              nombre: si !== -1 ? item.slice(0, si) : item,
              descripcion: si !== -1 ? item.slice(si + 3) : '',
              precio: '',
            };
          }),
        });
      }
    };
    add('1ER TIEMPO', raw.primerTiempo);
    add('2DO TIEMPO', raw.segundoTiempo);
    add('3ER TIEMPO', raw.tercerTiempoGuisado);
    add('POSTRES',    raw.postre);
    add('BEBIDAS',    raw.aguas);
    return { secciones };
  }

  return null;
}

// ─── In-memory store ──────────────────────────────────────────────────────────
let _menuData: MenuData | null = null;
let _cartaData: MenuData | null = null;
let _fonditaName = '';
let _fonditaDescription = '';
let _tipoNegocio: string | null = null;

export function setMenuData(data: MenuData)  { _menuData  = data; }
export function getMenuData(): MenuData | null  { return _menuData; }
export function setCartaData(data: MenuData) { _cartaData = data; }
export function getCartaData(): MenuData | null { return _cartaData; }
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
