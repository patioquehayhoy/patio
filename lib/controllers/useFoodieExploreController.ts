import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, Share, type TextInput } from 'react-native';
import type { Region } from 'react-native-maps';

import { fetchAiSearchIntent } from '@/lib/aiSearch';
import { getFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import { estaAbiertoAhora } from '@/lib/horario';
import { searchLiveMenus } from '@/lib/menu';
import { fetchPublicFonditas, type Patio, type PatioDishMatch } from '@/lib/patios';
import { getSavedMapCategories, setSavedMapCategories } from '@/lib/saved-map-filters';

type FoodieSheetMode = 'nearby' | 'saved' | null;

function normalizeIntent(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function interpretAiQuery(text: string) {
  const value = normalizeIntent(text);
  const terms = new Set<string>();
  const signals: string[] = [];
  if (/cald|sopa|consome|liquid|calient/.test(value)) {
    ['caldo', 'pozole', 'consomé', 'birria', 'pancita', 'sopa'].forEach((term) => terms.add(term));
    signals.push('algo caldoso');
  }
  if (/mexican|sazon|caser|tradicional/.test(value)) {
    ['mole', 'pozole', 'birria', 'enchiladas', 'chile relleno'].forEach((term) => terms.add(term));
    signals.push('sazón mexicano');
  }
  if (/barat|econom|menos de/.test(value)) signals.push('precio accesible');
  const openNow = /abiert|ahora/.test(value);
  if (openNow) signals.push('abierto ahora');
  if (!terms.size) {
    value.split(/\s+/).filter((word) => word.length > 3 && !['quiero', 'tengo', 'antoja', 'algo', 'comer', 'busco', 'cerca', 'donde'].includes(word)).forEach((word) => terms.add(word));
  }
  return { terms: [...terms].slice(0, 8), signals, openNow };
}

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
  if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)}\u00A0m`;
  return `${km.toFixed(km < 10 ? 1 : 0)}\u00A0km`;
}

export function useFoodieExploreController() {
  // selectedId: which pin is highlighted. showHeader: user explicitly tapped a pin/row.
  // These two are always moved together via selectPatio/deselect.
  const [allPatios, setAllPatios] = useState<Patio[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [activeSavedCategories, setActiveSavedCategories] = useState<string[]>([]);
  const [sheetMode, setSheetMode] = useState<FoodieSheetMode>(null);
  const [searchActive, setSearchActive] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [query, setQuery] = useState('');
  // `query` es lo que se ve en el campo de texto, vivo con cada tecla.
  // `submittedQuery` es lo que de verdad dispara resultados, mapa y sheet —
  // solo cambia al presionar el botón de buscar del teclado (o el X, para
  // limpiar). Apple Maps y Google Maps separan igual "escribir" de
  // "buscar": mientras escribes solo hay sugerencias vivas (o, como aquí,
  // nada todavía) — el mapa no se mueve, no aparecen pines ni card hasta
  // que se confirma la búsqueda. Antes ambos eran el mismo estado y cada
  // tecla ya movía el mapa y mostraba resultados.
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [visibleRegion, setVisibleRegion] = useState<Region>(FOODIE_INITIAL_REGION);
  // El orden de la lista se calcula UNA VEZ por búsqueda, con el centro del
  // mapa que había al confirmar — no con el centro en vivo. Antes ordenaba
  // por `visibleRegion` directo: al tocar un resultado, la cámara se movía
  // para encuadrarlo, eso cambiaba `visibleRegion`, y la lista se
  // reacomodaba sola bajo el dedo (el resultado que acabas de tocar podía
  // saltar de posición). Ni Apple ni Google reordenan la lista mientras la
  // exploras — solo al buscar de nuevo.
  const sortAnchorRegion = useRef<Region>(FOODIE_INITIAL_REGION);
  useEffect(() => {
    if (submittedQuery.trim()) sortAnchorRegion.current = visibleRegion;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedQuery]);
  const [liveResults, setLiveResults] = useState<PatioDishMatch[]>([]);
  const [searchPending, setSearchPending] = useState(false);
  const [aiNote, setAiNote] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!submittedQuery.trim()) {
      setLiveResults([]);
      setSearchPending(false);
      setAiNote('');
      return;
    }

    let cancelled = false;
    setSearchPending(true);
    // Ya no hace falta un debounce de 300ms — antes existía para no
    // recalcular en cada tecla; ahora esto solo corre una vez, al
    // confirmar la búsqueda.
    (async () => {
      // Primero la heurística local (instantánea, siempre disponible). En
      // modo IA se intenta reemplazarla con la interpretación real de Claude
      // (supabase/functions/search-intent) — expande vocabulario culinario de
      // verdad en vez de las 3 reglas fijas de abajo. Si la llamada falla o
      // tarda (sin red, función caída), la búsqueda sigue con la heurística
      // local en vez de quedarse sin resultados.
      const localIntent = interpretAiQuery(submittedQuery);
      let terms = localIntent.terms.length ? localIntent.terms : [submittedQuery];
      let openNow = localIntent.openNow;
      let note = '';
      if (aiMode) {
        const aiIntent = await fetchAiSearchIntent(submittedQuery);
        if (cancelled) return;
        if (aiIntent && aiIntent.terminos.length) {
          terms = aiIntent.terminos;
          openNow = aiIntent.abiertoAhora;
          note = aiIntent.nota;
        }
      }
      const groups = await Promise.all(terms.map((term) => searchLiveMenus(term, allPatios)));
      if (!cancelled) {
        const merged = new Map<string, PatioDishMatch>();
        groups.flat().forEach((result) => {
          if (aiMode && openNow && (!result.patio.weeklyHours || !estaAbiertoAhora(result.patio.weeklyHours))) return;
          const key = `${result.patio.id}-${result.section}-${result.item.name}`;
          const previous = merged.get(key);
          if (!previous || result.score > previous.score) merged.set(key, result);
        });
        setLiveResults([...merged.values()]);
        setAiNote(note);
        setSearchPending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [submittedQuery, allPatios, aiMode]);

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
      Promise.all([getFavoritePatioIds(), getSavedMapCategories()]).then(([ids, categories]) => {
        if (!mounted) return;
        setSavedIds(ids);
        setActiveSavedCategories(categories);
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
        (activeSavedCategories.length === 0 ||
          (savedIds.includes(patio.id) && patio.categories.some((c) => activeSavedCategories.includes(c)))) &&
        patio.latitude > 0 &&
        patio.latitude >= minLat &&
        patio.latitude <= maxLat &&
        patio.longitude >= minLng &&
        patio.longitude <= maxLng
    );
  }, [visibleRegion, allPatios, activeSavedCategories, savedIds]);

  const mapFilteredPatios = useMemo(
    () => activeSavedCategories.length === 0
      ? allPatios
      : allPatios.filter((patio) => savedIds.includes(patio.id) && patio.categories.some((c) => activeSavedCategories.includes(c))),
    [activeSavedCategories, allPatios, savedIds],
  );

  const clearSavedMapFilter = useCallback(async () => {
    setActiveSavedCategories([]);
    await setSavedMapCategories([]);
  }, []);

  const searchResults = useMemo(() => {
    if (!submittedQuery.trim()) return [];
    const anchor = sortAnchorRegion.current;
    return [...liveResults].sort((a, b) => {
      // Relevance decides the tier; distance from the map center AT SEARCH
      // TIME orders equivalent matches (not the live center — ver
      // `sortAnchorRegion`). This prevents a nearby weak tag from
      // outranking an exact dish while keeping useful results walkable.
      const relevanceTierA = Math.floor(a.score / 20);
      const relevanceTierB = Math.floor(b.score / 20);
      if (relevanceTierA !== relevanceTierB) return relevanceTierB - relevanceTierA;
      const distanceA = distanceKm(anchor, a.patio);
      const distanceB = distanceKm(anchor, b.patio);
      const ratingA = Number.parseFloat(a.patio.rating ?? '') || 0;
      const ratingB = Number.parseFloat(b.patio.rating ?? '') || 0;
      return (aiMode ? ratingB - ratingA : 0) || distanceA - distanceB || b.score - a.score;
    });
  }, [aiMode, liveResults, submittedQuery]);

  const matchingPatioIds = useMemo(() => new Set(searchResults.map((result) => result.patio.id)), [searchResults]);
  const isFiltering = submittedQuery.trim().length > 0;
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
  const distanceLabelForPatio = useCallback(
    (patio: Patio) => patio.latitude > 0 ? formatDistance(distanceKm(visibleRegion, patio)) : null,
    [visibleRegion],
  );
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
    setAiMode(false);
    setQuery('');
    setSubmittedQuery('');
    deselect();
  }, [deselect]);

  const openNearby = useCallback(() => {
    Keyboard.dismiss();
    setSearchActive(false);
    setAiMode(false);
    setQuery('');
    setSubmittedQuery('');
    setSheetMode('nearby');
    deselect();
  }, [deselect]);

  const openSaved = useCallback(() => {
    Keyboard.dismiss();
    setSearchActive(false);
    setAiMode(false);
    setQuery('');
    setSubmittedQuery('');
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
      message: `${selectedPatio.name}\n${selectedPatio.categories[0] ?? 'Fondita'} · ${selectedPatio.area}\n${selectedPatio.open}\n\n${selectedPatio.address}\n${mapsUrl}`,
    });
  }, [selectedPatio]);

  const openSearch = useCallback(() => {
    // Focus is not a query. Keep the map quiet until la persona confirma la
    // búsqueda (ver `handleSubmitSearch`) — igual que Apple Maps y Google
    // Maps, que no mueven el mapa ni comprometen resultados solo por
    // escribir.
    setSheetMode(null);
    setSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  }, []);

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchActive(false);
    setAiMode(false);
    setQuery('');
    setSubmittedQuery('');
    setSheetMode(null);
    deselect();
  }, [deselect]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    if (!text.trim()) {
      // Borrar el texto sí limpia de inmediato — no hay ambigüedad en
      // mostrar nada cuando el campo está vacío, a diferencia de escribir
      // texto nuevo sin confirmar, que debe dejar los resultados anteriores
      // en paz hasta que se confirme o se borre.
      setSubmittedQuery('');
      deselect();
    }
  }, [deselect]);

  const handleSubmitSearch = useCallback(() => {
    Keyboard.dismiss();
    setSubmittedQuery(query);
  }, [query]);

  // Para las pills de sugerencia rápida ("mole", "pozole"…): tocar una debe
  // buscar de inmediato, como si se hubiera escrito y confirmado en un solo
  // gesto — no basta con `handleQueryChange` porque ya no dispara la
  // búsqueda por sí sola (ver `submittedQuery` arriba).
  const searchFor = useCallback((text: string) => {
    Keyboard.dismiss();
    setQuery(text);
    setSubmittedQuery(text);
  }, []);

  return {
    activeSavedCategories,
    aiMode,
    aiNote,
    allPatios,
    clearSavedMapFilter,
    closeSheet,
    closeSearch,
    deselect,
    distanceLabelForPatio,
    featuredMatch,
    handleQueryChange,
    handleSubmitSearch,
    searchFor,
    handleShareSelected,
    idleMode,
    initialLoading,
    isFiltering,
    matchingPatioIds,
    mapFilteredPatios,
    openSearch,
    openNearby,
    openSaved,
    query,
    savedIds,
    savedPatios,
    searchActive,
    searchInputRef,
    searchPending,
    setAiMode,
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
