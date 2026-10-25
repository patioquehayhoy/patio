import createIconSet from '@expo/vector-icons/createIconSet';
import { businessCategoryIcon, type CategoryIcon } from '@/lib/business-category-icons';

// Una sola familia para todos los giros: Lucide (ISC) más taco y elote
// dibujados con sus mismas reglas. Fuentes en design-source/patio-giros/.
export const PATIO_GIROS_GLYPHS: Record<CategoryIcon, number> = {
  fondita: 0xe001, tacos: 0xe002, antojitos: 0xe003, elotes: 0xe004, botanas: 0xe005,
  postres: 0xe006, cafeteria: 0xe007, mariscos: 0xe008, bebidas: 0xe009, jugos: 0xe00a,
  restaurante: 0xe00b, otro: 0xe00c, pin: 0xe00d,
};
export const PatioGiros = createIconSet(PATIO_GIROS_GLYPHS, 'PatioGirosLucide', require('../assets/fonts/PatioGiros.ttf'));

export function BusinessCategoryIcon({ category, context = 'onboarding', size = 19, color }: { category: string; context?: 'onboarding' | 'map'; size?: number; color: string }) {
  return <PatioGiros name={businessCategoryIcon(category, context)} size={size} color={color} />;
}
