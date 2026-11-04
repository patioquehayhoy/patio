import { canonicalDishName } from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';

// Herramientas de Pro (migración 20261102120000_business_pro.sql): avisos
// especiales, platillo destacado y cuándo hay más interés. El servidor decide
// quién tiene Pro; la app solo lo lee.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAYS = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

export type ProStatus = { proUntil: Date | null; noticesLeft: number };

/** Solo responde al dueño; null si no se pudo leer. */
export async function getProStatus(negocioId: string): Promise<ProStatus | null> {
  if (!UUID.test(negocioId)) return null;
  const { data, error } = await supabase.rpc('business_pro_status', { target: negocioId });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return { proUntil: row?.pro_until ? new Date(row.pro_until) : null, noticesLeft: Number(row?.notices_left ?? 0) };
}

export async function sendSpecialNotice(negocioId: string, text: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-special-notice', { body: { fonditaId: negocioId, text } });
  if (!error) return;
  const context = 'context' in error ? (error as { context?: unknown }).context : null;
  if (context instanceof Response && [400, 402, 422, 429].includes(context.status)) {
    const body = await context.clone().json().catch(() => null);
    if (typeof body?.error === 'string' && body.error.trim()) throw new Error(body.error.slice(0, 200));
  }
  throw new Error('No pudimos enviar el aviso. Inténtalo de nuevo.');
}

/** El día y la hora con más seguidores nuevos y «me gusta» de los últimos 90 días. */
export async function getPeakTime(negocioId: string): Promise<{ day: string; hour: number } | null> {
  if (!UUID.test(negocioId)) return null;
  const { data, error } = await supabase.rpc('business_peak_times', { target: negocioId });
  if (error || !Array.isArray(data) || !data.length) return null;
  const byDay = new Map<number, number>();
  const byHour = new Map<number, number>();
  for (const row of data as { weekday: number; hour_of_day: number; signals: number }[]) {
    byDay.set(row.weekday, (byDay.get(row.weekday) ?? 0) + Number(row.signals));
    byHour.set(row.hour_of_day, (byHour.get(row.hour_of_day) ?? 0) + Number(row.signals));
  }
  const top = (map: Map<number, number>) => [...map.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0];
  return { day: DAYS[top(byDay)], hour: top(byHour) };
}

export async function setFeaturedDish(negocioId: string, dishName: string | null): Promise<void> {
  const { error } = await supabase.from('negocios')
    .update({ featured_dish: dishName ? canonicalDishName(dishName) : null }).eq('id', negocioId);
  if (error) throw new Error('No pudimos guardar el platillo destacado.');
}

export type PatioHighlights = { featuredDish: string | null; notice: { body: string; createdAt: Date } | null };

/** Lo que Pro agrega a la ficha pública: platillo destacado y aviso de las últimas 24 horas. */
export async function getPatioHighlights(negocioId: string): Promise<PatioHighlights> {
  if (!UUID.test(negocioId)) return { featuredDish: null, notice: null };
  const { data, error } = await supabase.rpc('patio_highlights', { target: negocioId });
  const row = !error && Array.isArray(data) ? data[0] : null;
  return {
    featuredDish: row?.featured_dish ?? null,
    notice: row?.notice_body ? { body: row.notice_body, createdAt: new Date(row.notice_at) } : null,
  };
}

export type MyPlan = { source: 'store' | 'founder'; expiresAt: Date };

/** Pro vigente de la cuenta (la base solo entrega la fila propia). */
export async function getMyPlan(): Promise<MyPlan | null> {
  const { data, error } = await supabase.from('business_plans').select('source,expires_at').maybeSingle();
  if (error || !data) return null;
  const expiresAt = new Date(data.expires_at);
  return expiresAt > new Date() ? { source: data.source, expiresAt } : null;
}
