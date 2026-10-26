import { BusinessCategoryIcon } from '@/components/business-category-icon';
import { mapMarkerDetail } from '@/lib/business-category-icons';
import { useScrollEdges } from '@/lib/use-scroll-edges';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { PatioIdentityIcon } from '@/components/patio-identity-icon';
import { patioCardAccessibilityLabel } from '@/lib/patio-card-info';
import { PatioCardInfo } from '@/components/patio-card-info';
import { FoodieLoading } from '@/components/foodie-loading';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { SearchField } from '@/components/search-field';
import { FoodieFilterBar, matchesFoodieFilters } from '@/components/foodie-filter-bar';
import { FOODIE_INITIAL_REGION, useFoodieExploreController } from '@/lib/controllers/useFoodieExploreController';
import { useFoodieFilters } from '@/lib/foodie-filters-context';
import { recordRecentPatio } from '@/lib/recent-patios';
import { useExploreSheet } from '@/lib/use-explore-sheet';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { noWidow } from '@/lib/typography';
import { Radius, useTheme, type Theme, Type } from '@/lib/theme';
import { createCollection, getCollections, type PatioCollection } from '@/lib/collections';
import type { Patio } from '@/lib/patios';
import { bottomTabClearance } from '@/lib/layout-metrics';
import { floatingSurfaceShadow, sheetSurfaceTint } from '@/lib/surface-styles';
import { useSheetKeyboard } from '@/lib/use-sheet-keyboard';
import { useMapLocation } from '@/lib/use-map-location';

