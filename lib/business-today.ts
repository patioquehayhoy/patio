import { supabase } from '@/lib/supabase';

// «Hoy» del negocio (v4 §3): vistas de su menú contra un día igual, los
// últimos 7 días y lo demás que pasó hoy. Solo responde al dueño
// (business_today, migración 20261109110000).
export type BusinessToday = {
  viewsToday: number;
  /** Promedio del mismo día en las últimas cuatro semanas con datos; null sin historia. */
  viewsUsual: number | null;
  week: { day: string; views: number }[];
  followersToday: number;
  dishLikesToday: number;
  reviewsToday: number;
  topDishes: { name: string; likes: number }[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getBusinessToday(negocioId: string): Promise<BusinessToday | null> {
  if (!UUID.test(negocioId)) return null;
  const { data, error } = await supabase.rpc('business_today', { target: negocioId });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    viewsToday: Number(row.views_today ?? 0),
    viewsUsual: row.views_usual === null || row.views_usual === undefined ? null : Number(row.views_usual),
    week: Array.isArray(row.views_week) ? row.views_week.map((entry: { day: string; views: number }) => ({ day: String(entry.day), views: Number(entry.views ?? 0) })) : [],
    followersToday: Number(row.followers_today ?? 0),
    dishLikesToday: Number(row.dish_likes_today ?? 0),
    reviewsToday: Number(row.reviews_today ?? 0),
    topDishes: Array.isArray(row.top_dishes) ? row.top_dishes.map((dish: { name: string; likes: number }) => ({ name: String(dish.name ?? ''), likes: Number(dish.likes ?? 0) })).filter((dish: { name: string }) => dish.name) : [],
  };
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

/** «8 más que un viernes normal», «Igual que un viernes normal». null sin historia. */
export function viewsComparison(today: number, usual: number | null, weekday: number): string | null {
  if (usual === null) return null;
  const diff = Math.round(today - usual);
  const day = `un ${WEEKDAYS[weekday]} normal`;
  if (diff === 0) return `Igual que ${day}`;
  return `${Math.abs(diff).toLocaleString('es-MX')} ${diff > 0 ? 'más' : 'menos'} que ${day}`;
}
