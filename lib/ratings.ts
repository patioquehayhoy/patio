import { withStorageLock } from './storage-queue';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { localMenuDate } from './menu-date';
import { isReviewPhotoUrl } from './dish-photo-url';
import { isPhotoHash } from './photo-hash';
import { uploadReviewPhoto } from './dish-photo';

const KEY = '@patio_ratings';

/** Hasta cuántas fotos lleva una reseña (una visita). */
export const MAX_REVIEW_PHOTOS = 5;

/** Una foto de la visita (tabla `review_photos`). */
export type ReviewPhotoItem = {
  /** Fila del servidor; sin él es una foto guardada solo en este teléfono. */
  id?: string;
  /** Pública (bucket `review-photos`) o, en un lugar de prueba, la del teléfono. */
  url: string;
  /** De qué platillo es (opcional): solo las que lo tienen salen en el menú. */
  dish?: string;
  /** Frase corta del platillo que va como pie de la foto. */
  note?: string;
  /** Vista previa instantánea (lib/photo-hash.ts). */
  hash?: string;
};

export type PatioRating = {
  stars: number;
  reasons?: string[];
  note?: string;
  /** Fotos de la visita, en el orden en que se eligieron (hasta 5). */
  photos?: ReviewPhotoItem[];
  timestamp: number;
};

/** Las fotos que llegan del servidor, en su orden, solo del bucket de Patio. */
function photosFromRows(rows: any[] | null | undefined): ReviewPhotoItem[] | undefined {
  const photos = (rows ?? [])
    .filter((row) => isReviewPhotoUrl(row?.url))
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((row): ReviewPhotoItem => ({
      id: row.id,
      url: row.url,
      ...(row.platillo ? { dish: row.platillo } : {}),
      ...(row.nota ? { note: row.nota } : {}),
      ...(isPhotoHash(row.hash) ? { hash: row.hash } : {}),
    }));
  return photos.length ? photos : undefined;
}
const PHOTO_COLUMNS = 'id,url,platillo,nota,hash,sort_order';

/** Reseñas guardadas antes del 21 nov (una sola foto en `photoUri`). */
function withLocalPhotos(rating: PatioRating & { photoUri?: string; photoDish?: string; photoNote?: string }): PatioRating {
  if (rating.photos || !rating.photoUri) return rating;
  const { photoUri, photoDish, photoNote, ...rest } = rating;
  return { ...rest, photos: [{ url: photoUri, ...(photoDish ? { dish: photoDish } : {}), ...(photoNote ? { note: photoNote } : {}) }] };
}

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
    Object.entries(parsed).map(([patioId, value]) => [patioId, (Array.isArray(value) ? value : [value]).map(withLocalPhotos)]),
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

/** Reseñas que la ficha pide por página (2026-11-16): 20 y «Ver más». */
export const REVIEW_PAGE_SIZE = 20;

export type ReviewSummary = {
  total: number;
  average: number;
  /** Cuántas hay de cada estrella, de 5 a 1. */
  byStars: { stars: number; count: number }[];
};

export function summarizeReviews(reviews: { stars: number }[]): ReviewSummary {
  const total = reviews.length;
  return {
    total,
    average: total ? reviews.reduce((sum, review) => sum + review.stars, 0) / total : 0,
    byStars: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: reviews.filter((review) => review.stars === stars).length })),
  };
}

/**
 * Promedio, total y estrellas calculados en el servidor
 * (migración 20261116120000_review_summary). `null` si el servidor todavía no
 * tiene esa función: la ficha entonces baja todas, como antes.
 */
export async function getPatioReviewSummary(patioId: string): Promise<ReviewSummary | null> {
  if (!/^[0-9a-f-]{36}$/i.test(patioId)) return null;
  const { data, error } = await supabase.rpc('review_summary', { target_negocio: patioId });
  const row: any = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;
  const count = (value: unknown) => Number(value) || 0;
  return {
    total: count(row.total),
    average: Number(row.average) || 0,
    byStars: [5, 4, 3, 2, 1].map((stars) => ({ stars, count: count(row[`stars${stars}`]) })),
  };
}

