import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { businessCategoryIcon } from '@/lib/business-category-icons';

export function BusinessCategoryIcon({ category, context = 'onboarding', size = 19, color }: { category: string; context?: 'onboarding' | 'map'; size?: number; color: string }) {
  const icon = businessCategoryIcon(category, context);
  return icon === 'taco' || icon === 'corn'
    ? <MaterialCommunityIcons name={icon} size={size} color={color} />
    : <Ionicons name={icon} size={size} color={color} />;
}
