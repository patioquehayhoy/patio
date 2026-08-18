import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Keyboard, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
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
// Se evalúa una sola vez, al cargar este módulo — Metro vuelve a ejecutar
// todo el cuerpo del archivo en cada Fast Refresh, así que esta constante
// se recalcula justo cuando el cambio llega al teléfono. Solo para
// confirmar en dispositivo "¿ya tengo la versión más reciente?", nunca sale
// en producción.
const LOADED_AT = new Date();
// Dos buscadores con alturas REALES distintas comparten esta barra de
// filtros — bug encontrado tras varias rondas de "sigue sin pegarse":
// - Inactivo (pill "¿Qué se te antoja?", sin escribir): 10 de margen + ~50
//   de alto de la pill — termina en insets.top+60. Sin padding extra debajo
//   (`bottomControls` no tiene padding propio).
// - Activo (ya escribiendo, con flecha atrás + IA): 10 + 50 + 12 de
//   padding inferior del contenedor — termina en insets.top+72.
// Usar el mismo número (72) para los dos dejaba 12pt de aire de sobra en el
// estado inactivo — exactamente lo que se seguía viendo pegado a la
// captura. Cada estado ahora usa su propio número real.
const IDLE_FILTER_BAR_TOP_OFFSET = 60;
const FILTER_BAR_TOP_OFFSET = 72;
// `FILTER_BAR_TOP_OFFSET` (borde inferior del buscador) + 44 (barra de
// filtros) + 8 (aire entre la barra y el sheet) — es el `top` real del
// sheet de resultados en modo filtrado y también define el marco del que
// se deriva el detent medio (ver `mediumGap` más abajo); un solo número,
// no dos que puedan desalinearse.
const FILTERING_SHEET_TOP_OFFSET = FILTER_BAR_TOP_OFFSET + 44 + 8;
// Cuántas filas de resultado completas caben en el detent medio del sheet
// de búsqueda — ver `mediumContentHeight` más abajo, junto al PanResponder.
const SHEET_MEDIUM_ROWS = 3;
// Apple (HIG "Sheets"): un sheet redimensionable descansa en "detents" — el
// sistema define large (altura completa) y medium ("about half of the fully
// expanded height"). Mismo spring en las tres transiciones (entrada, salida,
// cambio de detent) para que el movimiento se sienta como una sola mano, no
// varias animaciones distintas peleando entre sí.
const SHEET_SPRING = { stiffness: 320, damping: 30, mass: 0.75, useNativeDriver: true } as const;
// Redimensionar el alto real del sheet (no un transform) no puede usar el
// driver nativo — solo transform/opacity corren ahí. Mismo spring, distinto
// driver.
const SHEET_SPRING_JS = { stiffness: 320, damping: 30, mass: 0.75, useNativeDriver: false } as const;
const SHEET_DISMISS_TRANSLATE = 900;

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
    // Un solo lenguaje de marcador (globo + ícono), como el resto del mapa —
    // antes un resultado de búsqueda cambiaba a un punto relleno de acento,
    // una segunda forma que no existe en ningún otro pin de la app. Ahora el
    // match es el mismo globo con borde de acento; el propio MapKit/Apple
    // Maps también usa una sola forma de "balloon marker" con glyph para
    // cualquier pin, nunca un punto sin ícono para resultados de búsqueda.
    pinCategoryMatch: { borderWidth: 1.5, borderColor: t.accent },
    pinCategorySelected: { backgroundColor: '#111214', borderColor: '#111214', shadowOpacity: 0.24, shadowRadius: 9 },
    clusterHitArea: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    clusterPin: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(18,19,22,0.94)' : 'rgba(255,255,255,0.96)', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: t.isDark ? 0.28 : 0.15, shadowRadius: 7, elevation: 4 },
    searchPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 15, borderRadius: 18, overflow: 'hidden', backgroundColor: t.isDark ? 'rgba(20,21,24,0.55)' : 'rgba(255,255,255,0.78)', borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: btnShadowOpacity + 0.04, shadowRadius: 22, elevation: 4 },
    bottomControls: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
    searchRow: { flex: 1, height: 50, borderRadius: 18, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: btnShadowOpacity, shadowRadius: 16, elevation: 2 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '400', color: t.text, height: 50, paddingVertical: 0 },
    aiProButton: { minHeight: 30, paddingHorizontal: 8, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.accentSoft },
    aiProText: { fontSize: 10.5, fontWeight: '800', color: t.accent, letterSpacing: 0.3 },
    sheet: { position: 'absolute', left: 14, right: 14, bottom: 14, maxHeight: '48%', borderRadius: Radius.sheet, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: t.isDark ? 0.20 : 0.08, shadowRadius: 32, elevation: 8 },
    grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)', marginTop: 7 },
    grabberTouch: { height: 20, alignItems: 'center', justifyContent: 'flex-start' },
    price: { fontSize: 24, lineHeight: 28, fontWeight: '400', color: t.text },
    listHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6, flexDirection: 'row', alignItems: 'center' },
    listTitle: { fontSize: 12.5, fontWeight: '600', color: t.textSecondary },
    aiNoteRow: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    aiNoteText: { fontSize: 12.5, fontWeight: '300', color: t.textSecondary, flexShrink: 1 },
    listFilter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 30, borderRadius: 15, backgroundColor: t.accentLight },
    listFilterText: { fontSize: 12, fontWeight: '900', color: t.accent },
    list: { paddingBottom: 12 },
    patioRow: { minHeight: 78, marginHorizontal: 8, marginBottom: 7, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.56)' },
    addBox: { width: 32, height: 32, borderRadius: 9, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    addBoxMuted: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    patioInfo: { flex: 1, minWidth: 0, paddingRight: 8 },
    patioName: { fontSize: 15, lineHeight: 19, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    patioMeta: { marginTop: 4, fontSize: 12, lineHeight: 16, fontWeight: '400', color: t.textSecondary },
    patioContext: { marginTop: 3, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
    patioContextText: { fontSize: 11.5, fontWeight: '500', color: t.textSecondary },
    patioRight: { width: 82, flexShrink: 0, alignItems: 'flex-end', gap: 4 },
    patioPrice: { fontSize: 14, fontWeight: '400', color: t.textSecondary, letterSpacing: -0.1 },
    patioOpen: { fontSize: 11.5, fontWeight: '700', color: t.textSecondary },
    emptyResults: { paddingHorizontal: 28, paddingVertical: 36, alignItems: 'center' },
    emptyIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 10 },
    emptyTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8, lineHeight: 30, color: t.text, textAlign: 'center', marginBottom: 12, fontFamily: Fonts.brand },
    emptySub: { fontSize: 15, fontWeight: '400', lineHeight: 21, color: t.textSecondary, textAlign: 'center', marginBottom: 28, maxWidth: 300 },
    emptyPruebaLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase', color: t.textSecondary, marginBottom: 14 },
    emptyPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    emptyPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    emptyPillText: { fontSize: 14, fontWeight: '400', color: t.text },
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
  const { height: windowHeight } = useWindowDimensions();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const idleLayerOpacity = useRef(new Animated.Value(1)).current;
  const sheetTranslateY = useRef(new Animated.Value(0)).current;
  // `sheetTranslateY` mueve el sheet completo (entrada/salida/overshoot de
  // cierre) vía transform, nativo y fluido. `sheetTopExtra` cambia el
  // ALTO real del sheet (su `top`) para el detent medio, con el `bottom`
  // siempre anclado al teclado/inset — nunca lo tapa, porque nunca lo
  // desplaza, solo lo encoge desde arriba.
  const sheetTopExtra = useRef(new Animated.Value(0)).current;
  const keyboardHeightAnim = useRef(new Animated.Value(insets.bottom)).current;
  // Apple define medium como "about half of the fully expanded height" (HIG
  // Sheets) — probamos esa proporción y también un 38% fijo, y ambas
  // seguían sin sentirse bien en dispositivo. En vez de perseguir un
  // porcentaje, el detent medio ahora se dimensiona por CONTENIDO: que
  // quepan 3 filas de resultado completas (`SHEET_MEDIUM_ROWS`), ni más ni
  // menos — un tamaño que se explica solo con lo que muestra, no con una
  // fracción de pantalla arbitraria. Los números (grabber, header, alto de
  // fila) son los mismos valores reales de `makeStyles` más abajo, no
  // inventados aparte. Calculado aquí arriba (no solo junto al
  // PanResponder) porque el encuadre del mapa también lo necesita, para
  // reservar exactamente el espacio que el sheet ocupa de verdad.
  const filteringSheetBottom = keyboardHeight > 0 ? keyboardHeight : insets.bottom;
  const largeFrameHeight = Math.max(windowHeight - (insets.top + FILTERING_SHEET_TOP_OFFSET) - filteringSheetBottom, 0);
  // grabberTouch (20) + listHeader (paddingTop 4 + paddingBottom 6 + línea
  // de texto ~15 = 25) + N × patioRow (minHeight 78 + marginBottom 7 = 85)
  // + paddingBottom del sheet (4).
  const mediumContentHeight = 20 + 25 + SHEET_MEDIUM_ROWS * 85 + 4;
  const mediumSheetHeight = Math.min(largeFrameHeight, Math.max(mediumContentHeight, 220));
  const mediumGap = largeFrameHeight - mediumSheetHeight;
  const mediumGapRef = useRef(mediumGap);
  mediumGapRef.current = mediumGap;
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
    handleSubmitSearch,
    searchFor,
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
  // Igual que Google Maps: al buscar, la cámara se mueve para encuadrar los
  // resultados — no se queda quieta esperando que el humano la mueva a mano.
  // Google documenta esta técnica para exactamente este caso ("mostrar todas
  // las gasolineras a 5 millas, mover la cámara para que quepan todas en
  // pantalla" — developers.google.com/maps/documentation/ios-sdk/views,
  // sección "Set boundaries"); `fitToCoordinates` ya vive en este archivo
  // para el tap de un cluster (más abajo) — se reutiliza el mismo mecanismo
  // en vez de inventar uno nuevo.
  //
  // `filteredMatches` ya trae un solo resultado por Patio (topMatchPerPatio
  // dedup arriba), así que no hace falta deduplicar de nuevo aquí. La llave
  // ordenada evita relanzar el fit cuando la lista se recalcula por razones
  // que no cambian qué lugares aparecen (ej. tocar un corazón mientras se
  // busca cambia `savedIds` y por lo tanto la referencia de `filteredMatches`,
  // pero no el conjunto de resultados).
  const matchedResultIdsKey = useMemo(
    () => filteredMatches.map((match) => match.patio.id).sort().join('|'),
    [filteredMatches]
  );
  useEffect(() => {
    // No dispara en cada tecla: `searchPending` viene del debounce de 300ms
    // ya existente en useFoodieExploreController — solo se lee aquí, no se
    // agrega un segundo debounce.
    if (!isFiltering || searchPending) return;
    const found = filteredMatches
      .map((match) => match.patio)
      .filter((patio) => patio.latitude > 0 && patio.longitude !== 0);
    if (found.length === 0) {
      // Cero resultados: no mover el mapa. Ni Airbnb reposiciona el mapa sin
      // listados que ubicar (airbnb.com/help/article/252 — el mapa se mueve
      // para "encontrar listados", no de forma incondicional en cada
      // búsqueda), y reportes reales de usuarios en la comunidad de soporte
      // de Google Maps describen el salto de cámara sin resultados como un
      // defecto molesto, no como el comportamiento esperado
      // (support.google.com/maps/thread/349598502,
      // support.google.com/maps/thread/321038862).
      return;
    }
    if (found.length === 1) {
      // Un único resultado: no hay límites que calcular entre un solo punto
      // — forzar un fit ahí sobre-acerca el mapa de forma rara. Se anima a
      // un acercamiento fijo y predecible, el mismo piso de zoom que ya usa
      // este archivo al entrar a un cluster de un solo lugar (ver
      // `animateToRegion` más abajo, delta 0.009), en vez de un número nuevo
      // sin relación con el resto del archivo.
      mapRef.current?.animateToRegion({
        latitude: found[0].latitude,
        longitude: found[0].longitude,
        latitudeDelta: 0.009,
        longitudeDelta: 0.009,
      }, 420);
      return;
    }
    // Dos o más resultados: encuadrar todos. Padding derivado de la propia
    // pantalla, no inventado: `top` coincide con el `top` real del sheet de
    // resultados (insets.top + 132, ver el estilo `sheet` más abajo) para
    // que el encuadre no esconda pines detrás de la barra de búsqueda ni de
    // la de filtros. `bottom` antes reusaba el `150` fijo del fit de
    // clusters (pensado para el mapa en reposo, sin sheet) — con el sheet de
    // resultados en el detent medio, eso dejaba mucho menos espacio real
    // reservado del que el sheet ocupa de verdad, desencuadrando los pines.
    // Ahora usa el alto real del sheet en su detent medio
    // (`filteringSheetBottom + mediumSheetHeight`, los mismos valores que ya
    // gobiernan el propio sheet — no `mediumGap`, que es cuánto se encoge
    // el sheet respecto al grande, no su alto real), así el encuadre
    // siempre reserva exactamente lo que el sheet tapa, ni más ni menos.
    mapRef.current?.fitToCoordinates(
      found.map((patio) => ({ latitude: patio.latitude, longitude: patio.longitude })),
      { edgePadding: { top: insets.top + 132, right: 54, bottom: filteringSheetBottom + mediumSheetHeight, left: 54 }, animated: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedResultIdsKey, isFiltering, searchPending, filteringSheetBottom, mediumSheetHeight]);
  const shouldCluster = !isFiltering && mapRegion.latitudeDelta > 0.018;
  const stableMapPatios = useMemo(() => allPatios.filter((patio) => patio.latitude > 0 && patio.longitude !== 0), [allPatios]);
  // Rejilla fija de 6×5 = 30 celdas (mismo límite `row>5`/`column>4` de
  // siempre). Antes `clusters` era un array que solo incluía las celdas con
  // lugares — al hacer zoom/pan, la rejilla se recalculaba con celdas
  // distintas en cada tick de `onRegionChangeComplete`, así que React
  // desmontaba y montaba vistas nativas de `Marker` constantemente. Es
  // exactamente el patrón que ya tronó la app una vez en este archivo
  // (crash real documentado: `NSInvalidArgumentException` en
  // `-[AIRMap insertReactSubview:atIndex:]`, corregido entonces solo para
  // los pines individuales, no para los clusters). Ahora `clusterCells` es
  // un lookup por celda; `clusterMarkerElements` más abajo siempre renderiza
  // las mismas 30 llaves y solo cambia opacidad/posición — igual que ya
  // hacen los pines individuales (`opacity={included && !shouldCluster...`).
  const CLUSTER_ROWS = 6;
  const CLUSTER_COLS = 5;
  const clusterCells = useMemo(() => {
    const cells = new Map<string, { patios: Patio[]; latitude: number; longitude: number }>();
    if (!shouldCluster) return cells;
    const latStep = mapRegion.latitudeDelta / CLUSTER_ROWS;
    const lngStep = mapRegion.longitudeDelta / CLUSTER_COLS;
    const minLat = mapRegion.latitude - mapRegion.latitudeDelta / 2;
    const minLng = mapRegion.longitude - mapRegion.longitudeDelta / 2;

    filteredPins.forEach((patio) => {
      const row = Math.floor((patio.latitude - minLat) / latStep);
      const column = Math.floor((patio.longitude - minLng) / lngStep);
      if (row < 0 || row >= CLUSTER_ROWS || column < 0 || column >= CLUSTER_COLS) return;
      const key = `${row}:${column}`;
      const cell = cells.get(key) ?? { patios: [], latitude: 0, longitude: 0 };
      cell.patios.push(patio);
      cell.latitude += patio.latitude;
      cell.longitude += patio.longitude;
      cells.set(key, cell);
    });
    return cells;
  }, [filteredPins, mapRegion, shouldCluster]);
  const clusterGridKeys = useMemo(() => {
    const keys: string[] = [];
    for (let row = 0; row < CLUSTER_ROWS; row++) {
      for (let column = 0; column < CLUSTER_COLS; column++) keys.push(`${row}:${column}`);
    }
    return keys;
  }, []);
  // Antes: soltar el dedo llamaba a closeSheet() y esperaba a que el estado
  // (showSheet) diera la vuelta por React para que el useEffect de abajo
  // arrancara la animación de salida. Ese viaje de ida y vuelta por el
  // render deja la card congelada un instante justo al soltar — se ve como
  // que se detiene antes de irse. Ahora la animación arranca en el mismo
  // frame en que sueltas, continuando desde donde iba el dedo; closeSheet()
  // se llama hasta que la animación ya terminó.
  const isFilteringRef = useRef(isFiltering);
  isFilteringRef.current = isFiltering;
  // Deslizar la card hacia abajo NO debe borrar la búsqueda — Apple Maps y
  // Google Maps ocultan la lista pero conservan el término y los pines
  // resaltados; solo se pierde al tocar la "x" o volver atrás. Antes
  // `dismissSheet()` llamaba siempre a `closeSheet()` del controller, que
  // limpia `submittedQuery` — cada vez que querías reposicionarte tenías
  // que volver a escribir y buscar. Ahora, en modo búsqueda, solo se oculta
  // la card localmente; el estado real (mapa, pines, término) sigue vivo.
  const [sheetHiddenByDrag, setSheetHiddenByDrag] = useState(false);
  useEffect(() => {
    if (!isFiltering) setSheetHiddenByDrag(false);
  }, [isFiltering]);
  const dismissSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.spring(sheetTranslateY, { toValue: SHEET_DISMISS_TRANSLATE, ...SHEET_SPRING }).start(({ finished }) => {
      if (!finished) return;
      if (isFilteringRef.current) setSheetHiddenByDrag(true);
      else closeSheet();
    });
  };
  const [sheetDetent, setSheetDetent] = useState<'medium' | 'large'>('medium');
  const sheetDetentRef = useRef(sheetDetent);
  sheetDetentRef.current = sheetDetent;
  // Posición de descanso actual del sheet, en `sheetTopExtra`: 0 = detent
  // grande, mediumGap = detent medio. El arrastre parte de aquí, no siempre
  // de 0, porque ahora hay dos lugares donde el sheet puede estar en reposo.
  const sheetRestYRef = useRef(0);
  const sheetDragStartRef = useRef(0);
  const settleSheetToDetent = (detent: 'medium' | 'large') => {
    const target = detent === 'medium' ? mediumGapRef.current : 0;
    sheetRestYRef.current = target;
    setSheetDetent(detent);
    Animated.spring(sheetTopExtra, { toValue: target, ...SHEET_SPRING_JS }).start();
    Animated.spring(sheetTranslateY, { toValue: 0, ...SHEET_SPRING }).start();
  };
  const sheetDraggingRef = useRef(false);
  const sheetPanResponder = useRef(
    PanResponder.create({
      // El grabber reclama el toque desde que baja el dedo (no solo tras un
      // umbral de arrastre) para poder distinguir tap (cicla detent) de
      // arrastre (redimensiona/cierra) dentro del mismo responder, sin
      // mezclar PanResponder con un Touchable sobre la misma vista.
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        sheetDraggingRef.current = true;
        sheetTopExtra.stopAnimation();
        sheetTranslateY.stopAnimation();
        sheetDragStartRef.current = sheetRestYRef.current;
      },
      onPanResponderMove: (_event, gesture) => {
        if (!isFilteringRef.current) {
          sheetTranslateY.setValue(Math.max(0, gesture.dy));
          return;
        }
        // El recorrido total del dedo primero encoge el sheet (sube
        // `sheetTopExtra` hasta mediumGap, el detent más chico) y, solo una
        // vez ahí, lo que sobra empuja el sheet completo hacia abajo
        // (`sheetTranslateY`) para el gesto de cierre — igual que un sheet
        // real de Apple: no hay un tercer detent más chico, así que pasado
        // el medio ya no encoge más, se va.
        const total = Math.max(0, sheetDragStartRef.current + gesture.dy);
        const medium = mediumGapRef.current;
        sheetTopExtra.setValue(Math.min(total, medium));
        sheetTranslateY.setValue(Math.max(0, total - medium));
      },
      onPanResponderRelease: (_event, gesture) => {
        sheetDraggingRef.current = false;
        const isTap = Math.abs(gesture.dy) < 6 && Math.abs(gesture.dx) < 6;
        if (isTap) {
          // Apple (HIG Sheets): "people can also tap [the grabber] to cycle
          // through the detents" — hoy solo se podía arrastrar.
          if (isFilteringRef.current) {
            Haptics.selectionAsync().catch(() => {});
            settleSheetToDetent(sheetDetentRef.current === 'medium' ? 'large' : 'medium');
          }
          return;
        }
        if (!isFilteringRef.current) {
          // Guardados/Cerca de ti no tienen detents — mismo comportamiento
          // de siempre, un solo arrastre hacia abajo cierra.
          if (gesture.dy > 54 || gesture.vy > 0.8) { dismissSheet(); return; }
          Animated.spring(sheetTranslateY, { toValue: 0, ...SHEET_SPRING }).start();
          return;
        }
        const total = Math.max(0, sheetDragStartRef.current + gesture.dy);
        const medium = mediumGapRef.current;
        const dismissThreshold = medium + 70;
        if (total > dismissThreshold || (gesture.vy > 0.8 && total > medium * 0.6)) {
          dismissSheet();
          return;
        }
        if (gesture.vy < -0.8) { settleSheetToDetent('large'); return; }
        if (gesture.vy > 0.8) { settleSheetToDetent('medium'); return; }
        settleSheetToDetent(total > medium / 2 ? 'medium' : 'large');
      },
      onPanResponderTerminate: () => {
        sheetDraggingRef.current = false;
        Animated.spring(sheetTopExtra, { toValue: sheetRestYRef.current, ...SHEET_SPRING_JS }).start();
        Animated.spring(sheetTranslateY, { toValue: 0, ...SHEET_SPRING }).start();
      },
    })
  ).current;
  const showSheet = (isFiltering && !sheetHiddenByDrag) || sheetMode !== null;
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
      if (isFiltering) {
        // Apple (HIG Motion): "strive for realistic feedback motion that
        // follows people's gestures" — si el sheet se puede descartar
        // deslizando hacia abajo, también debe ENTRAR deslizando desde
        // abajo, no aparecer ya puesto (antes no había animación de
        // entrada). Arranca siempre en el detent medio: Apple documenta que
        // el share sheet abre en medium por "progressive disclosure", y
        // Google nunca reabre su bottom sheet recordando un alto expandido
        // anterior. El alto (`sheetTopExtra`) se fija a medium de una vez —
        // solo la posición (`sheetTranslateY`) se anima, para que la
        // entrada se vea como "una tarjeta ya del tamaño correcto sube",
        // no como una tarjeta que cambia de tamaño mientras sube.
        sheetRestYRef.current = mediumGapRef.current;
        setSheetDetent('medium');
        sheetTopExtra.setValue(mediumGapRef.current);
        sheetTranslateY.setValue(SHEET_DISMISS_TRANSLATE);
        Animated.spring(sheetTranslateY, { toValue: 0, ...SHEET_SPRING }).start();
      } else {
        sheetRestYRef.current = 0;
        sheetTopExtra.setValue(0);
        sheetTranslateY.setValue(0);
      }
      setSheetView({ mounted: true, filtering: isFiltering });
    } else if (sheetView.mounted) {
      Animated.spring(sheetTranslateY, { toValue: SHEET_DISMISS_TRANSLATE, ...SHEET_SPRING }).start(({ finished }) => {
        if (finished) setSheetView((v) => ({ ...v, mounted: false }));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSheet, isFiltering]);
  // Red de seguridad: la entrada de arriba fija `sheetTopExtra` al
  // `mediumGap` que existía EN ESE INSTANTE — pero `handleSubmitSearch`
  // llama `Keyboard.dismiss()` en el mismo gesto que confirma la búsqueda,
  // y el teclado tarda ~250ms en cerrarse de verdad. Si la entrada corre
  // antes de que `keyboardHeight` se actualice a 0, el sheet se queda
  // encogido usando el marco chico (con teclado) para siempre — se ve como
  // "ocupa toda la pantalla" porque nunca se vuelve a corregir. Este efecto
  // re-sincroniza el alto real cada vez que `mediumGap` cambia (ej. cuando
  // el teclado termina de cerrar), mientras el sheet esté en reposo en el
  // detent medio y nadie lo esté arrastrando.
  useEffect(() => {
    if (sheetDetent !== 'medium' || sheetDraggingRef.current || !sheetView.mounted || !sheetView.filtering) return;
    sheetRestYRef.current = mediumGap;
    Animated.spring(sheetTopExtra, { toValue: mediumGap, ...SHEET_SPRING_JS }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediumGap]);
  const listPatios = activeSavedCategories.length ? mapFilteredPatios : allPatios;
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      // Sincronizado con la duración real que iOS reporta para su propia
      // animación del teclado — antes el `bottom` del sheet saltaba de golpe
      // mientras el teclado todavía se deslizaba, dando el efecto de que no
      // "se centraba bien" al abrir/cerrar.
      Animated.timing(keyboardHeightAnim, { toValue: e.endCoordinates.height, duration: e.duration || 250, useNativeDriver: false }).start();
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', (e) => {
      setKeyboardHeight(0);
      Animated.timing(keyboardHeightAnim, { toValue: insets.bottom, duration: e?.duration || 250, useNativeDriver: false }).start();
    });
    return () => { show.remove(); hide.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <View style={[s.pinCategory, showMatch && s.pinCategoryMatch, selected && s.pinCategorySelected]}>
            <Ionicons name={categoryIcon(patio.categories[0] ?? 'Fondita')} size={13} color={selected ? '#FFFFFF' : theme.text} />
            <View style={[s.pinPointer, { borderTopColor: selected ? '#111214' : theme.isDark ? 'rgba(18,19,22,0.90)' : 'rgba(255,255,255,0.92)' }]} />
          </View>
        </View>
      </Marker>
    );
  }), [filteredPinIds, isFiltering, matchingPatioIds, openPatioFromPin, pressedPinId, s, shouldCluster, stableMapPatios, theme]);

  const clusterMarkerElements = useMemo(() => clusterGridKeys.map((key) => {
    const cell = clusterCells.get(key);
    const visible = !!cell && cell.patios.length > 0;
    let category = 'Cocina mexicana';
    if (cell && visible) {
      // Un cluster solo puede mostrar un ícono — cuenta el tag PRIMARIO de
      // cada lugar (no todos sus tags) para decidir cuál domina la celda.
      const categoryCounts = new Map<string, number>();
      cell.patios.forEach((patio) => {
        const primary = patio.categories[0] ?? 'Fondita';
        categoryCounts.set(primary, (categoryCounts.get(primary) ?? 0) + 1);
      });
      category = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? category;
    }
    const latitude = cell && visible ? cell.latitude / cell.patios.length : FOODIE_INITIAL_REGION.latitude;
    const longitude = cell && visible ? cell.longitude / cell.patios.length : FOODIE_INITIAL_REGION.longitude;
    return (
      <Marker
        key={`cluster-${key}`}
        coordinate={{ latitude, longitude }}
        opacity={visible ? 1 : 0}
        tappable={visible}
        tracksViewChanges={false}
        onPress={(event: any) => {
          if (!visible || !cell) return;
          event.stopPropagation?.();
          Haptics.selectionAsync().catch(() => {});
          if (cell.patios.length > 1) {
            mapRef.current?.fitToCoordinates(
              cell.patios.map((patio) => ({ latitude: patio.latitude, longitude: patio.longitude })),
              { edgePadding: { top: 190, right: 54, bottom: 150, left: 54 }, animated: true },
            );
          } else {
            mapRef.current?.animateToRegion({
              latitude,
              longitude,
              latitudeDelta: Math.max(mapRegion.latitudeDelta / 2.5, 0.009),
              longitudeDelta: Math.max(mapRegion.longitudeDelta / 2.5, 0.009),
            }, 360);
          }
        }}>
        <View style={s.clusterHitArea}>
          <View style={s.clusterPin}>
            <Ionicons name={categoryIcon(category)} size={15} color={theme.text} />
            <View style={[s.pinPointer, { borderTopColor: theme.isDark ? 'rgba(18,19,22,0.94)' : 'rgba(255,255,255,0.96)' }]} />
          </View>
        </View>
      </Marker>
    );
  }), [clusterGridKeys, clusterCells, mapRegion.latitudeDelta, mapRegion.longitudeDelta, s, theme]);

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {__DEV__ && (
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: insets.top + 2, right: 8, zIndex: 999, backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ fontSize: 9, fontWeight: '700', color: '#FFFFFF' }}>
            {LOADED_AT.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })}{' '}
            {LOADED_AT.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </Text>
        </View>
      )}

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
            // Con resultados activos, tocar el mapa solo debe quitar el
            // teclado para dar espacio — igual que Google/Apple Maps, que
            // conservan la búsqueda y los pines resaltados mientras
            // exploras. Antes `closeSearch()` corría siempre aquí y borraba
            // la palabra buscada de golpe. Sin texto (`searchActive` sin
            // `isFiltering`), no hay nada que conservar, así que sí cierra
            // la búsqueda por completo.
            if (isFiltering) return;
            if (searchActive) closeSearch();
            else closeSheet();
          }}
          onPanDrag={() => {
            if (isFiltering) { Keyboard.dismiss(); return; }
            if (searchActive) closeSearch();
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
        <View style={[s.mapFilters, { top: insets.top + IDLE_FILTER_BAR_TOP_OFFSET }]}>
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
        <View style={[s.mapFilters, { top: insets.top + FILTER_BAR_TOP_OFFSET }]}>
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
                {noWidow('¿Qué se te antoja?')}
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
                onSubmitEditing={handleSubmitSearch}
                onFocus={() => setSheetHiddenByDrag(false)}
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
        // Dos capas separadas a propósito: RN no deja mezclar, en la misma
        // vista animada, una prop con driver nativo (`transform`, esta
        // capa externa) con una sin driver nativo (`top`/`bottom`, la capa
        // interna) — hacerlo tronaba con "Style property 'top' is not
        // supported by native animated module" y podía tumbar la app. La
        // externa solo se mueve (entrada/salida/arrastre); la interna solo
        // cambia de tamaño (detent medio/grande, alto real del teclado).
        <Animated.View
          pointerEvents="box-none"
          style={{ position: 'absolute', left: 14, right: 14, top: 0, bottom: 0, transform: [{ translateY: sheetTranslateY }] }}>
        <Animated.View
          style={[s.sheet, { left: 0, right: 0 }, sheetView.filtering ? {
            // `FILTERING_SHEET_TOP_OFFSET` es el borde real donde termina
            // la barra de filtros — antes el sheet empezaba justo ahí y la
            // hubiera tapado. `sheetTopExtra` encoge el sheet en el detent
            // medio sin tocar `bottom` — por eso nunca puede quedar detrás
            // del teclado, a diferencia de mover el sheet completo con
            // transform (lo que sí desplazaba el borde inferior detrás del
            // teclado). `bottom` usa el valor animado, sincronizado con la
            // duración real de la animación del teclado — y ya no deja
            // aire extra: llega hasta el margen inferior real (el inset o
            // el teclado), así el radio inferior siempre queda a ras del
            // borde, nunca flotando con un hueco debajo.
            top: Animated.add(insets.top + FILTERING_SHEET_TOP_OFFSET, sheetTopExtra),
            bottom: keyboardHeightAnim,
            maxHeight: undefined,
            paddingBottom: 4,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
          } : {
            bottom: keyboardHeight > 0 ? keyboardHeight + 70 : insets.bottom + 82,
            paddingBottom: insets.bottom ? 4 : 8,
          }]}>
          <BlurView intensity={theme.isDark ? 16 : 22} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View
            {...sheetPanResponder.panHandlers}
            style={s.grabberTouch}
            accessibilityRole="button"
            accessibilityLabel={isFiltering ? 'Cambiar tamaño de la lista de resultados' : undefined}>
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
                  <Text style={s.emptyEyebrow} allowFontScaling={true}>{noWidow('Sin resultados')}</Text>
                  <Text style={s.emptyTitle} allowFontScaling={true}>{noWidow('No hay coincidencias cerca')}</Text>
                  <Text style={s.emptySub} allowFontScaling={true}>{noWidow('Mueve el mapa o cambia tu búsqueda.')}</Text>
                  <Text style={s.emptyPruebaLabel} allowFontScaling={true}>{noWidow('OTRAS BÚSQUEDAS')}</Text>
                  <View style={s.emptyPills}>
                    {['caldo', 'tinga', 'mole', 'pozole', 'veggie'].map((q) => (
                      <TouchableOpacity key={q} onPress={() => searchFor(q)} activeOpacity={0.8} style={s.emptyPill} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityRole="button" accessibilityLabel={`Buscar ${q}`}>
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
                      onPressIn={() => {
                        // Airbnb: tocar una tarjeta resalta y centra su pin
                        // en el mapa sin abrir la ficha — aquí se reusa el
                        // mismo mecanismo de selección que ya usan los pines
                        // al tocarlos (`pressedPinId`/`pinCategorySelected`),
                        // en vez de un segundo lenguaje visual. Dispara
                        // desde que el dedo baja, no hasta soltar, para que
                        // la respuesta se sienta inmediata.
                        if (match.patio.latitude <= 0) return;
                        setPressedPinId(match.patio.id);
                        mapRef.current?.animateToRegion({
                          latitude: match.patio.latitude,
                          longitude: match.patio.longitude,
                          latitudeDelta: mapRegion.latitudeDelta,
                          longitudeDelta: mapRegion.longitudeDelta,
                        }, 260);
                      }}
                      onPressOut={() => setPressedPinId((id) => (id === match.patio.id ? null : id))}
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
