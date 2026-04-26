import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/lib/theme';

type Patio = {
  id: string;
  name: string;
  category: string;
  area: string;
  price: string;
  open: string;
  reason: string;
  x: number;
  y: number;
};

const PATIOS: Patio[] = [
  {
    id: 'la-fondita',
    name: 'La Fondita',
    category: 'Fondita',
    area: 'Escandón',
    price: '$95',
    open: 'Hasta 4pm',
    reason: 'Menú del día claro',
    x: 24,
    y: 29,
  },
  {
    id: 'tacos-don-luis',
    name: 'Tacos Don Luis',
    category: 'Taquería',
    area: 'San Miguel Chapultepec',
    price: '$80',
    open: 'Abierto',
    reason: 'Rápido para comer',
    x: 68,
    y: 26,
  },
  {
    id: 'mariscos-lola',
    name: 'Mariscos Lola',
    category: 'Mariscos',
    area: 'Tacubaya',
    price: '$140',
    open: 'Hasta 6pm',
    reason: 'Buena opción de tarde',
    x: 48,
    y: 52,
  },
  {
    id: 'cocina-norte',
    name: 'Cocina Norte',
    category: 'Comida corrida',
    area: 'Anzures',
    price: '$110',
    open: 'Hasta 5pm',
    reason: 'Cerca de oficinas',
    x: 78,
    y: 61,
  },
];

function makeStyles(t: Theme) {
  const route = t.isDark ? 'rgba(245,245,240,0.62)' : 'rgba(28,28,30,0.54)';
  const glass = t.isDark ? 'rgba(27,28,32,0.82)' : 'rgba(255,255,255,0.82)';
  const mutedGlass = t.isDark ? 'rgba(36,38,44,0.74)' : 'rgba(246,244,238,0.78)';

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
    closeButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: glass, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    titleBlock: { flex: 1, paddingHorizontal: 16 },
    code: { fontSize: 13, fontWeight: '900', letterSpacing: 1.6, color: t.textSecondary },
    title: { marginTop: 2, fontSize: 28, lineHeight: 32, fontWeight: '900', color: t.text },
    toolGroup: { flexDirection: 'row', gap: 8 },
    toolButton: { width: 48, height: 48, borderRadius: 14, backgroundColor: glass, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    zoomStack: { position: 'absolute', left: 24, gap: 8 },
    smallTool: { width: 48, height: 48, borderRadius: 24, backgroundColor: mutedGlass, alignItems: 'center', justifyContent: 'center' },
    eta: { position: 'absolute', left: 24 },
    etaLabel: { fontSize: 13, color: t.textSecondary },
    etaRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 2 },
    etaTime: { fontSize: 38, lineHeight: 42, fontWeight: '300', color: t.text },
    etaBadge: { minHeight: 30, paddingHorizontal: 12, borderRadius: 10, backgroundColor: t.accentLight, alignItems: 'center', justifyContent: 'center' },
    etaBadgeText: { fontSize: 13, fontWeight: '900', color: t.accent },
    sheet: { position: 'absolute', left: 14, right: 14, bottom: 14, maxHeight: '46%', borderRadius: 28, backgroundColor: glass, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: t.isDark ? 0.28 : 0.12, shadowRadius: 30, elevation: 8 },
    grabber: { alignSelf: 'center', width: 48, height: 4, borderRadius: 2, backgroundColor: t.border, marginTop: 10, marginBottom: 8 },
    selectedPanel: { paddingHorizontal: 18, paddingBottom: 14 },
    selectedHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
    spark: { width: 30, height: 30, borderRadius: 10, backgroundColor: t.accentLight, alignItems: 'center', justifyContent: 'center' },
    selectedTitle: { flex: 1, fontSize: 20, fontWeight: '900', color: t.text },
    selectedMeta: { fontSize: 13, lineHeight: 18, color: t.textSecondary },
    selectedStats: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 12 },
    price: { fontSize: 32, lineHeight: 36, fontWeight: '300', color: t.text },
    priceCaption: { marginTop: 1, fontSize: 12, color: t.textSecondary },
    cta: { minHeight: 42, paddingHorizontal: 16, borderRadius: 15, backgroundColor: t.text, flexDirection: 'row', alignItems: 'center', gap: 6 },
    ctaText: { fontSize: 13, fontWeight: '900', color: t.surface },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    listHeader: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    listTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, color: t.text },
    listMeta: { fontSize: 12, color: t.textSecondary },
    list: { paddingBottom: 12 },
    patioRow: { minHeight: 74, marginHorizontal: 8, marginBottom: 8, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.62)' },
    patioRowActive: { backgroundColor: t.isDark ? 'rgba(255,106,61,0.14)' : 'rgba(242,97,47,0.10)' },
    addBox: { width: 32, height: 32, borderRadius: 9, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    addBoxMuted: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    patioInfo: { flex: 1, paddingRight: 10 },
    patioName: { fontSize: 16, fontWeight: '900', color: t.text },
    patioMeta: { marginTop: 4, fontSize: 12, lineHeight: 16, color: t.textSecondary },
    patioRight: { alignItems: 'flex-end', gap: 3 },
    patioPrice: { fontSize: 15, fontWeight: '900', color: t.text },
    patioOpen: { fontSize: 12, color: t.textSecondary },
  });
}

