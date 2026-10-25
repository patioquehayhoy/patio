import type { Ionicons } from '@expo/vector-icons';
import type { BusinessType } from './smart-setup';

/** Preserve the existing Ionicons catalogue; only taco/corn need literal replacements. */
export const BUSINESS_CATEGORY_ICONS = {
  fondita: 'storefront-outline',
  taqueria: 'taco',
  antojitos: 'fast-food-outline',
  elotes: 'corn',
  botanas: 'basket-outline',
  reposteria: 'cafe-outline',
  mariscos: 'fish-outline',
  bebidas: 'wine-outline',
  restaurante: 'restaurant-outline',
  otro: 'ellipsis-horizontal',
} as const satisfies Record<BusinessType, keyof typeof Ionicons.glyphMap | 'taco' | 'corn'>;

export function businessCategoryIcon(category: string, context: 'onboarding' | 'map' = 'onboarding'): keyof typeof Ionicons.glyphMap | 'taco' | 'corn' {
  const value = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  if (context === 'map') {
    if (/taco|taquer/.test(value)) return 'taco';
    if (/elote|esquite/.test(value)) return 'corn';
    if (/antojito|hamburgues/.test(value)) return 'fast-food-outline';
    if (/botana/.test(value)) return 'leaf-outline';
    if (/postre|pan|reposter|cafe|desayuno/.test(value)) return 'cafe-outline';
    if (/bar|antro|cantina|bebida/.test(value)) return 'wine-outline';
    if (/mercado/.test(value)) return 'basket-outline';
    if (/marisco/.test(value)) return 'fish-outline';
    if (/tianguis/.test(value)) return 'storefront-outline';
    return 'location-outline';
  }
  if (Object.hasOwn(BUSINESS_CATEGORY_ICONS, value)) return BUSINESS_CATEGORY_ICONS[value as BusinessType];
  if (/taco|taquer/.test(value)) return BUSINESS_CATEGORY_ICONS.taqueria;
  if (/elote|esquite/.test(value)) return BUSINESS_CATEGORY_ICONS.elotes;
  if (/botana|palomita/.test(value)) return BUSINESS_CATEGORY_ICONS.botanas;
  if (/antojito|garnacha|quesadilla|hamburgues|torta|empanada/.test(value)) return BUSINESS_CATEGORY_ICONS.antojitos;
  if (/postre|\bpan\b|panader|reposter|pastel/.test(value)) return BUSINESS_CATEGORY_ICONS.reposteria;
  if (/marisco|pescad/.test(value)) return BUSINESS_CATEGORY_ICONS.mariscos;
  if (/bebida|cafe|bar\b|antro|cantina/.test(value)) return BUSINESS_CATEGORY_ICONS.bebidas;
  if (/restaurante/.test(value)) return BUSINESS_CATEGORY_ICONS.restaurante;
  if (/fond|cocina|caser/.test(value)) return BUSINESS_CATEGORY_ICONS.fondita;
  return BUSINESS_CATEGORY_ICONS.otro;
}

/** Latitude spans in degrees: city/block detail is a product choice, not max zoom. */
export function mapMarkerDetail(latitudeDelta: number): 'cluster' | 'dot' | 'icon' {
  if (!Number.isFinite(latitudeDelta) || latitudeDelta <= 0) return 'dot';
  if (latitudeDelta > 0.018) return 'cluster';
  return latitudeDelta > 0.006 ? 'dot' : 'icon';
}
