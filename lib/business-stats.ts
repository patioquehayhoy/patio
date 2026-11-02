import type { FollowListPerson } from '@/lib/profile-privacy';
import { supabase } from '@/lib/supabase';

// Números públicos del negocio. Seguir un lugar es la fila de saved_patios;
// quién lo sigue es público, como en Instagram (decisión de Parco,
// 2026-11-02). Los «me gusta» no se muestran como número público.
export type BusinessStats = { saves: number; dishLikes: number; reviews: number };

export async function getBusinessStats(negocioId: string): Promise<BusinessStats | null> {
  if (!/^[0-9a-f-]{36}$/i.test(negocioId)) return null;
  const { data, error } = await supabase.rpc('business_stats', { target: negocioId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { saves: Number(row?.saves ?? 0), dishLikes: Number(row?.dish_likes ?? 0), reviews: Number(row?.reviews ?? 0) };
}

/** «128 seguidores»; «0 seguidores» también, como Instagram. */
export function businessStatsLabel(stats: BusinessStats | null): string {
  if (!stats) return '';
  return `${stats.saves} ${stats.saves === 1 ? 'seguidor' : 'seguidores'}`;
}

// Tablero del dueño: totales y los últimos 7 días. Solo responde al dueño.
export type BusinessInsights = { saves: number; savesWeek: number; dishLikes: number; dishLikesWeek: number };

export async function getBusinessInsights(negocioId: string): Promise<BusinessInsights | null> {
  if (!/^[0-9a-f-]{36}$/i.test(negocioId)) return null;
  const { data, error } = await supabase.rpc('business_insights', { target: negocioId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    saves: Number(row?.saves ?? 0),
    savesWeek: Number(row?.saves_week ?? 0),
    dishLikes: Number(row?.dish_likes ?? 0),
    dishLikesWeek: Number(row?.dish_likes_week ?? 0),
  };
}

export type DishLikeCount = { dishName: string; displayName: string; likes: number };

/** «Me gusta» por platillo, del que más tiene al que menos (nombre canónico). */
export async function getDishLikeCounts(negocioId: string): Promise<DishLikeCount[]> {
  if (!/^[0-9a-f-]{36}$/i.test(negocioId)) return [];
  const { data, error } = await supabase.rpc('business_dish_like_counts', { target: negocioId });
  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({ dishName: row.dish_name, displayName: row.display_name, likes: Number(row.likes ?? 0) }));
}

/** Quién sigue a un lugar, del más reciente al más antiguo (público, como Instagram). */
export async function getPatioFollowers(negocioId: string): Promise<FollowListPerson[]> {
  if (!/^[0-9a-f-]{36}$/i.test(negocioId)) return [];
  const { data, error } = await supabase.rpc('patio_followers', { target: negocioId });
  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({
    userId: row.user_id, name: row.display_name, handle: row.handle || undefined, avatarUrl: row.avatar_url || undefined,
  }));
}
