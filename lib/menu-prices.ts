import { publicCurrency } from './prices';
import { makePrecioId, type MenuData, type MenuPrecio } from './menu-store';

// Precios del menú del día (2026-11-14). Antes había uno solo y se guardaba en
// la primera sección; ahora viven en `MenuData.precios`, uno por forma de
// cobrar el menú («Completo», «Solo guisado», «Ejecutivo»). Los precios de
// sección («CARTA $110») y de platillo se quedan donde estaban.

/**
 * «Incluye…» del menú del día, listo para mostrarse: «sopa, arroz y agua» →
 * «Incluye sopa, arroz y agua.» Acepta que la persona ya haya escrito
 * «Incluye» o un punto final.
 */
export function menuIncludesLine(value: string | null | undefined): string {
  const text = (value ?? '').trim().replace(/^incluye\s*:?\s*/i, '').replace(/[.\s]+$/, '');
  if (!text) return '';
  return `Incluye ${text.charAt(0).toLocaleLowerCase('es-MX')}${text.slice(1)}.`;
}

export type PublicMenuPrice = {
  /** Vacío cuando el negocio no le puso nombre (un solo precio). */
  label: string;
  /** Con signo: «$95». */
  price: string;
};

const hasAmount = (value: string) => Number(value.replace(/[^0-9.]/g, '')) > 0;

/**
 * El menú con sus precios en `precios`, también si se guardó antes del cambio:
 * ahí el precio del menú era el único precio de sección y estaba en la
 * primera. Ese caso se pasa a `precios` y la sección queda sin precio.
 */
export function withMenuPrecios(data: MenuData): MenuData & { precios: MenuPrecio[] } {
  if (data.precios) return { ...data, precios: data.precios };
  const priced = data.secciones.filter((section) => hasAmount(section.precio));
  const first = data.secciones[0];
  if (priced.length !== 1 || priced[0] !== first) return { ...data, precios: [] };
  return {
    ...data,
    precios: [{ id: makePrecioId(), nombre: '', precio: first.precio.trim() }],
    secciones: data.secciones.map((section, index) => index === 0 ? { ...section, precio: '' } : section),
  };
}

/** Solo los precios con cantidad, limpios, para guardar o publicar. */
export function cleanMenuPrecios(precios: MenuPrecio[] | undefined): MenuPrecio[] {
  return (precios ?? [])
    .map((price) => ({ id: price.id, nombre: price.nombre.trim(), precio: price.precio.replace(/[^0-9.]/g, '') }))
    .filter((price) => hasAmount(price.precio));
}

export function publicMenuPrices(data: MenuData): PublicMenuPrice[] {
  return cleanMenuPrecios(withMenuPrecios(data).precios)
    .map((price) => ({ label: price.nombre, price: publicCurrency(price.precio) }));
}

/** «Completo $95 · Solo guisado $70»; con uno sin nombre, solo «$95». */
export function menuPricesLine(prices: PublicMenuPrice[]): string {
  return prices.map((price) => price.label ? `${price.label} ${price.price}` : price.price).join(' · ');
}

/** Para lectores de pantalla: «Menú completo, 95 pesos. Solo guisado, 70 pesos». */
export function menuPricesAccessibilityLabel(prices: PublicMenuPrice[]): string {
  return prices
    .map((price) => `${price.label || 'Precio del menú'}, ${price.price.replace('$', '')} pesos`)
    .join('. ');
}
