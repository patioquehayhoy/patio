import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  getPatioReviewSummary,
  getPublicPatioReviewPage,
  getPublicPatioReviews,
  REVIEW_PAGE_SIZE,
  summarizeReviews,
  type PublicPatioReview,
  type ReviewSummary,
} from '@/lib/ratings';

/** Fotos de clientes que la ficha baja para el menú, aparte de la lista. */
const PHOTO_REVIEWS_LIMIT = 200;

const keyOf = (review: PublicPatioReview) => review.reviewId ?? `${review.userId}-${review.timestamp}`;

function union(...lists: PublicPatioReview[][]): PublicPatioReview[] {
  const byKey = new Map<string, PublicPatioReview>();
  for (const list of lists) for (const review of list) if (!byKey.has(keyOf(review))) byKey.set(keyOf(review), review);
  return [...byKey.values()].sort((a, b) => b.timestamp - a.timestamp);
}

type Paged = {
  /** Lista que se ve, del filtro actual, de la más nueva a la más vieja. */
  list: PublicPatioReview[];
  cursor: string | null;
  photos: PublicPatioReview[];
  summary: ReviewSummary;
};

/**
 * Reseñas de la ficha por partes (2026-11-16): 20 y «Ver más», con el promedio,
 * el total y las estrellas calculados en el servidor. Las fotos de clientes se
 * bajan aparte para que el menú tenga todas aunque su reseña no esté cargada.
 *
 * Lugares de prueba (sin cuenta) o un servidor sin `review_summary`: se bajan
 * todas y la página se arma aquí, con el mismo «Ver más».
 */
export function usePatioReviews(
  patioId: string | undefined,
  withExtras: (patioId: string, reviews: PublicPatioReview[]) => PublicPatioReview[],
) {
  const [all, setAll] = useState<PublicPatioReview[] | null>(null);
  const [shown, setShown] = useState(REVIEW_PAGE_SIZE);
  const [paged, setPaged] = useState<Paged | null>(null);
  const [filter, setFilterState] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const request = useRef(0);
  const filterRef = useRef<number | null>(null);
  const loadedCount = useRef(REVIEW_PAGE_SIZE);
  const extras = useRef(withExtras);
  extras.current = withExtras;

  useEffect(() => {
    request.current += 1;
    setAll(null);
    setPaged(null);
    setShown(REVIEW_PAGE_SIZE);
    setFilterState(null);
    filterRef.current = null;
    loadedCount.current = REVIEW_PAGE_SIZE;
  }, [patioId]);

  /** Vuelve a pedir lo que ya se veía (al regresar a la ficha, tras reseñar). */
  const refresh = useCallback(async () => {
    if (!patioId) return;
    const id = ++request.current;
    const stars = filterRef.current;
    const limit = Math.max(REVIEW_PAGE_SIZE, loadedCount.current);
    const [summary, page, photos] = await Promise.all([
      getPatioReviewSummary(patioId),
      getPublicPatioReviewPage(patioId, { limit, stars }),
      getPublicPatioReviewPage(patioId, { limit: PHOTO_REVIEWS_LIMIT, photosOnly: true }),
    ]).catch(() => [null, null, null] as const);
    if (id !== request.current) return;
    if (summary && page && photos) {
      setAll(null);
      setPaged({ list: page.reviews, cursor: page.nextCursor, photos: photos.reviews, summary });
      return;
    }
    const everything = extras.current(patioId, await getPublicPatioReviews(patioId).catch(() => []));
    if (id !== request.current) return;
    setPaged(null);
    setAll(everything);
  }, [patioId]);

  const setFilter = useCallback((stars: number | null) => {
    filterRef.current = stars;
    setFilterState(stars);
    setShown(REVIEW_PAGE_SIZE);
    loadedCount.current = REVIEW_PAGE_SIZE;
    if (!patioId || all) return;
    const id = ++request.current;
    getPublicPatioReviewPage(patioId, { limit: REVIEW_PAGE_SIZE, stars }).then((page) => {
      if (id !== request.current) return;
      setPaged((latest) => latest && { ...latest, list: page.reviews, cursor: page.nextCursor });
    }).catch(() => {});
  }, [all, patioId]);

  const loadMore = useCallback(() => {
    if (all) {
      setShown((current) => {
        loadedCount.current = current + REVIEW_PAGE_SIZE;
        return current + REVIEW_PAGE_SIZE;
      });
      return;
    }
    if (!patioId || !paged?.cursor || loadingMore) return;
    const id = request.current;
    setLoadingMore(true);
    getPublicPatioReviewPage(patioId, { limit: REVIEW_PAGE_SIZE, stars: filterRef.current, cursor: paged.cursor })
      .then((page) => {
        if (id !== request.current) return;
        setPaged((latest) => {
          if (!latest) return latest;
          const list = union(latest.list, page.reviews);
          loadedCount.current = list.length;
          return { ...latest, list, cursor: page.nextCursor };
        });
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [all, loadingMore, paged?.cursor, patioId]);

  /** Trae páginas hasta que aparezca esa reseña (de la foto a su reseña). */
  const ensureListed = useCallback(async (review: { reviewId?: string; userId: string; timestamp: number }) => {
    if (all) {
      const index = (filterRef.current ? all.filter((item) => item.stars === filterRef.current) : all)
        .findIndex((item) => item.userId === review.userId && item.timestamp === review.timestamp);
      if (index >= 0) setShown((current) => Math.max(current, Math.ceil((index + 1) / REVIEW_PAGE_SIZE) * REVIEW_PAGE_SIZE));
      return;
    }
    if (!patioId || !paged) return;
    const listed = (list: PublicPatioReview[]) => list.some((item) => item.userId === review.userId && item.timestamp === review.timestamp);
    if (listed(paged.list)) return;
    const id = request.current;
    let list = paged.list;
    let cursor = paged.cursor;
    // Hasta la fecha de esa reseña, en una sola petición.
    if (cursor) {
      const page = await getPublicPatioReviewPage(patioId, { cursor, stars: filterRef.current, limit: 500 })
        .catch(() => null);
      if (!page || id !== request.current) return;
      const older = page.reviews;
      const cut = older.findIndex((item) => item.userId === review.userId && item.timestamp === review.timestamp);
      const take = cut >= 0 ? older.slice(0, cut + 1) : older;
      list = union(list, take);
      cursor = cut >= 0 && (cut < older.length - 1 || page.nextCursor)
        ? new Date(take[take.length - 1].timestamp).toISOString()
        : page.nextCursor;
    }
    loadedCount.current = list.length;
    setPaged((latest) => latest && { ...latest, list, cursor });
  }, [all, paged, patioId]);

  const summary = useMemo(() => paged?.summary ?? summarizeReviews(all ?? []), [all, paged]);
  const filteredAll = useMemo(() => (all && filter ? all.filter((review) => review.stars === filter) : all), [all, filter]);
  const list = useMemo(() => (filteredAll ? filteredAll.slice(0, shown) : paged?.list ?? []), [filteredAll, paged, shown]);
  const hasMore = filteredAll ? filteredAll.length > shown : !!paged?.cursor;
  // Todo lo que la ficha conoce: la lista y las reseñas con foto del menú.
  const known = useMemo(() => all ?? union(paged?.list ?? [], paged?.photos ?? []), [all, paged]);

  return { summary, list, known, hasMore, loadMore, loadingMore, filter, setFilter, refresh, ensureListed };
}
