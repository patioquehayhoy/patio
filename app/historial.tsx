import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts } from '@/lib/theme';

// FonderoHistory exacto a Figma: métricas + chart + menús pasados.
const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.03)',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.06)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  textMute: 'rgba(248,248,245,0.4)',
  accent: '#FF6A3D',
  green: '#1F9D55',
};

const CHART = [34, 52, 28, 71, 65, 48, 14];
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const TODAY_IDX = 3;

const PAST = [
  { day: 'Ayer · Lun', price: '$60', dish: 'Mole verde · Milanesa', views: 71 },
  { day: 'Vie pasado', price: '$60', dish: 'Pancita · Chiles rellenos', views: 65 },
  { day: 'Jue pasado', price: '$55', dish: 'Tinga · Bistec', views: 48 },
];

export default function HistorialScreen() {
  const insets = useSafeAreaInsets();
  const { onScroll } = useTabBarScroll();

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top */}
      <View style={[s.top, { top: insets.top + 6 }]}>
        <TouchableOpacity style={s.navBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={DARK.text} />
        </TouchableOpacity>
        <Text style={s.navTitle} allowFontScaling={true}>Mi Patio</Text>
        <View style={s.navBtn} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 58, paddingHorizontal: 22, paddingBottom: 200 }}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}>
        {/* Métrica grande */}
        <Text style={s.eyebrow} allowFontScaling={true}>Esta semana</Text>
        <View style={s.bigRow}>
          <Text style={s.bigNum} allowFontScaling={true}>312</Text>
          <View style={s.trend}>
            <Ionicons name="trending-up" size={12} color={DARK.green} />
            <Text style={s.trendText} allowFontScaling={true}>+18%</Text>
          </View>
        </View>
        <Text style={s.bigSub} allowFontScaling={true}>personas vieron tu menú</Text>

        {/* Chart */}
        <View style={s.chartCard}>
          <View style={s.chartBars}>
            {CHART.map((v, i) => (
              <View key={i} style={s.barCol}>
                <View style={[s.bar, { height: `${v}%`, backgroundColor: i === TODAY_IDX ? DARK.accent : 'rgba(248,248,245,0.15)' }]} />
              </View>
            ))}
          </View>
          <View style={s.chartDays}>
            {DAYS.map((d, i) => (
              <Text key={i} style={[s.dayLabel, { color: i === TODAY_IDX ? DARK.accent : DARK.textMute, fontWeight: i === TODAY_IDX ? '700' : '500' }]} allowFontScaling={true}>{d}</Text>
            ))}
          </View>
        </View>

        {/* Menús pasados */}
        <Text style={s.sectionLabel} allowFontScaling={true}>Menús pasados</Text>
        {PAST.map((m, i) => (
          <View key={i} style={s.pastCard}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={s.pastDay} allowFontScaling={true}>{m.day} · {m.price}</Text>
              <Text style={s.pastDish} numberOfLines={1} allowFontScaling={true}>{m.dish}</Text>
            </View>
            <View style={s.viewsBox}>
              <Ionicons name="eye-outline" size={11} color={DARK.textMute} />
              <Text style={s.viewsText} allowFontScaling={true}>{m.views}</Text>
            </View>
            <TouchableOpacity style={s.repeatBtn} onPress={() => router.replace('/menu')} activeOpacity={0.8}>
              <Ionicons name="refresh" size={13} color={DARK.accent} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

      {/* CTA publicar */}
      <View style={[s.ctaWrap, { paddingBottom: (insets.bottom || 10) + 90 }]} pointerEvents="box-none">
        <TouchableOpacity style={s.cta} onPress={() => router.replace('/menu')} activeOpacity={0.86}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={s.ctaText} allowFontScaling={true}>Publicar menú de hoy</Text>
        </TouchableOpacity>
      </View>

      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK.bg },
  top: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 20 },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(248,248,245,0.9)' },

  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: DARK.accent, marginBottom: 6 },
  bigRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginBottom: 2 },
  bigNum: { fontSize: 64, fontWeight: '900', letterSpacing: -2.5, lineHeight: 72, color: DARK.text, fontFamily: Fonts.brand, includeFontPadding: false },
  trend: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 8 },
  trendText: { fontSize: 13, fontWeight: '700', color: DARK.green },
  bigSub: { fontSize: 14, fontWeight: '300', color: DARK.textSecondary, marginBottom: 24 },

  chartCard: { padding: 16, borderRadius: 18, backgroundColor: DARK.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: DARK.border, marginBottom: 22 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 6, height: 60 },
  barCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 6, minHeight: 6 },
  chartDays: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 10.5, letterSpacing: 0.5 },

  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(248,248,245,0.5)', marginBottom: 12 },
  pastCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, backgroundColor: DARK.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: DARK.border2, marginBottom: 8 },
  pastDay: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: DARK.textMute, marginBottom: 3 },
  pastDish: { fontSize: 14, color: DARK.text },
  viewsBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewsText: { fontSize: 12, fontWeight: '600', color: 'rgba(248,248,245,0.6)' },
  repeatBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(255,106,61,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,106,61,0.25)', alignItems: 'center', justifyContent: 'center' },

  ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 22, paddingTop: 16, backgroundColor: DARK.bg },
  cta: { height: 56, borderRadius: 18, backgroundColor: DARK.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: DARK.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 5 },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});
