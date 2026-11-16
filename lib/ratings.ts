import { withStorageLock } from './storage-queue';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { localMenuDate } from './menu-date';
import { isReviewPhotoUrl } from './dish-photo-url';
import { uploadReviewPhoto } from './dish-photo';

const KEY = '@patio_ratings';

export type PatioRating = {
  stars: number;
  reasons?: string[];
  note?: string;
  photoUri?: string;
  /** Foto pública de la reseña (bucket `review-photos`) y de qué platillo es. */
  photoUrl?: string;
  photoDish?: string;
  /** Frase corta del platillo que va como pie de la foto. */
  photoNote?: string;
  timestamp: number;
};

export type PublicPatioReview = PatioRating & {
  reviewId?: string;
  userId: string;
  author: string;
  avatarUrl?: string;
  businessReply?: string;
  businessRepliedAt?: string;
  isMine: boolean;
};

type RatingsMap = Record<string, PatioRating[]>;

async function getMap(): Promise<RatingsMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  const parsed = JSON.parse(raw) as Record<string, PatioRating | PatioRating[]>;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
  return Object.fromEntries(
    Object.entries(parsed).map(([patioId, value]) => [patioId, Array.isArray(value) ? value : [value]]),
  );
}

export async function getPatioRating(patioId: string): Promise<PatioRating | null> {
  const map = await getMap();
  const local = map[patioId]?.at(-1);
  if (local || !/^[0-9a-f-]{36}$/i.test(patioId)) return local ?? null;
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;
  const { data } = await supabase
    .from('reviews')
    .select('stars,reasons,note,created_at')
    .eq('negocio_id', patioId)
    .eq('user_id', user.user.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? {
    stars: data.stars,
    reasons: data.reasons ?? [],
    note: data.note || undefined,
    timestamp: new Date(data.created_at).getTime(),
  } : null;
}

export async function getPublicPatioReviews(patioId: string): Promise<PublicPatioReview[]> {
  if (!/^[0-9a-f-]{36}$/i.test(patioId)) {
    const map = await getMap();
    return (map[patioId] ?? [])
      .map((review) => ({ ...review, userId: `local-${review.timestamp}`, author: 'Tú', isMine: true }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  const [{ data: session }, { data, error }] = await Promise.all([
    supabase.auth.getSession(),
    supabase
      .from('reviews')
      .select('id,user_id,stars,reasons,note,created_at,updated_at,business_reply,business_replied_at,foto_url,foto_platillo,foto_nota')
      .eq('negocio_id', patioId)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
  ]);
  if (error) return [];
  const userIds = [...new Set((data ?? []).map((row: any) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('user_profiles').select('user_id,display_name,avatar_url').in('user_id', userIds)
    : { data: [] };
  const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
  const currentUserId = session.session?.user.id;
  return (data ?? []).flatMap((row: any) => {
    const profile: any = profilesById.get(row.user_id);
    const isMine = row.user_id === currentUserId;
    const publicName = isMine ? 'Tú' : profile?.display_name?.trim();
    if (!publicName) return [];
    return [{
      reviewId: row.id,
      userId: row.user_id,
      author: publicName,
      avatarUrl: profile?.avatar_url || undefined,
      stars: row.stars,
      reasons: row.reasons ?? [],
      note: row.note || undefined,
      timestamp: new Date(row.created_at || row.updated_at).getTime(),
      businessReply: row.business_reply || undefined,
      ...(isReviewPhotoUrl(row.foto_url) ? { photoUrl: row.foto_url, photoDish: row.foto_platillo || undefined, photoNote: row.foto_nota || undefined } : {}),
      businessRepliedAt: row.business_replied_at || undefined,
      isMine,
    }];
  });
}

export async function replyToReview(reviewId: string, reply: string): Promise<void> {
  const { error } = await supabase.rpc('reply_to_review', {
    target_review_id: reviewId,
    reply_text: reply.trim(),
  });
  if (error) throw error;
  // Aviso a quien escribió la reseña, de mejor esfuerzo: la respuesta ya quedó.
  void supabase.functions.invoke('send-community-notification', { body: { kind: 'business_reply', reviewId } }).catch(() => {});
}

export type SaveRatingInput = {
  stars: number;
  reasons?: string[];
  note?: string;
  photoUri?: string;
  /** De qué platillo es la foto (opcional). */
  photoDish?: string;
  /** Frase corta del platillo (opcional). */
  photoNote?: string;
};

/** Lugares que ya reseñaste desde este teléfono. */
export async function getRatedPatioIds(): Promise<Set<string>> {
  return new Set(Object.entries(await getMap()).filter(([, ratings]) => ratings.length > 0).map(([id]) => id));
}

/** ¿Ya reseñaste este lugar desde este teléfono? (para no volver a preguntar). */
export async function hasRatedPatio(patioId: string): Promise<boolean> {
  return ((await getMap())[patioId] ?? []).length > 0;
}

// Acepta la firma corta (stars, reasons) por compatibilidad, o un objeto completo.
export async function savePatioRating(
  patioId: string,
  starsOrInput: number | SaveRatingInput,
  reasons?: string[],
): Promise<void> {
  return withStorageLock(KEY, async () => {
  const map = await getMap();
  const today = localMenuDate();
  if ((map[patioId] ?? []).some((review) => localMenuDate(new Date(review.timestamp)) === today)) {
    throw new Error('REVIEW_ALREADY_PUBLISHED_TODAY');
  }
  const data: SaveRatingInput =
    typeof starsOrInput === 'number'
      ? { stars: starsOrInput, reasons }
      : starsOrInput;
  if (!Number.isInteger(data.stars) || data.stars < 1 || data.stars > 5) throw new Error('Elige una calificación de 1 a 5 estrellas.');
  const rating: PatioRating = {
    stars: data.stars,
    reasons: data.reasons,
    note: data.note?.trim() || undefined,
    photoUri: data.photoUri || undefined,
    photoDish: data.photoUri && data.photoDish?.trim() ? data.photoDish.trim() : undefined,
    photoNote: data.photoUri && data.photoNote?.trim() ? data.photoNote.trim() : undefined,
    timestamp: Date.now(),
  };
  if (/^[0-9a-f-]{36}$/i.test(patioId)) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Inicia sesión para publicar tu reseña.');
    if (user.user) {
      // La foto se sube antes de publicar; si falla, la reseña no sale a medias.
      let fotoUrl: string | null = null;
      if (data.photoUri) {
        try { fotoUrl = await uploadReviewPhoto(data.photoUri); } catch { throw new Error('REVIEW_PHOTO_UPLOAD_FAILED'); }
      }
      const { error } = await supabase.from('reviews').insert({
        user_id: user.user.id,
        negocio_id: patioId,
        stars: data.stars,
        reasons: data.reasons ?? [],
        note: data.note?.trim() || null,
        foto_url: fotoUrl,
        foto_platillo: fotoUrl && data.photoDish?.trim() ? data.photoDish.trim().slice(0, 120) : null,
        foto_nota: fotoUrl && data.photoNote?.trim() ? data.photoNote.trim().slice(0, 140) : null,
        visit_date: localMenuDate(),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      // Aviso al dueño de mejor esfuerzo: la reseña ya quedó publicada.
      void supabase.functions.invoke('send-review-notification', { body: { fonditaId: patioId } }).catch(() => {});
    }
  }
  map[patioId] = [...(map[patioId] ?? []), rating];
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
  });
}

/** Quien subió la foto la corrige: de qué platillo es y su frase. */
export async function updateMyReviewPhoto(reviewId: string, dish: string | undefined, note: string | undefined): Promise<void> {
  const { error } = await supabase.rpc('update_my_review_photo', {
    target_review_id: reviewId,
    dish: dish?.trim() || null,
    photo_note: note?.trim() || null,
  });
  if (error) throw error;
}

/** Quita la foto de tu reseña; la reseña se queda. */
export async function removeMyReviewPhoto(reviewId: string, photoUrl: string): Promise<void> {
  const { error } = await supabase.rpc('remove_my_review_photo', { target_review_id: reviewId });
  if (error) throw error;
  // El archivo, de mejor esfuerzo: la foto ya no sale aunque esto falle.
  const path = photoUrl.split('/storage/v1/object/public/review-photos/')[1]?.split('?')[0];
  if (path) void supabase.storage.from('review-photos').remove([decodeURIComponent(path)]).then(() => {}, () => {});
}
