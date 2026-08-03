import { supabase } from './supabase';
import type { Patio, PatioMenuSection, PatioDishMatch } from './patios';
import type { MenuData } from './menu-store';
import { publicCurrency } from './prices';

export function cleanMenuText(value?: string): string | undefined {
  if (!value) return undefined;
  const cleaned = value
    .replace(/^\s*opciones(?:\s+de\s+(?:preparaci[oó]n|relleno))?\s*:\s*/i, '')
    .replace(/\(\s*precio\s+no\s+(?:disponible|visible)\s*\)/gi, '')
    .replace(/\bprecio\s+no\s+(?:disponible|visible)\b/gi, '')
    .replace(/\s+([,.;:])/g, '$1')
    .replace(/^[\s,.;:·-]+|[\s,;:·-]+$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return cleaned || undefined;
}

export const cleanMenuDescription = cleanMenuText;

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

function menuDataToSections(data: MenuData): PatioMenuSection[] {
  return data.secciones
    .filter((sec) => sec.platillos.some((p) => p.nombre))
    .map((sec) => ({
      section: cleanMenuText(sec.nombre) || sec.nombre,
      price: publicCurrency(sec.precio) || undefined,
      items: sec.platillos
        .filter((p) => p.nombre)
        .map((p) => ({
          name: cleanMenuText(p.nombre) || p.nombre,
          description: cleanMenuDescription(p.descripcion),
          price: publicCurrency(p.precio) || undefined,
        })),
    }));
}

export async function fetchMenuForFondita(fonditaId: string): Promise<PatioMenuSection[]> {
  // Lo publicado hoy manda; la carta permanente es el fallback para el
  // negocio que no cambia menú todos los días.
  const { data: menuHoy } = await supabase
    .from('menus')
    .select('secciones')
    .eq('fondita_id', fonditaId)
    .eq('fecha', hoy())
    .maybeSingle();

  if (menuHoy?.secciones) return menuDataToSections(menuHoy.secciones as MenuData);

  const { data: carta } = await supabase
    .from('cartas')
    .select('secciones')
    .eq('fondita_id', fonditaId)
    .maybeSingle();

  if (carta?.secciones) return menuDataToSections(carta.secciones as MenuData);

  return [];
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
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

function extractPatioMenuMatches(patio: Patio, query: string): PatioDishMatch[] {
  const q = normalize(query);
  const tokens = q.split(/\s+/).filter(Boolean);
  const matches: PatioDishMatch[] = [];

  for (const section of patio.menu) {
    for (const item of section.items) {
      const haystack = [
        item.name,
        item.description ?? '',
        item.price ?? '',
        section.section,
        patio.name,
        patio.category,
        patio.reason,
        ...(item.tags ?? []),
      ].map(normalize).join(' ');

      if (!haystack.includes(q) && !tokens.every((token) => haystack.includes(token))) continue;

      matches.push({
        patio,
        section: section.section,
        item,
        score: normalize(item.name).includes(q) ? 90 : normalize(section.section).includes(q) ? 50 : 25,
      });
    }
  }

  return matches;
}

function extractPatioIdentityMatch(patio: Patio, query: string): PatioDishMatch | null {
  const q = normalize(query);
  const stem = q.replace(/(?:es|s)$/u, '');
  const identity = normalize([patio.name, patio.category, patio.reason, patio.area].join(' '));
  if (!identity.includes(q) && (stem.length < 3 || !identity.includes(stem))) return null;
  const name = normalize(patio.name);
  const category = normalize(patio.category);
  const area = normalize(patio.area);
  const score = name === q
    ? 150
    : name.startsWith(q)
      ? 125
      : name.includes(q)
        ? 105
        : category.includes(stem || q)
          ? 52
          : area.includes(stem || q)
            ? 38
            : 28;
  return {
    patio,
    section: 'LUGAR',
    item: { name: patio.name, description: patio.category, price: patio.price },
    score,
  };
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

  // A query can express a dish ("mole") or a type of place ("bares").
  // Place matches use the same result model but are labeled as LUGAR so the
  // UI can explain why they appeared.
  for (const patio of patios) {
    const match = extractPatioIdentityMatch(patio, query);
    if (!match) continue;
    const key = `${patio.id}-LUGAR`;
    seen.add(key);
    results.push(match);
  }

  const [cartas, menus] = await Promise.all([
    supabase.from('cartas').select('fondita_id, secciones').filter('secciones::text', 'ilike', `%${query}%`),
    supabase.from('menus').select('fondita_id, secciones').eq('fecha', hoy()).filter('secciones::text', 'ilike', `%${query}%`),
  ]);

  // El menú de hoy tiene prioridad sobre una coincidencia duplicada de carta.
  for (const row of menus.data ?? []) addResults(row.fondita_id, row.secciones as MenuData);
  for (const row of cartas.data ?? []) addResults(row.fondita_id, row.secciones as MenuData);

  if (__DEV__) {
    for (const patio of patios) {
      for (const match of extractPatioMenuMatches(patio, query)) {
        const key = `${patio.id}-${match.item.name}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push(match);
        }
      }
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
