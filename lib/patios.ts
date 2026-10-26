import { supabase } from './supabase';
import { localMenuDate } from './menu-date';
import { normalizeMenuData } from './menu-store';
import { cleanMenuText } from './menu';
import { publicCurrency } from './prices';
import {
  deserialize,
  migrarStringLegacy,
  horarioDeHoy,
  formatHHMM12,
  type HorarioSemanal,
} from './horario';

export type PatioMenuItem = {
  name: string;
  description?: string;
  price?: string;
  tags?: string[];
};

export type PatioMenuSection = {
  section: string;
  price?: string;
  items: PatioMenuItem[];
};

export type Patio = {
  id: string;
  name: string;
  // Multi-tag: un lugar puede traer varias etiquetas atómicas a la vez
  // (ej. ['Elotes', 'Botanas']), igual que Google Places/Yelp. Nunca vacío
  // en la práctica — usa ['Fondita'] como fallback cuando no hay dato.
  // Para UI de una sola línea (pin, subtítulo compacto) usa categories[0].
  categories: string[];
  area: string;
  price: string;
  address: string;
  open: string;
  rating: string;
  ratingCount?: number;
  reason: string;
  latitude: number;
  longitude: number;
  x: number;
  y: number;
  menu: PatioMenuSection[];
  // Presence of a nonempty publication for today's business date, independent
  // of the permanent menu used as a content fallback.
  hasTodayMenu?: boolean;
  payments: string[];
  weeklyHours: HorarioSemanal | null;
  patioJoinedAt?: string;
  // Fecha real de apertura del negocio. Nunca sustituir con la fecha de alta en Patio.
  businessOpenedAt?: string;
  // Distinción propia de Patio. En producción debe venir de señales verificables.
  isNeighborhoodFavorite?: boolean;
  // Confirma identidad/control del negocio; no certifica calidad ni reputación.
  isVerifiedBusiness?: boolean;
  // Agotado es disponibilidad de inventario, no estado de horario.
  soldOut?: boolean;
};

// Deriva el horario semanal de una fila: jsonb nuevo, o fallback al string viejo.
function weeklyFromRow(horarioSemanal: unknown, horario: string | null): HorarioSemanal | null {
  return deserialize(horarioSemanal) ?? migrarStringLegacy(horario);
}

// "open" para tarjetas (explorar): el rango de HOY si hay horario semanal,
// si no el string legacy crudo.
function openLabel(weekly: HorarioSemanal | null, horario: string | null): string {
  const hoy = horarioDeHoy(weekly);
  if (hoy && !hoy.cerrado && hoy.abre && hoy.cierra) {
    return `${formatHHMM12(hoy.abre)}–${formatHHMM12(hoy.cierra)}`;
  }
  return horario ?? '';
}

export type PatioDishMatch = {
  patio: Patio;
  section: string;
  item: PatioMenuItem;
  score: number;
};

