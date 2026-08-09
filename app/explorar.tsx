import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { FOODIE_INITIAL_REGION, useFoodieExploreController } from '@/lib/controllers/useFoodieExploreController';
import { noWidow } from '@/lib/typography';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';
import { createCollection, getCollections, type PatioCollection } from '@/lib/collections';
import { estaAbiertoAhora } from '@/lib/horario';
import type { Patio } from '@/lib/patios';

const OPEN_GREEN = '#1F9D55';
const WHEEL_ROW_HEIGHT = 34;
const WHEEL_VISIBLE_ROWS = 1;
const WHEEL_HEIGHT = WHEEL_ROW_HEIGHT * WHEEL_VISIBLE_ROWS;
const WHEEL_PADDING = WHEEL_ROW_HEIGHT * Math.floor(WHEEL_VISIBLE_ROWS / 2);
const WHEEL_SENSITIVITY = 2;
const PILL_GAP = 7;
const PILL_DRAG_SENSITIVITY = 0.62;
const PILL_SLOTS_KEY = 'patio:map-filter-order-v2';
const MAX_PILL_SLOTS = 10;

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
    grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)', marginTop: 10, marginBottom: 8 },
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
    listHeader: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listTitle: { fontSize: 12, fontWeight: '900', color: t.text },
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
    patioContextText: { fontSize: 10.5, fontWeight: '600', color: t.textSecondary },
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
    mapFiltersRow: { height: 44, justifyContent: 'center' },
    mapFiltersScroll: { flex: 1 },
    mapFiltersContent: { gap: PILL_GAP, paddingLeft: 16, paddingRight: 84 },
    mapFilterHitArea: { minHeight: 44, justifyContent: 'center' },
    editablePillWrap: { position: 'relative' },
    mapFilter: { height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    mapFilterText: { fontSize: 12.5, fontWeight: '600' },
    removePillButton: { position: 'absolute', right: -7, top: -4, width: 24, height: 24, zIndex: 4, alignItems: 'center', justifyContent: 'center' },
    addPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderStyle: 'dashed' },
    listasDock: { position: 'absolute', right: 0, top: 0, zIndex: 5, width: 60, height: 44, paddingRight: 16, alignItems: 'flex-end', justifyContent: 'center', backgroundColor: 'transparent' },
    doneDock: { width: 74 },
    listasTrigger: { width: 34, paddingHorizontal: 0, alignItems: 'center' },
    doneTrigger: { minWidth: 58, paddingHorizontal: 12, alignItems: 'center' },
    doneText: { fontSize: 12.5, fontWeight: '700' },
    listasBar: { position: 'absolute', top: 5, height: WHEEL_HEIGHT, borderRadius: 17, overflow: 'hidden', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: btnShadowOpacity + 0.04, shadowRadius: 22, elevation: 4 },
    listasBarFromLists: { left: 16, right: 84 },
    listasBarFromCategories: { left: 96, right: 16 },
    wheelRow: { height: WHEEL_ROW_HEIGHT, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 16 },
    wheelText: { fontSize: 15, fontWeight: '600', color: t.text },
    editPillPanel: { position: 'absolute', left: 16, right: 16, top: 48, maxHeight: 320, borderRadius: 18, overflow: 'hidden', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: btnShadowOpacity + 0.04, shadowRadius: 22, elevation: 4 },
    editPillHeader: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    editPillHeaderText: { fontSize: 14, fontWeight: '700', color: t.text },
    editPillOption: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
    editPillOptionDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    editPillOptionText: { flex: 1, fontSize: 14.5, fontWeight: '500', color: t.text },
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

type WheelItem = { key: string; label: string };

type PillSlot = { key: string; label: string };
const BUILTIN_PILL_OPTIONS: PillSlot[] = [{ key: 'today', label: 'Menú hoy' }, { key: 'open', label: 'Abiertos' }];

function defaultPillSlots(collections: PatioCollection[]): PillSlot[] {
  return [
    ...BUILTIN_PILL_OPTIONS,
    ...collections.map((collection) => ({ key: `collection:${collection.id}`, label: collection.title })),
  ].slice(0, MAX_PILL_SLOTS);
}

