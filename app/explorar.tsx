import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MOCK_PATIOS as PATIOS } from '@/lib/patios';
import { getFavoritePatioIds, toggleFavoritePatio } from '@/lib/favorites';
import { useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  const route = t.isDark ? 'rgba(245,245,240,0.62)' : 'rgba(28,28,30,0.54)';
  const glass = t.isDark ? 'rgba(27,28,32,0.82)' : 'rgba(255,255,255,0.82)';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    map: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0' },
    mapTint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(17,18,20,0.48)' : 'rgba(248,248,245,0.34)' },
    grid: { ...StyleSheet.absoluteFillObject, opacity: t.isDark ? 0.16 : 0.32 },
    gridRow: { flex: 1, flexDirection: 'row' },
    gridCell: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.58)' },
    avenue: { position: 'absolute', height: 1, backgroundColor: t.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.68)', transform: [{ rotate: '-22deg' }] },
    routeSegment: { position: 'absolute', height: 2, borderRadius: 1, backgroundColor: route },
    routeHot: { backgroundColor: t.accent },
    pin: { position: 'absolute', width: 42, height: 42, marginLeft: -21, marginTop: -21, borderRadius: 21, backgroundColor: t.isDark ? 'rgba(245,245,240,0.24)' : 'rgba(255,255,255,0.62)', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 4 },
    pinCore: { width: 22, height: 22, borderRadius: 11, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    pinCoreSelected: { backgroundColor: t.text },
    pinDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.surface },
    topBar: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    topRight: { flexDirection: 'row', gap: 8 },
    closeButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: glass, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    toolButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: glass, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    sideActions: { position: 'absolute', right: 24, gap: 10 },
    sideButton: { width: 52, height: 52, borderRadius: 16, backgroundColor: glass, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    sheet: { position: 'absolute', left: 14, right: 14, bottom: 14, maxHeight: '43%', borderRadius: 30, backgroundColor: glass, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: t.isDark ? 0.28 : 0.12, shadowRadius: 30, elevation: 8 },
    grabber: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10, marginBottom: 8 },
    selectedPanel: { paddingHorizontal: 18, paddingBottom: 14 },
    selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 8 },
    selectedTitle: { flex: 1, fontSize: 24, lineHeight: 28, fontWeight: '900', color: t.text },
    heartButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
    selectedMeta: { fontSize: 13, lineHeight: 18, color: t.textSecondary },
    selectedStats: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 },
    price: { fontSize: 26, lineHeight: 30, fontWeight: '300', color: t.text },
    priceCaption: { marginTop: 1, fontSize: 12, color: t.textSecondary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
    ratingText: { fontSize: 13, fontWeight: '900', color: t.text },
    cta: { minHeight: 46, paddingHorizontal: 18, borderRadius: 23, backgroundColor: t.text, flexDirection: 'row', alignItems: 'center', gap: 6 },
    ctaText: { fontSize: 13, fontWeight: '900', color: t.surface },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    listHeader: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, color: t.text },
    listMeta: { fontSize: 12, color: t.textSecondary },
    listFilter: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, minHeight: 30, borderRadius: 15, backgroundColor: t.accentLight },
    listFilterText: { fontSize: 12, fontWeight: '900', color: t.accent },
    list: { paddingBottom: 12 },
    patioRow: { minHeight: 70, marginHorizontal: 8, marginBottom: 7, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 11, flexDirection: 'row', alignItems: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.56)' },
    patioRowActive: { backgroundColor: t.isDark ? 'rgba(255,106,61,0.14)' : 'rgba(242,97,47,0.10)' },
    addBox: { width: 32, height: 32, borderRadius: 9, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    addBoxMuted: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    patioInfo: { flex: 1, paddingRight: 10 },
    patioName: { fontSize: 15, fontWeight: '900', color: t.text },
    patioMeta: { marginTop: 4, fontSize: 12, lineHeight: 16, color: t.textSecondary },
    patioRight: { alignItems: 'flex-end', gap: 3 },
    patioPrice: { fontSize: 15, fontWeight: '900', color: t.text },
    patioOpen: { fontSize: 12, color: t.textSecondary },
    patioRating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    patioRatingText: { fontSize: 12, fontWeight: '900', color: t.text },
  });
}

