import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';

const KEY = '@patio_review_likes';

// Mismo patrón que lib/dish-likes.ts: optimista y local siempre (funciona
// sin cuenta), sincroniza a Supabase solo si hay sesión real — para que el
// like cuente en el agregado que ve quien escribió la reseña.
async function getLocalLiked(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

async function setLocalLiked(liked: Set<string>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(liked)));
}

export async function getLikedReviewIds(reviewIds: string[]): Promise<Set<string>> {
  const liked = await getLocalLiked();
  return new Set(reviewIds.filter((id) => liked.has(id)));
}

export async function toggleReviewLike(reviewId: string): Promise<boolean> {
  const liked = await getLocalLiked();
  const wasLiked = liked.has(reviewId);
  if (wasLiked) liked.delete(reviewId); else liked.add(reviewId);
  await setLocalLiked(liked);

  const { data: user } = await supabase.auth.getUser();
  if (user.user) {
    if (wasLiked) {
      await supabase.from('review_likes').delete().eq('review_id', reviewId).eq('user_id', user.user.id);
    } else {
      await supabase.from('review_likes').upsert({ review_id: reviewId, user_id: user.user.id });
    }
  }
  return !wasLiked;
}

export async function getReviewLikeCounts(reviewIds: string[]): Promise<Record<string, number>> {
  if (!reviewIds.length) return {};
  const { data, error } = await supabase.from('review_likes').select('review_id').in('review_id', reviewIds);
  if (error || !data) return {};
  const counts: Record<string, number> = {};
  for (const row of data as { review_id: string }[]) counts[row.review_id] = (counts[row.review_id] ?? 0) + 1;
  return counts;
}

export type MyReviewLikeEvent = {
  reviewId: string;
  fonditaId: string;
  fonditaName: string;
  authors: { name: string; avatarUrl?: string }[];
  daysAgo: number;
};

// Para la pantalla de notificaciones del Foodie: reseñas propias que
// recibieron like de alguien más. Se fusiona por reseña+día (el like no
// trae contenido propio, mismo criterio que dish_likes en Actividad).
export async function getMyReviewLikeEvents(): Promise<MyReviewLikeEvent[]> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return [];

  const { data: myReviews } = await supabase
    .from('reviews')
    .select('id,fondita_id,fonditas(name)')
    .eq('user_id', user.user.id);
  if (!myReviews?.length) return [];
  const reviewIds = myReviews.map((row: any) => row.id);
  const fonditaByReview = new Map(myReviews.map((row: any) => [row.id, { id: row.fondita_id, name: row.fonditas?.name ?? 'un Patio' }]));

  const { data: likes } = await supabase
    .from('review_likes')
    .select('review_id,user_id,created_at')
    .in('review_id', reviewIds)
    .neq('user_id', user.user.id)
    .order('created_at', { ascending: false });
  if (!likes?.length) return [];

  const likerIds = [...new Set(likes.map((row: any) => row.user_id))];
  const { data: profiles } = await supabase.from('user_profiles').select('user_id,display_name,avatar_url').in('user_id', likerIds);
  const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));

  const groups = new Map<string, { reviewId: string; latest: number; authors: { name: string; avatarUrl?: string }[] }>();
  for (const like of likes as any[]) {
    const profile: any = profilesById.get(like.user_id);
    const name = profile?.display_name?.trim();
    if (!name) continue;
    const ts = new Date(like.created_at).getTime();
    const groupKey = `${like.review_id}::${new Date(like.created_at).toDateString()}`;
    const existing = groups.get(groupKey);
    if (existing) {
      existing.authors.push({ name, avatarUrl: profile?.avatar_url || undefined });
      existing.latest = Math.max(existing.latest, ts);
    } else {
      groups.set(groupKey, { reviewId: like.review_id, latest: ts, authors: [{ name, avatarUrl: profile?.avatar_url || undefined }] });
    }
  }
  const now = Date.now();
  return Array.from(groups.values()).map((group) => {
    const fondita = fonditaByReview.get(group.reviewId);
    return {
      reviewId: group.reviewId,
      fonditaId: fondita?.id ?? '',
      fonditaName: fondita?.name ?? 'un Patio',
      authors: group.authors,
      daysAgo: Math.max(0, Math.floor((now - group.latest) / 86400000)),
    };
  });
}
