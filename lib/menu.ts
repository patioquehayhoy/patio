import { supabase } from './supabase';
import type { Patio, PatioMenuSection, PatioDishMatch } from './patios';
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
  const { data: carta } = await supabase
    .from('cartas')
    .select('secciones')
    .eq('fondita_id', fonditaId)
    .maybeSingle();

  if (carta?.secciones) return menuDataToSections(carta.secciones as MenuData);

  const { data: menuHoy } = await supabase
    .from('menus')
    .select('secciones')
    .eq('fondita_id', fonditaId)
    .eq('fecha', hoy())
    .maybeSingle();

  if (menuHoy?.secciones) return menuDataToSections(menuHoy.secciones as MenuData);

  return [];
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

function matchesQuery(text: string, q: string): boolean {
  return normalize(text).includes(normalize(q));
}

function extractMatches(secciones: MenuData['secciones'], patio: Patio, query: string): PatioDishMatch[] {
  const matches: PatioDishMatch[] = [];
  for (const sec of secciones) {
    for (const platillo of sec.platillos) {
      if (!platillo.nombre) continue;
      if (matchesQuery(platillo.nombre, query) || matchesQuery(sec.nombre, query)) {
        matches.push({
          patio,
          section: sec.nombre,
          item: { name: platillo.nombre, price: platillo.precio || undefined },
          score: matchesQuery(platillo.nombre, query) ? 80 : 30,
        });
      }
    }
  }
  return matches;
}

export async function searchLiveMenus(query: string, patios: Patio[]): Promise<PatioDishMatch[]> {
  if (!query.trim()) return [];
  const patioMap = new Map(patios.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const results: PatioDishMatch[] = [];

  const addResults = (fonditaId: string, secciones: MenuData) => {
    const patio = patioMap.get(fonditaId);
    if (!patio) return;
    for (const match of extractMatches(secciones.secciones, patio, query)) {
      const key = `${fonditaId}-${match.item.name}`;
      if (!seen.has(key)) { seen.add(key); results.push(match); }
    }
  };

  const [cartas, menus] = await Promise.all([
    supabase.from('cartas').select('fondita_id, secciones').filter('secciones::text', 'ilike', `%${query}%`),
    supabase.from('menus').select('fondita_id, secciones').eq('fecha', hoy()).filter('secciones::text', 'ilike', `%${query}%`),
  ]);

  for (const row of cartas.data ?? []) addResults(row.fondita_id, row.secciones as MenuData);
  for (const row of menus.data ?? []) addResults(row.fondita_id, row.secciones as MenuData);

  return results.sort((a, b) => b.score - a.score);
}