function EditablePill({
  slot, active, editing, order, widths, scrollX, scrollViewportWidth, s, theme, onPress, onLongPress, onRemove, onReorder,
}: {
  slot: PillSlot;
  active: boolean;
  editing: boolean;
  order: string[];
  widths: { current: Record<string, number> };
  scrollX: Animated.Value;
  scrollViewportWidth: number;
  s: ReturnType<typeof makeStyles>;
  theme: Theme;
  onPress: () => void;
  onLongPress: () => void;
  onRemove: () => void;
  onReorder: (nextOrder: string[]) => void;
}) {
  const translateX = useRef(new Animated.Value(0)).current;
  const jiggle = useRef(new Animated.Value(0)).current;
  const [layout, setLayout] = useState({ x: 0, width: 0 });
  const editingRef = useRef(editing);
  const onReorderRef = useRef(onReorder);
  const startXRef = useRef(0);
  const orderRef = useRef(order);
  editingRef.current = editing;
  onReorderRef.current = onReorder;
  orderRef.current = order;

  useEffect(() => {
    if (!editing) {
      jiggle.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(jiggle, { toValue: 1, duration: 110, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: -1, duration: 220, useNativeDriver: true }),
        Animated.timing(jiggle, { toValue: 0, duration: 110, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [editing, jiggle]);

  const xFor = (ord: string[], key: string) => {
    let x = 0;
    for (const k of ord) {
      if (k === key) return x;
      x += (widths.current[k] ?? 60) + PILL_GAP;
    }
    return x;
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gesture) => editingRef.current && Math.abs(gesture.dx) > 4 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
      onPanResponderTerminationRequest: () => !editingRef.current,
      onPanResponderGrant: () => {
        startXRef.current = xFor(orderRef.current, slot.key);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_event, gesture) => {
        // En edición prima el control fino: el dedo recorre más distancia que
        // la pill para evitar atravesar varias posiciones con un gesto corto.
        const liveX = startXRef.current + gesture.dx * PILL_DRAG_SENSITIVITY;
        const myWidth = widths.current[slot.key] ?? 60;
        const liveCenter = liveX + myWidth / 2;
        const ord = orderRef.current;
        const idx = ord.indexOf(slot.key);
        if (idx > 0) {
          const leftKey = ord[idx - 1];
          const leftX = xFor(ord, leftKey);
          const leftCenter = leftX + (widths.current[leftKey] ?? 60) / 2;
          if (liveCenter < leftCenter) {
            const next = [...ord];
            [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
            Haptics.selectionAsync();
            onReorderRef.current(next);
          }
        } else if (idx < ord.length - 1) {
          const rightKey = ord[idx + 1];
          const rightX = xFor(ord, rightKey);
          const rightCenter = rightX + (widths.current[rightKey] ?? 60) / 2;
          if (liveCenter > rightCenter) {
            const next = [...ord];
            [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
            Haptics.selectionAsync();
            onReorderRef.current(next);
          }
        }
        translateX.setValue(liveX - xFor(orderRef.current, slot.key));
      },
      onPanResponderRelease: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true, stiffness: 320, damping: 26 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const rotate = jiggle.interpolate({ inputRange: [-1, 1], outputRange: ['-1.2deg', '1.2deg'] });
  const centerX = layout.x + layout.width / 2;
  const rightEdgeOpacity = scrollViewportWidth > 0 && layout.width > 0
    ? scrollX.interpolate({
        inputRange: [centerX - scrollViewportWidth - 4, centerX - scrollViewportWidth + 30],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      })
    : 1;

  return (
    <Animated.View
      {...pan.panHandlers}
      onLayout={(event) => {
        const { x, width } = event.nativeEvent.layout;
        widths.current[slot.key] = width;
        setLayout((current) => current.x === x && current.width === width ? current : { x, width });
      }}
      style={[s.mapFilterHitArea, s.editablePillWrap, { opacity: rightEdgeOpacity, transform: [{ translateX }, { rotate: editing ? rotate : '0deg' }], zIndex: editing ? 2 : 0 }]}>
      <TouchableOpacity
        onPress={() => { if (!editing) onPress(); }}
        onLongPress={onLongPress}
        delayLongPress={420}
        hitSlop={{ top: 5, bottom: 5 }}
        style={[s.mapFilter, { backgroundColor: active ? theme.text : theme.glass, borderColor: active ? theme.text : theme.border }]}>
        {!active && <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />}
        <Text style={[s.mapFilterText, { color: active ? theme.bg : theme.text }]}>{slot.label}</Text>
      </TouchableOpacity>
      {editing && (
        <TouchableOpacity
          accessibilityLabel={`Quitar ${slot.label} de accesos directos`}
          accessibilityRole="button"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          onPress={onRemove}
          style={s.removePillButton}>
          <Ionicons name="remove-circle" size={20} color={theme.text} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
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
    allPatios,
    clearSavedMapFilter,
    closeSheet,
    closeSearch,
    distanceLabelForPatio,
    handleQueryChange,
    idleMode,
    initialLoading,
    isFiltering,
    matchingPatioIds,
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
  const [mapFilter, setMapFilter] = useState('all');
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [pillSlots, setPillSlots] = useState<PillSlot[]>([]);
  const [editingPills, setEditingPills] = useState(false);
  const [showAddPillPanel, setShowAddPillPanel] = useState(false);
  const pillWidths = useRef<Record<string, number>>({});
  const pillScrollX = useRef(new Animated.Value(0)).current;
  const [pillScrollViewportWidth, setPillScrollViewportWidth] = useState(0);
  const pillSlotsLoaded = useRef(false);
  useEffect(() => {
    getCollections().then(async (items) => {
      if (__DEV__ && items.length === 0) {
        const seedNames = ['Antojos', 'Postres', 'Fin de semana', 'Cerca del trabajo', 'Para llevar', 'Comida corrida', 'Con la familia', 'Vegetarianos', 'Desayunos', 'Para cuando llueve', 'Rápido y rico', 'Picositos', 'Con terraza', 'Baratos', 'Clásicos de la colonia'];
        for (const name of seedNames) await createCollection(name);
        items = await getCollections();
      }
      setCollections(items);
      setCollectionsLoaded(true);
    }).catch(() => { setCollectionsLoaded(true); });
  }, []);
  useEffect(() => {
    if (!collectionsLoaded) return;
    AsyncStorage.getItem(PILL_SLOTS_KEY).then((raw) => {
      pillSlotsLoaded.current = true;
      if (!raw) {
        setPillSlots(defaultPillSlots(collections));
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed.length <= MAX_PILL_SLOTS && parsed.every((item) => item && typeof item.key === 'string' && typeof item.label === 'string')) {
          const available = new Map(defaultPillSlots(collections).map((item) => [item.key, item]));
          const restored = parsed.filter((item) => item.key === 'today' || item.key === 'open' || collections.some((collection) => `collection:${collection.id}` === item.key));
          const used = new Set(restored.map((item) => item.key));
          const expanded = [...restored, ...Array.from(available.values()).filter((item) => !used.has(item.key))].slice(0, MAX_PILL_SLOTS);
          setPillSlots(expanded);
        } else {
          setPillSlots(defaultPillSlots(collections));
        }
      } catch { setPillSlots(defaultPillSlots(collections)); }
    }).catch(() => { pillSlotsLoaded.current = true; });
  }, [collections, collectionsLoaded]);
  useEffect(() => {
    if (!pillSlotsLoaded.current) return;
    AsyncStorage.setItem(PILL_SLOTS_KEY, JSON.stringify(pillSlots)).catch(() => {});
  }, [pillSlots]);
  const availablePillOptions = (): PillSlot[] => {
    const usedKeys = new Set(pillSlots.map((slot) => slot.key));
    return [...BUILTIN_PILL_OPTIONS, ...collections.map((collection) => ({ key: `collection:${collection.id}`, label: collection.title }))]
      .filter((option) => !usedKeys.has(option.key));
  };
  const listasItems: WheelItem[] = useMemo(() =>
    collections.map((collection) => ({ key: `collection:${collection.id}`, label: collection.title })),
  [collections]);
  const categoryItems: WheelItem[] = useMemo(() => [
    { key: 'all', label: 'Todos' },
    ...[...new Set(allPatios.map((patio) => patio.category))]
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((category) => ({ key: category, label: category })),
  ], [allPatios]);
  const listasItemsRef = useRef(listasItems);
  const categoryItemsRef = useRef(categoryItems);
  listasItemsRef.current = listasItems;
  categoryItemsRef.current = categoryItems;
  const [wheelMode, setWheelMode] = useState<'lists' | 'categories'>('lists');
  const activeWheelItems = wheelMode === 'categories' ? categoryItems : listasItems;
  const wheelItemsRef = useRef(activeWheelItems);
  wheelItemsRef.current = activeWheelItems;
  const mapFilterRef = useRef(mapFilter);
  mapFilterRef.current = mapFilter;
  const [wheelOpen, setWheelOpen] = useState(false);
  const wheelOpenAnim = useRef(new Animated.Value(0)).current;
  const wheelOffset = useRef(new Animated.Value(0)).current;
  const wheelOpenedRef = useRef(false);
  const wheelOpenTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wheelOriginIndex = useRef(0);
  const wheelLastIndex = useRef(0);
  useEffect(() => {
    Animated.timing(wheelOpenAnim, { toValue: wheelOpen ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [wheelOpen, wheelOpenAnim]);
  const clearWheelTimer = () => {
    if (wheelOpenTimer.current) { clearTimeout(wheelOpenTimer.current); wheelOpenTimer.current = null; }
  };
  const beginWheelOpen = (mode: 'lists' | 'categories') => {
    const items = mode === 'categories' ? categoryItemsRef.current : listasItemsRef.current;
    if (!items.length) return;
    setWheelMode(mode);
    wheelItemsRef.current = items;
    const currentKey = mode === 'lists'
      ? (mapFilterRef.current.startsWith('collection:') ? mapFilterRef.current : 'all')
      : (items.some((item) => item.key === mapFilterRef.current) ? mapFilterRef.current : 'all');
    const idx = Math.max(0, items.findIndex((item) => item.key === currentKey));
    wheelOriginIndex.current = idx;
    wheelLastIndex.current = idx;
    wheelOffset.setValue(idx * WHEEL_ROW_HEIGHT);
    wheelOpenedRef.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWheelOpen(true);
  };
  const applyWheelIndex = (index: number) => {
    const count = wheelItemsRef.current.length;
    if (!count) return;
    // Rueda circular: nunca hay tope, dar la vuelta permite alcanzar
    // cualquier lista sin agotar el recorrido físico del dedo en pantalla.
    const wrapped = ((index % count) + count) % count;
    if (wrapped === wheelLastIndex.current) return;
    wheelLastIndex.current = wrapped;
    Haptics.selectionAsync();
    // No se aplica el filtro en cada tick: re-renderiza el mapa completo y
    // trababa la app al deslizar rápido por muchas listas. Se aplica una
    // sola vez al soltar (ver onPanResponderRelease/Terminate).
  };
  const commitWheelSelection = () => {
    const item = wheelItemsRef.current[wheelLastIndex.current];
    if (item) setMapFilter(item.key);
  };
  const listasPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        wheelOpenedRef.current = false;
        clearWheelTimer();
        wheelOpenTimer.current = setTimeout(() => beginWheelOpen('lists'), 320);
      },
      onPanResponderMove: (_event, gesture) => {
        if (!wheelOpenedRef.current) {
          if (Math.abs(gesture.dy) > 8 || Math.abs(gesture.dx) > 8) clearWheelTimer();
          return;
        }
        // + (no -): el botón vive pegado arriba de la pantalla, así que hay
        // mucho más recorrido de dedo hacia abajo que hacia arriba.
        const y = wheelOriginIndex.current * WHEEL_ROW_HEIGHT + gesture.dy * WHEEL_SENSITIVITY;
        wheelOffset.setValue(y);
        applyWheelIndex(Math.round(y / WHEEL_ROW_HEIGHT));
      },
      onPanResponderRelease: () => {
        clearWheelTimer();
        if (wheelOpenedRef.current) {
          wheelOpenedRef.current = false;
          commitWheelSelection();
          setWheelOpen(false);
        }
      },
      onPanResponderTerminate: () => {
        clearWheelTimer();
        if (wheelOpenedRef.current) {
          wheelOpenedRef.current = false;
          commitWheelSelection();
          setWheelOpen(false);
        }
      },
    })
  ).current;
  const categoriesPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        wheelOpenedRef.current = false;
        clearWheelTimer();
        wheelOpenTimer.current = setTimeout(() => beginWheelOpen('categories'), 320);
      },
      onPanResponderMove: (_event, gesture) => {
        if (!wheelOpenedRef.current) {
          if (Math.abs(gesture.dy) > 8 || Math.abs(gesture.dx) > 8) clearWheelTimer();
          return;
        }
        const y = wheelOriginIndex.current * WHEEL_ROW_HEIGHT + gesture.dy * WHEEL_SENSITIVITY;
        wheelOffset.setValue(y);
        applyWheelIndex(Math.round(y / WHEEL_ROW_HEIGHT));
      },
      onPanResponderRelease: () => {
        clearWheelTimer();
        if (wheelOpenedRef.current) {
          wheelOpenedRef.current = false;
          commitWheelSelection();
          setWheelOpen(false);
        } else {
          setMapFilter('all');
        }
      },
      onPanResponderTerminate: () => {
        clearWheelTimer();
        if (wheelOpenedRef.current) {
          wheelOpenedRef.current = false;
          commitWheelSelection();
          setWheelOpen(false);
        }
      },
    })
  ).current;
  useEffect(() => {
    if (params.collection) setMapFilter(`collection:${params.collection}`);
    else if (params.saved === '1') setMapFilter('saved');
  }, [params.collection, params.saved]);
  const filteredPins = useMemo(() => visiblePatios.filter((patio) => {
    if (mapFilter === 'all') return true;
    if (mapFilter === 'saved') return savedIds.includes(patio.id);
    if (mapFilter === 'today') return patio.menu.some((section) => section.items.length > 0);
    if (mapFilter === 'open') return patio.weeklyHours ? estaAbiertoAhora(patio.weeklyHours) : false;
    if (mapFilter.startsWith('collection:')) {
      const collection = collections.find((item) => item.id === mapFilter.slice('collection:'.length));
      return !!collection?.patioIds.includes(patio.id);
    }
    return patio.category === mapFilter;
  }), [collections, mapFilter, savedIds, visiblePatios]);
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
      const categoryCounts = new Map<string, number>();
      cell.patios.forEach((patio) => categoryCounts.set(patio.category, (categoryCounts.get(patio.category) ?? 0) + 1));
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
    Animated.timing(sheetTranslateY, {
      toValue: 420,
      duration: 190,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) closeSheet();
      sheetTranslateY.setValue(0);
    });
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
              <Ionicons name={categoryIcon(patio.category)} size={13} color={selected ? '#FFFFFF' : theme.text} />
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
            setEditingPills(false);
            setShowAddPillPanel(false);
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
        <View style={[s.mapFilters, { top: insets.top + 72 }]}>
          <View style={s.mapFiltersRow}>
            <Animated.ScrollView
              horizontal
              bounces
              pointerEvents={wheelOpen && wheelMode === 'lists' ? 'none' : 'auto'}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.mapFiltersContent}
              onLayout={(event) => setPillScrollViewportWidth(event.nativeEvent.layout.width)}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: pillScrollX } } }], { useNativeDriver: true })}
              scrollEventThrottle={16}
              style={[s.mapFiltersScroll, wheelOpen && wheelMode === 'lists' && { opacity: 0 }]}>
              <View
                {...categoriesPan.panHandlers}
                accessibilityLabel="Categorías de lugares"
                accessibilityRole="button"
                accessibilityHint="Toca para ver todos; mantén presionado y desliza para elegir una categoría"
                style={s.mapFilterHitArea}>
                <View style={[s.mapFilter, { backgroundColor: (wheelOpen && wheelMode === 'categories') || mapFilter === 'all' ? theme.text : theme.glass, borderColor: (wheelOpen && wheelMode === 'categories') || mapFilter === 'all' ? theme.text : theme.border }]}>
                  {mapFilter !== 'all' && !(wheelOpen && wheelMode === 'categories') && <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />}
                  <Text style={[s.mapFilterText, { color: (wheelOpen && wheelMode === 'categories') || mapFilter === 'all' ? theme.bg : theme.text }]}>Todos</Text>
                </View>
              </View>
              {pillSlots.map((slot) => (
                <EditablePill
                  key={slot.key}
                  slot={slot}
                  active={mapFilter === slot.key}
                  editing={editingPills}
                  order={pillSlots.map((item) => item.key)}
                  widths={pillWidths}
                  scrollX={pillScrollX}
                  scrollViewportWidth={Math.max(0, pillScrollViewportWidth - 60)}
                  s={s}
                  theme={theme}
                  onPress={() => setMapFilter(slot.key)}
                  onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEditingPills(true); setShowAddPillPanel(false); }}
                  onRemove={() => {
                    Haptics.selectionAsync();
                    setPillSlots((prev) => prev.filter((item) => item.key !== slot.key));
                    if (mapFilter === slot.key) setMapFilter('all');
                  }}
                  onReorder={(nextKeys) => setPillSlots((prev) => nextKeys.map((key) => prev.find((item) => item.key === key)!))}
                />
              ))}
              {editingPills && pillSlots.length < MAX_PILL_SLOTS && (
                <View style={s.mapFilterHitArea}>
                  <TouchableOpacity
                    accessibilityLabel="Añadir acceso directo"
                    accessibilityRole="button"
                    onPress={() => { Haptics.selectionAsync(); setShowAddPillPanel(true); }}
                    style={[s.mapFilter, s.addPill, { backgroundColor: theme.glass, borderColor: theme.border }]}>
                    <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
                    <Ionicons name="add" size={15} color={theme.text} />
                    <Text style={[s.mapFilterText, { color: theme.text }]}>Añadir</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.ScrollView>
            {editingPills ? (
              <TouchableOpacity
                accessibilityLabel="Terminar de editar accesos directos"
                accessibilityRole="button"
                onPress={() => { Haptics.selectionAsync(); setEditingPills(false); setShowAddPillPanel(false); }}
                style={[s.listasDock, s.doneDock]}>
                <View style={[s.mapFilter, s.doneTrigger, { backgroundColor: theme.text, borderColor: theme.text }]}>
                  <Text style={[s.doneText, { color: theme.bg }]}>Listo</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View
                {...listasPan.panHandlers}
                accessibilityLabel="Listas guardadas"
                accessibilityRole="button"
                accessibilityHint="Mantén presionado y desliza para elegir una lista"
                style={[s.listasDock, wheelOpen && wheelMode === 'categories' && { opacity: 0 }]}>
                <View style={[s.mapFilter, s.listasTrigger, { backgroundColor: (wheelOpen && wheelMode === 'lists') || mapFilter.startsWith('collection:') ? theme.text : theme.glass, borderColor: (wheelOpen && wheelMode === 'lists') || mapFilter.startsWith('collection:') ? theme.text : theme.border }]}>
                  {!(wheelOpen && wheelMode === 'lists') && !mapFilter.startsWith('collection:') && <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />}
                  <Ionicons name="list-outline" size={16} color={(wheelOpen && wheelMode === 'lists') || mapFilter.startsWith('collection:') ? theme.bg : theme.text} />
                </View>
              </View>
            )}
          </View>
          {wheelOpen && (
            <Animated.View
              pointerEvents="none"
              style={[
                s.listasBar,
                wheelMode === 'lists' ? s.listasBarFromLists : s.listasBarFromCategories,
                {
                  opacity: wheelOpenAnim,
                  transform: [{ translateY: wheelOpenAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
                },
              ]}>
              {/* Rueda circular: cada ítem se dibuja en 3 copias (ciclo anterior,
                  actual, siguiente) para que al dar la vuelta el reemplazo se
                  vea continuo — nunca hay un tope donde el dedo se quede sin
                  pantalla para alcanzar el resto de las listas. */}
              {activeWheelItems.flatMap((item, index) => [-1, 0, 1].map((cycle) => {
                const virtualIndex = index + cycle * activeWheelItems.length;
                const inputRange = [(virtualIndex - 2) * WHEEL_ROW_HEIGHT, (virtualIndex - 1) * WHEEL_ROW_HEIGHT, virtualIndex * WHEEL_ROW_HEIGHT, (virtualIndex + 1) * WHEEL_ROW_HEIGHT, (virtualIndex + 2) * WHEEL_ROW_HEIGHT];
                const opacity = wheelOffset.interpolate({ inputRange, outputRange: [0.25, 0.55, 1, 0.55, 0.25], extrapolate: 'clamp' });
                const scale = wheelOffset.interpolate({ inputRange, outputRange: [0.84, 0.92, 1, 0.92, 0.84], extrapolate: 'clamp' });
                const translateY = Animated.subtract(virtualIndex * WHEEL_ROW_HEIGHT + WHEEL_PADDING, wheelOffset);
                return (
                  <Animated.View key={`${item.key}-${cycle}`} style={[s.wheelRow, { position: 'absolute', left: 0, right: 0, transform: [{ translateY }] }]}>
                    <Animated.Text numberOfLines={1} style={[s.wheelText, { opacity, transform: [{ scale }] }]}>{item.label}</Animated.Text>
                  </Animated.View>
                );
              }))}
            </Animated.View>
          )}
          {showAddPillPanel && (
            <View style={s.editPillPanel}>
              <View style={s.editPillHeader}>
                <Text style={s.editPillHeaderText}>Añadir acceso</Text>
                <TouchableOpacity accessibilityLabel="Cerrar" hitSlop={8} onPress={() => setShowAddPillPanel(false)}>
                  <Ionicons name="close" size={20} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {availablePillOptions().map((option, index) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setPillSlots((prev) => [...prev, option].slice(0, MAX_PILL_SLOTS));
                      setShowAddPillPanel(false);
                    }}
                    style={[s.editPillOption, index > 0 && s.editPillOptionDivider]}>
                    <Ionicons name={option.key.startsWith('collection:') ? 'bookmark' : 'pricetag-outline'} size={16} color={theme.textSecondary} />
                    <Text style={s.editPillOptionText} numberOfLines={1}>{option.label}</Text>
                    <Ionicons name="add-circle-outline" size={19} color={theme.text} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      )}

      {!!activeSavedCategories.length && !searchActive && (
        <TouchableOpacity
          style={[s.listFilter, { position: 'absolute', top: insets.top + 12, alignSelf: 'center' }]}
          onPress={clearSavedMapFilter}
          activeOpacity={0.78}>
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
            <TouchableOpacity accessibilityLabel="Buscar comida o un lugar" activeOpacity={0.82} onPress={openSearch} style={[s.searchPill, { flex: 1 }]}>
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
              <TouchableOpacity onPress={closeSearch} activeOpacity={0.76} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
                <TouchableOpacity onPress={() => handleQueryChange('')} activeOpacity={0.76} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
                accessibilityRole="button"
                accessibilityLabel="Conocer búsqueda con inteligencia artificial de Patio Pro">
                <Ionicons name="sparkles" size={13} color={aiMode ? theme.bg : theme.accent} />
                <Text style={[s.aiProText, aiMode && { color: theme.bg }]}>IA</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {showSheet && (
        <Animated.View
          {...sheetPanResponder.panHandlers}
          style={[s.sheet, isFiltering ? {
            bottom: keyboardHeight > 0 ? keyboardHeight + 10 : insets.bottom + 78,
            maxHeight: '48%',
            paddingBottom: 4,
            transform: [{ translateY: sheetTranslateY }],
          } : {
            bottom: keyboardHeight > 0 ? keyboardHeight + 70 : insets.bottom + 82,
            paddingBottom: insets.bottom ? 4 : 8,
            transform: [{ translateY: sheetTranslateY }],
          }]}>
          <BlurView intensity={theme.isDark ? 16 : 22} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View style={s.grabber} />

          {/* List */}
          <View style={s.listHeader}>
            {isFiltering ? (
              <>
                <Text style={s.listTitle} allowFontScaling={true}>
                  {topMatchPerPatio.length > 0
                    ? `${topMatchPerPatio.length} RESULTADO${topMatchPerPatio.length !== 1 ? 'S' : ''}`
                    : 'SIN RESULTADOS'}
                </Text>
                <Text style={s.listMeta} allowFontScaling={true}>MEJORES COINCIDENCIAS</Text>
              </>
            ) : (
              <Text style={s.listTitle} allowFontScaling={true}>{sheetMode === 'saved' ? 'GUARDADOS' : 'CERCA DE TI'}</Text>
            )}
          </View>

          <ScrollView
            style={s.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            onScrollBeginDrag={Keyboard.dismiss}>
            {isFiltering ? (
              topMatchPerPatio.length === 0 ? (
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
                      <TouchableOpacity key={q} onPress={() => handleQueryChange(q)} activeOpacity={0.8} style={s.emptyPill}>
                        <Text style={s.emptyPillText} allowFontScaling={true}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                )
              ) : (
                topMatchPerPatio.map((match) => {
                  const state = openState(match.patio);
                  return (
                    <TouchableOpacity
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
                            {!!match.patio.rating && match.patio.rating !== 'Nuevo' && <Text style={s.patioContextText}>★ {match.patio.rating}{match.patio.ratingCount != null ? ` (${match.patio.ratingCount})` : ''}</Text>}
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
                          {!!patio.rating && patio.rating !== 'Nuevo' && <Text style={s.patioContextText}>★ {patio.rating}{patio.ratingCount != null ? ` (${patio.ratingCount})` : ''}</Text>}
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
      <BottomTabBar variant="foodie" />
    </View>
  );
}
