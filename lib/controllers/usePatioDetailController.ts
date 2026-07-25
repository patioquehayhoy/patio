import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Linking, Platform, Share } from 'react-native';

import { getFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import {
  DIA_CORTO,
  estaAbiertoAhora,
  formatHHMM12,
  horarioDeHoy,
  proximaApertura,
  resumenHorario,
} from '@/lib/horario';
import { fetchMenuForFondita } from '@/lib/menu';
import { getNotifPrefs, setAvisar } from '@/lib/notifications';
import { fetchFonditaById, getPatioById, type Patio, type PatioMenuSection } from '@/lib/patios';
import { publicCurrency, publicPrice } from '@/lib/prices';
import { getPatioRating, type PatioRating } from '@/lib/ratings';
import { registerPatioView } from '@/lib/stats';

type PatioParam = string | string[] | undefined;

function cleanParam(id: PatioParam): string | undefined {
  return Array.isArray(id) ? id[0] : id;
}

function isPatioOpenLegacy(open: string): boolean | null {
  const match = open.match(/(\d+)(am|pm)?[-–](\d+)(am|pm)/i);
  if (!match) return null;
  const toHour = (hour: string, period: string) => {
    let parsed = parseInt(hour, 10);
    if (period?.toLowerCase() === 'pm' && parsed !== 12) parsed += 12;
    if (period?.toLowerCase() === 'am' && parsed === 12) parsed = 0;
    return parsed;
  };
  const now = new Date();
  const cdmx = now.getUTCHours() - 6 + now.getUTCMinutes() / 60;
  const opens = toHour(match[1], match[2] ?? match[4]);
  const closes = toHour(match[3], match[4]);
  return cdmx >= opens && cdmx < closes;
}

function patioStatus(patio: Patio): boolean | null {
  if (patio.weeklyHours) return estaAbiertoAhora(patio.weeklyHours);
  return isPatioOpenLegacy(patio.open);
}

export function usePatioDetailController(id: PatioParam) {
  const [patio, setPatio] = useState<Patio | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveMenu, setLiveMenu] = useState<PatioMenuSection[] | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [userReview, setUserReview] = useState<PatioRating | null>(null);
  const [notifyOn, setNotifyOn] = useState(false);
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
    getNotifPrefs().then((prefs) => setNotifyOn(prefs.avisar));
    fetchMenuForFondita(patioId).then((sections) => {
      if (sections.length > 0) setLiveMenu(sections);
    });
  }, [patioId]);

  useFocusEffect(
    useCallback(() => {
      if (!patioId) return undefined;
      let active = true;
      getPatioRating(patioId).then((rating) => {
        if (active) setUserReview(rating);
      });
      return () => {
        active = false;
      };
    }, [patioId]),
  );

  const status = useMemo(() => (patio ? patioStatus(patio) : null), [patio]);
  const isClosed = status === false;
  const soldOut = patio?.soldOut === true;
  const sections = useMemo(() => liveMenu ?? patio?.menu ?? [], [liveMenu, patio]);
  const hoy = useMemo(() => (patio ? horarioDeHoy(patio.weeklyHours) : null), [patio]);
  const rangoHoy = useMemo(() => {
    if (!patio) return '';
    return hoy && !hoy.cerrado && hoy.abre && hoy.cierra
      ? `${formatHHMM12(hoy.abre)}–${formatHHMM12(hoy.cierra)}`
      : patio.open;
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
    if (url) Linking.openURL(url);
  }, [patio]);

  const handleAvisarManana = useCallback(async () => {
    if (!patio) return;
    if (!notifyOn && !isSaved) {
      const next = await toggleFavoritePatio(patio.id);
      setIsSaved(next.includes(patio.id));
    }
    const ok = await setAvisar(!notifyOn);
    setNotifyOn(ok);
  }, [isSaved, notifyOn, patio]);

  const handleToggleSaved = useCallback(async () => {
    if (!patio) return;
    const next = await toggleFavoritePatio(patio.id);
    setIsSaved(next.includes(patio.id));
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
    });
  }, [patio]);

  const handleStarPress = useCallback((stars: number) => {
    if (!patio) return;
    router.push({ pathname: '/resena/[id]', params: { id: patio.id, stars: String(stars) } });
  }, [patio]);

  return {
    cleanId,
    handleAvisarManana,
    handleBack,
    handleComoLlegar,
    handleShare,
    handleStarPress,
    handleToggleSaved,
    hoy,
    isClosed,
    isSaved,
    loading,
    notifyOn,
    patio,
    patioId,
    priceLabel,
    proxTexto,
    rangoHoy,
    sections,
    soldOut,
    status,
    todayLabel,
    userRating: userReview?.stars ?? null,
    userReview,
  };
}
