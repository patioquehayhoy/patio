// Fotos de platillos (2026-11-15): la URL viaja dentro del menú, que escribe
// el negocio. La app solo muestra fotos del bucket `dish-photos` de Patio,
// nunca una dirección de afuera.
const BASE = (process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gjfjsjlrgycrgmcbjrus.supabase.co').replace(/\/+$/, '');

export const DISH_PHOTO_PREFIX = `${BASE}/storage/v1/object/public/dish-photos/`;

export const REVIEW_PHOTO_PREFIX = `${BASE}/storage/v1/object/public/review-photos/`;

/** Foto de un cliente (reseña): solo del bucket `review-photos` de Patio. */
export function isReviewPhotoUrl(url: unknown): url is string {
  return typeof url === 'string'
    && url.length <= 600
    && url.startsWith(REVIEW_PHOTO_PREFIX)
    && !url.slice(REVIEW_PHOTO_PREFIX.length).includes('..');
}

export function isDishPhotoUrl(url: unknown): url is string {
  return typeof url === 'string'
    && url.length <= 600
    && url.startsWith(DISH_PHOTO_PREFIX)
    && !url.slice(DISH_PHOTO_PREFIX.length).includes('..');
}
