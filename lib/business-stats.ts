import { supabase } from '@/lib/supabase';

// Números públicos del negocio. En Patio, guardar un lugar es seguirlo: el
// conteo se llama «guardados», igual que el botón que lo produce.
export type BusinessStats = { saves: number; dishLikes: number; reviews: number };

export async function getBusinessStats(negocioId: string): Promise<BusinessStats | null> {
  if (!/^[0-9a-f-]{36}$/i.test(negocioId)) return null;
  const { data, error } = await supabase.rpc('business_stats', { target: negocioId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { saves: Number(row?.saves ?? 0), dishLikes: Number(row?.dish_likes ?? 0), reviews: Number(row?.reviews ?? 0) };
}

/** «128 guardados · 42 me gusta»; solo lo que ya tiene número. */
export function businessStatsLabel(stats: BusinessStats | null): string {
  if (!stats) return '';
  return [
    stats.saves ? `${stats.saves} ${stats.saves === 1 ? 'guardado' : 'guardados'}` : '',
    stats.dishLikes ? `${stats.dishLikes} me gusta` : '',
  ].filter(Boolean).join(' · ');
}
