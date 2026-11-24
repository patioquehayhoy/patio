import { splitCarta } from './menu-carta';
import { publicMenuPrices, withMenuPrecios } from './menu-prices';
import type { MenuData } from './menu-store';

// Lo que lleva el póster del menú (vista previa del editor e imagen para
// compartir): lo de hoy, la carta y los precios del menú.
export type PosterData = {
  sections: MenuData['secciones'];
  carta: MenuData['secciones'];
  menuPrices: { label: string; price: string }[];
  priceLabel: string | null;
  priceName: string;
};

/** Lo de hoy, la carta y los precios del menú, listos para el póster. */
export function posterFromMenu(menuData: MenuData | null, savedCarta?: MenuData | null): PosterData {
  // Menús guardados antes del 14 nov traen el precio en la primera sección.
  // Un borrador del editor puede traer la carta marcada: esa manda.
  const split = menuData ? splitCarta(menuData) : null;
  const withPrices = split ? withMenuPrecios(split.hoy) : null;
  const tidy = (list: MenuData['secciones']) => list
    .map((section) => ({ ...section, platillos: section.platillos.filter((dish) => dish.nombre.trim()) }))
    // Un encabezado con precio («MENÚ DEL DÍA $100») sale aunque no tenga platillos debajo.
    .filter((section) => section.platillos.length || Number(section.precio.replace(/[^0-9.]/g, '')) > 0);
  const sections = tidy(withPrices?.secciones ?? []);
  const carta = tidy(split?.carta.secciones.length ? split.carta.secciones : savedCarta?.secciones ?? []);
  const menuPrices = withPrices ? publicMenuPrices(withPrices) : [];
  return { sections, carta, menuPrices, priceLabel: menuPrices[0]?.price ?? null, priceName: menuPrices[0]?.label || 'Menú' };
}

