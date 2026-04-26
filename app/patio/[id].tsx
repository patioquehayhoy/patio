import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPatioById } from '@/lib/patios';
import { useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 34 },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 22 },
    iconButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    hero: { paddingBottom: 18 },
    eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: t.textSecondary, marginBottom: 8 },
    title: { fontSize: 34, lineHeight: 38, fontWeight: '900', color: t.text, letterSpacing: 0 },
    meta: { marginTop: 8, fontSize: 15, lineHeight: 21, color: t.textSecondary },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 },
    ratingText: { fontSize: 15, fontWeight: '900', color: t.text },
    mapPanel: { height: 190, borderRadius: 30, backgroundColor: t.isDark ? '#191A1B' : '#D8D6D0', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, marginBottom: 22 },
    mapGrid: { ...StyleSheet.absoluteFillObject, opacity: t.isDark ? 0.14 : 0.3 },
    gridRow: { flex: 1, flexDirection: 'row' },
    gridCell: { flex: 1, borderRightWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.62)' },
    mapLine: { position: 'absolute', height: 2, borderRadius: 1, backgroundColor: t.textSecondary, opacity: 0.5 },
    mapLineAccent: { backgroundColor: t.accent, opacity: 0.72 },
    mapPin: { position: 'absolute', left: '50%', top: '48%', width: 54, height: 54, marginLeft: -27, marginTop: -27, borderRadius: 27, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.16, shadowRadius: 16, elevation: 4 },
    mapPinCore: { width: 24, height: 24, borderRadius: 12, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    mapPinDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: t.surface },
    mapPill: { position: 'absolute', left: 14, right: 14, bottom: 14, minHeight: 52, borderRadius: 18, backgroundColor: t.isDark ? 'rgba(27,28,32,0.82)' : 'rgba(255,255,255,0.82)', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
    mapPillText: { flex: 1, fontSize: 13, fontWeight: '900', color: t.text },
    panel: { borderRadius: 22, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    menuPanel: { borderRadius: 26, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: t.isDark ? 0.16 : 0.06, shadowRadius: 24, elevation: 3 },
    menuHeader: { minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    menuHeaderTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: t.text },
    menuHeaderMeta: { fontSize: 14, fontWeight: '900', color: t.textSecondary },
    menuSectionHeader: { minHeight: 44, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: t.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(248,248,245,0.68)' },
    menuSectionTitle: { fontSize: 13, fontWeight: '900', letterSpacing: 1.2, color: t.textSecondary },
    menuSectionPrice: { fontSize: 13, fontWeight: '900', color: t.textSecondary },
    row: { minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
    rowIcon: { width: 24, marginRight: 8, opacity: 0.48 },
    rowText: { flex: 1, fontSize: 13, lineHeight: 18, color: t.textSecondary },
    rowValue: { fontSize: 16, fontWeight: '900', color: t.text },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 52 },
    menuDivider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 44 },
    section: { paddingTop: 18 },
    sectionTitle: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: t.text, marginBottom: 12 },
    menuItem: { minHeight: 54, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
    bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent, marginRight: 12 },
    menuText: { flex: 1, fontSize: 16, fontWeight: '900', color: t.text },
  });
}

export default function PatioDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const patio = getPatioById(id);
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();

  if (!patio) {
    return (
      <View style={[s.container, { paddingTop: insets.top }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.scrollContent}>
          <View style={s.top}>
            <TouchableOpacity style={s.iconButton} onPress={() => router.back()} activeOpacity={0.76}>
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
          <Text style={s.title}>No encontrado</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <TouchableOpacity style={s.iconButton} onPress={() => router.back()} activeOpacity={0.76}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconButton} activeOpacity={0.76}>
            <Ionicons name="heart-outline" size={22} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={s.hero}>
          <Text style={s.eyebrow} allowFontScaling={true}>PATIO PÚBLICO</Text>
          <Text style={s.title} allowFontScaling={true}>{patio.name}</Text>
          <Text style={s.meta} allowFontScaling={true}>
            {patio.category} · {patio.area} · {patio.open}
          </Text>
          <View style={s.ratingRow}>
            <Ionicons name="star" size={15} color={theme.accent} />
            <Text style={s.ratingText} allowFontScaling={true}>{patio.rating}</Text>
          </View>
        </View>

        <View style={s.mapPanel}>
          <View style={s.mapGrid}>
            {Array.from({ length: 5 }).map((_, row) => (
              <View key={row} style={s.gridRow}>
                {Array.from({ length: 6 }).map((__, col) => <View key={col} style={s.gridCell} />)}
              </View>
            ))}
          </View>
          <View style={[s.mapLine, { left: '12%', top: '34%', width: '58%', transform: [{ rotate: '32deg' }] }]} />
          <View style={[s.mapLine, s.mapLineAccent, { left: '47%', top: '55%', width: '32%', transform: [{ rotate: '-26deg' }] }]} />
          <View style={s.mapPin}>
            <View style={s.mapPinCore}>
              <View style={s.mapPinDot} />
            </View>
          </View>
          <View style={s.mapPill}>
            <Text style={s.mapPillText} numberOfLines={1} allowFontScaling={true}>{patio.address}</Text>
          </View>
        </View>

        <View style={s.menuPanel}>
          <View style={s.menuHeader}>
            <Text style={s.menuHeaderTitle} allowFontScaling={true}>MENÚ DE HOY</Text>
            <Text style={s.menuHeaderMeta} allowFontScaling={true}>{patio.price === '$' ? 'Precio pendiente' : patio.price}</Text>
          </View>
          <View style={s.divider} />
          {patio.menu.map((section, sectionIndex) => (
            <View key={section.section}>
              <View style={s.menuSectionHeader}>
                <Text style={s.menuSectionTitle} allowFontScaling={true}>{section.section}</Text>
                {!!section.price && <Text style={s.menuSectionPrice} allowFontScaling={true}>{section.price}</Text>}
              </View>
              {section.items.map((item, index) => (
                <View key={`${section.section}-${item.name}`}>
                  <View style={s.menuItem}>
                    <View style={s.bullet} />
                    <Text style={s.menuText} allowFontScaling={true}>{item.name}</Text>
                  </View>
                  {index < section.items.length - 1 && <View style={s.menuDivider} />}
                </View>
              ))}
              {sectionIndex < patio.menu.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle} allowFontScaling={true}>DETALLES</Text>
          <View style={s.panel}>
            <View style={s.row}>
              <Ionicons name="location-outline" size={22} color={theme.text} style={s.rowIcon} />
              <Text style={s.rowText} allowFontScaling={true}>{patio.address}</Text>
            </View>
            <View style={s.divider} />
            <View style={s.row}>
              <Ionicons name="card-outline" size={22} color={theme.text} style={s.rowIcon} />
              <Text style={s.rowText} allowFontScaling={true}>{patio.payments.join(' · ')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
