export type MenuSection = {
  enabled: boolean;
  items: string[];
  descs?: string[];
};

export type MenuData = {
  primerTiempo: MenuSection;
  segundoTiempo: MenuSection;
  tercerTiempoGuisado: MenuSection;
  postre: MenuSection;
  aguas: MenuSection;
  precio: { enabled: boolean; value: string };
};

const ORDS = ['1er', '2do', '3er'];

export function getTiempoLabels(data: MenuData) {
  const p = data.primerTiempo.enabled ? 1 : 0;
  const s = data.segundoTiempo.enabled ? 1 : 0;
  return {
    primerLabel: `${ORDS[0]} Tiempo`,
    segundoLabel: `${ORDS[p]} Tiempo`,
    tercerLabel: `${ORDS[p + s]} Tiempo`,
  };
}

export function buildWhatsAppMessage(data: MenuData, fonditaName: string): string {
  const { primerLabel, segundoLabel, tercerLabel } = getTiempoLabels(data);
  const lines: string[] = [];

  lines.push(`*${fonditaName}*`);
  lines.push('');

  if (data.primerTiempo.enabled && data.primerTiempo.items.some(Boolean)) {
    lines.push(`*${primerLabel}*`);
    data.primerTiempo.items.filter(Boolean).forEach((item) => lines.push(`• ${item}`));
    lines.push('');
  }

  if (data.segundoTiempo.enabled && data.segundoTiempo.items.some(Boolean)) {
    lines.push(`*${segundoLabel}*`);
    data.segundoTiempo.items.filter(Boolean).forEach((item) => lines.push(`• ${item}`));
    lines.push('');
  }

  if (data.tercerTiempoGuisado.enabled && data.tercerTiempoGuisado.items.some(Boolean)) {
    lines.push(`*${tercerLabel}*`);
    data.tercerTiempoGuisado.items.filter(Boolean).forEach((item) => lines.push(`• ${item}`));
    lines.push('');
  }

  if (data.postre.enabled && data.postre.items.some(Boolean)) {
    lines.push('*Postre*');
    data.postre.items.filter(Boolean).forEach((item) => lines.push(`• ${item}`));
    lines.push('');
  }

  if (data.aguas.enabled && data.aguas.items.some(Boolean)) {
    lines.push('*Bebidas*');
    data.aguas.items.filter(Boolean).forEach((item) => lines.push(`• ${item}`));
    lines.push('');
  }

  if (data.precio.enabled && data.precio.value.trim()) {
    lines.push(`*Precio: $${data.precio.value}*`);
    lines.push('');
  }

  lines.push('_Menú de hoy_');

  return lines.join('\n');
}

let _menuData: MenuData | null = null;
let _cartaData: MenuData | null = null;
let _fonditaName = 'La Fondita';
let _fonditaDescription = '';

export function setMenuData(data: MenuData) {
  _menuData = data;
}

export function getMenuData(): MenuData | null {
  return _menuData;
}

export function setCartaData(data: MenuData) {
  _cartaData = data;
}

export function getCartaData(): MenuData | null {
  return _cartaData;
}

export function getFonditaName(): string {
  return _fonditaName;
}

export function setFonditaName(name: string) {
  _fonditaName = name;
}

export function getFonditaDescription(): string {
  return _fonditaDescription;
}

export function setFonditaDescription(desc: string) {
  _fonditaDescription = desc;
}

let _fonditaDireccion = '';
let _fonditaDireccionVisible = false;
let _fonditaHorario = '';
let _pagosEfectivo = false;
let _pagosTrans = false;
let _pagosTarjeta = false;

export function getFonditaDireccion(): string { return _fonditaDireccion; }
export function setFonditaDireccion(d: string) { _fonditaDireccion = d; }
export function getFonditaDireccionVisible(): boolean { return _fonditaDireccionVisible; }
export function setFonditaDireccionVisible(v: boolean) { _fonditaDireccionVisible = v; }
export function getFonditaHorario(): string { return _fonditaHorario; }
export function setFonditaHorario(v: string) { _fonditaHorario = v; }
export function getPagosEfectivo(): boolean { return _pagosEfectivo; }
export function setPagosEfectivo(v: boolean) { _pagosEfectivo = v; }
export function getPagosTrans(): boolean { return _pagosTrans; }
export function setPagosTrans(v: boolean) { _pagosTrans = v; }
export function getPagosTarjeta(): boolean { return _pagosTarjeta; }
export function setPagosTarjeta(v: boolean) { _pagosTarjeta = v; }
