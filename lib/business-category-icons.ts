import type { Ionicons } from '@expo/vector-icons';
import type { BusinessType } from './smart-setup';

/** Giros use Ionicons, the same family as navigation and actions. Giros Ionicons
 * lacks are composed from real Ionicons parts in the PatioGiros font. */
export type PatioGiroGlyph = 'patio-jugos';
export type CategoryIcon = keyof typeof Ionicons.glyphMap | PatioGiroGlyph;

export const BUSINESS_CATEGORY_ICONS = {
  fondita: 'storefront-outline',
  taqueria: 'flame-outline',
  antojitos: 'fast-food-outline',
  elotes: 'leaf-outline',
  botanas: 'basket-outline',
  reposteria: 'ice-cream-outline',
  cafeteria: 'cafe-outline',
  mariscos: 'fish-outline',
  bebidas: 'beer-outline',
  jugos: 'patio-jugos',
  restaurante: 'restaurant-outline',
  otro: 'ellipsis-horizontal',
} as const satisfies Record<BusinessType, CategoryIcon>;

// Free-text categories (Supabase `categorias`, «Otro» answers) resolve by keyword.
const KEYWORDS: [RegExp, CategoryIcon][] = [
  [/taco|taquer/, 'flame-outline'],
  [/elote|esquite/, 'leaf-outline'],
  [/botana|palomita/, 'basket-outline'],
  [/jugo|fruta|licuad/, 'patio-jugos'],
  [/cafeter|cafe\b/, 'cafe-outline'],
  [/antojito|garnacha|quesadilla|hamburgues|torta|empanada/, 'fast-food-outline'],
  [/postre|\bpan\b|panader|reposter|pastel/, 'ice-cream-outline'],
  [/marisco|pescad/, 'fish-outline'],
  [/bebida|bar\b|antro|cantina/, 'beer-outline'],
  [/restaurante/, 'restaurant-outline'],
  [/fond|cocina|caser/, 'storefront-outline'],
];

export function businessCategoryIcon(category: string, context: 'onboarding' | 'map' = 'onboarding'): CategoryIcon {
  const value = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const exact = Object.hasOwn(BUSINESS_CATEGORY_ICONS, value) ? BUSINESS_CATEGORY_ICONS[value as BusinessType] : null;
  const icon = exact ?? KEYWORDS.find(([pattern]) => pattern.test(value))?.[1] ?? 'ellipsis-horizontal';
  // On the map a generic place is a pin, not a storefront or cutlery.
  if (context === 'map' && (icon === 'storefront-outline' || icon === 'restaurant-outline' || icon === 'ellipsis-horizontal')) return 'location-outline';
  return icon;
}

/** Latitude spans in degrees: city/block detail is a product choice, not max zoom. */
export function mapMarkerDetail(latitudeDelta: number): 'cluster' | 'dot' | 'icon' {
  if (!Number.isFinite(latitudeDelta) || latitudeDelta <= 0) return 'dot';
  if (latitudeDelta > 0.018) return 'cluster';
  return latitudeDelta > 0.006 ? 'dot' : 'icon';
}
