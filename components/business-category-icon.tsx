import { Ionicons } from '@expo/vector-icons';
import createIconSet from '@expo/vector-icons/createIconSet';
import { businessCategoryIcon, type PatioGiroGlyph } from '@/lib/business-category-icons';

// Giros que Ionicons no trae, con su misma línea (origen y licencias en design-source/patio-giros/).
export const PATIO_GIROS_GLYPHS: Record<PatioGiroGlyph, number> = {
  'patio-jugos': 0xe001, 'patio-tacos': 0xe002, 'patio-elotes': 0xe003, 'patio-postres': 0xe004, 'patio-botanas': 0xe005,
};
export const PatioGiros = createIconSet(PATIO_GIROS_GLYPHS, 'PatioGirosIon3', require('../assets/fonts/PatioGiros.ttf'));

export function BusinessCategoryIcon({ category, context = 'onboarding', size = 19, color }: { category: string; context?: 'onboarding' | 'map'; size?: number; color: string }) {
  const icon = businessCategoryIcon(category, context);
  return icon in PATIO_GIROS_GLYPHS
    ? <PatioGiros name={icon as PatioGiroGlyph} size={size} color={color} />
    : <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={size} color={color} />;
}