// Degradado del contorno de acento (pin seleccionado y match de búsqueda):
// sólido arriba, se desvanece hacia la punta. 0.55 = sigue 100% opaco hasta
// más de la mitad; 0.72 = transparente del todo ya cerca de la punta — corte
// corto/rápido, no un degradado largo y gradual.
//
// Sin `MaskedView`: en vez de recortar un borde con una máscara, se dibuja
// una gota MÁS GRANDE rellena con este degradado detrás de la gota real
// (opaca, del tamaño normal) — como la de encima es más chica y centrada,
// solo se asoma un anillo de la de atrás, que es donde vive el degradado.
// El truco para que el degradado se vea VERTICAL de verdad (no en diagonal)
// pese a que la forma está rotada -45°: en vez de contrarrotar el propio
// degradado (composición de transforms nada confiable entre iOS/Android sin
// poder probarlo en dispositivo real), se elige la dirección `start`/`end`
// en el espacio LOCAL (sin rotar) de manera que, después de que el -45° de
// el pin lo rota para pantalla, quede exactamente vertical. Matemática:
// rotar (0,1) [abajo en pantalla] por +45° da (-0.707, 0.707) — de ahí
// start={{x:1,y:0}} → end={{x:0,y:1}} (esquina superior-derecha a
// inferior-izquierda en local), que es esa misma dirección normalizada.
const PIN_GLOW_COLORS_LOCATIONS = [0, 0.55, 0.72] as const;
const PIN_GLOW_START = { x: 1, y: 0 };
const PIN_GLOW_END = { x: 0, y: 1 };
// El literal `'transparent'` de CSS/RN es `rgba(0,0,0,0)` — negro con alpha
// 0, NO "este mismo color con alpha 0". Usarlo como último color de un
// degradado hace que la interpolación pase por tonos grises/negruzcos de
// camino a invisible, en vez de un fade limpio de alpha puro. Por eso el
// color final del degradado tiene que ser el MISMO rgb del acento con
// alpha 0 explícito.
function accentToTransparentRgba(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0)`;
}
// Dos buscadores con alturas REALES distintas comparten esta barra de
// filtros — bug encontrado tras varias rondas de "sigue sin pegarse":
// - Inactivo (pill "¿Qué se te antoja?", sin escribir): 10 de margen + ~50
//   de alto de la pill — termina en insets.top+60. Sin padding extra debajo
//   (`bottomControls` no tiene padding propio).
// - Activo (ya escribiendo, con flecha atrás + IA): 10 + 50 + 12 de
//   padding inferior del contenedor — termina en insets.top+72.
// El estado inactivo termina en top+60; sumamos 8pt de separación real.
// El activo ya incorpora 12pt debajo del campo. Cada estado usa su medida.
const IDLE_FILTER_BAR_TOP_OFFSET = 64;
const FILTER_BAR_TOP_OFFSET = IDLE_FILTER_BAR_TOP_OFFSET;
// `FILTER_BAR_TOP_OFFSET` (borde inferior del buscador) + 44 (barra de
// filtros) + 8 (aire entre la barra y el sheet) — es el `top` real del
// sheet de resultados en modo filtrado y también define el marco del que
// se deriva el detent medio (ver `mediumGap` más abajo); un solo número,
// no dos que puedan desalinearse.
const FILTERING_SHEET_TOP_OFFSET = FILTER_BAR_TOP_OFFSET + 44 + 8;
// Cuántas filas de resultado completas caben en el detent medio del sheet
// de búsqueda — ver `mediumContentHeight` más abajo, junto al PanResponder.
const SHEET_MEDIUM_ROWS = 3;
const SHEET_LIST_BOTTOM_PADDING = 12;
// Apple (HIG "Sheets"): un sheet redimensionable descansa en "detents" — el
// sistema define large (altura completa) y medium ("about half of the fully
// expanded height"). Mismo spring en las tres transiciones (entrada, salida,
// cambio de detent) para que el movimiento se sienta como una sola mano, no
// varias animaciones distintas peleando entre sí.
// Redimensionar el alto real del sheet (no un transform) no puede usar el
// driver nativo — solo transform/opacity corren ahí. Mismo spring, distinto
// driver.

function makeStyles(t: Theme) {
  const btnBorder = t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: t.bg, zIndex: 50 },
    map: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0' },
    mapView: { ...StyleSheet.absoluteFillObject },
    // Deja aire para que la sombra no se recorte en la captura del marcador.
    mapDotWrap: { padding: 4 },
    // Claro y oscuro: mismo punto naranja sin contorno; solo cambia la fuerza de la sombra leve.
    mapDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: t.accent, shadowColor: '#000', shadowOpacity: t.isDark ? 0.35 : 0.18, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
    pinHitArea: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    // Gota invertida como UNA sola pieza (no círculo + triángulo pegado):
    // cuadrado con 3 esquinas redondeadas al 50% y la esquina inferior
    // izquierda recta, rotado -45° — la técnica clásica del pin de mapa (el
    // mismo truco detrás del marcador de Google Maps). Como es una forma
    // continua, el anillo de abajo (mismo corte + misma rotación) la cubre
    // completa sin dejar ninguna parte fuera — a diferencia del círculo +
    // triángulo suelto de antes. El ícono adentro se contrarrota +45° para
    // quedar derecho.
    // Sin borde propio en reposo — un hairline blanco/negro fijo se veía
    // como un filo indeseado alrededor de la gota, sobre todo en oscuro.
    pinCategory: { width: 26, height: 26, borderTopLeftRadius: 13, borderTopRightRadius: 13, borderBottomRightRadius: 13, borderBottomLeftRadius: 0, transform: [{ rotate: '-45deg' }], alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(18,19,22,0.90)' : 'rgba(255,255,255,0.92)', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: t.isDark ? 0.24 : 0.12, shadowRadius: 6, elevation: 3 },
    // El relleno normal del pin no es 100% opaco (92%/90% arriba) — a
    // propósito, deja pasar un poco el mapa de abajo. Pero cuando hay un
    // degradado detrás (seleccionado o match), ese 8-10% de transparencia
    // deja que el color se filtre A TRAVÉS de todo el pin, no solo se asome
    // en el anillo — se ve como un "corte"/silueta de la capa de atrás.
    // Este override fuerza opacidad completa SOLO mientras el degradado
    // está activo, para taparlo del todo.
    pinCategoryOpaque: { backgroundColor: t.isDark ? 'rgb(18,19,22)' : '#FFFFFF' },
    // Sigue viva para el marker de CLUSTER (`clusterMarkerElements` más
    // abajo), que conserva la forma de globo clásica — no participa en la
    // selección ni en el anillo, no tenía el problema de la gota.
    pinPointer: { position: 'absolute', bottom: -5, width: 0, height: 0, borderLeftWidth: 4, borderRightWidth: 4, borderTopWidth: 6, borderLeftColor: 'transparent', borderRightColor: 'transparent' },
    // Gota MÁS GRANDE detrás, rellena con el degradado (ver constantes
    // PIN_GLOW_* arriba) — la gota real (pinCategory, opaca, 26x26) se
    // pinta encima y tapa el centro, dejando solo un anillo de 2px visible
    // alrededor (antes 3px, se sentía muy grueso). Centrada en pinHitArea
    // (40x40): (40-30)/2 = 5.
    pinSelectedGlowPosition: { position: 'absolute', top: 5, left: 5, width: 30, height: 30 },
    pinSelectedGlowShape: { width: 30, height: 30, borderTopLeftRadius: 15, borderTopRightRadius: 15, borderBottomRightRadius: 15, borderBottomLeftRadius: 0 },
    // Mismo truco que la selección, pero SIN animar (estático — puede haber
    // 10-30 pines de match a la vez en una búsqueda; animar cada uno sería
    // redibujar de más markers nativos en simultáneo) y con anillo más
    // delgado (1px, gota de 28 en vez de 30) para que la jerarquía visual
    // quede clara: "hace match" pesa menos que "es EL seleccionado".
    pinMatchGlowPosition: { position: 'absolute', top: 6, left: 6, width: 28, height: 28 },
    pinMatchGlowShape: { width: 28, height: 28, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderBottomRightRadius: 14, borderBottomLeftRadius: 0 },
    clusterHitArea: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
    // Círculo completo (radio = mitad del ancho) — "pansoncito", redondo y
    // simple para cuando hay muchos agrupados lejos; a propósito distinto
    // de la gota delicada de los pines individuales de cerca.
    clusterPin: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(18,19,22,0.94)' : 'rgba(255,255,255,0.96)', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: t.isDark ? 0.28 : 0.15, shadowRadius: 7, elevation: 4 },
    searchPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, height: 50, borderRadius: 18, overflow: 'hidden', backgroundColor: t.isDark ? 'rgba(20,21,24,0.55)' : 'rgba(255,255,255,0.78)', borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, ...floatingSurfaceShadow(t.isDark) },
    bottomControls: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
    aiProButton: { minHeight: 44, minWidth: 44, paddingHorizontal: 8, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: t.accentSoft },
    aiProText: { fontSize: 10.5, fontWeight: '800', color: t.accent, letterSpacing: 0.3 },
    // Edge-to-edge (sin margen lateral): mismo criterio que el sheet de
    // Filtros/Listas de FoodieFilterBar — ancho completo, borde solo arriba
    // (decisión 2026-08-20). Las esquinas inferiores siguen redondeándose en
    // modo idle (flota sobre la tab bar, con aire debajo) y se aplanan en
    // modo filtrado (llega hasta abajo del todo) — eso ya lo maneja el JSX.
    sheet: { position: 'absolute', left: 0, right: 0, maxHeight: '48%', borderRadius: Radius.sheet, overflow: 'hidden', borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)' },
    sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: sheetSurfaceTint(t.isDark) },
    grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)', marginTop: 7 },
    sheetHeader: { minHeight: 44 },
    grabberTouch: { height: 20, alignItems: 'center', justifyContent: 'flex-start' },
    price: { fontSize: 24, lineHeight: 28, fontWeight: '400', color: t.text },
    listHeader: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 6, flexDirection: 'row', alignItems: 'center' },
    listTitle: { fontSize: 12.5, fontWeight: '600', color: t.textSecondary },
    aiNoteRow: { paddingHorizontal: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
    aiNoteText: { fontSize: 12.5, fontWeight: '300', color: t.textSecondary, flexShrink: 1 },
    listFilter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 30, borderRadius: 15, backgroundColor: t.accentLight },
    listFilterText: { fontSize: 12, fontWeight: '900', color: t.accent },
    listContent: { paddingBottom: SHEET_LIST_BOTTOM_PADDING },
    // Solo en modo filtrado el sheet tiene una altura acotada de verdad
    // (`top`/`bottom` explícitos, ver JSX) — ahí SÍ hace falta `flex: 1`
    // para que este ScrollView haga scroll en vez de cortarse contra el
    // `overflow: hidden` del sheet cuando el contenido excede el detent
    // (ej. el estado "sin resultados", o texto agrandado por accesibilidad).
    // El sheet de exploración (sin filtrar) no tiene `top` fijo — es
    // auto-alto hasta `maxHeight: 48%` — y forzar `flex: 1` ahí colapsaría
    // el ScrollView a 0 por no tener un alto de referencia.
    listFiltering: { flex: 1 },
    // El sheet ya es la superficie que agrupa los resultados. Cada resultado
    // es una fila continua (patrón Maps/Music), no otra card dentro del panel.
    patioRow: { minHeight: 60, marginHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    resultIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    patioInfo: { flex: 1, minWidth: 0 },
    patioName: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: t.text },
    patioMetaLine: { marginTop: 2, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
    patioMeta: { flex: 1, minWidth: 0, fontSize: 13, lineHeight: 18, fontWeight: '300', color: t.text },
    patioDistance: { marginLeft: 6, flexShrink: 0, fontSize: 13, lineHeight: 18, fontWeight: '300', color: t.textSecondary, fontVariant: ['tabular-nums'] },
    patioRight: { width: 76, flexShrink: 0, alignItems: 'flex-end', gap: 4 },
    patioPrice: { fontSize: 14, fontWeight: '300', color: t.textSecondary },
    patioOpen: { fontSize: 11.5, fontWeight: '700', color: t.textSecondary },
    emptyResults: { paddingHorizontal: 28, paddingVertical: 36, alignItems: 'center' },
    emptyIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', color: t.accent, marginBottom: 10 },
    emptyTitle: { ...Type.title, color: t.text, textAlign: 'center', marginBottom: 12 },
    emptySub: { fontSize: 15, fontWeight: '400', lineHeight: 21, color: t.textSecondary, textAlign: 'center', marginBottom: 28, maxWidth: 300 },
    emptyPruebaLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, textTransform: 'uppercase', color: t.textSecondary, marginBottom: 14 },
    emptyPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    emptyPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    emptyPillText: { fontSize: 14, fontWeight: '400', color: t.text },
    mapFilters: { position: 'absolute', left: 0, right: 0 },
  });
}

export default function ExplorarScreen() {
  const params = useLocalSearchParams<{ collection?: string; saved?: string }>();
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const accentTransparent = useMemo(() => accentToTransparentRgba(theme.accent), [theme.accent]);
  const pinGlowColors = useMemo(() => [theme.accent, theme.accent, accentTransparent] as const, [theme.accent, accentTransparent]);
  const insets = useSafeAreaInsets();
  const { onScroll: onTabBarScroll, reveal: revealNavigation } = useTabBarScroll();
  const { height: windowHeight } = useWindowDimensions();
  const { keyboardInset: keyboardHeight, keyboardVisible } = useSheetKeyboard();
  const [sheetHeaderHeight, setSheetHeaderHeight] = useState(45);
  const [sheetRowHeights, setSheetRowHeights] = useState([60, 60, 60]);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const idleLayerOpacity = useRef(new Animated.Value(1)).current;
  const keyboardHeightAnim = useRef(new Animated.Value(0)).current;
  // Apple define medium como "about half of the fully expanded height" (HIG
  // Sheets) — probamos esa proporción y también un 38% fijo, y ambas
  // seguían sin sentirse bien en dispositivo. En vez de perseguir un
  // porcentaje, el detent medio ahora se dimensiona por CONTENIDO: que
  // quepan 3 filas de resultado completas (`SHEET_MEDIUM_ROWS`), ni más ni
  // menos — un tamaño que se explica solo con lo que muestra, no con una
  // fracción de pantalla arbitraria. La cabecera y las primeras tres filas se
  // miden para incluir el tamaño de texto de la persona. Calculado aquí
  // arriba (no solo junto al
  // PanResponder) porque el encuadre del mapa también lo necesita, para
  // reservar exactamente el espacio que el sheet ocupa de verdad.
  const filteringSheetBottom = keyboardHeight;
  const largeFrameHeight = Math.max(windowHeight - (insets.top + FILTERING_SHEET_TOP_OFFSET) - filteringSheetBottom, 0);
  // Las medidas reales conservan las filas completas al aumentar el texto
  // o cambiar la información. El espacio final pertenece al contenido.
  const mediumContentHeight = sheetHeaderHeight + sheetRowHeights.reduce((total, height) => total + height, 0) + SHEET_LIST_BOTTOM_PADDING + (keyboardVisible ? 0 : insets.bottom) + 4;
  const mediumSheetHeight = Math.min(largeFrameHeight, Math.max(mediumContentHeight, 220));
  const mediumGap = largeFrameHeight - mediumSheetHeight;
  const mapRef = useRef<MapView>(null);
  const manualMapPosition = useRef(false);
  const [mapRegion, setMapRegion] = useState<Region>(FOODIE_INITIAL_REGION);
  const [pressedPinId, setPressedPinId] = useState<string | null>(null);
  const pinNavigationPending = useRef(false);
  const pinTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Prender/apagar el pin seleccionado no es simétrico: HIG Motion (ease-out
  // rápido al aparecer) + el propio patrón de UIKit para `UIButton.highlighted`
  // (se enciende sin animación al tocar, se apaga con fade al soltar) — aquí
  // 120ms de encendido casi instantáneo, 260ms de apagado suave. Solo el pin
  // seleccionado anima (uno a la vez); los pines de match de búsqueda quedan
  // instantáneos como antes por costo de redibujado nativo del Marker.
  const selectedPinAnimRef = useRef<Map<string, Animated.Value>>(new Map()).current;
  const getSelectedPinAnim = useCallback((id: string) => {
    let value = selectedPinAnimRef.get(id);
    if (!value) {
      value = new Animated.Value(0);
      selectedPinAnimRef.set(id, value);
    }
    return value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const prevPressedPinIdRef = useRef<string | null>(null);
  const [animatingPinIds, setAnimatingPinIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const prev = prevPressedPinIdRef.current;
    prevPressedPinIdRef.current = pressedPinId;
    const targets: { id: string; toValue: number }[] = [];
    if (pressedPinId) targets.push({ id: pressedPinId, toValue: 1 });
    if (prev && prev !== pressedPinId) targets.push({ id: prev, toValue: 0 });
    if (targets.length === 0) return;
    setAnimatingPinIds((curr) => {
      const next = new Set(curr);
      targets.forEach((t) => next.add(t.id));
      return next;
    });
    let pending = targets.length;
    targets.forEach(({ id, toValue }) => {
      Animated.timing(getSelectedPinAnim(id), {
        toValue,
        // Ease-in/ease-out (HIG Motion) es para MOVIMIENTO — aquí es opacidad
        // pura, y para propiedades de luz (opacidad/color/brillo) la curva
        // correcta es lineal: con ease-in casi todo el cambio queda
        // comprimido en el último instante y se lee como "no pasa nada,
        // luego desaparece de golpe" en vez de un apagado perceptible.
        duration: toValue === 1 ? 120 : 280,
        easing: toValue === 1 ? Easing.out(Easing.quad) : Easing.linear,
        useNativeDriver: false,
      }).start(() => {
        pending -= 1;
        if (pending <= 0) {
          // `tracksViewChanges` en el Marker se apaga en cuanto sale de
          // `animatingPinIds` — si eso pasa en el MISMO tick en que termina
          // la animación, a veces react-native-maps no alcanza a tomar la
          // snapshot final antes de congelar el marker, y se queda pegado a
          // medio fade (el bug de "solo se queda el aro"). Un respiro corto
          // aquí le da tiempo a iOS de rasterizar el frame ya asentado antes
          // de dejar de rastrear cambios.
          pinTimers.current.push(setTimeout(() => {
            setAnimatingPinIds((curr) => {
              const next = new Set(curr);
              targets.forEach((t) => next.delete(t.id));
              return next;
            });
          }, 80));
        }
      });
    });
  }, [pressedPinId, getSelectedPinAnim]);
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
    savedIds,
    mapFilteredPatios,
    searchActive,
    searchInputRef,
    searchPending,
    setAiMode,
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
  const { filters, setFilters } = useFoodieFilters();
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
  }, [params.collection, setFilters]);
  // Los atributos (categoría, pagos, horario) se combinan por intersección
  // (AND) — como Google Maps. Las listas se combinan por unión (OR): elegir
  // dos listas muestra los lugares de cualquiera de las dos, para comparar
  // cuál te queda más cerca entre ambas, no para restringir a los que están
  // en las dos a la vez.
  const filteredPins = useMemo(() => visiblePatios.filter((patio) => matchesFoodieFilters(filters, {
    patioId: patio.id,
    weeklyHours: patio.weeklyHours ?? null,
    categories: patio.categories,
    payments: patio.payments,
    collections,
  })), [collections, filters, visiblePatios]);
  // Los filtros también deben aplicar cuando ya estás buscando una palabra
  // (no solo en el mapa idle) — así lo hace Apple Maps: los chips de filtro
  // siguen vivos y afectan los resultados de la búsqueda, no desaparecen en
  // cuanto escribes.
  const filteredMatches = useMemo(() => topMatchPerPatio.filter((match) =>
    (!activeSavedCategories.length || (savedIds.includes(match.patio.id) && match.patio.categories.some((category) => activeSavedCategories.includes(category)))) && matchesFoodieFilters(filters, {
    patioId: match.patio.id,
    weeklyHours: match.patio.weeklyHours ?? null,
    categories: match.patio.categories,
    payments: match.patio.payments,
    collections,
  })), [topMatchPerPatio, filters, collections, activeSavedCategories, savedIds]);
  const matchingPatioIds = useMemo(() => new Set(filteredMatches.map((match) => match.patio.id)), [filteredMatches]);
  const filteredPinIds = useMemo(() => new Set(filteredPins.map((patio) => patio.id)), [filteredPins]);
  // Los pines de match/muted cambian de CONTENIDO nativo (se agrega/quita la
  // capa de degradado, cambia el relleno a opaco, cambia opacity/tappable)
  // cada vez que escribes y los resultados se recalculan — pero
  // `tracksViewChanges` solo miraba selección, nunca esto. react-native-maps
  // se queda con el snapshot VIEJO del pin (de antes de matchear/mutear) y
  // no lo vuelve a rasterizar, así que se veía "roto"/desaparecido a medias.
  // Ventana corta de re-tracking cada vez que el set de matches cambia
  // (una vez por actualización de búsqueda, no por frame — no reintroduce
  // el costo de animar 30 pines seguido).
  //
  // 2026-08-20: esta ventana marcaba tracksViewChanges=true en TODOS los
  // pines que hacen match Y TODOS los que se mutean a la vez — en una
  // búsqueda típica eso puede ser 25-30 vistas nativas de Marker
  // reconciliándose en el mismo instante, que es exactamente el patrón que
  // ya crasheó esta app antes (NSInvalidArgumentException en
  // -[AIRMap insertReactSubview:atIndex:], ver docs/HANDOFF.md). Un pin que
  // se MUTEA queda con opacity=0 (invisible) — su contenido interno (el
  // anillo) puede quedar con el snapshot viejo sin que nadie lo note, porque
  // nadie lo ve. Solo los pines que SÍ deben mostrarse con contenido nuevo
  // (match) necesitan el re-snapshot; ver `matchTrackWindow` en el JSX del
  // Marker, ya no incluye `isMuted`.
  const [matchTrackWindow, setMatchTrackWindow] = useState(false);
  useEffect(() => {
    if (!isFiltering) return;
    setMatchTrackWindow(true);
    const timer = setTimeout(() => setMatchTrackWindow(false), 180);
    pinTimers.current.push(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchingPatioIds]);
  // Sugerencias del estado "sin resultados": antes era una lista fija
  // ('caldo', 'tinga', 'mole'...) sin relación con lo que existe cerca —
  // tocar una sugerencia que no tiene ni un solo lugar real detrás es peor
  // que no sugerir nada. Estas salen de las categorías reales de los
  // negocios visibles en el mapa ahora mismo, ordenadas por qué tan
  // frecuentes son — tocar cualquiera garantiza encontrar algo.
  const emptyResultsSuggestions = useMemo(() => {
    const counts = new Map<string, number>();
    visiblePatios.forEach((patio) => {
      patio.categories.forEach((category) => {
        const label = category.trim();
        if (!label) return;
        counts.set(label, (counts.get(label) ?? 0) + 1);
      });
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label]) => label);
  }, [visiblePatios]);
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
  // que no cambian qué lugares aparecen.
  const matchedResultIdsKey = useMemo(
    () => filteredMatches.map((match) => match.patio.id).sort().join('|'),
    [filteredMatches]
  );
  useEffect(() => {
    // No dispara en cada tecla: `searchPending` viene del debounce de 300ms
    // ya existente en useFoodieExploreController — solo se lee aquí, no se
    // agrega un segundo debounce.
    if (!isFiltering || searchPending || manualMapPosition.current) return;
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
  const markerDetail = mapMarkerDetail(mapRegion.latitudeDelta);
  const shouldCluster = markerDetail === 'cluster';
  const showCategoryIcons = markerDetail === 'icon';
  const markerRefs = useRef<Map<string, { redraw: () => void }>>(new Map());
  const clusterRefs = useRef<Map<string, { redraw: () => void }>>(new Map());
  // Refresh snapshots once when detail changes; do not remount native markers
  // or leave tracksViewChanges running for every point during map gestures.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!shouldCluster) markerRefs.current.forEach(marker => marker.redraw());
    });
    return () => cancelAnimationFrame(frame);
  }, [showCategoryIcons, shouldCluster]);
  // Si el pin seleccionado se agrupa en un cluster al alejar el zoom, su
  // Marker se vuelve invisible (`opacity: included && !shouldCluster ? 1
  // : 0`) pero nada limpiaba `pressedPinId` ni el `Animated.Value` de su
  // anillo — quedaban "vivos" en 1. Al volver a acercar el zoom, el pin
  // reaparecía con el anillo ya prendido de golpe, sin el fade-in de
  // 120ms. Como es invisible mientras está agrupado, el reset puede ser
  // instantáneo (`setValue`, no animado) sin que se note.
  useEffect(() => {
    if (!shouldCluster || !pressedPinId) return;
    getSelectedPinAnim(pressedPinId).setValue(0);
    setPressedPinId(null);
    setAnimatingPinIds(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldCluster]);
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
      if (isFiltering && !matchingPatioIds.has(patio.id)) return;
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
  }, [filteredPins, mapRegion, shouldCluster, isFiltering, matchingPatioIds]);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      clusterCells.forEach((_cell, key) => clusterRefs.current.get(key)?.redraw());
    });
    return () => cancelAnimationFrame(frame);
  }, [clusterCells, isFiltering, theme.isDark]);
  const clusterGridKeys = useMemo(() => {
    const keys: string[] = [];
    for (let row = 0; row < CLUSTER_ROWS; row++) {
      for (let column = 0; column < CLUSTER_COLS; column++) keys.push(`${row}:${column}`);
    }
    return keys;
  }, []);
  const {
    activateSheetHandle, dismissSheet, reopenSheet, sheetDetent, sheetPanResponder,
    sheetTopExtra, sheetTranslateY, sheetView, sheetVisibleHeightRef, showNavigation, showSheet,
  } = useExploreSheet({
    isFiltering, sheetMode, searchActive, keyboardVisible, windowHeight, mediumGap,
    emptyResults: isFiltering && !searchPending && filteredMatches.length === 0,
    closeSheet, revealNavigation,
  });
  const scrollViewKey = `${sheetView.mounted}:${sheetView.filtering}`;
  const edges = useScrollEdges(scrollViewKey);
  const { centerOnLocation, locating, location, cancelLocation } = useMapLocation((point) => {
    manualMapPosition.current = true;
    // Revealing the map keeps the searched term, filters and highlighted pins.
    dismissSheet();
    mapRef.current?.animateToRegion({ ...point, latitudeDelta: 0.009, longitudeDelta: 0.009 }, 420);
  });
  const listPatios = (activeSavedCategories.length ? mapFilteredPatios : allPatios).filter((patio) => matchesFoodieFilters(filters, {
    patioId: patio.id,
    weeklyHours: patio.weeklyHours ?? null,
    categories: patio.categories,
    payments: patio.payments,
    collections,
  }));
  useEffect(() => {
    // Frame relativo al viewport: Android puede haber descontado el teclado
    // con adjustResize. Descontar su alto otra vez cortaba el panel.
    const animation = Animated.timing(keyboardHeightAnim, { toValue: keyboardHeight, duration: 250, useNativeDriver: false });
    animation.start();
    return () => animation.stop();
  }, [keyboardHeight, keyboardHeightAnim]);

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
    const isAnimatingSelection = animatingPinIds.has(patio.id);
    const showSelectedOverlay = selected || isAnimatingSelection;
    const isMuted = included && isFiltering && !matchingPatioIds.has(patio.id);
    // El anillo de selección y el borde de "match" son el mismo color de
    // acento — mostrar los dos a la vez dibuja dos círculos concéntricos.
    // La selección es la señal más específica, así que gana ella sola.
    const showMatch = isFiltering && !isMuted && !showSelectedOverlay;
    return (
      <Marker
        key={patio.id}
        ref={marker => { if (marker) markerRefs.current.set(patio.id, marker); else markerRefs.current.delete(patio.id); }}
        accessibilityLabel={`Abrir ${patio.name}`}
        coordinate={{ latitude: patio.latitude, longitude: patio.longitude }}
        // Antes los que no hacían match se mostraban atenuados (18%) en vez
        // de ocultarse — se sentían como "fantasmas" ensuciando el mapa.
        // Ahora, mientras hay búsqueda activa, solo se ven los que sí hacen
        // match; el resto se oculta igual que los que ya estaban excluidos.
        opacity={included && !shouldCluster && !isMuted ? 1 : 0}
        tappable={included && !shouldCluster && !isMuted}
        // Un pin "prendido" (seleccionado o match) no debe quedar tapado
        // por el cuerpo de un vecino normal si están cerca en el mapa —
        // zIndex sí funciona en iOS aquí (usa layer.zPosition nativo).
        zIndex={selected ? 3 : isAnimatingSelection ? 2 : showMatch ? 1 : 0}
        tracksViewChanges={selected || isAnimatingSelection || (matchTrackWindow && showMatch)}
        onPress={(event: any) => {
          if (!included) return;
          event.stopPropagation?.();
          openPatioFromPin(patio.id);
        }}>
        <View style={s.pinHitArea}>
          {showCategoryIcons || showSelectedOverlay ? <>
          {showSelectedOverlay && (
            <Animated.View
              pointerEvents="none"
              style={[
                s.pinSelectedGlowPosition,
                {
                  opacity: getSelectedPinAnim(patio.id),
                  transform: [
                    { rotate: '-45deg' },
                    { scale: getSelectedPinAnim(patio.id).interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) },
                  ],
                },
              ]}>
              <LinearGradient
                colors={pinGlowColors}
                locations={PIN_GLOW_COLORS_LOCATIONS}
                start={PIN_GLOW_START}
                end={PIN_GLOW_END}
                style={s.pinSelectedGlowShape}
              />
            </Animated.View>
          )}
          {showMatch && (
            <View pointerEvents="none" style={[s.pinMatchGlowPosition, { transform: [{ rotate: '-45deg' }] }]}>
              <LinearGradient
                colors={pinGlowColors}
                locations={PIN_GLOW_COLORS_LOCATIONS}
                start={PIN_GLOW_START}
                end={PIN_GLOW_END}
                style={s.pinMatchGlowShape}
              />
            </View>
          )}
          <View style={[s.pinCategory, (showSelectedOverlay || showMatch) && s.pinCategoryOpaque]}>
            <View style={{ transform: [{ rotate: '45deg' }] }}><BusinessCategoryIcon context="map" category={patio.categories[0] ?? 'Fondita'} size={15} color={theme.text} /></View>
          </View>
          </> : <View style={s.mapDotWrap}><View style={[s.mapDot, showMatch && { backgroundColor: theme.accent, borderColor: theme.accent }]} /></View>}
        </View>
      </Marker>
    );
  }), [animatingPinIds, filteredPinIds, getSelectedPinAnim, isFiltering, matchingPatioIds, matchTrackWindow, openPatioFromPin, pinGlowColors, pressedPinId, s, shouldCluster, showCategoryIcons, stableMapPatios, theme]);

  const clusterMarkerElements = useMemo(() => clusterGridKeys.map((key) => {
    const cell = clusterCells.get(key);
    const visible = !!cell && cell.patios.length > 0;
    const latitude = cell && visible ? cell.latitude / cell.patios.length : FOODIE_INITIAL_REGION.latitude;
    const longitude = cell && visible ? cell.longitude / cell.patios.length : FOODIE_INITIAL_REGION.longitude;
    return (
      <Marker
        key={`cluster-${key}`}
        ref={marker => { if (marker) clusterRefs.current.set(key, marker); else clusterRefs.current.delete(key); }}
        accessibilityLabel={cell ? `${cell.patios.length} ${cell.patios.length === 1 ? 'lugar' : 'lugares'}, acercar mapa` : undefined}
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
          <View style={s.mapDotWrap}><View style={[s.mapDot, isFiltering && { backgroundColor: theme.accent, borderColor: theme.accent }]} /></View>
        </View>
      </Marker>
    );
  }), [clusterGridKeys, clusterCells, mapRegion.latitudeDelta, mapRegion.longitudeDelta, isFiltering, s, theme]);

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
          showsUserLocation={location !== null}
          followsUserLocation={false}
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
                      <BusinessCategoryIcon context="map" category={patio.category} size={13} color={selected ? '#FFFFFF' : theme.text} />
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
                  <BusinessCategoryIcon context="map" category={cluster.category} size={15} color={theme.text} />
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

      {/* One instance preserves the filter panel while the keyboard/search
          changes state. No second row of quick toggles beside this control. */}
      {(!showSheet || (sheetView.mounted && sheetView.filtering)) && (
        <View pointerEvents="box-none" style={[s.mapFilters, { top: insets.top + (searchActive ? FILTER_BAR_TOP_OFFSET : IDLE_FILTER_BAR_TOP_OFFSET) }]}>
          <FoodieFilterBar
            filters={filters}
            onChange={setFilters}
            collections={collections}
            categories={[...new Set(allPatios.flatMap((patio) => patio.categories))].sort((a, b) => a.localeCompare(b, 'es'))}
            additionalFilter={activeSavedCategories.length ? { label: activeSavedCategories.join(' · '), onClear: clearSavedMapFilter } : undefined}
            onCollectionCreated={(c) => setCollections((prev) => [c, ...prev])}
            onCollectionUpdated={(c) => setCollections((prev) => prev.map((item) => item.id === c.id ? c : item))}
            onCollectionRemoved={(id) => setCollections((prev) => prev.filter((item) => item.id !== id))}
            locationAction={{ onPress: () => { Haptics.selectionAsync().catch(() => {}); void centerOnLocation(); }, busy: locating }}
          />
        </View>
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
              <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="search-outline" size={21} color={theme.textSecondary} />
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
          <View style={{ paddingHorizontal: 16, paddingBottom: 4 }}>
            <SearchField
              inputRef={searchInputRef}
              accessibilityLabel="Buscar comida o un lugar"
              value={query}
              onChangeText={handleQueryChange}
              placeholder="¿Qué se te antoja?"
              autoFocus
              blurOnSubmit={false}
              onSubmitEditing={() => { cancelLocation(); manualMapPosition.current = false; reopenSheet(); handleSubmitSearch(); }}
              onFocus={reopenSheet}
              onCancel={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); closeSearch(); }}
              trailingAction={
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
              }
            />
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
          pointerEvents={showSheet ? "box-none" : "none"}
          accessibilityElementsHidden={!showSheet}
          importantForAccessibility={showSheet ? 'auto' : 'no-hide-descendants'}
          style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, transform: [{ translateY: sheetTranslateY }] }}>
        <Animated.View
          onLayout={(event) => { sheetVisibleHeightRef.current = event.nativeEvent.layout.height; }}
          style={[s.sheet, sheetView.filtering ? {
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
            bottom: keyboardVisible ? keyboardHeight + 16 : bottomTabClearance(insets.bottom),
            paddingBottom: insets.bottom ? 4 : 8,
          }]}>
          <BlurView intensity={theme.isDark ? 16 : 22} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={s.sheetTint} />
          <View
            {...sheetPanResponder.panHandlers}
            style={s.sheetHeader}
            onLayout={(event) => setSheetHeaderHeight(Math.max(44, Math.ceil(event.nativeEvent.layout.height)))}
            accessible
            accessibilityRole="button"
            accessibilityLabel={isFiltering ? (sheetDetent === 'medium' ? 'Expandir resultados' : 'Reducir resultados') : 'Ocultar lugares'}
            accessibilityValue={{ text: isFiltering
              ? `${filteredMatches.length} resultado${filteredMatches.length !== 1 ? 's' : ''}${aiMode && aiNote ? `. ${aiNote}` : ''}`
              : sheetMode === 'saved' ? 'Guardados' : 'Cerca de ti' }}
            accessibilityState={isFiltering ? { expanded: sheetDetent === 'large' } : undefined}
            onAccessibilityTap={activateSheetHandle}
            accessibilityActions={[{ name: 'activate' }]}
            onAccessibilityAction={(event) => {
              if (event.nativeEvent.actionName === 'activate') activateSheetHandle();
            }}
            onAccessibilityEscape={dismissSheet}>
            <View style={s.grabberTouch}>
              <View style={s.grabber} />
            </View>

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
                <Text style={s.aiNoteText} allowFontScaling={true}>{aiNote}</Text>
              </View>
            )}
          </View>

          <View style={sheetView.filtering ? s.listFiltering : { flexShrink: 1 }}>
          <ScrollView key={scrollViewKey}
            onLayout={edges.onLayout}
            onContentSizeChange={edges.onContentSizeChange}
            contentContainerStyle={[s.listContent, sheetView.filtering && {
              paddingBottom: keyboardVisible ? SHEET_LIST_BOTTOM_PADDING : searchActive
                ? insets.bottom + SHEET_LIST_BOTTOM_PADDING : bottomTabClearance(insets.bottom),
            }]}
            showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            scrollEventThrottle={16}
            onScroll={(event) => { edges.onScroll(event); if (!sheetView.filtering) onTabBarScroll?.(event); }}
            onScrollBeginDrag={() => {
              Keyboard.dismiss();
              setPressedPinId(null);
            }}>
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
                  {!!emptyResultsSuggestions.length && (
                    <>
                      <Text style={s.emptyPruebaLabel} allowFontScaling={true}>{noWidow('CERCA DE TI')}</Text>
                      <View style={s.emptyPills}>
                        {emptyResultsSuggestions.map((q) => (
                          <TouchableOpacity key={q} onPress={() => { cancelLocation(); manualMapPosition.current = false; reopenSheet(); searchFor(q); }} activeOpacity={0.8} style={s.emptyPill} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }} accessibilityRole="button" accessibilityLabel={`Buscar ${q}`}>
                            <Text style={s.emptyPillText} allowFontScaling={true}>{q}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
                )
              ) : (
                filteredMatches.map((match, index) => {
                  const distance = distanceLabelForPatio(match.patio);
                  return (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Abrir resultado ${match.item.name} en ${match.patio.name}`}
                      key={`${match.patio.id}-${match.item.name}`}
                      style={s.patioRow}
                      onLayout={index < SHEET_MEDIUM_ROWS ? (event) => {
                        const height = Math.max(60, Math.ceil(event.nativeEvent.layout.height));
                        setSheetRowHeights((current) => current[index] === height ? current : current.map((value, row) => row === index ? height : value));
                      } : undefined}
                      onPress={() => {
                        Keyboard.dismiss();
                        void recordRecentPatio(match.patio, 'searched').catch(() => {});
                        router.push(`/patio/${match.patio.id}`);
                      }}
                      onPressIn={() => {
                        // El toque resalta el pin; desplazar la lista no
                        // debe cambiar la posición ni los resultados del mapa.
                        if (match.patio.latitude <= 0) return;
                        setPressedPinId(match.patio.id);
                      }}
                      onPressOut={() => setPressedPinId((id) => (id === match.patio.id ? null : id))}
                      activeOpacity={0.76}>
                      <View style={s.resultIcon}>
                        <PatioIdentityIcon patio={match.patio} />
                      </View>
                      <View style={s.patioInfo}>
                        <PatioCardInfo patio={match.patio} distanceLabel={distance} />
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
                const distance = distanceLabelForPatio(patio);
                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={patioCardAccessibilityLabel(patio, { distanceLabel: distance })}
                    key={patio.id}
                    style={s.patioRow}
                    onPress={() => router.push(`/patio/${patio.id}`)}
                    activeOpacity={0.76}>
                    <View style={s.resultIcon}>
                      <PatioIdentityIcon patio={patio} />
                    </View>
                    <View style={s.patioInfo}>
                      <PatioCardInfo patio={patio} distanceLabel={distance} />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
          </View>
        </Animated.View>
        </Animated.View>
      )}
      {initialLoading && (
        <View style={s.loadingOverlay}>
          <FoodieLoading />
        </View>
      )}
      {showNavigation && <BottomTabBar variant="foodie" />}
    </View>
  );
}
