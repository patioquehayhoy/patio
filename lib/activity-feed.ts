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

const FOODIE_SEEN_KEY = '@patio_review_likes_seen_at';

// Mismo mecanismo, lado Foodie: ¿alguien le dio like a una reseña mía desde
// la última vez que revisé? Reciprocidad simétrica a la del Fondero con sus
// platillos — sin esto, escribir una reseña nunca tenía retorno visible.
export async function hasUnseenReviewLikes(): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;
  const { data: myReviews } = await supabase.from('reviews').select('id').eq('user_id', user.user.id);
  const reviewIds = (myReviews ?? []).map((row: any) => row.id);
  if (!reviewIds.length) return false;
  const [{ data: latestLike }, seenRaw] = await Promise.all([
    supabase.from('review_likes').select('created_at').in('review_id', reviewIds).neq('user_id', user.user.id)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    AsyncStorage.getItem(FOODIE_SEEN_KEY),
  ]);
  if (!latestLike) return false;
  const latest = new Date((latestLike as any).created_at).getTime();
  return latest > (seenRaw ? Number(seenRaw) : 0);
}

// Actividad del Foodie completa: «me gusta», comentarios y respuestas desde la
// última visita, o solicitudes para seguirte sin responder. Es lo que enciende
// el punto de la pestaña Perfil y de la fila Actividad.
export async function hasUnseenFoodieActivity(): Promise<boolean> {
  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user.id;
  if (!me) return false;
  const [likes, requests, seenRaw, myReviews, myComments] = await Promise.all([
    hasUnseenReviewLikes(),
    supabase.from('profile_follows').select('follower_id', { count: 'exact', head: true }).eq('followed_id', me).eq('status', 'pending'),
    AsyncStorage.getItem(FOODIE_SEEN_KEY),
    supabase.from('reviews').select('id').eq('user_id', me),
    supabase.from('review_comments').select('id').eq('user_id', me),
  ]);
  if (likes || (requests.count ?? 0) > 0) return true;
  const seen = seenRaw ? Number(seenRaw) : 0;
  const reviewIds = (myReviews.data ?? []).map((row: any) => row.id);
  const commentIds = (myComments.data ?? []).map((row: any) => row.id);
  const latest = async (column: 'review_id' | 'parent_id', ids: string[]) => {
    if (!ids.length) return 0;
    const { data } = await supabase.from('review_comments').select('created_at').in(column, ids).neq('user_id', me)
      .order('created_at', { ascending: false }).limit(1).maybeSingle();
    return data ? new Date((data as any).created_at).getTime() : 0;
  };
  const newest = Math.max(await latest('review_id', reviewIds), await latest('parent_id', commentIds));
  return newest > seen;
}

export async function markReviewLikesSeen(): Promise<void> {
  await AsyncStorage.setItem(FOODIE_SEEN_KEY, String(Date.now()));
}

// Compartido entre resenas.tsx (Fondero) y notificaciones.tsx (Foodie): un
// like no tiene contenido propio, así que varias personas se fusionan en un
// solo texto — mismo criterio que usa Instagram para likes (nunca para
// comentarios/reseñas, que sí llevan texto único).
export function formatLikeAuthors(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names[0]}, ${names[1]} y ${names.length - 2} más`;
}