export type ReviewPageOptions = {
  /** Sin límite baja todas (Actividad del negocio). */
  limit?: number;
  /** `created_at` de la última reseña ya cargada: trae las anteriores. */
  cursor?: string | null;
  /** Solo las de esa estrella (barras del resumen). */
  stars?: number | null;
  /** Solo las que tienen fotos (fotos de clientes en el menú). */
  photosOnly?: boolean;
};

export type ReviewPage = {
  reviews: PublicPatioReview[];
  /** Para pedir la siguiente página; `null` cuando ya no hay más. */
  nextCursor: string | null;
};

export async function getPublicPatioReviews(patioId: string): Promise<PublicPatioReview[]> {
  return (await getPublicPatioReviewPage(patioId)).reviews;
}

export async function getPublicPatioReviewPage(patioId: string, options: ReviewPageOptions = {}): Promise<ReviewPage> {
  const { limit, cursor, stars, photosOnly } = options;
  if (!/^[0-9a-f-]{36}$/i.test(patioId)) {
    const map = await getMap();
    const reviews = (map[patioId] ?? [])
      .map((review) => ({ ...review, userId: `local-${review.timestamp}`, author: 'Tú', isMine: true }))
      .sort((a, b) => b.timestamp - a.timestamp);
    return { reviews, nextCursor: null };
  }
  // Las fotos viven en `review_photos` (hasta 5 por reseña); con `!inner`
  // solo llegan las reseñas que tienen alguna.
  const columns = `id,user_id,stars,reasons,note,created_at,updated_at,business_reply,business_replied_at,review_photos${photosOnly ? '!inner' : ''}(${PHOTO_COLUMNS})`;
  let request = supabase
    .from('reviews')
    .select(columns)
    .eq('negocio_id', patioId)
    .eq('status', 'published');
  if (stars) request = request.eq('stars', stars);
  if (cursor) request = request.lt('created_at', cursor);
  request = request.order('created_at', { ascending: false });
  const [{ data: session }, { data, error }] = await Promise.all([supabase.auth.getSession(), limit ? request.limit(limit) : request]);
  if (error) return { reviews: [], nextCursor: null };
  const rows: any[] = data ?? [];
  // Se decide con las filas del servidor, antes de quitar las que no tienen nombre.
  const nextCursor = limit && rows.length === limit ? rows[rows.length - 1].created_at ?? null : null;
  const userIds = [...new Set(rows.map((row: any) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('user_profiles').select('user_id,display_name,avatar_url').in('user_id', userIds)
    : { data: [] };
  const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
  const currentUserId = session.session?.user.id;
  const reviews = rows.flatMap((row: any): PublicPatioReview[] => {
    const profile: any = profilesById.get(row.user_id);
    const isMine = row.user_id === currentUserId;
    // Lo tuyo lleva tu nombre, como lo ven los demás; «Tú» solo si aún no tienes nombre.
    const publicName = profile?.display_name?.trim() || (isMine ? 'Tú' : undefined);
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
      ...(photosFromRows(row.review_photos) ? { photos: photosFromRows(row.review_photos) } : {}),
      businessRepliedAt: row.business_replied_at || undefined,
      isMine,
    }];
  });
  return { reviews, nextCursor };
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
  /** Fotos del teléfono (hasta 5), cada una con su platillo opcional. */
  photos?: { uri: string; dish?: string }[];
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
  const picked = (data.photos ?? []).filter((photo) => !!photo.uri).slice(0, MAX_REVIEW_PHOTOS);
  const rating: PatioRating = {
    stars: data.stars,
    reasons: data.reasons,
    note: data.note?.trim() || undefined,
    ...(picked.length ? { photos: picked.map((photo) => ({ url: photo.uri, ...(photo.dish?.trim() ? { dish: photo.dish.trim() } : {}) })) } : {}),
    timestamp: Date.now(),
  };
  if (/^[0-9a-f-]{36}$/i.test(patioId)) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Inicia sesión para publicar tu reseña.');
    if (user.user) {
      // Las fotos se suben antes de publicar (todas a la vez); si alguna falla,
      // la reseña no sale a medias y las que sí subieron se borran.
      const uploads = await Promise.allSettled(picked.map((photo) => uploadReviewPhoto(photo.uri)));
      const uploaded = uploads.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []));
      const dropUploaded = () => {
        const paths = uploaded.flatMap((photo) => storagePathOf(photo.url) ?? []);
        if (paths.length) void supabase.storage.from('review-photos').remove(paths).then(() => {}, () => {});
      };
      if (uploaded.length < picked.length) { dropUploaded(); throw new Error('REVIEW_PHOTO_UPLOAD_FAILED'); }
      // Reseña y fotos en un solo paso: o sale todo o nada (migración 20261121090000).
      const { error } = await supabase.rpc('publish_review', {
        target_negocio_id: patioId,
        review_stars: data.stars,
        review_reasons: data.reasons ?? [],
        review_note: data.note?.trim() || null,
        review_photos: uploaded.map((photo, index) => ({
          url: photo.url,
          dish: picked[index].dish?.trim().slice(0, 120) || null,
          hash: photo.hash ?? null,
        })),
      });
      if (error) { dropUploaded(); throw error; }
      // Aviso al dueño de mejor esfuerzo: la reseña ya quedó publicada.
      void supabase.functions.invoke('send-review-notification', { body: { fonditaId: patioId } }).catch(() => {});
    }
  }
  map[patioId] = [...(map[patioId] ?? []), rating];
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
  });
}

