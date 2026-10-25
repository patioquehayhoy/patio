import { Ionicons } from '@expo/vector-icons';
import { businessCategoryIcon } from '@/lib/business-category-icons';

export function BusinessCategoryIcon({ category, context = 'onboarding', size = 19, color }: { category: string; context?: 'onboarding' | 'map'; size?: number; color: string }) {
  return <Ionicons name={businessCategoryIcon(category, context)} size={size} color={color} />;
}
