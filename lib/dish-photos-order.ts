// Orden de las fotos de un platillo (2026-11-15).
// 1. La del negocio primero: es la portada que eligió.
// 2. Luego las de clientes de los últimos 90 días, la más nueva primero: el
//    platillo cambia y una foto de hace dos años engaña.
// 3. Una por persona antes de repetir a alguien: nadie llena la galería.
// 4. Al final las más viejas, con la misma regla.
// Las estrellas de la reseña no ordenan: si lo hicieran, solo se verían las
// de reseñas buenas.

export type DishPhoto = {
  url: string;
  /** Nombre de quien la subió; sin él es del negocio. */
  by?: string;
  /** Frase del platillo que va como pie. */
  note?: string;
  /** Cuándo se subió (ms). */
  at?: number;
  reviewId?: string;
  userId?: string;
  mine?: boolean;
};

const RECENT_MS = 90 * 24 * 60 * 60 * 1000;

function onePerPersonFirst(photos: DishPhoto[]): DishPhoto[] {
  const seen = new Set<string>();
  const first: DishPhoto[] = [];
  const repeats: DishPhoto[] = [];
  photos.forEach((photo) => {
    const who = photo.userId ?? photo.by ?? photo.url;
    if (seen.has(who)) repeats.push(photo);
    else { seen.add(who); first.push(photo); }
  });
  return [...first, ...repeats];
}

export function orderDishPhotos(businessPhoto: string | undefined, customerPhotos: DishPhoto[], now = Date.now()): DishPhoto[] {
  const newest = [...customerPhotos].sort((a, b) => (b.at ?? 0) - (a.at ?? 0));
  const recent = newest.filter((photo) => now - (photo.at ?? 0) <= RECENT_MS);
  const older = newest.filter((photo) => now - (photo.at ?? 0) > RECENT_MS);
  const seenUrls = new Set<string>();
  return [
    ...(businessPhoto ? [{ url: businessPhoto }] : []),
    ...onePerPersonFirst(recent),
    ...onePerPersonFirst(older),
  ].filter((photo) => (seenUrls.has(photo.url) ? false : (seenUrls.add(photo.url), true)));
}

/** «hoy», «ayer», «hace 3 días», «hace 2 meses»… para el crédito de la foto. */
export function photoAge(at: number | undefined, now = Date.now()): string | undefined {
  if (!at) return undefined;
  const days = Math.floor((now - at) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'hoy';
  if (days === 1) return 'ayer';
  if (days < 30) return `hace ${days} días`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? 'hace un mes' : `hace ${months} meses`;
  const years = Math.floor(months / 12);
  return years === 1 ? 'hace un año' : `hace ${years} años`;
}