/** Ruta del archivo dentro del bucket `review-photos`. */
function storagePathOf(url: string): string | undefined {
  const path = url.split('/storage/v1/object/public/review-photos/')[1]?.split('?')[0];
  return path ? decodeURIComponent(path) : undefined;
}

/** Quien subió la foto la corrige: de qué platillo es y su frase. */
export async function updateMyReviewPhoto(photoId: string, dish: string | undefined, note: string | undefined): Promise<void> {
  const { error } = await supabase.rpc('update_my_review_photo_item', {
    target_photo_id: photoId,
    dish: dish?.trim() || null,
    photo_note: note?.trim() || null,
  });
  if (error) throw error;
}

/** Quita una foto de tu reseña; la reseña y las demás fotos se quedan. */
export async function removeMyReviewPhoto(photoId: string, photoUrl: string): Promise<void> {
  const { error } = await supabase.rpc('remove_my_review_photo_item', { target_photo_id: photoId });
  if (error) throw error;
  // El archivo, de mejor esfuerzo: la foto ya no sale aunque esto falle.
  const path = storagePathOf(photoUrl);
  if (path) void supabase.storage.from('review-photos').remove([path]).then(() => {}, () => {});
}

export type AuthorReview = {
  reviewId: string;
  placeId: string;
  placeName: string;
  stars: number;
  note?: string;
  timestamp: number;
  photos?: ReviewPhotoItem[];
};

/**
 * Las reseñas de una persona, más nuevas primero, con el nombre de cada lugar:
 * su perfil muestra sus fotos y sus reseñas (2026-11-15). Son públicas, igual
 * que en la ficha de cada lugar.
 */
export async function getReviewsByAuthor(userId: string, limit = 60): Promise<AuthorReview[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select(`id,negocio_id,stars,note,created_at,review_photos(${PHOTO_COLUMNS})`)
    .eq('user_id', userId)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  const rows = data as any[];
  const placeIds = [...new Set(rows.map((row) => row.negocio_id))];
  const { data: places } = placeIds.length
    ? await supabase.from('negocios').select('id,nombre').in('id', placeIds)
    : { data: [] };
  const names = new Map((places ?? []).map((place: any) => [place.id, String(place.nombre ?? '').trim()]));
  return rows.flatMap((row) => {
    const placeName = names.get(row.negocio_id);
    if (!placeName) return [];
    return [{
      reviewId: row.id,
      placeId: row.negocio_id,
      placeName,
      stars: row.stars,
      note: row.note || undefined,
      timestamp: new Date(row.created_at).getTime(),
      ...(photosFromRows(row.review_photos) ? { photos: photosFromRows(row.review_photos) } : {}),
    }];
  });
}
