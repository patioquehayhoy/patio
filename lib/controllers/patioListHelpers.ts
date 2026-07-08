import type { Patio } from '@/lib/patios';

export function todayDish(patio: Patio): string | null {
  const first = patio.menu?.[0]?.items?.slice(0, 2).map((item) => item.name).join(' · ');
  return first || null;
}