export default function ExplorarScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState(PATIOS[0].id);
  const selectedPatio = PATIOS.find((patio) => patio.id === selectedId) ?? PATIOS[0];
  const [mapExpanded, setMapExpanded] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const selectedSaved = savedIds.includes(selectedId);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      getFavoritePatioIds().then((ids) => {
        if (mounted) setSavedIds(ids);
      });

      return () => { mounted = false; };
    }, [])
  );

  const toggleSaved = async () => {
    const next = await toggleFavoritePatio(selectedId);
    setSavedIds(next);
  };

  return (
    <View style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={s.map}>
        <View style={s.grid}>
          {Array.from({ length: 10 }).map((_, row) => (
            <View key={row} style={s.gridRow}>
              {Array.from({ length: 8 }).map((__, col) => <View key={col} style={s.gridCell} />)}
            </View>
          ))}
        </View>
        {Array.from({ length: 7 }).map((_, index) => (
          <View
            key={index}
            style={[
              s.avenue,
              {
                left: `${-18 + index * 19}%`,
                top: `${12 + index * 9}%`,
                width: '88%',
              },
            ]}
          />
        ))}
        <View style={[s.routeSegment, { left: '18%', top: '34%', width: '32%', transform: [{ rotate: '38deg' }] }]} />
        <View style={[s.routeSegment, { left: '45%', top: '50%', width: '26%', transform: [{ rotate: '-18deg' }] }]} />
        <View style={[s.routeSegment, s.routeHot, { left: '58%', top: '43%', width: '20%', transform: [{ rotate: '48deg' }] }]} />
        <View style={[s.routeSegment, { left: '22%', top: '64%', width: '44%', transform: [{ rotate: '-8deg' }] }]} />
        <View style={s.mapTint} />

        {PATIOS.map((patio) => (
          <TouchableOpacity
            key={patio.id}
            style={[s.pin, { left: `${patio.x}%`, top: `${patio.y}%` }]}
            onPress={() => setSelectedId(patio.id)}
            activeOpacity={0.78}>
            <View style={[s.pinCore, selectedId === patio.id && s.pinCoreSelected]}>
              <View style={s.pinDot} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.topBar, { top: insets.top + 14 }]}>
        <TouchableOpacity style={s.closeButton} onPress={() => router.push('/cuenta')} activeOpacity={0.76}>
          <Ionicons name="menu-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={s.topRight}>
          <TouchableOpacity style={s.toolButton} onPress={() => router.push('/buscar')} activeOpacity={0.76}>
            <Ionicons name="search-outline" size={21} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.toolButton} onPress={() => setMapExpanded((value) => !value)} activeOpacity={0.76}>
            <Ionicons name={mapExpanded ? 'list-outline' : 'expand-outline'} size={21} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[s.sideActions, { top: insets.top + 154 }]}>
        <TouchableOpacity style={s.sideButton} onPress={() => router.push('/favoritos')} activeOpacity={0.76}>
          <Ionicons name="star-outline" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {!mapExpanded && (
      <View style={[s.sheet, { paddingBottom: insets.bottom ? 4 : 8 }]}>
        <View style={s.grabber} />
        <View style={s.selectedPanel}>
          <View style={s.selectedHeader}>
            <Text style={s.selectedTitle} allowFontScaling={true}>{selectedPatio.name}</Text>
            <TouchableOpacity style={s.heartButton} onPress={toggleSaved} activeOpacity={0.76}>
              <Ionicons name={selectedSaved ? 'heart' : 'heart-outline'} size={22} color={selectedSaved ? theme.accent : theme.textSecondary} />
            </TouchableOpacity>
          </View>
          <Text style={s.selectedMeta} allowFontScaling={true}>
            {selectedPatio.category} · {selectedPatio.area} · {selectedPatio.open}
          </Text>
          <View style={s.selectedStats}>
            <View>
              <Text style={s.price} allowFontScaling={true}>{selectedPatio.price === '$' ? 'Precio pendiente' : selectedPatio.price}</Text>
              <Text style={s.priceCaption} allowFontScaling={true}>{selectedPatio.reason}</Text>
              <View style={s.ratingRow}>
                <Ionicons name="star" size={13} color={theme.accent} />
                <Text style={s.ratingText} allowFontScaling={true}>{selectedPatio.rating}</Text>
              </View>
            </View>
            <TouchableOpacity style={s.cta} onPress={() => router.push(`/patio/${selectedPatio.id}`)} activeOpacity={0.82}>
              <Text style={s.ctaText} allowFontScaling={true}>Ver</Text>
              <Ionicons name="chevron-forward" size={15} color={theme.surface} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.divider} />
        <View style={s.listHeader}>
          <Text style={s.listTitle} allowFontScaling={true}>CERCA DE TI</Text>
          <View style={s.listFilter}>
            <Ionicons name="star" size={12} color={theme.accent} />
            <Text style={s.listFilterText} allowFontScaling={true}>5.0</Text>
          </View>
        </View>
        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {PATIOS.map((patio, index) => {
            const active = patio.id === selectedId;
            return (
              <TouchableOpacity
                key={patio.id}
                style={[s.patioRow, active && s.patioRowActive]}
                onPress={() => {
                  setSelectedId(patio.id);
                }}
                activeOpacity={0.76}>
                <View style={[s.addBox, !active && s.addBoxMuted]}>
                  <Text style={{ color: active ? theme.surface : theme.textSecondary, fontWeight: '900' }}>{index + 1}</Text>
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
          })}
        </ScrollView>
      </View>
      )}
    </View>
  );
}
