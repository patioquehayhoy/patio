import type { MenuData } from './menu-store';

/**
 * Título de un menú sin nombre, como Notas usa su primera línea: los primeros
 * platillos y cuántos más hay («Chilaquiles, Molletes y 22 más»). Con nombres
 * largos baja a uno solo para caber en dos renglones sin cortarse.
 */
export function summary(menu: Pick<MenuData, 'secciones'>): string {
  const names = menu.secciones
    .flatMap((section) => section.platillos)
    .map((dish) => dish.nombre.trim())
    .filter(Boolean);
  if (!names.length) return '';
  const shown = names[0].length + (names[1]?.length ?? 0) > 46 ? names.slice(0, 1) : names.slice(0, 2);
  const rest = names.length - shown.length;
  const head = shown.join(', ');
  return rest > 0 ? `${head} y ${rest} más` : shown.length === 2 ? `${shown[0]} y ${shown[1]}` : head;
}
