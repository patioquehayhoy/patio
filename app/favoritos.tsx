import { patioDistance, patioMinimumPrice, sortPatiosByMetric, type PatioSortMode } from '@/lib/patio-sort';
import { FoodieLoading } from '@/components/foodie-loading';
import { useScrollEdges } from '@/lib/use-scroll-edges';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { bottomActionClearance, bottomTabClearance, patioGridColumns } from '@/lib/layout-metrics';
import { AlphabetIndex } from '@/components/alphabet-index';
import { EMPTY_FOODIE_FILTERS, FoodieFilterBar, matchesFoodieFilters } from '@/components/foodie-filter-bar';
import { SelectionActions } from '@/components/selection-actions';
import { SaveToListSheet } from '@/components/save-to-list-sheet';
import { SearchField } from '@/components/search-field';
import { PatioIdentityIcon } from '@/components/patio-identity-icon';
import { patioCardAccessibilityLabel } from '@/lib/patio-card-info';
import { PatioCardInfo, PatioCardPrice } from '@/components/patio-card-info';
import { useFavoritePatiosController } from '@/lib/controllers/useFavoritePatiosController';
import { useFoodieFilters } from '@/lib/foodie-filters-context';
import { formatDistance } from '@/lib/geo';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';
import { recordRecentPatio } from '@/lib/recent-patios';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { noWidow } from '@/lib/typography';
import { createCollection, getCollections, publishCollection, setPatiosInCollection, type PatioCollection } from '@/lib/collections';
import { removeFavoritePatios } from '@/lib/favorites';
import { alphabeticalSections } from '@/lib/library-index';
import { resolveLibraryMoveSelection } from '@/lib/library-selection';
import { useKnownLocation } from '@/lib/use-known-location';

const FAVORITES_VIEW_KEY = '@patio_favorites_view';
const FAVORITES_SORT_KEY = '@patio_favorites_sort';

// Both views preserve the same reading order: place, menu, location, personal context.
// Status is text rather than color-only badges; controls live outside the content cards.
function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },
    viewport: { flex: 1 },
    alphabetSection: { paddingHorizontal: 16 },

    controlsClip: { overflow: 'hidden' },
    filterWrap: { paddingTop: 10, paddingBottom: 4, gap: 4 },
    searchWrap: { marginHorizontal: 16 },
    libraryHeader: { paddingHorizontal: 16, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    libraryCount: { flex: 1, fontSize: 13, lineHeight: 17, color: t.textSecondary },

    // Selección rápida: link a la derecha, arriba del filtro — mismo lugar
    // donde iOS pone "Seleccionar" en Fotos/Archivos (esquina superior).
    selectRow: { paddingHorizontal: 16, minHeight: 52, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    selectTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: t.text },
    selectToggle: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
    selectToggleText: { fontSize: 14, fontWeight: '700', color: t.textSecondary },

    // Lista continua y compacta; el índice lateral sustituye los encabezados por letra.
    list: { paddingHorizontal: 16 },
    grid: { paddingHorizontal: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    card: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingVertical: 12 },
    gridCard: { backgroundColor: t.surface, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, padding: 12 },
    cardSelected: { borderColor: t.accent, backgroundColor: t.accentSoft },
    gridTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    gridPrice: { flex: 1, minWidth: 0 },
    thumb: { width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
    body: { flex: 1, minWidth: 0, justifyContent: 'flex-start' },
    // Nombre + platillo de hoy son una sola unidad óptica (identidad +
    // "descripción" del lugar, igual que título/artista en Apple Music —
    // ver CLAUDE.md "Campos de texto agrupados"): 2px máximo entre ellos.
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
    name: { flexShrink: 1, fontSize: 16, fontWeight: '700', color: t.text, lineHeight: 21 },
    today: { fontSize: 13, lineHeight: 18, fontWeight: '300', color: t.text, marginBottom: 2 },
    metaLine: { minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 },
    distance: { flexShrink: 0, fontSize: 13, lineHeight: 18, fontWeight: '300', color: t.textSecondary, fontVariant: ['tabular-nums'] },
    price: { flexShrink: 0, fontSize: 14, fontWeight: '300', color: t.textSecondary, letterSpacing: -0.1 },
    metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', columnGap: 8, rowGap: 2 },
    metaArea: { flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 0, flexShrink: 1 },
    metaAreaText: { fontSize: 12, lineHeight: 17, fontWeight: '300', color: t.textSecondary, flexShrink: 1 },

    // Sin resultados de filtro: misma tarjeta que una fila, para no
    // introducir un cuarto tratamiento visual solo para este estado.
    filterEmptyCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, backgroundColor: t.surface, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    filterEmptyText: { marginTop: 10, fontSize: 14, lineHeight: 20, fontWeight: '400', color: t.textSecondary, textAlign: 'center' },
    resetButton: { minHeight: 44, paddingHorizontal: 16, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
    resetText: { fontSize: 14, fontWeight: '700', color: t.text },

    // Empty
    empty: { minHeight: 520, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    emptyIcon: { width: 68, height: 68, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
    emptyTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, color: t.text, textAlign: 'center', fontFamily: Fonts.brand },
    emptyText: { marginTop: 10, fontSize: 15, lineHeight: 21, fontWeight: '400', color: t.textSecondary, textAlign: 'center' },
    cta: { marginTop: 26, height: 54, paddingHorizontal: 24, borderRadius: 27, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    // Barra de acciones en lote — reemplaza la tab bar mientras se
    // selecciona, mismo lenguaje de vidrio que el resto de panels flotantes.
    actionBar: {
      position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, overflow: 'hidden',
      borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)',
      backgroundColor: t.isDark ? 'rgba(17,18,20,0.4)' : 'rgba(248,248,245,0.4)',
      shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: t.isDark ? 0.20 : 0.08, shadowRadius: 32,
    },
    actionButtons: { flexDirection: 'row', gap: 8 },
    actionBtn: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4 },
    actionBtnDisabled: { opacity: 0.35 },
    actionBtnText: { fontSize: 12, fontWeight: '600' },
  });
}

