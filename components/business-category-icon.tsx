import { Ionicons } from '@expo/vector-icons';
import createIconSet from '@expo/vector-icons/createIconSet';
import { businessCategoryIcon, type PatioGiroGlyph } from '@/lib/business-category-icons';

// Giros que Ionicons no trae, armados con piezas de Ionicons (design-source/patio-giros/).
export const PATIO_GIROS_GLYPHS: Record<PatioGiroGlyph, number> = { 'patio-jugos': 0xe001 };
export const PatioGiros = createIconSet(PATIO_GIROS_GLYPHS, 'PatioGirosIon2', require('../assets/fonts/PatioGiros.ttf'));

export function BusinessCategoryIcon({ category, context = 'onboarding', size = 19, color }: { category: string; context?: 'onboarding' | 'map'; size?: number; color: string }) {
  const icon = businessCategoryIcon(category, context);
  return icon in PATIO_GIROS_GLYPHS
    ? <PatioGiros name={icon as PatioGiroGlyph} size={size} color={color} />
    : <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}
