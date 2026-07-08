import { supabase } from './supabase';
import {
  deserialize,
  migrarStringLegacy,
  horarioDeHoy,
  formatHHMM12,
  type HorarioSemanal,
} from './horario';

export type PatioMenuItem = {
  name: string;
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
  category: string;
  area: string;
  price: string;
  address: string;
  open: string;
  rating: string;
  reason: string;
  latitude: number;
  longitude: number;
  x: number;
  y: number;
  menu: PatioMenuSection[];
  payments: string[];
  weeklyHours: HorarioSemanal | null;
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
    category: 'Taquería',
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
    weeklyHours: null,
  },
  {
    id: 'cintora-taqueria',
    name: 'Cíntora Taquería',
    category: 'Taquería',
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
    weeklyHours: null,
  },
  {
    id: 'don-bonachon',
    name: 'Don Bonachón',
    category: 'Restaurante',
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
    weeklyHours: null,
  },
  {
    id: 'aaattaco',
    name: 'AAATTACO',
    category: 'Tacos de guisado',
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
    weeklyHours: null,
  },
  {
    id: 'vianca',
    name: 'Restaurante Vianca',
    category: 'Restaurante',
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
    weeklyHours: null,
  },
];

function tipoLabel(tipo: string | null): string {
  const map: Record<string, string> = {
    fondita: 'Fondita',
    taqueria: 'Taquería',
    reposteria: 'Repostería',
    mariscos: 'Mariscos',
    otro: 'Fondita',
  };
  return (tipo && map[tipo]) || 'Fondita';
}

// En desarrollo, el mapa se llena con lugares sintéticos (lib/demo.ts) además
// de los reales, para poder recorrer la app completa. En producción solo Supabase.
async function withDevPatios(reales: Patio[]): Promise<Patio[]> {
  if (!__DEV__) return reales;
  const { DEMO_PATIOS, getDevPublishedPatio } = require('./demo') as typeof import('./demo');
  const published = await getDevPublishedPatio();
  const vistos = new Set(reales.map((p) => p.id));
  const extra = [...(published ? [published] : []), ...MOCK_PATIOS, ...DEMO_PATIOS].filter((p) => !vistos.has(p.id));
  return [...reales, ...extra];
}

export async function fetchPublicFonditas(): Promise<Patio[]> {
  const { data, error } = await supabase
    .from('fonditas')
    .select('id, nombre, descripcion, direccion, horario, horario_semanal, tipo_negocio, pagos_efectivo, pagos_transferencia, pagos_tarjeta, latitude, longitude')
    .not('nombre', 'is', null)
    .neq('nombre', 'Mi Fondita');

  if (error || !data) return withDevPatios([]);

  return withDevPatios(data.map((row): Patio => {
    const weekly = weeklyFromRow((row as any).horario_semanal, row.horario);
    return {
      id: row.id,
      name: row.nombre ?? 'Sin nombre',
      category: tipoLabel(row.tipo_negocio),
      area: 'CDMX',
      price: '$',
      address: row.direccion ?? '',
      open: openLabel(weekly, row.horario),
      rating: '',
      reason: row.descripcion ?? '',
      latitude: row.latitude ?? 0,
      longitude: row.longitude ?? 0,
      x: 0,
      y: 0,
      menu: [],
      payments: [
        ...(row.pagos_efectivo ? ['Efectivo'] : []),
        ...(row.pagos_transferencia ? ['Transferencia'] : []),
        ...(row.pagos_tarjeta ? ['Tarjeta'] : []),
      ],
      weeklyHours: weekly,
    };
  }));
}

export async function fetchFonditaById(id: string): Promise<Patio | null> {
  // Mocks y demo (DEV) se resuelven local: sus ids no existen en Supabase.
  const local = (await withDevPatios([])).find((p) => p.id === id);
  if (local) return local;

  const base = 'id, nombre, descripcion, direccion, horario, horario_semanal, tipo_negocio, pagos_efectivo, pagos_transferencia, pagos_tarjeta';
  let row: Record<string, unknown> | null = null;

  const withLoc = await supabase.from('fonditas').select(`${base}, latitude, longitude`).eq('id', id).maybeSingle();
  if (!withLoc.error && withLoc.data) {
    row = withLoc.data as Record<string, unknown>;
  } else {
    const noLoc = await supabase.from('fonditas').select(base).eq('id', id).maybeSingle();
    if (noLoc.error || !noLoc.data) return null;
    row = noLoc.data as Record<string, unknown>;
  }

  const weekly = weeklyFromRow(row.horario_semanal, (row.horario as string | null) ?? null);
  return {
    id: row.id as string,
    name: (row.nombre as string | null) ?? 'Sin nombre',
    category: tipoLabel(row.tipo_negocio as string | null),
    area: 'CDMX',
    price: '$',
    address: (row.direccion as string | null) ?? '',
    open: openLabel(weekly, (row.horario as string | null) ?? null),
    rating: '',
    reason: (row.descripcion as string | null) ?? '',
    latitude: (row.latitude as number | null) ?? 0,
    longitude: (row.longitude as number | null) ?? 0,
    x: 0, y: 0,
    menu: [],
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
        const { DEMO_PATIOS } = require('./demo') as typeof import('./demo');
        return [...MOCK_PATIOS, ...DEMO_PATIOS];
      })()
    : MOCK_PATIOS;

  for (const patio of patios) {
    for (const section of patio.menu) {
      for (const item of section.items) {
        const itemName = normalizeSearch(item.name);
        const sectionName = normalizeSearch(section.section);
        const tags = (item.tags ?? []).map(normalizeSearch);
        const haystack = [itemName, sectionName, patio.category, patio.reason, ...tags].map(normalizeSearch);
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