function normalizeSearch(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export const MOCK_PATIOS: Patio[] = [
  {
    id: 'cochitacos',
    name: 'Cochitacos',
    categories: ['Taquería'],
    area: 'Irrigación',
    price: '$100-120',
    address: 'Presa Las Vírgenes 101',
    open: '8am-5pm',
    rating: '5.0',
    reason: 'Tacos cerca de Irrigación',
    latitude: 19.44358,
    longitude: -99.20564,
    x: 24,
    y: 30,
    menu: [
      {
        section: 'TACOS',
        items: [
          { name: 'Taco de cochinita', price: '$32', tags: ['tacos', 'cochinita', 'cerdo'] },
          { name: 'Orden para compartir', price: '$120', tags: ['tacos', 'orden', 'compartir'] },
          { name: 'Chamorro en taco', price: '$38', tags: ['tacos', 'chamorro'] },
        ],
      },
      { section: 'BEBIDAS', items: [{ name: 'Agua fresca', tags: ['bebida', 'agua'] }, { name: 'Refresco', tags: ['bebida'] }] },
    ],
    payments: ['Efectivo', 'Transferencia'],
    businessOpenedAt: '2018-08-11',
    isNeighborhoodFavorite: true,
    weeklyHours: null,
  },
  {
    id: 'cintora-taqueria',
    name: 'Cíntora Taquería',
    categories: ['Taquería'],
    area: 'Irrigación',
    price: '$',
    address: 'Calz. Legaria 800A',
    open: '9am-6pm',
    rating: '5.0',
    reason: 'Sobre Legaria',
    latitude: 19.44578,
    longitude: -99.20341,
    x: 62,
    y: 27,
    menu: [
      {
        section: 'TACOS',
        items: [
          { name: 'Taco al pastor', price: '$24', tags: ['tacos', 'pastor'] },
          { name: 'Bistec con queso', price: '$38', tags: ['tacos', 'bistec', 'queso'] },
          { name: 'Suadero', price: '$26', tags: ['tacos', 'suadero'] },
        ],
      },
      { section: 'BEBIDAS', items: [{ name: 'Agua', tags: ['bebida'] }, { name: 'Refresco', tags: ['bebida'] }] },
    ],
    payments: ['Efectivo'],
    businessOpenedAt: '2015-04-18',
    weeklyHours: null,
  },
  {
    id: 'don-bonachon',
    name: 'Don Bonachón',
    categories: ['Restaurante'],
    area: 'Irrigación',
    price: '$',
    address: 'Presa Endo 17A',
    open: '8am-4pm',
    rating: '5.0',
    reason: 'Comida de barrio',
    latitude: 19.44226,
    longitude: -99.20216,
    x: 46,
    y: 48,
    menu: [
      {
        section: 'MENÚ DEL DÍA',
        items: [
          { name: 'Mole rojo con arroz', price: '$95', tags: ['mole', 'pollo', 'comida corrida', 'guisado'] },
          { name: 'Sopa del día', tags: ['sopa', 'entrada'] },
          { name: 'Agua de jamaica', tags: ['agua', 'bebida'] },
        ],
      },
    ],
    payments: ['Efectivo', 'Tarjeta'],
    businessOpenedAt: '2009-10-03',
    isNeighborhoodFavorite: true,
    weeklyHours: null,
  },
  {
    id: 'aaattaco',
    name: 'AAATTACO',
    categories: ['Taquería'],
    area: 'Irrigación',
    price: '$',
    address: 'Av. Irrigación 126',
    open: '9am-5pm',
    rating: '5.0',
    reason: 'Guisados para comer rápido',
    latitude: 19.43986,
    longitude: -99.20095,
    x: 76,
    y: 60,
    menu: [
      {
        section: 'GUISADOS',
        items: [
          { name: 'Taco de chicharrón', price: '$28', tags: ['tacos', 'guisado', 'chicharron'] },
          { name: 'Tinga de pollo', price: '$28', tags: ['tacos', 'guisado', 'pollo'] },
          { name: 'Papa con chorizo', price: '$28', tags: ['tacos', 'guisado'] },
        ],
      },
      { section: 'EXTRAS', items: [{ name: 'Arroz rojo', tags: ['arroz'] }, { name: 'Agua del día', tags: ['agua', 'bebida'] }] },
    ],
    payments: ['Efectivo', 'Transferencia'],
    businessOpenedAt: '2020-02-21',
    weeklyHours: null,
  },
  {
    id: 'vianca',
    name: 'Restaurante Vianca',
    categories: ['Restaurante'],
    area: 'Irrigación',
    price: '$',
    address: 'Presa Angostura 167 A',
    open: '10am-6pm',
    rating: '5.0',
    reason: 'Opción de comida en la zona',
    latitude: 19.44116,
    longitude: -99.20786,
    x: 34,
    y: 64,
    menu: [
      {
        section: 'MENÚ DEL DÍA',
        items: [
          { name: 'Enchiladas de mole', price: '$105', tags: ['enchiladas', 'mole', 'pollo'] },
          { name: 'Caldo tlalpeño', price: '$90', tags: ['caldo', 'pollo'] },
          { name: 'Agua de anís', tags: ['anis', 'agua', 'bebida'] },
        ],
      },
      {
        section: 'POSTRES',
        items: [
          { name: 'Gelatina de anís', price: '$35', tags: ['anis', 'gelatina', 'postre'] },
          { name: 'Flan casero', price: '$40', tags: ['postre'] },
        ],
      },
    ],
    payments: ['Efectivo', 'Tarjeta'],
    businessOpenedAt: '2011-07-16',
    weeklyHours: null,
  },
];

// Taxonomía real: las mismas 9 etiquetas atómicas que un Fondero puede elegir
// al darse de alta (ver BUSINESS_TYPES en app/patio-smart.tsx), modelo
// multi-tag estilo Google Places/Yelp — un lugar puede traer varias a la vez.
// Único origen de verdad — los datos demo/densidad (lib/demo.ts) deben usar
// exactamente estas etiquetas, nunca inventar otras, o los chips de categoría
// del mapa se contaminan.
export const PATIO_CATEGORIES = ['Fondita', 'Taquería', 'Antojitos', 'Elotes', 'Botanas', 'Postres', 'Cafetería', 'Mariscos', 'Bebidas', 'Jugos y fruta', 'Restaurante'];

// Fallback para filas de Supabase que todavía no tienen `categorias` (text[])
// poblado: deriva etiquetas atómicas desde el `tipo_negocio` legacy (single
// value). El caso 'elotes' es especial — antes de este cambio esa era la
// ÚNICA etiqueta compuesta "Elotes y botanas"; se expande a las dos atómicas
// para no perder significado en datos viejos sin migrar fila por fila.
function tipoLabels(tipo: string | null): string[] {
  const map: Record<string, string[]> = {
    fondita: ['Fondita'],
    taqueria: ['Taquería'],
    reposteria: ['Postres'],
    mariscos: ['Mariscos'],
    antojitos: ['Antojitos'],
    elotes: ['Elotes', 'Botanas'],
    botanas: ['Botanas'],
    bebidas: ['Bebidas'],
    jugos: ['Jugos y fruta'],
    cafeteria: ['Cafetería'],
    restaurante: ['Restaurante'],
    otro: ['Otro'],
  };
  return (tipo && map[tipo]) || ['Fondita'];
}

// Combina la columna nueva `categorias` (si ya trae datos) con el fallback
// derivado de `tipo_negocio`, para no romper filas que aún no se migraron.
// Etiquetas viejas guardadas en Supabase que hoy se muestran con otro nombre.
const LEGACY_CATEGORY_LABELS: Record<string, string> = { 'Repostería': 'Postres' };

function categoriasFromRow(categorias: unknown, tipoNegocio: string | null): string[] {
  const fromColumn = Array.isArray(categorias) ? categorias.filter((c): c is string => typeof c === 'string' && c.length > 0) : [];
  const normalized = fromColumn.map((c) => LEGACY_CATEGORY_LABELS[c] ?? c);
  return normalized.length ? normalized : tipoLabels(tipoNegocio);
}

// En desarrollo, el mapa se llena con lugares sintéticos (lib/demo.ts) además
// de los reales, para poder recorrer la app completa. En producción solo Supabase.
async function withDevPatios(reales: Patio[]): Promise<Patio[]> {
  if (!__DEV__) return reales;
  const { DEMO_PATIOS, DENSITY_DEMO_PATIOS, getDevPublishedPatio } = require('./demo') as typeof import('./demo');
  const published = await getDevPublishedPatio();
  const vistos = new Set(reales.map((p) => p.id));
  const extra = [...(published ? [published] : []), ...MOCK_PATIOS, ...DEMO_PATIOS, ...DENSITY_DEMO_PATIOS.slice(0, 40)].filter((p) => !vistos.has(p.id));
  return [...reales, ...extra.map((patio) => ({
    ...patio,
    hasTodayMenu: patio.hasTodayMenu ?? patio.menu.some((section) => section.items.some((item) => item.name.trim())),
  }))];
}

const FONDITAS_BASE_COLUMNS = 'id, nombre, descripcion, direccion, horario, horario_semanal, tipo_negocio, pagos_efectivo, pagos_transferencia, pagos_tarjeta, latitude, longitude';

function publicMenuSections(value: unknown): PatioMenuSection[] {
  const normalized = normalizeMenuData(value);
  return (normalized?.secciones ?? []).flatMap((section) => {
    const items = section.platillos.filter((item) => item.nombre.trim()).map((item) => ({
      name: cleanMenuText(item.nombre) || item.nombre,
      description: cleanMenuText(item.descripcion),
      price: publicCurrency(item.precio) || undefined,
    }));
    return items.length ? [{ section: cleanMenuText(section.nombre) || section.nombre, price: publicCurrency(section.precio) || undefined, items }] : [];
  });
}

// Two batched reads hydrate both Map and Saved consistently. A permanent menu
// provides useful dishes but must never advertise a publication made today.
async function fetchPublicMenus(ids: string[]): Promise<Map<string, { menu: PatioMenuSection[]; hasTodayMenu: boolean }>> {
  const result = new Map<string, { menu: PatioMenuSection[]; hasTodayMenu: boolean }>();
  if (!ids.length) return result;
  const today = localMenuDate();
  const [daily, permanent] = await Promise.allSettled([
    supabase.from('menus').select('fondita_id, fecha, secciones').in('fondita_id', ids).eq('fecha', today),
    supabase.from('cartas').select('fondita_id, secciones').in('fondita_id', ids),
  ]);
  if (permanent.status === 'fulfilled' && !permanent.value.error) {
    for (const row of permanent.value.data ?? []) {
      result.set(row.fondita_id, { menu: publicMenuSections(row.secciones), hasTodayMenu: false });
    }
  }
  if (daily.status === 'fulfilled' && !daily.value.error) {
    for (const row of daily.value.data ?? []) {
      if (row.fecha !== today) continue;
      const menu = publicMenuSections(row.secciones);
      if (menu.length) result.set(row.fondita_id, { menu, hasTodayMenu: true });
    }
  }
  return result;
}

export async function fetchPublicFonditas(options: { throwOnError?: boolean } = {}): Promise<Patio[]> {
  // `categorias` es una columna nueva (migración 20260816). Si todavía no se
  // aplicó en el proyecto de Supabase, el select con ella falla; reintenta
  // sin la columna para no tumbar el mapa de Foodie mientras se aplica.
  let data: Record<string, unknown>[] | null = null;
  const withCategorias = await supabase
    .from('fonditas')
    .select(`${FONDITAS_BASE_COLUMNS}, categorias`)
    .not('nombre', 'is', null)
    .neq('nombre', 'Mi Fondita');
  if (!withCategorias.error && withCategorias.data) {
    data = withCategorias.data as Record<string, unknown>[];
  } else {
    const withoutCategorias = await supabase
      .from('fonditas')
      .select(FONDITAS_BASE_COLUMNS)
      .not('nombre', 'is', null)
      .neq('nombre', 'Mi Fondita');
    if (!withoutCategorias.error && withoutCategorias.data) data = withoutCategorias.data as Record<string, unknown>[];
    else if (withoutCategorias.error && options.throwOnError) throw withoutCategorias.error;
  }

  if (!data) return withDevPatios([]);
  const menus = await fetchPublicMenus(data.map((row) => row.id as string));

  return withDevPatios(data.map((row: any): Patio => {
    const weekly = weeklyFromRow(row.horario_semanal, row.horario);
    return {
      id: row.id,
      name: row.nombre ?? 'Sin nombre',
      categories: categoriasFromRow(row.categorias, row.tipo_negocio),
      area: '',
      price: '$',
      address: row.direccion ?? '',
      open: openLabel(weekly, row.horario),
      rating: '',
      reason: row.descripcion ?? '',
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
      x: 0,
      y: 0,
      menu: menus.get(row.id)?.menu ?? [],
      hasTodayMenu: menus.get(row.id)?.hasTodayMenu ?? false,
      payments: [
        ...(row.pagos_efectivo ? ['Efectivo'] : []),
        ...(row.pagos_transferencia ? ['Transferencia'] : []),
        ...(row.pagos_tarjeta ? ['Tarjeta'] : []),
      ],
      weeklyHours: weekly,
    };
  }));
}

export async function fetchFonditaById(id: string, options: { throwOnError?: boolean } = {}): Promise<Patio | null> {
  // Mocks y demo (DEV) se resuelven local: sus ids no existen en Supabase.
  const local = (await withDevPatios([])).find((p) => p.id === id);
  if (local) return local;

  const base = 'id, nombre, descripcion, direccion, horario, horario_semanal, tipo_negocio, pagos_efectivo, pagos_transferencia, pagos_tarjeta';
  let row: Record<string, unknown> | null = null;

  // Intenta con `categorias` (migración 20260816) + ubicación; va degradando
  // el select si alguna columna todavía no existe en el proyecto, para no
  // romper la ficha del negocio mientras se aplica la migración.
  const withLocAndCategorias = await supabase.from('fonditas').select(`${base}, categorias, latitude, longitude`).eq('id', id).maybeSingle();
  if (!withLocAndCategorias.error && withLocAndCategorias.data) {
    row = withLocAndCategorias.data as Record<string, unknown>;
  } else {
    const withLoc = await supabase.from('fonditas').select(`${base}, latitude, longitude`).eq('id', id).maybeSingle();
    if (!withLoc.error && withLoc.data) {
      row = withLoc.data as Record<string, unknown>;
    } else {
      const noLoc = await supabase.from('fonditas').select(base).eq('id', id).maybeSingle();
      if (noLoc.error) { if (options.throwOnError) throw noLoc.error; return null; }
      if (!noLoc.data) return null;
      row = noLoc.data as Record<string, unknown>;
    }
  }

  const weekly = weeklyFromRow(row.horario_semanal, (row.horario as string | null) ?? null);
  const menu = (await fetchPublicMenus([id])).get(id);
  return {
    id: row.id as string,
    name: (row.nombre as string | null) ?? 'Sin nombre',
    categories: categoriasFromRow(row.categorias, row.tipo_negocio as string | null),
    area: '',
    price: '$',
    address: (row.direccion as string | null) ?? '',
    open: openLabel(weekly, (row.horario as string | null) ?? null),
    rating: '',
    reason: (row.descripcion as string | null) ?? '',
    latitude: (row.latitude as number | null) ?? 0,
    longitude: (row.longitude as number | null) ?? 0,
    x: 0, y: 0,
    menu: menu?.menu ?? [],
    hasTodayMenu: menu?.hasTodayMenu ?? false,
    payments: [
      ...(row.pagos_efectivo ? ['Efectivo'] : []),
      ...(row.pagos_transferencia ? ['Transferencia'] : []),
      ...(row.pagos_tarjeta ? ['Tarjeta'] : []),
    ],
    weeklyHours: weekly,
  };
}

export function getPatioById(id: string | string[] | undefined): Patio | null {
  const cleanId = Array.isArray(id) ? id[0] : id;
  return MOCK_PATIOS.find((patio) => patio.id === cleanId) ?? null;
}

export function searchPatiosByDish(query: string): PatioDishMatch[] {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return [];
  const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

  const matches: PatioDishMatch[] = [];
  const patios = __DEV__
    ? (() => {
        const { DEMO_PATIOS, DENSITY_DEMO_PATIOS } = require('./demo') as typeof import('./demo');
        return [...MOCK_PATIOS, ...DEMO_PATIOS, ...DENSITY_DEMO_PATIOS.slice(0, 40)];
      })()
    : MOCK_PATIOS;

  for (const patio of patios) {
    for (const section of patio.menu) {
      for (const item of section.items) {
        const itemName = normalizeSearch(item.name);
        const sectionName = normalizeSearch(section.section);
        const tags = (item.tags ?? []).map(normalizeSearch);
        const haystack = [itemName, sectionName, ...patio.categories, patio.reason, ...tags].map(normalizeSearch);
        const haystackText = haystack.join(' ');

        let score = 0;
        if (itemName === normalizedQuery) score += 100;
        if (itemName.includes(normalizedQuery)) score += 70;
        if (tags.some((tag) => tag === normalizedQuery)) score += 55;
        if (tags.some((tag) => tag.includes(normalizedQuery))) score += 35;
        if (haystack.some((value) => value.includes(normalizedQuery))) score += 12;
        if (queryTokens.length > 1 && queryTokens.every((token) => haystackText.includes(token))) score += 28;

        if (score > 0) {
          matches.push({ patio, section: section.section, item, score });
        }
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score || a.patio.name.localeCompare(b.patio.name));
}
