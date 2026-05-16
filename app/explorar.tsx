import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Keyboard, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { HintSheet } from '@/components/hint-sheet';
import { markHintSeen, shouldShowHint } from '@/lib/hints';
import { fetchPublicFonditas, MOCK_PATIOS, searchPatiosByDish, type Patio, type PatioDishMatch } from '@/lib/patios';
import { searchLiveMenus } from '@/lib/menu';
import { Fonts, useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  const btnBorder = t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  const btnShadowOpacity = t.isDark ? 0.20 : 0.06;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    map: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0' },
    mapView: { ...StyleSheet.absoluteFillObject },
    pinHitArea: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    pinMuted: { opacity: 0.18 },
    pin: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.isDark ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 7, elevation: 2 },
    pinCoreSelected: { width: 12, height: 12, borderRadius: 6, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' },
    pinDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: t.surface },
    pinSmallDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: t.accent, borderWidth: 2.5, borderColor: t.isDark ? 'rgba(25,26,27,0.70)' : 'rgba(255,255,255,0.85)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 3, elevation: 2 },
    topBar: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    topRight: { flexDirection: 'row', gap: 8 },
    closeButton: { width: 44, height: 44, borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: btnShadowOpacity, shadowRadius: 16, elevation: 2 },
    toolButton: { width: 44, height: 44, borderRadius: 16, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: btnShadowOpacity, shadowRadius: 16, elevation: 2 },
    searchRow: { flex: 1, height: 44, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: btnShadowOpacity, shadowRadius: 16, elevation: 2 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '300', color: t.text, height: 44, paddingVertical: 0 },
    sheet: { position: 'absolute', left: 14, right: 14, bottom: 14, maxHeight: '48%', borderRadius: 30, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: t.isDark ? 0.20 : 0.08, shadowRadius: 32, elevation: 8 },
    grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)', marginTop: 10, marginBottom: 8 },
    selectedPanel: { paddingHorizontal: 18, paddingBottom: 14 },
    selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
    selectedTitle: { flex: 1, fontSize: 22, lineHeight: 26, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    heartButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    selectedMeta: { fontSize: 13, lineHeight: 18, fontWeight: '300', color: t.textSecondary },
    selectedStats: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 },
    price: { fontSize: 24, lineHeight: 28, fontWeight: '300', color: t.text },
    dishName: { fontSize: 19, lineHeight: 24, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    priceCaption: { marginTop: 1, fontSize: 12, fontWeight: '300', color: t.textSecondary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    ratingText: { fontSize: 13, fontWeight: '900', color: t.text },
    cta: { minHeight: 44, paddingHorizontal: 18, borderRadius: 22, backgroundColor: t.text, flexDirection: 'row', alignItems: 'center', gap: 6 },
    ctaText: { fontSize: 13, fontWeight: '900', color: t.surface },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    listHeader: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listTitle: { fontSize: 12, fontWeight: '900', color: t.text },
    listMeta: { fontSize: 12, fontWeight: '300', color: t.textSecondary },
    listFilter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 30, borderRadius: 15, backgroundColor: t.accentLight },
    listFilterText: { fontSize: 12, fontWeight: '900', color: t.accent },
    list: { paddingBottom: 12 },
    patioRow: { minHeight: 66, marginHorizontal: 8, marginBottom: 7, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.56)' },
    patioRowActive: { backgroundColor: t.isDark ? 'rgba(255,106,61,0.14)' : 'rgba(242,97,47,0.10)' },
    addBox: { width: 32, height: 32, borderRadius: 9, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    addBoxMuted: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    patioInfo: { flex: 1, paddingRight: 10 },
    patioName: { fontSize: 15, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    patioMeta: { marginTop: 4, fontSize: 12, lineHeight: 16, fontWeight: '300', color: t.textSecondary },
    patioRight: { alignItems: 'flex-end', gap: 3 },
    patioPrice: { fontSize: 15, fontWeight: '900', color: t.text },
    patioOpen: { fontSize: 12, fontWeight: '300', color: t.textSecondary },
    patioRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    patioRatingText: { fontSize: 12, fontWeight: '900', color: t.text },
    indexNum: { fontSize: 13, fontWeight: '900' },
    emptyResults: { paddingHorizontal: 18, paddingVertical: 20, alignItems: 'center' },
    pillsRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 10 },
    pill: { overflow: 'hidden', borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)' },
    pillText: { paddingHorizontal: 14, paddingVertical: 7, fontSize: 13, fontWeight: '300', color: t.text },
  });
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Genera puntos en anillos concéntricos centrados en pantalla
const RINGS = [
  { r: 28,  n: 6,  size: 5,   baseOpacity: 0.55 },
  { r: 58,  n: 10, size: 4,   baseOpacity: 0.38 },
  { r: 90,  n: 14, size: 3.5, baseOpacity: 0.26 },
  { r: 124, n: 18, size: 3,   baseOpacity: 0.18 },
  { r: 158, n: 22, size: 2.5, baseOpacity: 0.12 },
];

