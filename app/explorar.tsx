import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { publicPrice } from '@/lib/prices';
import { FoodieLoading } from '@/components/foodie-loading';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { EMPTY_FOODIE_FILTERS, FoodieFilterBar, matchesFoodieFilters, type FoodieFilters } from '@/components/foodie-filter-bar';
import { FOODIE_INITIAL_REGION, useFoodieExploreController } from '@/lib/controllers/useFoodieExploreController';
import { noWidow } from '@/lib/typography';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';
import { createCollection, getCollections, type PatioCollection } from '@/lib/collections';
import { estaAbiertoAhora } from '@/lib/horario';
import type { Patio } from '@/lib/patios';

const OPEN_GREEN = '#1F9D55';

function openState(patio: Patio): boolean | null {
  return patio.weeklyHours ? estaAbiertoAhora(patio.weeklyHours) : null;
}

function makeStyles(t: Theme) {
  const btnBorder = t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  const btnShadowOpacity = t.isDark ? 0.20 : 0.06;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: t.bg, zIndex: 50 },
    map: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0' },
    mapView: { ...StyleSheet.absoluteFillObject },
    pinHitArea: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    pinMuted: { opacity: 0.18 },
    pinCategory: { width: 26, height: 26, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(18,19,22,0.90)' : 'rgba(255,255,255,0.92)', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: t.isDark ? 0.24 : 0.12, shadowRadius: 6, elevation: 3 },
    pinPointer: { position: 'absolute', bottom: -5, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
    pinFilteredDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.text, borderWidth: 2, borderColor: t.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.16, shadowRadius: 3, elevation: 2 },
    pinMatch: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(18,19,22,0.84)' : 'rgba(255,255,255,0.88)', borderWidth: 1.5, borderColor: t.accent, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.16, shadowRadius: 5, elevation: 3 },
    pinMatchCore: { width: 6, height: 6, borderRadius: 3, backgroundColor: t.accent },
    pinSelected: { transform: [{ scale: 1.16 }] },
    pinCategorySelected: { backgroundColor: '#111214', borderColor: '#111214', shadowOpacity: 0.24, shadowRadius: 9 },
    pinFilteredSelected: { width: 16, height: 16, borderRadius: 8, backgroundColor: t.accent, borderWidth: 3 },
    pinMatchSelected: { backgroundColor: '#111214', borderColor: '#111214' },
    clusterHitArea: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    clusterPin: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(18,19,22,0.94)' : 'rgba(255,255,255,0.96)', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: t.isDark ? 0.28 : 0.15, shadowRadius: 7, elevation: 4 },
    pinTianguis: { width: 38, height: 30, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: t.text, borderWidth: 2, borderColor: t.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.22, shadowRadius: 7, elevation: 4 },
    pinTianguisCount: { fontSize: 10.5, fontWeight: '700', color: t.bg },
    deliveryZone: { width: 58, height: 58, borderRadius: 29, borderWidth: 1.5, borderStyle: 'dashed', borderColor: t.accent, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(242,97,47,0.08)' : 'rgba(242,97,47,0.10)' },
    deliveryCore: { width: 8, height: 8, borderRadius: 4, backgroundColor: t.accent },
    searchPill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 15, borderRadius: 18, overflow: 'hidden', backgroundColor: t.isDark ? 'rgba(20,21,24,0.55)' : 'rgba(255,255,255,0.78)', borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: btnShadowOpacity + 0.04, shadowRadius: 22, elevation: 4 },
    bottomControls: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
    nearbyButton: { width: 50, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(20,21,24,0.55)' : 'rgba(255,255,255,0.78)', borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: btnShadowOpacity + 0.04, shadowRadius: 22, elevation: 4 },
    searchRow: { flex: 1, height: 50, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: btnShadowOpacity, shadowRadius: 16, elevation: 2 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '400', color: t.text, height: 50, paddingVertical: 0 },
    aiProButton: { minHeight: 30, paddingHorizontal: 8, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.accentSoft },
    aiProText: { fontSize: 10.5, fontWeight: '800', color: t.accent, letterSpacing: 0.3 },
    sheet: { position: 'absolute', left: 14, right: 14, bottom: 14, maxHeight: '48%', borderRadius: Radius.sheet, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: t.isDark ? 0.20 : 0.08, shadowRadius: 32, elevation: 8 },
    grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)', marginTop: 7 },
    grabberTouch: { height: 20, alignItems: 'center', justifyContent: 'flex-start' },
    selectedPanel: { paddingHorizontal: 18, paddingBottom: 14 },
    selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
    selectedTitle: { flex: 1, fontSize: 22, lineHeight: 26, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    heartButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    selectedMeta: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: t.textSecondary },
    selectedStats: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 },
    price: { fontSize: 24, lineHeight: 28, fontWeight: '400', color: t.text },
    dishName: { fontSize: 19, lineHeight: 24, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    priceCaption: { marginTop: 1, fontSize: 12, fontWeight: '400', color: t.textSecondary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    ratingText: { fontSize: 13, fontWeight: '900', color: t.text },
    cta: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: t.text, flexDirection: 'row', alignItems: 'center', gap: 6 },
    ctaText: { fontSize: 13, fontWeight: '900', color: t.surface },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    listHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6, flexDirection: 'row', alignItems: 'center' },
    listTitle: { fontSize: 12.5, fontWeight: '600', color: t.textSecondary },
    aiNoteRow: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 5 },
    aiNoteText: { fontSize: 12.5, fontWeight: '300', color: t.textSecondary, flexShrink: 1 },
    listMeta: { fontSize: 12, fontWeight: '400', color: t.textSecondary },
    listFilter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 30, borderRadius: 15, backgroundColor: t.accentLight },
    listFilterText: { fontSize: 12, fontWeight: '900', color: t.accent },
    list: { paddingBottom: 12 },
    patioRow: { minHeight: 78, marginHorizontal: 8, marginBottom: 7, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.56)' },
    patioRowActive: { backgroundColor: t.isDark ? 'rgba(255,106,61,0.14)' : 'rgba(242,97,47,0.10)' },
    addBox: { width: 32, height: 32, borderRadius: 9, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    addBoxMuted: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    patioInfo: { flex: 1, minWidth: 0, paddingRight: 8 },
    patioName: { fontSize: 15, lineHeight: 19, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    patioMeta: { marginTop: 4, fontSize: 12, lineHeight: 16, fontWeight: '400', color: t.textSecondary },
    patioContext: { marginTop: 3, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
    patioContextText: { fontSize: 11.5, fontWeight: '500', color: t.textSecondary },
    patioRight: { width: 82, flexShrink: 0, alignItems: 'flex-end', gap: 5 },
    patioPrice: { fontSize: 14, fontWeight: '400', color: t.textSecondary, letterSpacing: -0.1 },
    patioOpen: { fontSize: 11.5, fontWeight: '700', color: t.textSecondary },
    patioRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    patioRatingText: { fontSize: 12, fontWeight: '900', color: t.text },
    indexNum: { fontSize: 13, fontWeight: '900' },
    emptyResults: { paddingHorizontal: 28, paddingVertical: 36, alignItems: 'center' },
    emptyIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 10 },
    emptyTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8, lineHeight: 30, color: t.text, textAlign: 'center', marginBottom: 12, fontFamily: Fonts.brand },
    emptySub: { fontSize: 15, fontWeight: '400', lineHeight: 21, color: t.textSecondary, textAlign: 'center', marginBottom: 28, maxWidth: 300 },
    emptyPruebaLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase', color: t.textSecondary, marginBottom: 14 },
    emptyPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    emptyPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    emptyPillText: { fontSize: 14, fontWeight: '400', color: t.text },
    pillsRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 10 },
    pill: { overflow: 'hidden', borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)' },
    pillText: { paddingHorizontal: 14, paddingVertical: 7, fontSize: 13, fontWeight: '400', color: t.text },
    mapFilters: { position: 'absolute', left: 0, right: 0 },
  });
}

