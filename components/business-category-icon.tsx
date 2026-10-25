import { Ionicons } from '@expo/vector-icons';
import createIconSet from '@expo/vector-icons/createIconSet';
import { businessCategoryIcon } from '@/lib/business-category-icons';

// Taco y elote dibujados a mano con la retícula de Ionicons (512, trazo 32,
// puntas redondas, sin relleno) para que convivan con el resto de giros.
export const PATIO_GIROS_GLYPHS = { taco: 0xe001, corn: 0xe002 } as const;
export const PatioGiros = createIconSet(PATIO_GIROS_GLYPHS, 'PatioGiros', require('../assets/fonts/PatioGiros.ttf'));

export function BusinessCategoryIcon({ category, context = 'onboarding', size = 19, color }: { category: string; context?: 'onboarding' | 'map'; size?: number; color: string }) {
  const icon = businessCategoryIcon(category, context);
  return icon === 'taco' || icon === 'corn'
    ? <PatioGiros name={icon} size={size} color={color} />
    : <Ionicons name={icon} size={size} color={color} />;
}