export default function ExplorarScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState(PATIOS[0].id);
  const selectedPatio = PATIOS.find((patio) => patio.id === selectedId) ?? PATIOS[0];

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
        <TouchableOpacity style={s.closeButton} onPress={() => router.replace('/')} activeOpacity={0.76}>
          <Ionicons name="close" size={20} color={theme.text} />
        </TouchableOpacity>
        <View style={s.titleBlock}>
          <Text style={s.code} allowFontScaling={true}>PATIO</Text>
          <Text style={s.title} allowFontScaling={true}>Miguel Hidalgo</Text>
        </View>
        <View style={s.toolGroup}>
          <TouchableOpacity style={s.toolButton} onPress={() => router.push('/?intent=business')} activeOpacity={0.76}>
            <Ionicons name="storefront-outline" size={20} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.toolButton} activeOpacity={0.76}>
            <Ionicons name="expand-outline" size={21} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[s.zoomStack, { top: insets.top + 176 }]}>
        <TouchableOpacity style={s.smallTool} activeOpacity={0.7}>
          <Ionicons name="add" size={21} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity style={s.smallTool} activeOpacity={0.7}>
          <Ionicons name="remove" size={21} color={theme.text} />
        </TouchableOpacity>
      </View>

      <View style={[s.eta, { bottom: insets.bottom + 390 }]}>
        <Text style={s.etaLabel} allowFontScaling={true}>Cerca de ti</Text>
        <View style={s.etaRow}>
          <Text style={s.etaTime} allowFontScaling={true}>10</Text>
          <View style={s.etaBadge}>
            <Text style={s.etaBadgeText} allowFontScaling={true}>lugares</Text>
          </View>
        </View>
      </View>

      <View style={[s.sheet, { paddingBottom: insets.bottom ? 4 : 8 }]}>
        <View style={s.grabber} />
        <View style={s.selectedPanel}>
          <View style={s.selectedHeader}>
            <View style={s.spark}>
              <Ionicons name="flash-outline" size={17} color={theme.accent} />
            </View>
            <Text style={s.selectedTitle} allowFontScaling={true}>{selectedPatio.name}</Text>
            <Ionicons name="ellipsis-vertical" size={18} color={theme.textSecondary} />
          </View>
          <Text style={s.selectedMeta} allowFontScaling={true}>
            {selectedPatio.category} · {selectedPatio.area} · {selectedPatio.open}
          </Text>
          <View style={s.selectedStats}>
            <View>
              <Text style={s.price} allowFontScaling={true}>desde {selectedPatio.price}</Text>
              <Text style={s.priceCaption} allowFontScaling={true}>{selectedPatio.reason}</Text>
            </View>
            <TouchableOpacity style={s.cta} activeOpacity={0.82}>
              <Text style={s.ctaText} allowFontScaling={true}>Ver</Text>
              <Ionicons name="chevron-forward" size={15} color={theme.surface} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={s.divider} />
        <View style={s.listHeader}>
          <Text style={s.listTitle} allowFontScaling={true}>TOP 10 MIGUEL HIDALGO</Text>
          <Text style={s.listMeta} allowFontScaling={true}>Curado</Text>
        </View>
        <ScrollView style={s.list} showsVerticalScrollIndicator={false}>
          {PATIOS.map((patio, index) => {
            const active = patio.id === selectedId;
            return (
              <TouchableOpacity
                key={patio.id}
                style={[s.patioRow, active && s.patioRowActive]}
                onPress={() => setSelectedId(patio.id)}
                activeOpacity={0.76}>
                <View style={[s.addBox, !active && s.addBoxMuted]}>
                  <Text style={{ color: active ? theme.surface : theme.textSecondary, fontWeight: '900' }}>{index + 1}</Text>
                </View>
                <View style={s.patioInfo}>
                  <Text style={s.patioName} allowFontScaling={true}>{patio.name}</Text>
                  <Text style={s.patioMeta} allowFontScaling={true}>{patio.category} · {patio.area}</Text>
                </View>
                <View style={s.patioRight}>
                  <Text style={s.patioPrice} allowFontScaling={true}>{patio.price}</Text>
                  <Text style={s.patioOpen} allowFontScaling={true}>{patio.open}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
