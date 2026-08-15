import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Share } from 'react-native';
import * as Haptics from 'expo-haptics';

import { syncSavedPatioNotificationSubscriptions } from '@/lib/community-notifications';
import { getFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import {
  DIA_CORTO,
  estaAbiertoAhora,
  formatHHMM12,
  horarioDeHoy,
  proximaApertura,
  resumenHorario,
} from '@/lib/horario';
import { cleanMenuDescription, cleanMenuText, fetchMenuForFondita } from '@/lib/menu';
import { fetchFonditaById, getPatioById, type Patio, type PatioMenuSection } from '@/lib/patios';
import { publicCurrency, publicPrice } from '@/lib/prices';
import { getPatioRating, getPublicPatioReviews, type PatioRating, type PublicPatioReview } from '@/lib/ratings';
import { registerPatioView } from '@/lib/stats';

type PatioParam = string | string[] | undefined;

const DEMO_PROFILE_REVIEWS: PublicPatioReview[] = [
  {
    userId: 'demo-review-sofia',
    author: 'Sofía R.',
    stars: 5,
    reasons: ['Sabor casero', 'Buena porción'],
    note: 'El mole está muy bien servido y las tortillas llegan calientes. Regresaría por las enchiladas.',
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    businessReply: 'Gracias, Sofía. El mole lo preparamos desde temprano; aquí te esperamos.',
    isMine: false,
  },
  {
    userId: 'demo-review-diego',
    author: 'Diego M.',
    stars: 4,
    reasons: ['Precio justo', 'Servicio amable'],
    note: 'Comida sencilla y rica. Al mediodía se llena, pero avanzan rápido.',
    timestamp: Date.now() - 1000 * 60 * 60 * 52,
    isMine: false,
  },
  {
    userId: 'demo-review-mariana',
    author: 'Mariana L.',
    stars: 5,
    reasons: ['Menú variado'],
    note: 'Probé el chile relleno y el agua de horchata. Todo se sintió fresco.',
    timestamp: Date.now() - 1000 * 60 * 60 * 80,
    isMine: false,
  },
];

const DEMO_CRITICAL_REVIEWS: PublicPatioReview[] = [
  { userId: 'demo-critical-1', author: 'Ana P.', stars: 2, reasons: ['Servicio lento'], note: 'La idea es buena, pero esperamos demasiado y varios platos llegaron fríos.', timestamp: Date.now() - 1000 * 60 * 60 * 20, isMine: false },
  { userId: 'demo-critical-2', author: 'Luis G.', stars: 1, reasons: ['No coincidió'], note: 'El menú publicado no coincidía con lo que tenían disponible al llegar.', timestamp: Date.now() - 1000 * 60 * 60 * 46, isMine: false },
  { userId: 'demo-critical-3', author: 'Majo C.', stars: 2, reasons: ['Porción pequeña'], note: 'El lugar se ve bien, aunque la porción fue menor de lo esperado por el precio.', timestamp: Date.now() - 1000 * 60 * 60 * 73, businessReply: 'Gracias por decirnos. Estamos ajustando porciones y tiempos durante estas primeras semanas.', isMine: false },
  { userId: 'demo-critical-4', author: 'Raúl V.', stars: 3, reasons: ['Buen ambiente'], note: 'Buen ambiente y café, todavía tienen que mejorar la coordinación del servicio.', timestamp: Date.now() - 1000 * 60 * 60 * 96, isMine: false },
];

const DEMO_ESTABLISHED_REVIEWS: PublicPatioReview[] = [
  { userId: 'demo-established-1', author: 'Fernanda T.', stars: 5, reasons: ['Sabor casero'], note: 'Venimos desde hace años. El chamorro sigue siendo el plato que siempre pedimos.', timestamp: Date.now() - 1000 * 60 * 60 * 30, isMine: false },
  { userId: 'demo-established-2', author: 'Jorge A.', stars: 4, reasons: ['Servicio amable'], note: 'Porciones generosas y servicio atento. Los domingos suele llenarse.', timestamp: Date.now() - 1000 * 60 * 60 * 70, isMine: false },
  { userId: 'demo-established-3', author: 'Pilar N.', stars: 5, reasons: ['Buena porción', 'Sabor casero'], note: 'Las enmoladas y el chile relleno valen mucho la visita.', timestamp: Date.now() - 1000 * 60 * 60 * 118, isMine: false },
];

const DEMO_LONGTIME_PATIO_REVIEWS: PublicPatioReview[] = [
  { userId: 'demo-longtime-1', author: 'Elena C.', stars: 5, reasons: ['Buen café', 'Servicio amable'], note: 'Es de esos lugares confiables a los que siempre se puede volver.', timestamp: Date.now() - 1000 * 60 * 60 * 40, isMine: false },
  { userId: 'demo-longtime-2', author: 'Marco V.', stars: 4, reasons: ['Ambiente tranquilo'], note: 'Buen desayuno y atención constante desde hace tiempo.', timestamp: Date.now() - 1000 * 60 * 60 * 92, isMine: false },
];

function withDemoProfileReviews(patioId: string, reviews: PublicPatioReview[]) {
  if (!__DEV__) return reviews;
  if (patioId === 'demo-mi-patio') return [...reviews, ...DEMO_PROFILE_REVIEWS];
  if (patioId === 'demo-patio-2') return [...reviews, ...DEMO_CRITICAL_REVIEWS];
  if (patioId === 'demo-patio-3') return [...reviews, ...DEMO_ESTABLISHED_REVIEWS];
  if (patioId === 'demo-patio-4') return [...reviews, ...DEMO_LONGTIME_PATIO_REVIEWS];
  return reviews;
}

function cleanParam(id: PatioParam): string | undefined {
  return Array.isArray(id) ? id[0] : id;
}

function patioStatus(patio: Patio): boolean | null {
  if (patio.weeklyHours) return estaAbiertoAhora(patio.weeklyHours);
  return null;
}

export function usePatioDetailController(id: PatioParam) {
  const [patio, setPatio] = useState<Patio | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveMenu, setLiveMenu] = useState<PatioMenuSection[] | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [userReview, setUserReview] = useState<PatioRating | null>(null);
  const [reviews, setReviews] = useState<PublicPatioReview[]>([]);
  const cleanId = cleanParam(id);
  const patioId = patio?.id;

  useEffect(() => {
    if (!cleanId) {
      setLoading(false);
      return;
    }

    const mock = getPatioById(cleanId);
    if (mock) {
      setPatio(mock);
      setLoading(false);
      return;
    }

    fetchFonditaById(cleanId).then((found) => {
      setPatio(found);
      setLoading(false);
    });
  }, [cleanId]);

  useEffect(() => {
    if (!patioId) return;
    registerPatioView(patioId);
    getFavoritePatioIds().then((ids) => setIsSaved(ids.includes(patioId)));
    fetchMenuForFondita(patioId).then((sections) => {
      if (sections.length > 0) setLiveMenu(sections);
    });
  }, [patioId]);

  useFocusEffect(
    useCallback(() => {
      if (!patioId) return undefined;
      let active = true;
      Promise.all([getPatioRating(patioId), getPublicPatioReviews(patioId), getFavoritePatioIds()]).then(([rating, publicReviews, favoriteIds]) => {
        if (active) {
          setUserReview(rating);
          setReviews(withDemoProfileReviews(patioId, publicReviews));
          setIsSaved(favoriteIds.includes(patioId));
        }
      });
      return () => {
        active = false;
      };
    }, [patioId]),
  );

  const status = useMemo(() => (patio ? patioStatus(patio) : null), [patio]);
  const isClosed = status === false;
  const soldOut = patio?.soldOut === true;
  const sections = useMemo(
    () => (liveMenu ?? patio?.menu ?? []).map((section) => ({
      ...section,
      section: cleanMenuText(section.section) || section.section,
      items: section.items.map((item) => ({
        ...item,
        name: cleanMenuText(item.name) || item.name,
        ...(() => {
          const description = cleanMenuDescription(item.description);
          const inferredPrice = !item.price && description?.match(/^\(\s*(\$\s*[\d,.]+)\s*\)$/)?.[1];
          return {
            description: inferredPrice ? undefined : description,
            price: item.price || inferredPrice,
          };
        })(),
      })),
    })),
    [liveMenu, patio],
  );
  const hoy = useMemo(() => (patio ? horarioDeHoy(patio.weeklyHours) : null), [patio]);
  const rangoHoy = useMemo(() => {
    if (!patio) return '';
    if (!patio.weeklyHours?.length) return 'Sin horario';
    if (!hoy) return 'Sin horario hoy';
    if (hoy.cerrado) return 'Cerrado hoy';
    if (hoy.abre && hoy.cierra) return `${formatHHMM12(hoy.abre)}–${formatHHMM12(hoy.cierra)}`;
    return 'Sin horario hoy';
  }, [hoy, patio]);
  const proxTexto = useMemo(() => {
    const prox = patio ? proximaApertura(patio.weeklyHours) : null;
    return prox ? `${DIA_CORTO[prox.dia]} abre a las ${formatHHMM12(prox.abre)}` : null;
  }, [patio]);
  const menuPrice = sections.find((section) => publicPrice(section.price))?.price;
  const priceLabel = menuPrice ? publicCurrency(menuPrice) : publicPrice(patio?.price);
  const todayLabel = DIA_CORTO[hoy?.dia ?? new Date().getDay()];

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/explorar');
  }, []);

  const handleComoLlegar = useCallback(() => {
    if (!patio) return;
    const { latitude, longitude } = patio;
    const url = Platform.select({
      ios: `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
      android: `google.navigation:q=${latitude},${longitude}`,
    });
    if (url) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Linking.openURL(url).catch(() => {});
    }
  }, [patio]);

  const handleToggleSaved = useCallback(async () => {
    if (!patio) return;
    const next = await toggleFavoritePatio(patio.id);
    setIsSaved(next.includes(patio.id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    syncSavedPatioNotificationSubscriptions(next).catch(() => {});
  }, [patio]);

  const handleShare = useCallback(() => {
    if (!patio) return;
    const patioUrl = `patio://patio/${patio.id}`;
    const mapsUrl = `https://maps.apple.com/?q=${patio.latitude},${patio.longitude}`;
    const horarioTexto = resumenHorario(patio.weeklyHours) || patio.open;
    Share.share({
      title: `${patio.name} en Patio`,
      message: `${patio.name}\n${patio.category} · ${patio.area}\n${horarioTexto}\n\nVer menú en Patio:\n${patioUrl}\n\nCómo llegar:\n${mapsUrl}`,
      url: patioUrl,
    }).catch(() => {});
  }, [patio]);

  const handleStarPress = useCallback((stars: number) => {
    if (!patio) return;
    router.push({ pathname: '/resena/[id]', params: { id: patio.id, stars: String(stars) } });
  }, [patio]);

  return {
    cleanId,
    handleBack,
    handleComoLlegar,
    handleShare,
    handleStarPress,
    handleToggleSaved,
    hoy,
    isClosed,
    isSaved,
    loading,
    patio,
    patioId,
    priceLabel,
    proxTexto,
    rangoHoy,
    reviews,
    sections,
    soldOut,
    status,
    todayLabel,
    userRating: userReview?.stars ?? null,
    userReview,
  };
}