function categoryIcon(category: string): keyof typeof Ionicons.glyphMap {
  const normalized = category.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (normalized.includes('taco') || normalized.includes('taquer')) return 'flame-outline';
  if (normalized.includes('antojito') || normalized.includes('hamburgues')) return 'fast-food-outline';
  if (normalized.includes('elote') || normalized.includes('botana')) return 'leaf-outline';
  if (normalized.includes('postre') || normalized.includes('pan') || normalized.includes('reposter') || normalized.includes('cafe') || normalized.includes('desayuno')) return 'cafe-outline';
  if (normalized.includes('bar') || normalized.includes('antro') || normalized.includes('cantina')) return 'wine-outline';
  if (normalized.includes('bebida')) return 'wine-outline';
  if (normalized.includes('restaurante')) return 'book-outline';
  if (normalized.includes('mercado')) return 'basket-outline';
  if (normalized.includes('marisco')) return 'fish-outline';
  if (normalized.includes('tianguis')) return 'storefront-outline';
  return 'restaurant-outline';
}

export default function ExplorarScreen() {
  const params = useLocalSearchParams<{ collection?: string; saved?: string }>();
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const idleLayerOpacity = useRef(new Animated.Value(1)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  const mapRef = useRef<MapView>(null);
  const [mapRegion, setMapRegion] = useState<Region>(FOODIE_INITIAL_REGION);
  const [pressedPinId, setPressedPinId] = useState<string | null>(null);
  const pinNavigationPending = useRef(false);
  const pinTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const {
    activeSavedCategories,
    aiMode,
    aiNote,
    allPatios,
    clearSavedMapFilter,
    closeSheet,
    closeSearch,
    distanceLabelForPatio,
    handleQueryChange,
    idleMode,
    initialLoading,
    isFiltering,
    openSearch,
    query,
    mapFilteredPatios,
    searchActive,
    searchInputRef,
    searchPending,
    setAiMode,
    savedIds,
    setVisibleRegion,
    sheetMode,
    topMatchPerPatio,
    visiblePatios,
  } = useFoodieExploreController();
  useEffect(() => () => pinTimers.current.forEach(clearTimeout), []);
  const openPatioFromPin = useCallback((patioId: string) => {
    if (pinNavigationPending.current) return;
    pinNavigationPending.current = true;
    setPressedPinId(patioId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    pinTimers.current.push(setTimeout(() => {
      router.push(`/patio/${patioId}`);
      pinTimers.current.push(setTimeout(() => {
        setPressedPinId(null);
        pinNavigationPending.current = false;
      }, 360));
    }, 145));
  }, []);
  const [filters, setFilters] = useState<FoodieFilters>(EMPTY_FOODIE_FILTERS);
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  useEffect(() => {
    getCollections().then(async (items) => {
      if (__DEV__ && items.length === 0) {
        const seedNames = ['Antojos', 'Postres', 'Fin de semana', 'Cerca del trabajo', 'Para llevar', 'Comida corrida', 'Con la familia', 'Vegetarianos'];
        for (const name of seedNames) await createCollection(name);
        items = await getCollections();
      }
      setCollections(items);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (params.collection) setFilters((f) => ({ ...f, collectionIds: [params.collection as string] }));
    else if (params.saved === '1') setFilters((f) => ({ ...f, saved: true }));
  }, [params.collection, params.saved]);
  // Los atributos (categoría, pagos, horario) se combinan por intersección
  // (AND) — como Google Maps. Las listas se combinan por unión (OR): elegir
  // dos listas muestra los lugares de cualquiera de las dos, para comparar
  // cuál te queda más cerca entre ambas, no para restringir a los que están
  // en las dos a la vez.
  const filteredPins = useMemo(() => visiblePatios.filter((patio) => matchesFoodieFilters(filters, {
    patioId: patio.id,
    hasTodayMenu: patio.menu.some((section) => section.items.length > 0),
    isOpenNow: !!(patio.weeklyHours && estaAbiertoAhora(patio.weeklyHours)),
    isSaved: savedIds.includes(patio.id),
    categories: patio.categories,
    payments: patio.payments,
    collections,
  })), [collections, filters, savedIds, visiblePatios]);
  // Los filtros también deben aplicar cuando ya estás buscando una palabra
  // (no solo en el mapa idle) — así lo hace Apple Maps: los chips de filtro
  // siguen vivos y afectan los resultados de la búsqueda, no desaparecen en
  // cuanto escribes.
  const filteredMatches = useMemo(() => topMatchPerPatio.filter((match) => matchesFoodieFilters(filters, {
    patioId: match.patio.id,
    hasTodayMenu: match.patio.menu.some((section) => section.items.length > 0),
    isOpenNow: !!(match.patio.weeklyHours && estaAbiertoAhora(match.patio.weeklyHours)),
    isSaved: savedIds.includes(match.patio.id),
    categories: match.patio.categories,
    payments: match.patio.payments,
    collections,
  })), [topMatchPerPatio, filters, savedIds, collections]);
  const matchingPatioIds = useMemo(() => new Set(filteredMatches.map((match) => match.patio.id)), [filteredMatches]);
  const filteredPinIds = useMemo(() => new Set(filteredPins.map((patio) => patio.id)), [filteredPins]);
  const shouldCluster = !isFiltering && mapRegion.latitudeDelta > 0.018;
  const stableMapPatios = useMemo(() => allPatios.filter((patio) => patio.latitude > 0 && patio.longitude !== 0), [allPatios]);
  const clusters = useMemo(() => {
    if (!shouldCluster) return [];
    const latStep = mapRegion.latitudeDelta / 6;
    const lngStep = mapRegion.longitudeDelta / 5;
    const minLat = mapRegion.latitude - mapRegion.latitudeDelta / 2;
    const minLng = mapRegion.longitude - mapRegion.longitudeDelta / 2;
    const cells = new Map<string, { patios: Patio[]; latitude: number; longitude: number }>();

    filteredPins.forEach((patio) => {
      const row = Math.floor((patio.latitude - minLat) / latStep);
      const column = Math.floor((patio.longitude - minLng) / lngStep);
      if (row < 0 || row > 5 || column < 0 || column > 4) return;
      const key = `${row}:${column}`;
      const cell = cells.get(key) ?? { patios: [], latitude: 0, longitude: 0 };
      cell.patios.push(patio);
      cell.latitude += patio.latitude;
      cell.longitude += patio.longitude;
      cells.set(key, cell);
    });

    return [...cells.entries()].map(([key, cell]) => {
      // Un cluster solo puede mostrar un ícono — cuenta el tag PRIMARIO de
      // cada lugar (no todos sus tags) para decidir cuál domina la celda.
      const categoryCounts = new Map<string, number>();
      cell.patios.forEach((patio) => {
        const primary = patio.categories[0] ?? 'Fondita';
        categoryCounts.set(primary, (categoryCounts.get(primary) ?? 0) + 1);
      });
      const category = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Cocina mexicana';
      return {
        key,
        count: cell.patios.length,
        category,
        patios: cell.patios,
        latitude: cell.latitude / cell.patios.length,
        longitude: cell.longitude / cell.patios.length,
      };
    });
  }, [filteredPins, mapRegion, shouldCluster]);
  const dismissSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    closeSheet();
  };
  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 12 && Math.abs(gesture.dx) < 28,
      onPanResponderGrant: () => sheetTranslateY.stopAnimation(),
      onPanResponderMove: (_event, gesture) => sheetTranslateY.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > 54 || gesture.vy > 0.8) {
          dismissSheet();
          return;
        }
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          stiffness: 320,
          damping: 30,
          mass: 0.75,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetTranslateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;
  const showSheet = isFiltering || sheetMode !== null;
  // Montaje separado del estado lógico: antes, cualquier cierre que no fuera
  // arrastrar con el dedo (borrar la búsqueda, tocar la "x", cambiar de tab)
  // desmontaba el sheet de golpe sin animación — solo el arrastre manual
  // tenía transición. Ahora TODO cierre anima hacia abajo antes de
  // desmontar. `filtering` se congela en su último valor mientras se anima
  // la salida, para que el alto/radio del contenedor no cambien de golpe a
  // media transición (esa era la fuente del "brinco").
  const [sheetView, setSheetView] = useState({ mounted: showSheet, filtering: isFiltering });
  useEffect(() => {
    if (showSheet) {
      sheetTranslateY.setValue(0);
      setSheetView({ mounted: true, filtering: isFiltering });
    } else if (sheetView.mounted) {
      Animated.timing(sheetTranslateY, { toValue: 420, duration: 190, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setSheetView((v) => ({ ...v, mounted: false }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSheet, isFiltering]);
  const listPatios = activeSavedCategories.length ? mapFilteredPatios : allPatios;
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Shimmer sobre mapa
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 3200, useNativeDriver: true })
    ).start();
    return () => shimmerAnim.stopAnimation();
  }, [shimmerAnim]);

  // La búsqueda mantiene el mapa nítido: los resultados se encienden en el
  // propio mapa y los demás puntos bajan de intensidad.
  useEffect(() => {
    const searching = searchActive || isFiltering;
    Animated.timing(idleLayerOpacity, { toValue: searching ? 0 : 1, duration: 240, useNativeDriver: true }).start();
  }, [searchActive, isFiltering, idleLayerOpacity]);

  // Abrir/correr las ruedas no debe reconciliar cientos de vistas AIRMap.
  const patioMarkerElements = useMemo(() => stableMapPatios.map((patio) => {
    const included = filteredPinIds.has(patio.id);
    const selected = pressedPinId === patio.id;
    const isMuted = included && isFiltering && !matchingPatioIds.has(patio.id);
    const showMatch = isFiltering && !isMuted;
    return (
      <Marker
        key={patio.id}
        coordinate={{ latitude: patio.latitude, longitude: patio.longitude }}
        opacity={included && !shouldCluster ? 1 : 0}
        tappable={included && !shouldCluster}
        tracksViewChanges={selected}
        onPress={(event: any) => {
          if (!included) return;
          event.stopPropagation?.();
          openPatioFromPin(patio.id);
        }}>
        <View style={[s.pinHitArea, isMuted && s.pinMuted]}>
          {showMatch ? (
            <View style={[s.pinMatch, selected && s.pinMatchSelected]}><View style={s.pinMatchCore} /></View>
          ) : (
            <View style={[s.pinCategory, selected && s.pinCategorySelected]}>
              <Ionicons name={categoryIcon(patio.categories[0] ?? 'Fondita')} size={13} color={selected ? '#FFFFFF' : theme.text} />
              <View style={[s.pinPointer, { borderTopColor: selected ? '#111214' : theme.isDark ? 'rgba(18,19,22,0.90)' : 'rgba(255,255,255,0.92)' }]} />
            </View>
          )}
        </View>
      </Marker>
    );
  }), [filteredPinIds, isFiltering, matchingPatioIds, openPatioFromPin, pressedPinId, s, shouldCluster, stableMapPatios, theme]);

  const clusterMarkerElements = useMemo(() => clusters.map((cluster) => (
    <Marker
      key={`cluster-${cluster.key}`}
      coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
      tracksViewChanges={false}
      onPress={(event: any) => {
        event.stopPropagation?.();
        Haptics.selectionAsync().catch(() => {});
        if (cluster.patios.length > 1) {
          mapRef.current?.fitToCoordinates(
            cluster.patios.map((patio) => ({ latitude: patio.latitude, longitude: patio.longitude })),
            { edgePadding: { top: 190, right: 54, bottom: 150, left: 54 }, animated: true },
          );
        } else {
          mapRef.current?.animateToRegion({
            latitude: cluster.latitude,
            longitude: cluster.longitude,
            latitudeDelta: Math.max(mapRegion.latitudeDelta / 2.5, 0.009),
            longitudeDelta: Math.max(mapRegion.longitudeDelta / 2.5, 0.009),
          }, 360);
        }
      }}>
      <View style={s.clusterHitArea}>
        <View style={s.clusterPin}>
          <Ionicons name={categoryIcon(cluster.category)} size={15} color={theme.text} />
          <View style={[s.pinPointer, { borderTopColor: theme.isDark ? 'rgba(18,19,22,0.94)' : 'rgba(255,255,255,0.96)' }]} />
        </View>
      </View>
    </Marker>
  )), [clusters, mapRegion.latitudeDelta, mapRegion.longitudeDelta, s, theme]);

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={s.map}>
        <MapView
          ref={mapRef}
          initialRegion={FOODIE_INITIAL_REGION}
          customMapStyle={theme.isDark ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
          loadingEnabled
          mapType="mutedStandard"
          pitchEnabled={false}
          rotateEnabled={false}
          showsBuildings={false}
          showsCompass={false}
          showsMyLocationButton={false}
          showsPointsOfInterest={false}
          showsTraffic={false}
          style={s.mapView}
          toolbarEnabled={false}
          userInterfaceStyle={theme.isDark ? 'dark' : 'light'}
          onPress={() => {
            Keyboard.dismiss();
            if (searchActive || isFiltering) closeSearch();
            else closeSheet();
          }}
          onPanDrag={() => {
            if (searchActive || isFiltering) closeSearch();
          }}
          onRegionChangeComplete={(region) => {
            setMapRegion(region);
            setVisibleRegion(region);
          }}>
          {patioMarkerElements}
          {clusterMarkerElements}
          {/*
          {stableMapPatios.map((patio) => {
            const included = filteredPinIds.has(patio.id);
            const selected = pressedPinId === patio.id;
            const isMuted = included && isFiltering && !matchingPatioIds.has(patio.id);
            const showMatch = isFiltering && !isMuted;
            return (
              <Marker
                key={patio.id}
                coordinate={{ latitude: patio.latitude, longitude: patio.longitude }}
                opacity={included && !shouldCluster ? 1 : 0}
                tappable={included && !shouldCluster}
                tracksViewChanges={selected}
                onPress={(event: any) => {
                  if (!included) return;
                  event.stopPropagation?.();
                  openPatioFromPin(patio.id);
                }}>
                <View style={[s.pinHitArea, isMuted && s.pinMuted]}>
                  {showMatch ? (
                    <View style={[s.pinMatch, selected && s.pinMatchSelected]}><View style={s.pinMatchCore} /></View>
                  ) : (
                    <View style={[s.pinCategory, selected && s.pinCategorySelected]}>
                      <Ionicons name={categoryIcon(patio.category)} size={13} color={selected ? '#FFFFFF' : theme.text} />
                      <View style={[s.pinPointer, { borderTopColor: selected ? '#111214' : theme.isDark ? 'rgba(18,19,22,0.90)' : 'rgba(255,255,255,0.92)' }]} />
                    </View>
                  )}
                </View>
              </Marker>
            );
          })}
          {clusters.map((cluster) => (
            <Marker
              key={`cluster-${cluster.key}`}
              coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
              tracksViewChanges={false}
              onPress={(event: any) => {
                event.stopPropagation?.();
                Haptics.selectionAsync().catch(() => {});
                if (cluster.patios.length > 1) {
                  mapRef.current?.fitToCoordinates(
                    cluster.patios.map((patio) => ({ latitude: patio.latitude, longitude: patio.longitude })),
                    { edgePadding: { top: 190, right: 54, bottom: 150, left: 54 }, animated: true },
                  );
                } else {
                  mapRef.current?.animateToRegion({
                    latitude: cluster.latitude,
                    longitude: cluster.longitude,
                    latitudeDelta: Math.max(mapRegion.latitudeDelta / 2.5, 0.009),
                    longitudeDelta: Math.max(mapRegion.longitudeDelta / 2.5, 0.009),
                  }, 360);
                }
              }}>
              <View style={s.clusterHitArea}>
                <View style={s.clusterPin}>
                  <Ionicons name={categoryIcon(cluster.category)} size={15} color={theme.text} />
                  <View style={[s.pinPointer, { borderTopColor: theme.isDark ? 'rgba(18,19,22,0.94)' : 'rgba(255,255,255,0.96)' }]} />
                </View>
              </View>
            </Marker>
          ))} */}
        </MapView>
        <LinearGradient
          colors={theme.isDark ? ['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)'] : ['rgba(239,239,239,0)', 'rgba(239,239,239,0.30)']}
          locations={[0.45, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {!searchActive && !showSheet && (
        <View style={[s.mapFilters, { top: insets.top + 80 }]}>
          <FoodieFilterBar
            filters={filters}
            onChange={setFilters}
            collections={collections}
            categories={[...new Set(allPatios.flatMap((patio) => patio.categories))].sort((a, b) => a.localeCompare(b, 'es'))}
            onCollectionCreated={(c) => setCollections((prev) => [c, ...prev])}
          />
        </View>
      )}

      {/* Igual que Apple Maps: los filtros no desaparecen al buscar — siguen
          vivos justo debajo del buscador y siguen afectando los resultados
          (ver matchesFoodieFilters aplicado a filteredMatches abajo). */}
      {sheetView.mounted && sheetView.filtering && (
        <View style={[s.mapFilters, { top: insets.top + 80 }]}>
          <FoodieFilterBar
            filters={filters}
            onChange={setFilters}
            collections={collections}
            categories={[...new Set(allPatios.flatMap((patio) => patio.categories))].sort((a, b) => a.localeCompare(b, 'es'))}
            onCollectionCreated={(c) => setCollections((prev) => [c, ...prev])}
          />
        </View>
      )}

      {!!activeSavedCategories.length && !searchActive && (
        <TouchableOpacity
          style={[s.listFilter, { position: 'absolute', top: insets.top + 12, alignSelf: 'center' }]}
          onPress={clearSavedMapFilter}
          activeOpacity={0.78}
          hitSlop={{ top: 7, bottom: 7, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={`Quitar filtro de mapa: ${activeSavedCategories.join(', ')}`}>
          <Ionicons name="map-outline" size={13} color={theme.accent} />
          <Text style={s.listFilterText} numberOfLines={1}>
            {activeSavedCategories.join(' · ')}
          </Text>
          <Ionicons name="close" size={13} color={theme.accent} />
        </TouchableOpacity>
      )}

      {/* Google Maps: la búsqueda es la primera capa del mapa y vive arriba.
          Los filtros quedan inmediatamente debajo, dentro de la misma zona de
          decisión visual. */}
      {!showSheet && (
        <Animated.View
          pointerEvents={idleMode ? 'box-none' : 'none'}
          style={[
            { position: 'absolute', left: 16, right: 16, top: insets.top + 10 },
            { opacity: idleLayerOpacity },
          ]}>
          <View style={s.bottomControls}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Buscar comida o un lugar" activeOpacity={0.82} onPress={openSearch} style={[s.searchPill, { flex: 1 }]}>
              <BlurView intensity={theme.isDark ? 28 : 36} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
              <Text style={{ fontSize: 16, fontWeight: '400', color: theme.textSecondary }}>
                ¿Qué se te antoja?
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Buscador activo — permanece arriba; el teclado y los resultados viven
          debajo, como en las superficies de mapa nativas. */}
      {searchActive && (
        <View
          style={{ position: 'absolute', left: 0, right: 0, top: insets.top + 10 }}
          pointerEvents="box-none">
          <View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
            <View style={s.searchRow}>
              <BlurView intensity={theme.isDark ? 30 : 36} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); closeSearch(); }} activeOpacity={0.76} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }} accessibilityRole="button" accessibilityLabel="Cerrar búsqueda">
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <TextInput
                accessibilityLabel="Buscar comida o un lugar"
                ref={searchInputRef}
                style={s.searchInput}
                value={query}
                onChangeText={handleQueryChange}
                placeholder="¿Qué se te antoja?"
                placeholderTextColor={theme.textSecondary}
                autoCorrect={false}
                autoCapitalize="none"
                autoFocus
                returnKeyType="search"
                blurOnSubmit={false}
                onSubmitEditing={Keyboard.dismiss}
                selectionColor={theme.accent}
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => { Haptics.selectionAsync(); handleQueryChange(''); }} activeOpacity={0.76} hitSlop={{ top: 13, bottom: 13, left: 13, right: 13 }} accessibilityRole="button" accessibilityLabel="Borrar búsqueda">
                  <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.aiProButton, aiMode && { backgroundColor: theme.accent }]}
                onPress={() => {
                  if (__DEV__) {
                    setAiMode((active) => !active);
                    requestAnimationFrame(() => searchInputRef.current?.focus());
                  } else {
                    Keyboard.dismiss();
                    router.push({ pathname: '/plan', params: { role: 'foodie' } });
                  }
                }}
                hitSlop={{ top: 7, bottom: 7, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityState={{ selected: aiMode }}
                accessibilityLabel="Conocer búsqueda con inteligencia artificial de Patio Pro">
                <Ionicons name="sparkles" size={13} color={aiMode ? theme.bg : theme.accent} />
                <Text style={[s.aiProText, aiMode && { color: theme.bg }]}>IA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {sheetView.mounted && (
        <Animated.View
          style={[s.sheet, sheetView.filtering ? {
            // 80 (borde inferior del buscador) + 44 (barra de filtros) + 8
            // (aire entre ambos) — antes el sheet empezaba justo donde
            // ahora vive la barra de filtros y la hubiera tapado.
            top: insets.top + 132,
            bottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom + 14,
            maxHeight: undefined,
            paddingBottom: 4,
            borderBottomLeftRadius: keyboardHeight > 0 ? 0 : Radius.sheet,
            borderBottomRightRadius: keyboardHeight > 0 ? 0 : Radius.sheet,
            transform: [{ translateY: sheetTranslateY }],
          } : {
            bottom: keyboardHeight > 0 ? keyboardHeight + 70 : insets.bottom + 82,
            paddingBottom: insets.bottom ? 4 : 8,
            transform: [{ translateY: sheetTranslateY }],
          }]}>
          <BlurView intensity={theme.isDark ? 16 : 22} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View {...sheetPanResponder.panHandlers} style={s.grabberTouch}>
            <View style={s.grabber} />
          </View>

          {/* List */}
          <View style={s.listHeader}>
            {isFiltering ? (
              <Text style={s.listTitle} allowFontScaling={true}>
                {filteredMatches.length > 0
                  ? `${filteredMatches.length} resultado${filteredMatches.length !== 1 ? 's' : ''}`
                  : 'Sin resultados'}
              </Text>
            ) : (
              <Text style={s.listTitle} allowFontScaling={true}>{sheetMode === 'saved' ? 'GUARDADOS' : 'CERCA DE TI'}</Text>
            )}
          </View>

          {aiMode && isFiltering && !!aiNote && (
            <View style={s.aiNoteRow}>
              <Ionicons name="sparkles" size={12} color={theme.accent} />
              <Text style={s.aiNoteText} numberOfLines={1} allowFontScaling={true}>{aiNote}</Text>
            </View>
          )}

          <ScrollView
            style={s.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={Keyboard.dismiss}>
            {isFiltering ? (
              filteredMatches.length === 0 ? (
                searchPending ? null : (
                <View style={s.emptyResults}>
                  <View style={s.emptyIconCircle}>
                    <Ionicons name="search" size={32} color={theme.accent} />
                  </View>
                  <Text style={s.emptyEyebrow} allowFontScaling={true}>Sin resultados</Text>
                  <Text style={s.emptyTitle} allowFontScaling={true}>{noWidow('No hay coincidencias cerca')}</Text>
                  <Text style={s.emptySub} allowFontScaling={true}>{noWidow('Mueve el mapa o cambia tu búsqueda.')}</Text>
                  <Text style={s.emptyPruebaLabel} allowFontScaling={true}>OTRAS BÚSQUEDAS</Text>
                  <View style={s.emptyPills}>
                    {['caldo', 'tinga', 'mole', 'pozole', 'veggie'].map((q) => (
                      <TouchableOpacity key={q} onPress={() => handleQueryChange(q)} activeOpacity={0.8} style={s.emptyPill} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityRole="button" accessibilityLabel={`Buscar ${q}`}>
                        <Text style={s.emptyPillText} allowFontScaling={true}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                )
              ) : (
                filteredMatches.map((match) => {
                  const state = openState(match.patio);
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir resultado ${match.item.name} en ${match.patio.name}`}
                      key={`${match.patio.id}-${match.item.name}`}
                      style={s.patioRow}
                      onPress={() => {
                        Keyboard.dismiss();
                        router.push(`/patio/${match.patio.id}`);
                      }}
                      activeOpacity={0.76}>
                      <View style={[s.addBox, s.addBoxMuted]}>
                        <Ionicons name={match.section === 'LUGAR' ? 'location-outline' : 'restaurant-outline'} size={15} color={theme.textSecondary} />
                      </View>
                      <View style={s.patioInfo}>
                        <Text style={s.patioName} numberOfLines={2} allowFontScaling={true}>{match.item.name}</Text>
                        <Text style={s.patioMeta} numberOfLines={1} allowFontScaling={true}>
                          {match.section === 'LUGAR' ? match.patio.area : match.patio.name}
                        </Text>
                        {(match.patio.rating && match.patio.rating !== 'Nuevo' || distanceLabelForPatio(match.patio)) && (
                          <View style={s.patioContext}>
                            {!!match.patio.rating && match.patio.rating !== 'Nuevo' && <><Ionicons name="star" size={11} color={theme.textSecondary} /><Text style={s.patioContextText}>{match.patio.rating}{match.patio.ratingCount != null ? ` (${match.patio.ratingCount})` : ''}</Text></>}
                            {!!distanceLabelForPatio(match.patio) && <Text style={s.patioContextText}>{match.patio.rating && match.patio.rating !== 'Nuevo' ? '· ' : ''}{distanceLabelForPatio(match.patio)}</Text>}
                          </View>
                        )}
                      </View>
                      <View style={s.patioRight}>
                        {match.section !== 'LUGAR' && !!publicPrice(match.item.price ?? match.patio.price) && (
                          <Text style={s.patioPrice} numberOfLines={1} allowFontScaling={true}>{publicPrice(match.item.price ?? match.patio.price)}</Text>
                        )}
                        <Text style={[s.patioOpen, state === true && { color: OPEN_GREEN }]} numberOfLines={1} allowFontScaling={true}>
                          {state === false ? 'Cerrado' : state === true ? 'Abierto' : 'Sin horario'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )
            ) : listPatios.length === 0 ? (
              <View style={s.emptyResults}>
                <View style={s.emptyIconCircle}>
                  <Ionicons name="bookmark-outline" size={32} color={theme.accent} />
                </View>
                <Text style={s.emptyEyebrow} allowFontScaling={true}>Guardados</Text>
                <Text style={s.emptyTitle} allowFontScaling={true}>{noWidow('Todavía no has guardado patios.')}</Text>
                <Text style={s.emptySub} allowFontScaling={true}>{noWidow('Toca un punto o un lugar cercano y usa el corazón para guardarlo aquí.')}</Text>
              </View>
            ) : (
              listPatios.map((patio) => {
                const state = openState(patio);
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Abrir ${patio.name}`}
                    key={patio.id}
                    style={s.patioRow}
                    onPress={() => router.push(`/patio/${patio.id}`)}
                    activeOpacity={0.76}>
                    <View style={[s.addBox, s.addBoxMuted]}>
                      <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
                    </View>
                    <View style={s.patioInfo}>
                      <Text style={s.patioName} numberOfLines={2} allowFontScaling={true}>{patio.name}</Text>
                      <Text style={s.patioMeta} numberOfLines={1} allowFontScaling={true}>{patio.area}</Text>
                      {(patio.rating && patio.rating !== 'Nuevo' || distanceLabelForPatio(patio)) && (
                        <View style={s.patioContext}>
                          {!!patio.rating && patio.rating !== 'Nuevo' && <><Ionicons name="star" size={11} color={theme.textSecondary} /><Text style={s.patioContextText}>{patio.rating}{patio.ratingCount != null ? ` (${patio.ratingCount})` : ''}</Text></>}
                          {!!distanceLabelForPatio(patio) && <Text style={s.patioContextText}>{patio.rating && patio.rating !== 'Nuevo' ? '· ' : ''}{distanceLabelForPatio(patio)}</Text>}
                        </View>
                      )}
                    </View>
                    <View style={s.patioRight}>
                      {!!publicPrice(patio.price) && (
                        <Text style={s.patioPrice} numberOfLines={1} allowFontScaling={true}>{publicPrice(patio.price)}</Text>
                      )}
                      <Text style={[s.patioOpen, state === true && { color: OPEN_GREEN }]} numberOfLines={1} allowFontScaling={true}>
                        {state === false ? 'Cerrado' : state === true ? 'Abierto' : 'Sin horario'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      )}
      {initialLoading && (
        <View style={s.loadingOverlay}>
          <FoodieLoading />
        </View>
      )}
      {!searchActive && <BottomTabBar variant="foodie" />}
    </View>
  );
}
