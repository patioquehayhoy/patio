import type { BusinessType } from './smart-setup';

/** Glyphs of the PatioGiros font (Lucide family; tacos/elotes drawn on its grid). */
export type CategoryIcon =
  | 'fondita' | 'tacos' | 'antojitos' | 'elotes' | 'botanas' | 'postres' | 'cafeteria'
  | 'mariscos' | 'bebidas' | 'jugos' | 'restaurante' | 'otro' | 'pin';

export const BUSINESS_CATEGORY_ICONS = {
  fondita: 'fondita',
  taqueria: 'tacos',
  antojitos: 'antojitos',
  elotes: 'elotes',
  botanas: 'botanas',
  reposteria: 'postres',
  cafeteria: 'cafeteria',
  mariscos: 'mariscos',
  bebidas: 'bebidas',
  jugos: 'jugos',
  restaurante: 'restaurante',
  otro: 'otro',
} as const satisfies Record<BusinessType, CategoryIcon>;

// Free-text categories (Supabase `categorias`, «Otro» answers) resolve by keyword.
const KEYWORDS: [RegExp, CategoryIcon][] = [
  [/taco|taquer/, 'tacos'],
  [/elote|esquite/, 'elotes'],
  [/botana|palomita/, 'botanas'],
  [/jugo|fruta|licuad/, 'jugos'],
  [/cafeter|cafe\b/, 'cafeteria'],
  [/antojito|garnacha|quesadilla|hamburgues|torta|empanada/, 'antojitos'],
  [/postre|\bpan\b|panader|reposter|pastel/, 'postres'],
  [/marisco|pescad/, 'mariscos'],
  [/bebida|bar\b|antro|cantina/, 'bebidas'],
  [/restaurante/, 'restaurante'],
  [/fond|cocina|caser/, 'fondita'],
];

export function businessCategoryIcon(category: string, context: 'onboarding' | 'map' = 'onboarding'): CategoryIcon {
  const value = category.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
  const exact = Object.hasOwn(BUSINESS_CATEGORY_ICONS, value) ? BUSINESS_CATEGORY_ICONS[value as BusinessType] : null;
  const icon = exact ?? KEYWORDS.find(([pattern]) => pattern.test(value))?.[1] ?? 'otro';
  // On the map a generic place is a pin, not a storefront or cutlery.
  if (context === 'map' && (icon === 'fondita' || icon === 'restaurante' || icon === 'otro')) return 'pin';
  return icon;
}

/** Latitude spans in degrees: city/block detail is a product choice, not max zoom. */
export function mapMarkerDetail(latitudeDelta: number): 'cluster' | 'dot' | 'icon' {
  if (!Number.isFinite(latitudeDelta) || latitudeDelta <= 0) return 'dot';
  if (latitudeDelta > 0.018) return 'cluster';
  return latitudeDelta > 0.006 ? 'dot' : 'icon';
}
