import { supabase } from './supabase';
import type { PatioMenuSection } from './patios';
import type { MenuData } from './menu-store';

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

function menuDataToSections(data: MenuData): PatioMenuSection[] {
  return data.secciones
    .filter((sec) => sec.platillos.some((p) => p.nombre))
    .map((sec) => ({
      section: sec.nombre,
      price: sec.precio || undefined,
      items: sec.platillos
        .filter((p) => p.nombre)
        .map((p) => ({ name: p.nombre, price: p.precio || undefined })),
    }));
}

export async function fetchMenuForFondita(fonditaId: string): Promise<PatioMenuSection[]> {
  // Carta (menú permanente) tiene prioridad
  const { data: carta } = await supabase
    .from('cartas')
    .select('secciones')
    .eq('fondita_id', fonditaId)
    .maybeSingle();

  if (carta?.secciones) return menuDataToSections(carta.secciones as MenuData);

  // Fallback: menú del día de hoy
  const { data: menuHoy } = await supabase
    .from('menus')
    .select('secciones')
    .eq('fondita_id', fonditaId)
    .eq('fecha', hoy())
    .maybeSingle();

  if (menuHoy?.secciones) return menuDataToSections(menuHoy.secciones as MenuData);

  return [];
}
