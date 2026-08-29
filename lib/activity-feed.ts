import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

const SEEN_KEY = '@patio_activity_seen_at';

// Hoy los likes de platillo y las reseñas no generan push — no hay backend
// de notificaciones todavía (ver docs/TASKS.md, "Backend social mínimo").
// Mientras tanto, este punto es la única señal de "hay algo nuevo": compara
// el evento más reciente contra la última vez que el Fondero abrió
// Actividad. Mismo lenguaje visual que el punto de "falta publicar hoy" del
// "+" en historial.tsx — un punto simple, sin número, sobre el ícono.
async function getLatestAt(table: 'reviews' | 'dish_likes', fonditaId: string): Promise<number> {
  const query = supabase.from(table).select('created_at').eq('fondita_id', fonditaId);
  const { data } = await (table === 'reviews' ? query.eq('status', 'published') : query)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? new Date((data as any).created_at).getTime() : 0;
}

export async function hasUnseenActivity(fonditaId: string | null): Promise<boolean> {
  if (!fonditaId || !/^[0-9a-f-]{36}$/i.test(fonditaId)) return false;
  const [latestReview, latestLike, seenRaw] = await Promise.all([
    getLatestAt('reviews', fonditaId),
    getLatestAt('dish_likes', fonditaId),
    AsyncStorage.getItem(SEEN_KEY),
  ]);
  const latest = Math.max(latestReview, latestLike);
  if (latest === 0) return false;
  return latest > (seenRaw ? Number(seenRaw) : 0);
}

export async function markActivitySeen(): Promise<void> {
  await AsyncStorage.setItem(SEEN_KEY, String(Date.now()));
}
