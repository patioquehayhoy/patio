import type { Ionicons } from '@expo/vector-icons';
import type { BusinessType } from './smart-setup';

/** Giros use Ionicons, the same family as navigation and actions. Giros Ionicons
 * lacks are composed from real Ionicons parts in the PatioGiros font. */
export type PatioGiroGlyph = 'patio-jugos' | 'patio-tacos' | 'patio-elotes' | 'patio-postres' | 'patio-botanas' | 'patio-fondita';
export type CategoryIcon = keyof typeof Ionicons.glyphMap | PatioGiroGlyph;

export const BUSINESS_CATEGORY_ICONS = {
  // Olla de comida corrida: la tiendita es la identidad de Mi Patio.
  fondita: 'patio-fondita',
  taqueria: 'patio-tacos',
  antojitos: 'fast-food-outline',
  elotes: 'patio-elotes',
  botanas: 'patio-botanas',
  reposteria: 'patio-postres',
  cafeteria: 'cafe-outline',
  mariscos: 'fish-outline',
  bebidas: 'wine-outline',
  jugos: 'patio-jugos',
  restaurante: 'restaurant-outline',
  casa: 'home-outline',
  otro: 'ellipsis-horizontal',
} as const satisfies Record<BusinessType, CategoryIcon>;

// Free-text categories (Supabase `categorias`, «Otro» answers) resolve by keyword.
const KEYWORDS: [RegExp, CategoryIcon][] = [
  [/taco|taquer/, 'patio-tacos'],
  [/elote|esquite/, 'patio-elotes'],
  [/botana|palomita/, 'patio-botanas'],
  [/jugo|fruta|licuad/, 'patio-jugos'],
  [/cafeter|cafe\b/, 'cafe-outline'],
  [/antojito|garnacha|quesadilla|hamburgues|torta|empanada/, 'fast-food-outline'],
  [/postre|\bpan\b|panader|reposter|pastel/, 'patio-postres'],
  [/marisco|pescad/, 'fish-outline'],
  [/bebida|bar\b|antro|cantina/, 'wine-outline'],
  [/restaurante/, 'restaurant-outline'],
  [/venta en casa|en casa|dark kitchen/, 'home-outline'],
  [/fond|cocina|caser/, 'patio-fondita'],
];

export function businessCategoryIcon(category: string, context: 'onboarding' | 'map' = 'onboarding'): CategoryIcon {
  const value = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const exact = Object.hasOwn(BUSINESS_CATEGORY_ICONS, value) ? BUSINESS_CATEGORY_ICONS[value as BusinessType] : null;
  const icon = exact ?? KEYWORDS.find(([pattern]) => pattern.test(value))?.[1] ?? 'ellipsis-horizontal';
  // On the map a generic place is a pin, not cutlery.
  if (context === 'map' && (icon === 'restaurant-outline' || icon === 'ellipsis-horizontal')) return 'location-outline';
  return icon;
}

/** Latitude spans in degrees: city/block detail is a product choice, not max zoom. */
export function mapMarkerDetail(latitudeDelta: number): 'cluster' | 'dot' | 'icon' {
  if (!Number.isFinite(latitudeDelta) || latitudeDelta <= 0) return 'dot';
  if (latitudeDelta > 0.018) return 'cluster';
  return latitudeDelta > 0.006 ? 'dot' : 'icon';
}
