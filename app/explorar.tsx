import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, PanResponder, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MAP_STYLE_DARK, MAP_STYLE_LIGHT } from '@/lib/map-style';
import { FoodieLoading } from '@/components/foodie-loading';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { FOODIE_INITIAL_REGION, useFoodieExploreController } from '@/lib/controllers/useFoodieExploreController';
import { noWidow } from '@/lib/typography';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  const btnBorder = t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  const btnShadowOpacity = t.isDark ? 0.20 : 0.06;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: t.bg, zIndex: 50 },
    map: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0' },
    mapView: { ...StyleSheet.absoluteFillObject },
    pinHitArea: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
    pinMuted: { opacity: 0.18 },
    pin: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.isDark ? 'rgba(255,255,255,0.34)' : 'rgba(255,255,255,0.62)', borderWidth: 1, borderColor: t.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 7, elevation: 2 },
    pinCoreSelected: { width: 12, height: 12, borderRadius: 6, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' },
    pinDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: t.surface },
    pinSmallDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: t.accent, borderWidth: 2.5, borderColor: t.isDark ? 'rgba(25,26,27,0.70)' : 'rgba(255,255,255,0.85)', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.22, shadowRadius: 3, elevation: 2 },
    searchPill: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 15, borderRadius: 18, overflow: 'hidden', backgroundColor: t.isDark ? 'rgba(20,21,24,0.55)' : 'rgba(255,255,255,0.78)', borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: btnShadowOpacity + 0.04, shadowRadius: 22, elevation: 4 },
    mapButtons: { position: 'absolute', left: 16, right: 16, zIndex: 12, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    mapButtonStack: { gap: 8 },
    mapButton: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: t.isDark ? 'rgba(20,21,24,0.78)' : 'rgba(255,255,255,0.88)', borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: btnShadowOpacity + 0.06, shadowRadius: 14, elevation: 4 },
    mapButtonActive: { backgroundColor: t.text },
    mapButtonBadge: { position: 'absolute', top: 5, right: 5, minWidth: 15, height: 15, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accent },
    mapButtonBadgeText: { fontSize: 8, fontWeight: '900', color: '#fff' },
    searchRow: { flex: 1, height: 44, borderRadius: 16, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: btnBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: btnShadowOpacity, shadowRadius: 16, elevation: 2 },
    searchInput: { flex: 1, fontSize: 15, fontWeight: '300', color: t.text, height: 44, paddingVertical: 0 },
    sheet: { position: 'absolute', left: 14, right: 14, bottom: 14, maxHeight: '48%', borderRadius: Radius.sheet, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: t.isDark ? 0.20 : 0.08, shadowRadius: 32, elevation: 8 },
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
    patioPrice: { fontSize: 16, fontWeight: '900', color: t.accent, letterSpacing: -0.3 },
    patioOpen: { fontSize: 12, fontWeight: '300', color: t.textSecondary },
    patioRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    patioRatingText: { fontSize: 12, fontWeight: '900', color: t.text },
    indexNum: { fontSize: 13, fontWeight: '900' },
    emptyResults: { paddingHorizontal: 28, paddingVertical: 36, alignItems: 'center' },
    emptyIconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
    emptyEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 10 },
    emptyTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8, lineHeight: 30, color: t.text, textAlign: 'center', marginBottom: 12, fontFamily: Fonts.brand },
    emptySub: { fontSize: 15, fontWeight: '300', lineHeight: 21, color: t.textSecondary, textAlign: 'center', marginBottom: 28, maxWidth: 300 },
    emptyPruebaLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase', color: t.textSecondary, marginBottom: 14 },
    emptyPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
    emptyPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 100, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    emptyPillText: { fontSize: 14, fontWeight: '300', color: t.text },
    pillsRow: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 10 },
    pill: { overflow: 'hidden', borderRadius: 100, borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)' },
    pillText: { paddingHorizontal: 14, paddingVertical: 7, fontSize: 13, fontWeight: '300', color: t.text },
  });
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