export default function FavoritosScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const [selectionBarHeight, setSelectionBarHeight] = useState(60);
  const edges = useScrollEdges();
  const scrollRef = useRef<ScrollView>(null);
  const { onScroll: onTabBarScroll } = useTabBarScroll();
  const sectionOffsets = useRef<Record<string, number>>({});
  const [activeLetter, setActiveLetter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { patios, metaById, removeLocally, loading, loadError, reload } = useFavoritePatiosController();
  const [here, setHere] = useKnownLocation();


  // Filtros: pensados para cuando los guardados crecen (~70 items). 'hoy'
  // filtra por menú publicado; el resto son las categorías reales de lo
  // guardado — se construyen solas, sin taxonomía inventada.
  const { filters, setFilters } = useFoodieFilters();
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  useFocusEffect(useCallback(() => {
    let active = true;
    getCollections().then((items) => { if (active) setCollections(items); }).catch(() => {});
    return () => { active = false; };
  }, []));

  // Selección rápida (patrón Fotos/Archivos de iOS): "Seleccionar" activa
  // círculos de selección por fila y cambia la barra inferior por acciones
  // en lote — nada de esto compite con el tap normal de abrir un lugar.
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [saveSheetVisible, setSaveSheetVisible] = useState(false);
  const [organizerOverlayVisible, setOrganizerOverlayVisible] = useState(false);
  const [saveMode, setSaveMode] = useState<'add' | 'move'>('add');
  const selectedActionPending = useRef(false);
  const shareDraft = useRef<PatioCollection | null>(null);

  const exitSelecting = () => {
    setSelecting(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Confirmación antes de borrar — el mismo patrón que ya usan
  // coleccion/[id].tsx y useMenuHistoryController.deleteMenus para su
  // equivalente en Menús; esta pantalla se había quedado sin ese paso
  // (bug encontrado en auditoría 2026-09-06).
  const removeSelected = () => {
    const ids = Array.from(selectedIds);
    Alert.alert(
      'Quitar de Guardados',
      `Se ${ids.length === 1 ? 'quitará 1 lugar' : `quitarán ${ids.length} lugares`} de Guardados.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            if (selectedActionPending.current) return;
            selectedActionPending.current = true;
            try {
              await removeFavoritePatios(ids);
              removeLocally(ids);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              exitSelecting();
            } catch {
              Alert.alert(noWidow('No pudimos quitar los lugares'), noWidow('Revisa tu conexión e inténtalo de nuevo.'));
            } finally {
              selectedActionPending.current = false;
            }
          },
        },
      ],
    );
  };

  const shareSelected = async () => {
    const ids = Array.from(selectedIds);
    const names = patios.filter((patio) => selectedIds.has(patio.id)).map((patio) => patio.name);
    if (!names.length || selectedActionPending.current) return;
    selectedActionPending.current = true;
    Haptics.selectionAsync().catch(() => {});
    // A diferencia del share de texto plano: convierte la selección en una
    // lista real (unlisted) para que el link abra Patio con los lugares de
    // verdad — no solo nombres sueltos que la otra persona no puede tocar.
    try {
      let draft = shareDraft.current;
      if (!draft || draft.patioIds.length !== ids.length || !ids.every((id) => draft!.patioIds.includes(id))) {
        draft = await createCollection('Selección');
        // Retain a failed publication as a private list and reuse it on retry.
        shareDraft.current = draft;
        setCollections((previous) => [draft!, ...previous]);
      }
      const created = await setPatiosInCollection(draft.id, ids, true);
      if (!created) throw new Error('La lista ya no está disponible.');
      shareDraft.current = created;
      setCollections((previous) => previous.map((entry) => entry.id === created.id ? created : entry));
      const published = await publishCollection({ ...created, visibility: 'unlisted' });
      shareDraft.current = published;
      setCollections((previous) => previous.map((entry) => entry.id === published.id ? published : entry));
      const link = `\n\npatio://coleccion-publica/${published.remoteId}`;
      await Share.share({ message: `Mis lugares en Patio\n${names.map((name) => `• ${name}`).join('\n')}${link}` });
    } catch (error) {
      Alert.alert(noWidow('No pudimos compartir los lugares'), noWidow(
        error instanceof Error && error.message === 'Inicia sesión para compartir esta lista.'
          ? error.message : 'Revisa tu conexión e inténtalo de nuevo.',
      ));
    } finally {
      selectedActionPending.current = false;
    }
  };
  const categories = useMemo(
    () => [...new Set(patios.flatMap((patio) => patio.categories).filter(Boolean))].sort(),
    [patios]
  );
  const normalizedQuery = searchQuery.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
  const searched = useMemo(() => normalizedQuery ? patios.filter((patio) => [
    patio.name, patio.area, ...patio.categories, ...(patio.menu ?? []).flatMap((section) => [section.section, ...section.items.map((item) => item.name)]),
  ].join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').includes(normalizedQuery)) : patios, [normalizedQuery, patios]);
  const filtered = useMemo(() => searched.filter((patio) => matchesFoodieFilters(filters, {
    patioId: patio.id,
    weeklyHours: patio.weeklyHours ?? null,
    categories: patio.categories,
    payments: patio.payments,
    collections,
  })), [collections, searched, filters]);

  // `patios` ya viene más-reciente-primero desde el storage (ver
  // lib/favorites.ts) — "Más reciente" no necesita tocar nada, es la base.
  // Pedido de Alejandro 2026-08-30: para su propio uso (~40 guardados) el
  // orden por default sin decisiones no basta, así que además de un buen
  // default se expone el control.
  const [sortMode, setSortMode] = useState<PatioSortMode>('recent');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const changedPreference = useRef({ view: false, sort: false });
  const preferenceWrites = useRef(Promise.resolve());
  const persistPreference = (key: string, value: string) => {
    preferenceWrites.current = preferenceWrites.current.then(() => AsyncStorage.setItem(key, value)).catch(() => {});
  };
  useEffect(() => {
    let mounted = true;
    Promise.all([AsyncStorage.getItem(FAVORITES_VIEW_KEY), AsyncStorage.getItem(FAVORITES_SORT_KEY)]).then(async ([savedView, savedSort]) => {
      if (!mounted) return;
      if (!changedPreference.current.view && (savedView === 'list' || savedView === 'grid')) setViewMode(savedView);
      if (savedSort === 'distance') {
        const permission = await Location.getForegroundPermissionsAsync();
        if (mounted && !changedPreference.current.sort && permission.granted) setSortMode('distance');
      } else if (!changedPreference.current.sort && (savedSort === 'recent' || savedSort === 'rating' || savedSort === 'az' || savedSort === 'price')) setSortMode(savedSort);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);
  const changeViewMode = (mode: 'list' | 'grid') => {
    changedPreference.current.view = true;
    setViewMode(mode);
    persistPreference(FAVORITES_VIEW_KEY, mode);
  };
  const changeSortMode = (mode: typeof sortMode) => {
    changedPreference.current.sort = true;
    sectionOffsets.current = {};
    setActiveLetter('');
    setSortMode(mode);
    persistPreference(FAVORITES_SORT_KEY, mode);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  };
  const sorted = useMemo(() => {
    switch (sortMode) {
      case 'rating':
        return [...filtered].sort((a, b) => (metaById[b.id]?.rating ?? -1) - (metaById[a.id]?.rating ?? -1));
      case 'price':
        return sortPatiosByMetric(filtered, patioMinimumPrice);
      case 'distance':
        return sortPatiosByMetric(filtered, (patio) => patioDistance(here, patio));
      case 'az':
        return alphabeticalSections(filtered).flatMap((section) => section.items);
      case 'recent':
      default:
        return filtered;
    }
  }, [filtered, sortMode, metaById, here]);
  const SORT_LABELS: Record<typeof sortMode, string> = { recent: 'Más reciente', distance: 'Más cerca', price: 'Precio: menor a mayor', rating: 'Tu calificación', az: 'Alfabético A–Z' };
  const sections = useMemo(() => sortMode === 'az' ? alphabeticalSections(filtered) : [], [filtered, sortMode]);
  const letters = sections.map((section) => section.letter);
  const showAlphabet = !selecting && viewMode === 'list' && sortMode === 'az' && !normalizedQuery && filtered.length >= 20 && letters.length >= 4;
  const moveSelection = resolveLibraryMoveSelection({
    collections, activeCollectionIds: filters.collectionIds, selectedPatioIds: [...selectedIds],
  });
  const gridWidth = patioGridColumns(width, fontScale) === 1 ? width - 32 : (width - 44) / 2;
  const jumpToLetter = (letter: string) => {
    const offset = sectionOffsets.current[letter];
    if (offset === undefined) return;
    setActiveLetter(letter);
    scrollRef.current?.scrollTo({ y: offset, animated: false });
  };

  const renderPatio = (patio: (typeof patios)[number]) => {
    const isSelected = selectedIds.has(patio.id);
    const km = patioDistance(here, patio);
    const distance = km === null ? null : formatDistance(km);
    return (
      <TouchableOpacity
        key={patio.id}
        style={[viewMode === 'grid' ? [s.gridCard, { width: gridWidth }] : s.card, viewMode === 'grid' && selecting && isSelected && s.cardSelected]}
        onPress={() => { if (selecting) toggleSelect(patio.id); else { if (normalizedQuery) void recordRecentPatio(patio, 'searched').catch(() => {}); router.push(`/patio/${patio.id}`); } }}
        onLongPress={() => { if (!selecting) { setSelecting(true); toggleSelect(patio.id); } }}
        activeOpacity={0.82}
        accessibilityRole={selecting ? 'checkbox' : 'button'}
        accessibilityState={selecting ? { checked: isSelected } : undefined}
        accessibilityLabel={selecting ? `${isSelected ? 'Quitar de la selección' : 'Seleccionar'} ${patio.name}` : patioCardAccessibilityLabel(patio, { distanceLabel: distance, personalRating: metaById[patio.id]?.rating, includePersonalRating: true })}>
        {viewMode === 'grid' ? (
          <View style={[s.gridTop, { minHeight: 40 * fontScale }]}>
            <View style={s.thumb}>{selecting ? <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? theme.accent : theme.textMute} /> : <PatioIdentityIcon patio={patio} />}</View>
            <PatioCardPrice patio={patio} style={s.gridPrice} />
          </View>
        ) : (
          <View style={s.thumb}>{selecting ? <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? theme.accent : theme.textSecondary} /> : <PatioIdentityIcon patio={patio} />}</View>
        )}
        <View style={s.body}>
          <PatioCardInfo patio={patio} variant={viewMode} showPrice={viewMode !== 'grid'} distanceLabel={distance} personalRating={metaById[patio.id]?.rating} showPersonalRating />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
        {patios.length > 0 && (
          <>
              <View style={s.filterWrap}>
                <SearchField
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Buscar en Guardados"
                  accessibilityLabel="Buscar en Guardados"
                  style={s.searchWrap}
                />
                <FoodieFilterBar
                  filters={filters}
                  onChange={setFilters}
                  floating={false}
                  onOverlayVisibilityChange={setOrganizerOverlayVisible}
                  collections={collections}
                  categories={categories}
                  onCollectionCreated={(c) => setCollections((prev) => [c, ...prev])}
                  onCollectionUpdated={(c) => setCollections((prev) => prev.map((item) => item.id === c.id ? c : item))}
                  onCollectionRemoved={(id) => setCollections((prev) => prev.filter((item) => item.id !== id))}
                  viewMode={viewMode}
                  onViewModeChange={changeViewMode}
                  libraryActions={[{ label: selecting ? 'Terminar selección' : 'Seleccionar lugares', icon: 'checkmark-circle-outline', afterDismiss: true, onPress: () => { Haptics.selectionAsync().catch(() => {}); if (selecting) exitSelecting(); else setSelecting(true); } }]}
                  organizationOptions={(['recent', 'distance', 'price', 'rating', 'az'] as const).map((mode, index) => ({
                    label: SORT_LABELS[mode],
                    sectionLabel: index === 0 ? 'Orden' : undefined,
                    icon: mode === 'distance' ? 'navigate-outline' : mode === 'price' ? 'cash-outline' : mode === 'rating' ? 'star-outline' : mode === 'recent' ? 'time-outline' : 'text-outline',
                    selected: mode === sortMode,
                    accessibilityHint: mode === 'price' ? 'Menor precio publicado primero. Sin precio al final.' : mode === 'distance' ? 'Distancia en línea recta desde tu ubicación. Sin coordenadas al final.' : 'Ordenar Guardados',
                    afterDismiss: mode === 'distance',
                    onPress: () => {
                      Haptics.selectionAsync().catch(() => {});
                      if (mode !== 'distance' || here) { changeSortMode(mode); return; }
                      void (async () => {
                        try {
                          const permission = await Location.requestForegroundPermissionsAsync();
                          if (!permission.granted) { Alert.alert(noWidow('Ubicación desactivada'), noWidow('Activa la ubicación de Patio en Ajustes para ordenar por cercanía.')); return; }
                          const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                          setHere({ latitude: position.coords.latitude, longitude: position.coords.longitude });
                          changeSortMode('distance');
                        } catch { Alert.alert(noWidow('No pudimos obtener tu ubicación'), noWidow('Inténtalo de nuevo para ordenar por cercanía.')); }
                      })();
                    },
                  }))}
                />
              </View>
          </>
        )}
      <View style={s.viewport}>
      <ScrollView onLayout={edges.onLayout} onContentSizeChange={edges.onContentSizeChange} ref={scrollRef} contentContainerStyle={[s.content, { paddingBottom: selecting ? bottomActionClearance(insets.bottom, selectionBarHeight) : bottomTabClearance(insets.bottom) }]} showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        scrollEventThrottle={16}
        onScroll={(event) => {
          edges.onScroll(event);
          onTabBarScroll?.(event);
          if (!showAlphabet) return;
          const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
          const y = contentOffset.y;
          if (y + layoutMeasurement.height >= contentSize.height - 4) {
            setActiveLetter(letters[letters.length - 1]);
            return;
          }
          const section = [...sections].reverse().find(({ letter }) => (sectionOffsets.current[letter] ?? Infinity) <= y + 8);
          if (section) setActiveLetter(section.letter);
        }}>
        {patios.length > 0 && <View style={s.libraryHeader}>
          <Text style={s.libraryCount}>{noWidow(selecting
            ? `${selectedIds.size} ${selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}`
            : filtered.length === patios.length ? `${patios.length} ${patios.length === 1 ? 'lugar' : 'lugares'}` : `${filtered.length} de ${patios.length} lugares`)}</Text>
          {selecting && <>
            <TouchableOpacity disabled={!filtered.length} accessibilityRole="checkbox" accessibilityLabel="Seleccionar todos los resultados" accessibilityState={{ checked: filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id)) }} style={s.selectToggle}
              onPress={() => setSelectedIds((current) => { const next = new Set(current); const all = filtered.every((item) => current.has(item.id)); filtered.forEach((item) => all ? next.delete(item.id) : next.add(item.id)); return next; })}>
              <Text style={s.selectToggleText}>{filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id)) ? 'Ninguno' : 'Todos'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={exitSelecting} style={s.selectToggle} accessibilityRole="button" accessibilityLabel="Cancelar selección"><Text style={s.selectToggleText}>Cancelar</Text></TouchableOpacity>
          </>}
        </View>}
        {loadError && patios.length > 0 && <TouchableOpacity style={s.resetButton} onPress={reload} accessibilityRole="button" accessibilityLabel="Reintentar actualización de Guardados"><Text style={s.resetText}>{noWidow('No pudimos actualizar. Reintentar')}</Text></TouchableOpacity>}
        {loading && patios.length === 0 ? <View style={{ minHeight: 240 }}><FoodieLoading label="Cargando guardados" /></View> : loadError && patios.length === 0 ? <View style={s.empty}>
          <Text style={s.emptyTitle}>{noWidow('No pudimos cargar Guardados')}</Text>
          <TouchableOpacity style={s.cta} onPress={reload} accessibilityRole="button" accessibilityLabel="Reintentar"><Text style={s.ctaText}>Reintentar</Text></TouchableOpacity>
        </View> : patios.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIcon}>
              <Ionicons name="bookmark-outline" size={32} color={theme.textSecondary} />
            </View>
            <Text style={s.emptyTitle} allowFontScaling={true}>{noWidow('Sin guardados')}</Text>
            <TouchableOpacity style={s.cta} onPress={() => router.replace('/explorar')} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel="Buscar algo rico">
              <Text style={s.ctaText} allowFontScaling={true}>{noWidow('Buscar algo rico')}</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'list' && sections.length > 0 ? (
          sections.map((section) => <View key={section.letter} style={[s.alphabetSection, showAlphabet && { paddingRight: 44 }]}
            onLayout={(event) => { sectionOffsets.current[section.letter] = event.nativeEvent.layout.y; }}>
            {section.items.map(renderPatio)}
          </View>)
        ) : (
          <View style={viewMode === 'grid' ? s.grid : s.list}>
            {filtered.length === 0 && (
              <View style={[s.filterEmptyCard, viewMode === 'grid' && { width: '100%' }]}>
                <Ionicons name={normalizedQuery ? 'search-outline' : 'options-outline'} size={22} color={theme.textSecondary} />
                <Text style={s.filterEmptyText} allowFontScaling={true}>{noWidow(normalizedQuery ? 'No encontramos lugares con esa búsqueda.' : 'Ningún lugar coincide con tu selección.')}</Text>
                <TouchableOpacity style={s.resetButton} onPress={() => normalizedQuery ? setSearchQuery('') : setFilters(EMPTY_FOODIE_FILTERS)} accessibilityRole="button">
                  <Text style={s.resetText}>{noWidow(normalizedQuery ? 'Borrar búsqueda' : 'Ver todos los guardados')}</Text>
                </TouchableOpacity>
              </View>
            )}
            {sorted.map(renderPatio)}
          </View>
        )}
      </ScrollView>
      {showAlphabet && <View pointerEvents="box-none" style={[StyleSheet.absoluteFillObject, { bottom: insets.bottom + 90 }]}><AlphabetIndex letters={letters} activeLetter={activeLetter || letters[0]} onSelect={jumpToLetter} /></View>}
      </View>
      {selecting ? !saveSheetVisible && !organizerOverlayVisible && <View onLayout={(event) => setSelectionBarHeight(event.nativeEvent.layout.height)} style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 8 }}>
        <SelectionActions actions={[
          { label: 'Añadir', icon: 'folder-outline', disabled: !selectedIds.size, onPress: () => { setSaveMode('add'); setSaveSheetVisible(true); } },
          { label: 'Mover', icon: 'folder-open-outline', disabled: !moveSelection.canMove, onPress: () => {
            setSaveMode('move');
            setSaveSheetVisible(true);
          } },
          { label: 'Compartir', icon: 'share-outline', disabled: !selectedIds.size, onPress: shareSelected },
          { label: 'Quitar', icon: 'trash-outline', disabled: !selectedIds.size, onPress: removeSelected },
        ]} />
      </View> : <BottomTabBar variant="foodie" />}
      <SaveToListSheet
        visible={saveSheetVisible}
        patioIds={Array.from(selectedIds)}
        patioName=""
        mode={saveMode}
        sourceCollectionIds={moveSelection.sourceCollectionIds}
        onChanged={() => { getCollections().then(setCollections).catch(() => {}); }}
        onDismiss={() => setSaveSheetVisible(false)}
        onMoved={exitSelecting}
      />
    </View>
  );
}