type RingDot = { x: number; y: number; size: number; baseOpacity: number; delay: number };

const RADAR_DOTS: RingDot[] = RINGS.flatMap(({ r, n, size, baseOpacity }, ri) =>
  Array.from({ length: n }, (_, i) => {
    const angle = (2 * Math.PI * i) / n;
    return { x: r * Math.cos(angle), y: r * Math.sin(angle), size, baseOpacity, delay: ri * 180 + i * 30 };
  })
);

function RadarDot({ x, y, size, baseOpacity, delay, color }: RingDot & { color: string }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 1100, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1100, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, [anim, delay]);
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [baseOpacity * 0.4, baseOpacity] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.2] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateX: x - size / 2 }, { translateY: y - size / 2 }, { scale }],
      }}
    />
  );
}

function PulsingDot({ style, delay = 0 }: { style: object; delay?: number }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const t = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.28, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      ).start();
    }, delay);
    return () => clearTimeout(t);
  }, [scale, delay]);
  return <Animated.View style={[style, { transform: [{ scale }] }]} />;
}

const INITIAL_REGION: Region = {
  latitude: 19.4429,
  longitude: -99.2044,
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

export default function ExplorarScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();

  // selectedId: which pin is highlighted. showHeader: user explicitly tapped a pin/row.
  // These two are always moved together via selectPatio/deselect — never set independently.
  const [allPatios, setAllPatios] = useState<Patio[]>(MOCK_PATIOS);
  const [showWelcomeHint, setShowWelcomeHint] = useState(false);
  const [showExplorarHint, setShowExplorarHint] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(false);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [searchActive, setSearchActive] = useState(false);
  const [query, setQuery] = useState('');
  const [visibleRegion, setVisibleRegion] = useState<Region>(INITIAL_REGION);
  const searchInputRef = useRef<TextInput>(null);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const idleOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!query.trim()) { setLiveResults([]); return; }
    let cancelled = false;
    searchLiveMenus(query, allPatios).then((r) => { if (!cancelled) setLiveResults(r); });
    return () => { cancelled = true; };
  }, [query, allPatios]);


  // Shimmer sobre mapa
  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 3200, useNativeDriver: true })
    ).start();
    return () => shimmerAnim.stopAnimation();
  }, [shimmerAnim]);

  useEffect(() => {
    fetchPublicFonditas().then((db) => {
      const existingIds = new Set(MOCK_PATIOS.map((p) => p.id));
      const newOnes = db.filter((p) => !existingIds.has(p.id));
      if (newOnes.length > 0) setAllPatios([...MOCK_PATIOS, ...newOnes]);
    });
  }, []);

  const visiblePatios = useMemo(() => {
    const { latitude, longitude, latitudeDelta, longitudeDelta } = visibleRegion;
    const minLat = latitude - latitudeDelta / 2;
    const maxLat = latitude + latitudeDelta / 2;
    const minLng = longitude - longitudeDelta / 2;
    const maxLng = longitude + longitudeDelta / 2;
    return allPatios.filter(
      (p) => p.latitude > 0 && p.latitude >= minLat && p.latitude <= maxLat && p.longitude >= minLng && p.longitude <= maxLng
    );
  }, [visibleRegion, allPatios]);

  const [liveResults, setLiveResults] = useState<PatioDishMatch[]>([]);
  const mockResults = useMemo(() => searchPatiosByDish(query), [query]);
  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const seen = new Set(mockResults.map((r) => `${r.patio.id}-${r.item.name}`));
    const fresh = liveResults.filter((r) => !seen.has(`${r.patio.id}-${r.item.name}`));
    return [...mockResults, ...fresh].sort((a, b) => b.score - a.score);
  }, [mockResults, liveResults, query]);
  const matchingPatioIds = useMemo(() => new Set(searchResults.map((r) => r.patio.id)), [searchResults]);
  const isFiltering = query.trim().length > 0;
  const idleMode = !searchActive && !showHeader && !isFiltering;

  useEffect(() => {
    Animated.timing(idleOpacity, { toValue: idleMode ? 1 : 0, duration: 320, useNativeDriver: true }).start();
  }, [idleMode, idleOpacity]);

  const topMatchPerPatio = useMemo(() => {
    const seen = new Set<string>();
    return searchResults.filter((r) => {
      if (seen.has(r.patio.id)) return false;
      seen.add(r.patio.id);
      return true;
    });
  }, [searchResults]);

  const selectedPatio = selectedId ? (allPatios.find((p) => p.id === selectedId) ?? null) : null;
  const featuredMatch = showHeader && isFiltering && selectedId
    ? (searchResults.find((r) => r.patio.id === selectedId) ?? null)
    : null;
  const selectedSaved = selectedId ? savedIds.includes(selectedId) : false;

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getFavoritePatioIds().then((ids) => { if (mounted) setSavedIds(ids); });
      shouldShowHint('foodie_welcome').then((show) => {
        if (!mounted) return;
        if (show) { setShowWelcomeHint(true); return; }
        shouldShowHint('foodie_explorar').then((s) => { if (mounted && s) setShowExplorarHint(true); });
      });
      return () => { mounted = false; };
    }, [])
  );

  // Explicit user selection — shows the header panel
  const selectPatio = useCallback((id: string) => {
    setSelectedId(id);
    setShowHeader(true);
  }, []);

  // Explicit deselect — hides the header panel
  const deselect = useCallback(() => {
    setSelectedId(null);
    setShowHeader(false);
  }, []);

  const toggleSaved = async () => {
    if (!selectedId) return;
    const next = await toggleFavoritePatio(selectedId);
    setSavedIds(next);
  };

  const handleShareSelected = () => {
    if (!selectedPatio) return;
    const mapsUrl = `https://maps.apple.com/?q=${selectedPatio.latitude},${selectedPatio.longitude}`;
    Share.share({
      message: `${selectedPatio.name}\n${selectedPatio.category} · ${selectedPatio.area}\n${selectedPatio.open}\n\n📍 ${selectedPatio.address}\n${mapsUrl}`,
    });
  };

  const openSearch = useCallback(() => {
    setSearchActive(true);
    setTimeout(() => searchInputRef.current?.focus(), 80);
  }, []);

  const closeSearch = useCallback(() => {
    Keyboard.dismiss();
    setSearchActive(false);
    setQuery('');
    deselect();
  }, [deselect]);

  const handleQueryChange = useCallback((text: string) => {
    setQuery(text);
    // Clearing the query returns to neutral — no selection
    if (!text.trim()) deselect();
  }, [deselect]);

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={s.map}>
        <MapView
          initialRegion={INITIAL_REGION}
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
          onPress={deselect}
          onRegionChangeComplete={setVisibleRegion}>
          {visiblePatios.map((patio, idx) => {
            const isSelected = patio.id === selectedId && showHeader;
            const isMuted = isFiltering && !matchingPatioIds.has(patio.id);
            return (
              <Marker
                key={patio.id}
                coordinate={{ latitude: patio.latitude, longitude: patio.longitude }}
                onPress={() => selectPatio(patio.id)}
                tracksViewChanges={false}>
                <View style={[s.pinHitArea, isMuted && s.pinMuted]}>
                  {isSelected ? (
                    <View style={s.pin}>
                      <View style={s.pinCoreSelected}>
                        <View style={s.pinDot} />
                      </View>
                    </View>
                  ) : (
                    <PulsingDot style={s.pinSmallDot} delay={(idx % 6) * 280} />
                  )}
                </View>
              </Marker>
            );
          })}
        </MapView>
        <LinearGradient
          colors={theme.isDark ? ['rgba(0,0,0,0)', 'rgba(0,0,0,0.22)'] : ['rgba(239,239,239,0)', 'rgba(239,239,239,0.30)']}
          locations={[0.45, 1]}
          pointerEvents="none"
          style={StyleSheet.absoluteFillObject}
        />
        {/* Blur suave en idle ~32% */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: idleOpacity }]}>
          <BlurView intensity={theme.isDark ? 38 : 40} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </View>

      {/* IDLE LAYER: radar dots + buscador centrado */}
      <Animated.View
        pointerEvents={idleMode ? 'box-none' : 'none'}
        style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', opacity: idleOpacity }]}>
        {/* Radar dots */}
        <View style={{ width: 0, height: 0 }}>
          {RADAR_DOTS.map((dot, i) => (
            <RadarDot key={i} {...dot} color={theme.accent} />
          ))}
        </View>
        {/* Buscador exactamente al centro */}
        <TouchableOpacity
          activeOpacity={0.82}
          onPress={openSearch}
          style={{ position: 'absolute', left: 24, right: 24 }}>
          <BlurView
            intensity={theme.isDark ? 20 : 24}
            tint={theme.isDark ? 'dark' : 'light'}
            style={{
              borderRadius: 18,
              overflow: 'hidden',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingVertical: 14,
              gap: 10,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: theme.isDark ? 0.22 : 0.08,
              shadowRadius: 24,
            }}>
            <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
            <Text style={{ fontSize: 16, fontWeight: '300', color: theme.textSecondary }}>
              ¿Qué se te antoja?
            </Text>
          </BlurView>
        </TouchableOpacity>
      </Animated.View>

      {/* Top bar */}
      <View style={[s.topBar, { top: insets.top + 14 }]}>
        {searchActive ? (
          <View style={s.searchRow}>
            <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
            <TouchableOpacity onPress={closeSearch} activeOpacity={0.76} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="chevron-back" size={20} color={theme.text} />
            </TouchableOpacity>
            <TextInput
              ref={searchInputRef}
              style={s.searchInput}
              value={query}
              onChangeText={handleQueryChange}
              placeholder="mole, enchiladas, agua de jamaica…"
              placeholderTextColor={theme.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              selectionColor={theme.accent}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleQueryChange('')} activeOpacity={0.76} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        ) : !idleMode ? (
          <>
            <TouchableOpacity style={s.closeButton} onPress={() => router.push('/cuenta')} activeOpacity={0.76}>
              <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="person-circle-outline" size={22} color={theme.text} />
            </TouchableOpacity>
            <View style={s.topRight}>
              <TouchableOpacity style={s.toolButton} onPress={() => router.push('/favoritos')} activeOpacity={0.76}>
                <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="heart-outline" size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity style={s.toolButton} onPress={openSearch} activeOpacity={0.76}>
                <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
                <Ionicons name="search-outline" size={20} color={theme.text} />
              </TouchableOpacity>
              <TouchableOpacity style={s.toolButton} onPress={() => setMapExpanded((v) => !v)} activeOpacity={0.76}>
                <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
                <Ionicons name={mapExpanded ? 'list-outline' : 'expand-outline'} size={20} color={theme.text} />
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </View>

      {!mapExpanded && (showHeader || isFiltering) && (
        <View style={[s.sheet, { paddingBottom: insets.bottom ? 4 : 8 }]}>
          <BlurView intensity={theme.isDark ? 16 : 22} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View style={s.grabber} />

          {/* Header panel — only on explicit selection */}
          {showHeader && selectedPatio && (
            <>
              <View style={s.selectedPanel}>
                <View style={s.selectedHeader}>
                  <Text style={s.selectedTitle} allowFontScaling={true}>{selectedPatio.name}</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity style={s.heartButton} onPress={handleShareSelected} activeOpacity={0.76}>
                      <Ionicons name="share-outline" size={20} color={theme.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.heartButton} onPress={toggleSaved} activeOpacity={0.76}>
                      <Ionicons name={selectedSaved ? 'heart' : 'heart-outline'} size={22} color={selectedSaved ? theme.accent : theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={s.selectedMeta} allowFontScaling={true}>
                  {featuredMatch
                    ? `${featuredMatch.section} · ${selectedPatio.area} · ${selectedPatio.open}`
                    : `${selectedPatio.category} · ${selectedPatio.area} · ${selectedPatio.open}`}
                </Text>
                <View style={s.selectedStats}>
                  <View>
                    {featuredMatch ? (
                      <>
                        <Text style={s.dishName} allowFontScaling={true}>{featuredMatch.item.name}</Text>
                        <Text style={s.priceCaption} allowFontScaling={true}>
                          {featuredMatch.item.price ?? selectedPatio.price}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={s.price} allowFontScaling={true}>
                          {selectedPatio.price === '$' ? 'Precio pendiente' : selectedPatio.price}
                        </Text>
                        <Text style={s.priceCaption} allowFontScaling={true}>{selectedPatio.reason}</Text>
                      </>
                    )}
                    <View style={s.ratingRow}>
                      <Ionicons name="star" size={13} color={theme.accent} />
                      <Text style={s.ratingText} allowFontScaling={true}>{selectedPatio.rating}</Text>
                    </View>
                  </View>
                  {selectedPatio.latitude > 0 && (
                    <TouchableOpacity style={s.cta} onPress={() => router.push(`/patio/${selectedPatio.id}`)} activeOpacity={0.82}>
                      <Text style={s.ctaText} allowFontScaling={true}>Ver</Text>
                      <Ionicons name="chevron-forward" size={15} color={theme.surface} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={s.divider} />
            </>
          )}

          {/* List */}
          <View style={s.listHeader}>
            {isFiltering ? (
              <>
                <Text style={s.listTitle} allowFontScaling={true}>
                  {topMatchPerPatio.length > 0
                    ? `${topMatchPerPatio.length} RESULTADO${topMatchPerPatio.length !== 1 ? 'S' : ''}`
                    : 'SIN RESULTADOS'}
                </Text>
                <TouchableOpacity style={s.listFilter} onPress={closeSearch} activeOpacity={0.76}>
                  <Ionicons name="close" size={12} color={theme.accent} />
                  <Text style={s.listFilterText} allowFontScaling={true}>Limpiar</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={s.listTitle} allowFontScaling={true}>CERCA DE TI</Text>
                <View style={s.listFilter}>
                  <Ionicons name="star" size={12} color={theme.accent} />
                  <Text style={s.listFilterText} allowFontScaling={true}>5.0</Text>
                </View>
              </>
            )}
          </View>

          <ScrollView style={s.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {isFiltering ? (
              topMatchPerPatio.length === 0 ? (
                <View style={s.emptyResults}>
                  <Text style={{ fontSize: 17, fontWeight: '900', color: theme.text, marginBottom: 6 }} allowFontScaling={true}>Nadie tiene eso hoy</Text>
                  <Text style={{ fontSize: 13, fontWeight: '300', color: theme.textSecondary, marginBottom: 14 }} allowFontScaling={true}>Prueba con tacos, mole o agua de jamaica</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['tacos', 'mole', 'agua'].map((q) => (
                      <TouchableOpacity key={q} onPress={() => handleQueryChange(q)} activeOpacity={0.76}
                        style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }}>
                        <Text style={{ fontSize: 13, fontWeight: '300', color: theme.text }} allowFontScaling={true}>{q}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ) : (
                topMatchPerPatio.map((match) => {
                  const active = match.patio.id === selectedId && showHeader;
                  return (
                    <TouchableOpacity
                      key={`${match.patio.id}-${match.item.name}`}
                      style={[s.patioRow, active && s.patioRowActive]}
                      onPress={() => selectPatio(match.patio.id)}
                      activeOpacity={0.76}>
                      <View style={[s.addBox, !active && s.addBoxMuted]}>
                        <Ionicons name="restaurant" size={14} color={active ? theme.surface : theme.textSecondary} />
                      </View>
                      <View style={s.patioInfo}>
                        <Text style={s.patioName} allowFontScaling={true}>{match.item.name}</Text>
                        <Text style={s.patioMeta} allowFontScaling={true}>{match.patio.name} · {match.patio.category}</Text>
                      </View>
                      <View style={s.patioRight}>
                        <Text style={s.patioPrice} allowFontScaling={true}>{match.item.price ?? match.patio.price}</Text>
                        <Text style={s.patioOpen} allowFontScaling={true}>{match.patio.open}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )
            ) : (
              allPatios.map((patio, index) => {
                const active = patio.id === selectedId && showHeader;
                return (
                  <TouchableOpacity
                    key={patio.id}
                    style={[s.patioRow, active && s.patioRowActive]}
                    onPress={() => selectPatio(patio.id)}
                    activeOpacity={0.76}>
                    <View style={[s.addBox, !active && s.addBoxMuted]}>
                      <Text style={[s.indexNum, { color: active ? theme.surface : theme.textSecondary }]}>{index + 1}</Text>
                    </View>
                    <View style={s.patioInfo}>
                      <Text style={s.patioName} allowFontScaling={true}>{patio.name}</Text>
                      <Text style={s.patioMeta} allowFontScaling={true}>{patio.category} · {patio.address}</Text>
                    </View>
                    <View style={s.patioRight}>
                      <Text style={s.patioPrice} allowFontScaling={true}>{patio.price}</Text>
                      <View style={s.patioRating}>
                        <Ionicons name="star" size={11} color={theme.accent} />
                        <Text style={s.patioRatingText} allowFontScaling={true}>{patio.rating}</Text>
                      </View>
                      <Text style={s.patioOpen} allowFontScaling={true}>{patio.open}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      )}
      <HintSheet
        visible={showWelcomeHint}
        icon="🗺️"
        title="Patio"
        body="Descubre qué hay de comer cerca. Busca un platillo o toca un punto en el mapa."
        primaryLabel="Explorar"
        onPrimary={() => { markHintSeen('foodie_welcome'); setShowWelcomeHint(false); }}
        onDismiss={() => { markHintSeen('foodie_welcome'); setShowWelcomeHint(false); }}
      />
      <HintSheet
        visible={showExplorarHint}
        icon="🍽️"
        title="¿Qué se te antoja hoy?"
        body="Busca un platillo o explora el mapa. Patio muestra qué fonditas tienen menú ahorita."
        primaryLabel="Ver qué hay"
        onPrimary={() => { markHintSeen('foodie_explorar'); setShowExplorarHint(false); }}
        onDismiss={() => { markHintSeen('foodie_explorar'); setShowExplorarHint(false); }}
      />
    </View>
  );
}