export default function ExplorarScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const idleLayerOpacity = useRef(new Animated.Value(1)).current;
  const searchBlurOpacity = useRef(new Animated.Value(0)).current;
  const {
    allPatios,
    closeSheet,
    closeSearch,
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
  } = useFoodieExploreController();
  const sheetPanResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 12 && Math.abs(gesture.dx) < 28,
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > 36) closeSheet();
      },
    })
  ).current;
  const showSelectedHeader = showHeader;
  const showSheet = showSelectedHeader || isFiltering || sheetMode !== null;
  const listPatios = sheetMode === 'saved' ? savedPatios : allPatios;
  const activeIconColor = theme.surface;
  const inactiveIconColor = theme.text;

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

  // Halo Xbox: idle = mapa nítido (sin blur), buscando vacío = blur intenso,
  // buscando con query = blur baja para ver los pins activos
  useEffect(() => {
    const searching = searchActive || isFiltering;
    const blurTarget = !searching ? 0 : isFiltering ? 0.45 : 1;
    Animated.parallel([
      Animated.timing(idleLayerOpacity, { toValue: searching ? 0 : 1, duration: 320, useNativeDriver: true }),
      Animated.timing(searchBlurOpacity, { toValue: blurTarget, duration: 420, useNativeDriver: true }),
    ]).start();
  }, [searchActive, isFiltering, idleLayerOpacity, searchBlurOpacity]);

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={s.map}>
        <MapView
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
          onPress={() => (searchActive ? closeSearch() : closeSheet())}
          onRegionChangeComplete={setVisibleRegion}>
          {visiblePatios.map((patio, idx) => {
            const isSelected = patio.id === selectedId && showSelectedHeader;
            const isMuted = isFiltering && !matchingPatioIds.has(patio.id);
            return (
              <Marker
                key={patio.id}
                coordinate={{ latitude: patio.latitude, longitude: patio.longitude }}
                onPress={(event: any) => {
                  event.stopPropagation?.();
                  selectPatio(patio.id);
                }}
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
        {/* Halo Xbox: blur aparece SOLO al buscar */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: searchBlurOpacity }]}>
          <BlurView intensity={theme.isDark ? 44 : 48} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </Animated.View>
      </View>

      {!searchActive && !isFiltering && (
        <View style={[s.mapButtons, { top: insets.top + 18 }]} pointerEvents="box-none">
          <View style={s.mapButtonStack}>
            <TouchableOpacity
              accessibilityLabel="Ver lugares cerca"
              activeOpacity={0.82}
              onPress={openNearby}
              style={[s.mapButton, sheetMode === 'nearby' && s.mapButtonActive]}>
              <Ionicons name="restaurant-outline" size={21} color={sheetMode === 'nearby' ? activeIconColor : inactiveIconColor} />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel="Ver guardados"
              activeOpacity={0.82}
              onPress={openSaved}
              style={[s.mapButton, sheetMode === 'saved' && s.mapButtonActive]}>
              <Ionicons name={sheetMode === 'saved' ? 'heart' : 'heart-outline'} size={22} color={sheetMode === 'saved' ? activeIconColor : inactiveIconColor} />
              {savedIds.length > 0 && (
                <View style={s.mapButtonBadge}>
                  <Text style={s.mapButtonBadgeText}>{Math.min(savedIds.length, 99)}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showSheet && (
        <Animated.View
          pointerEvents={idleMode ? 'box-none' : 'none'}
          style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center', opacity: idleLayerOpacity }]}>
          <View style={{ position: 'absolute', left: 24, right: 24 }}>
            <TouchableOpacity accessibilityLabel="Buscar comida" activeOpacity={0.82} onPress={openSearch} style={s.searchPill}>
              <BlurView intensity={theme.isDark ? 28 : 36} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
              <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
              <Text style={{ fontSize: 16, fontWeight: '300', color: theme.textSecondary }}>
                ¿Qué hay hoy?
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Buscador activo — anclado ENCIMA del teclado */}
      {searchActive && (
        <View
          style={{ position: 'absolute', left: 0, right: 0, bottom: keyboardHeight > 0 ? keyboardHeight : insets.bottom + 82 }}
          pointerEvents="box-none">
          <View style={{ paddingHorizontal: 16, paddingBottom: 12, paddingTop: 8 }}>
            <View style={s.searchRow}>
              <BlurView intensity={theme.isDark ? 30 : 36} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
              <TouchableOpacity onPress={closeSearch} activeOpacity={0.76} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="chevron-back" size={20} color={theme.text} />
              </TouchableOpacity>
              <TextInput
                accessibilityLabel="Buscar comida"
                ref={searchInputRef}
                style={s.searchInput}
                value={query}
                onChangeText={handleQueryChange}
                placeholder="¿Qué hay hoy?"
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
            </View>
          </View>
        </View>
      )}

      {showSheet && (
        <View
          {...sheetPanResponder.panHandlers}
          style={[s.sheet, { bottom: keyboardHeight > 0 ? keyboardHeight + 70 : insets.bottom + 82, paddingBottom: insets.bottom ? 4 : 8 }]}>
          <BlurView intensity={theme.isDark ? 16 : 22} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View style={s.grabber} />

          {/* Header panel — only on explicit selection */}
          {showSelectedHeader && selectedPatio && (
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
                    ? [selectedPatio.category, selectedPatio.area, selectedDistanceLabel, selectedPatio.open].filter(Boolean).join(' · ')
                    : [selectedPatio.category, selectedPatio.area, selectedDistanceLabel, selectedPatio.open].filter(Boolean).join(' · ')}
                </Text>
                <View style={s.selectedStats}>
                  <View>
                    {featuredMatch ? (
                      <>
                        <Text style={s.dishName} allowFontScaling={true}>Tiene {featuredMatch.item.name}</Text>
                        <Text style={s.priceCaption} allowFontScaling={true}>
                          {featuredMatch.section} · {featuredMatch.item.price ?? selectedPatio.price}
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
                  </View>
                  {selectedPatio.latitude > 0 && (
                    <TouchableOpacity accessibilityLabel={`Ver ${selectedPatio.name}`} style={s.cta} onPress={() => router.push(`/patio/${selectedPatio.id}`)} activeOpacity={0.82}>
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
                <Text style={s.listTitle} allowFontScaling={true}>{sheetMode === 'saved' ? 'GUARDADOS' : 'CERCA DE TI'}</Text>
                <TouchableOpacity style={s.listFilter} onPress={closeSheet} activeOpacity={0.76}>
                  <Ionicons name="chevron-down" size={13} color={theme.accent} />
                  <Text style={s.listFilterText} allowFontScaling={true}>Ocultar</Text>
                </TouchableOpacity>
              </>
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
                  <Text style={s.emptyTitle} allowFontScaling={true}>{noWidow('Nadie está sirviendo eso hoy.')}</Text>
                  <Text style={s.emptySub} allowFontScaling={true}>{noWidow('Patio busca en menús del día, no en catálogos. Prueba algo más cercano a la comida corrida.')}</Text>
                  <Text style={s.emptyPruebaLabel} allowFontScaling={true}>Prueba con</Text>
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
                  const active = match.patio.id === selectedId && showSelectedHeader;
                  return (
                    <TouchableOpacity
                      accessibilityLabel={`Abrir resultado ${match.item.name} en ${match.patio.name}`}
                      key={`${match.patio.id}-${match.item.name}`}
                      style={[s.patioRow, active && s.patioRowActive]}
                      onPress={() => {
                        Keyboard.dismiss();
                        selectPatio(match.patio.id);
                      }}
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
            ) : listPatios.length === 0 ? (
              <View style={s.emptyResults}>
                <View style={s.emptyIconCircle}>
                  <Ionicons name="heart-outline" size={32} color={theme.accent} />
                </View>
                <Text style={s.emptyEyebrow} allowFontScaling={true}>Guardados</Text>
                <Text style={s.emptyTitle} allowFontScaling={true}>{noWidow('Todavía no has guardado patios.')}</Text>
                <Text style={s.emptySub} allowFontScaling={true}>{noWidow('Toca un punto o un lugar cercano y usa el corazón para guardarlo aquí.')}</Text>
              </View>
            ) : (
              listPatios.map((patio, index) => {
                const active = patio.id === selectedId && showSelectedHeader;
                return (
                  <TouchableOpacity
                    accessibilityLabel={`Abrir ${patio.name}`}
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
                      <Text style={s.patioOpen} allowFontScaling={true}>{patio.open}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
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
