import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Share, type TextInput } from 'react-native';
import type { Region } from 'react-native-maps';

import { getFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import { searchLiveMenus } from '@/lib/menu';
import { fetchPublicFonditas, type Patio, type PatioDishMatch } from '@/lib/patios';

type FoodieSheetMode = 'nearby' | 'saved' | null;

export const FOODIE_INITIAL_REGION: Region = {
  latitude: 19.4429,
  longitude: -99.2044,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

function distanceKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (n: number) => (n * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return earthKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(km: number) {
  if (!Number.isFinite(km)) return null;
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m aprox.`;
  return `${km.toFixed(km < 10 ? 1 : 0)} km aprox.`;
}

export function useFoodieExploreController() {
  // selectedId: which pin is highlighted. showHeader: user explicitly tapped a pin/row.
  // These two are always moved together via selectPatio/deselect.
  const [allPatios, setAllPatios] = useState<Patio[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [sheetMode, setSheetMode] = useState<FoodieSheetMode>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleRegion, setVisibleRegion] = useState<Region>(FOODIE_INITIAL_REGION);
  const [liveResults, setLiveResults] = useState<PatioDishMatch[]>([]);
  const [searchPending, setSearchPending] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!query.trim()) {
      setLiveResults([]);
      setSearchPending(false);
      return;
    }

    let cancelled = false;
    setSearchPending(true);
    const timer = setTimeout(() => {
      searchLiveMenus(query, allPatios).then((results) => {
        if (!cancelled) {
          setLiveResults(results);
          setSearchPending(false);
        }
      });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, allPatios]);

  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise((resolve) => setTimeout(resolve, 900));
    const prepare = __DEV__
      ? import('@/lib/demo').then((demo) => demo.seedDemoFoodie()).then(fetchPublicFonditas)
      : fetchPublicFonditas();

    Promise.all([prepare, minDelay])
      .then(([db]) => {
        if (cancelled) return;
        setAllPatios(db as Patio[]);
        setInitialLoading(false);
      })
      .catch(() => {
        if (!cancelled) setInitialLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getFavoritePatioIds().then((ids) => {
        if (mounted) setSavedIds(ids);
      });
      if (__DEV__) {
        import('@/lib/demo')
          .then((demo) => demo.seedDemoFoodie())
          .then(fetchPublicFonditas)
          .then((patios) => {
            if (mounted) setAllPatios(patios);
          })
          .catch(() => {});
      }
      return () => {
        mounted = false;
      };
    }, [])
  );

  const visiblePatios = useMemo(() => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = visibleRegion;
    const minLat = latitude - latitudeDelta / 2;
    const maxLat = latitude + latitudeDelta / 2;
    const minLng = longitude - longitudeDelta / 2;
    const maxLng = longitude + longitudeDelta / 2;
    return allPatios.filter(
      (patio) =>
        patio.latitude > 0 &&
        patio.latitude >= minLat &&
        patio.latitude <= maxLat &&
        patio.longitude >= minLng &&
        patio.longitude <= maxLng
    );
  }, [visibleRegion, allPatios]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    return [...liveResults].sort((a, b) => b.score - a.score);
  }, [liveResults, query]);

  const matchingPatioIds = useMemo(() => new Set(searchResults.map((result) => result.patio.id)), [searchResults]);
  const isFiltering = query.trim().length >= 3;
  const idleMode = !searchActive && !showHeader && !isFiltering;

  const topMatchPerPatio = useMemo(() => {
    const seen = new Set<string>();
    return searchResults.filter((result) => {
      if (seen.has(result.patio.id)) return false;
      seen.add(result.patio.id);
      return true;
    });
  }, [searchResults]);

  const savedPatios = useMemo(
    () => allPatios.filter((patio) => savedIds.includes(patio.id)),
    [allPatios, savedIds]
  );
  const selectedPatio = selectedId ? (allPatios.find((patio) => patio.id === selectedId) ?? null) : null;
  const selectedDistanceLabel = selectedPatio && selectedPatio.latitude > 0
    ? formatDistance(distanceKm(visibleRegion, selectedPatio))
    : null;
  const featuredMatch = showHeader && isFiltering && selectedId
    ? (searchResults.find((result) => result.patio.id === selectedId) ?? null)
    : null;
  const selectedSaved = selectedId ? savedIds.includes(selectedId) : false;

  const selectPatio = useCallback((id: string) => {
    setSelectedId(id);
    setShowHeader(true);
    setSheetMode((current) => current ?? 'nearby');
  }, []);

  const deselect = useCallback(() => {
    setSelectedId(null);
    setShowHeader(false);
  }, []);

  const closeSheet = useCallback(() => {
    Keyboard.dismiss();
    setSheetMode(null);
    setSearchActive(false);
    setQuery('');
    deselect();
  }, [deselect]);

  const openNearby = useCallback(() => {
    Keyboard.dismiss();
    setSearchActive(false);
    setQuery('');
    setSheetMode('nearby');
    deselect();
  }, [deselect]);

  const openSaved = useCallback(() => {
    Keyboard.dismiss();
    setSearchActive(false);
    setQuery('');
    setSheetMode('saved');
    deselect();
  }, [deselect]);

  const toggleSaved = useCallback(async () => {
    if (!selectedId) return;
    const next = await toggleFavoritePatio(selectedId);
    setSavedIds(next);
  }, [selectedId]);

  const handleShareSelected = useCallback(() => {
    if (!selectedPatio) return;
    const mapsUrl = `https://maps.apple.com/?q=${selectedPatio.latitude},${selectedPatio.longitude}`;
    Share.share({
      message: `${selectedPatio.name}\n${selectedPatio.category} · ${selectedPatio.area}\n${selectedPatio.open}\n\n${selectedPatio.address}\n${mapsUrl}`,
    });
  }, [selectedPatio]);

  const openSearch = useCallback(() => {
    // Buscar abre también la lista "cerca de ti": el foodie ve opciones desde
    // el primer toque y el teclado (con su mic de dictado) queda listo.
    setSheetMode('nearby');
    setSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  }, []);

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchActive(false);
    setQuery('');
    setSheetMode(null);
    deselect();
  }, [deselect]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (!text.trim()) deselect();
  }, [deselect]);

  return {
    allPatios,
    closeSheet,
    closeSearch,
    deselect,
    featuredMatch,
    handleQueryChange,
    handleShareSelected,
    idleMode,
    initialLoading,
    isFiltering,
    matchingPatioIds,
    openSearch,
    openNearby,
    openSaved,
    query,
    savedIds,
    savedPatios,
    searchActive,
    searchInputRef,
    searchPending,
    selectPatio,
    selectedId,
    selectedDistanceLabel,
    selectedPatio,
    selectedSaved,
    setVisibleRegion,
    sheetMode,
    showHeader,
    toggleSaved,
    topMatchPerPatio,
    visiblePatios,
  };
}
