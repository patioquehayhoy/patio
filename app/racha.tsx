import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPeakTime, getProStatus } from '@/lib/business-pro';
import { getBusinessInsights, getDishLikeCounts, type BusinessInsights, type DishLikeCount } from '@/lib/business-stats';
import { useMenuHistoryController } from '@/lib/controllers/useMenuHistoryController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { localMenuDate } from '@/lib/menu-date';
import { getFonditaId } from '@/lib/menu-store';
import { Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// «Tu racha», pantalla completa desde Menús: la racha es la razón diaria para
// volver (lado difícil de la red) y junto a ella van los números que dicen si
// publicar está sirviendo. Mismo encabezado que las pantallas empujadas
// (avisos-lugares) y mismos estilos que el tablero de Actividad (resenas.tsx).

const dayNumber = (fecha: string) => Date.parse(`${fecha}T00:00:00Z`) / 86400000;

export function bestStreak(fechas: string[]): number {
  const days = [...new Set(fechas.filter((fecha) => /^\d{4}-\d{2}-\d{2}$/.test(fecha)))].sort().map(dayNumber);
  let best = 0;
  let run = 0;
  days.forEach((day, index) => {
    run = index > 0 && day - days[index - 1] === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

export default function RachaScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { menus, streak } = useMenuHistoryController();
  const publishedDates = menus.filter((menu) => menu.published).map((menu) => menu.fecha);
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [topDish, setTopDish] = useState<DishLikeCount | null>(null);
  const [peak, setPeak] = useState<{ day: string; hour: number } | null>(null);
  const [hasPro, setHasPro] = useState(false);

  useFocusEffect(useCallback(() => {
    const id = getFonditaId();
    if (!id) return;
    let alive = true;
    getBusinessInsights(id).then((value) => { if (alive) setInsights(value); }).catch(() => {});
    getDishLikeCounts(id).then((counts) => { if (alive) setTopDish(counts[0] ?? null); }).catch(() => {});
    getProStatus(id).then(async (status) => {
      const pro = !!status?.proUntil;
      if (!alive) return;
      setHasPro(pro);
      if (pro) { const value = await getPeakTime(id).catch(() => null); if (alive) setPeak(value); }
    }).catch(() => {});
    return () => { alive = false; };
  }, []));

  const month = localMenuDate().slice(0, 7);
  const thisMonth = new Set(publishedDates.filter((fecha) => fecha.startsWith(month))).size;
  const best = Math.max(bestStreak(publishedDates), streak);
  const publishedToday = publishedDates.includes(localMenuDate());
  const days = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={c.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" numberOfLines={1} style={[s.navTitle, { color: c.text }]}>Tu racha</Text>
        <View style={s.back} />
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
            {/* La racha manda (número de marca); lo demás la acompaña en el
                ritmo del tablero de Actividad. */}
            <View style={s.hero} accessible accessibilityLabel={`Racha de ${days(streak)} seguidos publicando`}>
              <View style={s.heroLine}>
                <Ionicons name="flame" size={24} color={c.accent} />
                <Text style={[s.heroValue, { color: c.text }]}>{days(streak)}</Text>
              </View>
              <Text style={[s.heroSub, { color: c.textSecondary }]}>
                {noWidow(publishedToday ? 'Hoy ya publicaste. Mañana la sigues.' : 'Publica hoy para no perderla.')}
              </Text>
            </View>

            <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={s.statRow}>
                <Stat label="Mejor racha" value={days(best)} c={c} />
                <Stat label="Publicados este mes" value={String(thisMonth)} c={c} />
              </View>
              <View style={[s.statRow, s.statRowNext, { borderTopColor: c.border }]}>
                <Stat label={insights?.saves === 1 ? 'Seguidor' : 'Seguidores'} value={insights ? String(insights.saves) : '—'} week={insights?.savesWeek} c={c} />
                <Stat label="Me gusta en platillos" value={insights ? String(insights.dishLikes) : '—'} week={insights?.dishLikesWeek} c={c} />
              </View>
              {!!topDish && (
                <View style={[s.group, { borderTopColor: c.border }]}>
                  <Text style={[s.groupLabel, { color: c.textSecondary }]}>{noWidow('Lo que más gusta')}</Text>
                  <View style={s.groupLine} accessible accessibilityLabel={`${topDish.displayName}, ${topDish.likes} me gusta`}>
                    <Text style={[s.groupValue, { color: c.text }]} numberOfLines={1}>{topDish.displayName}</Text>
                    <Ionicons name="heart" size={13} color={c.accent} />
                    <Text style={[s.groupCount, { color: c.textSecondary }]}>{topDish.likes}</Text>
                  </View>
                </View>
              )}
              {/* Solo con Pro: sin cobro encendido no hay a dónde mandar a
                  quien no lo tiene, y no se promete lo que no puede usar. */}
              {hasPro && (
                <View style={[s.group, { borderTopColor: c.border }]}>
                  <Text style={[s.groupLabel, { color: c.textSecondary }]}>{noWidow('Cuándo hay más interés')}</Text>
                  <Text style={[s.groupValue, { color: c.text }]} numberOfLines={1}>
                    {peak ? `Los ${peak.day} de ${peak.hour} a ${peak.hour + 1} h` : 'Aún juntamos datos de tu semana'}
                  </Text>
                </View>
              )}
            </View>

      </ScrollView>
    </View>
  );
}

function Stat({ label, value, week, c }: { label: string; value: string; week?: number; c: ReturnType<typeof fonderoPalette> }) {
  return (
    <View style={s.stat} accessible accessibilityLabel={`${label}: ${value}${week ? `, ${week} esta semana` : ''}`}>
      <Text style={[s.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: c.textSecondary }]}>{noWidow(label)}</Text>
      {!!week && <Text style={[s.statWeek, { color: c.accent }]}>{noWidow(`+${week} esta semana`)}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 22, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  hero: { paddingBottom: 24, gap: 4 },
  heroLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroValue: { ...Type.screen },
  heroSub: { ...Type.body },
  // Tarjeta del tablero de Actividad: radio 18, hairline, padding 16.
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16 },
  statRow: { flexDirection: 'row', gap: 16 },
  statRowNext: { marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth },
  stat: { flex: 1, minWidth: 0 },
  statValue: { ...Type.section, fontVariant: ['tabular-nums'] },
  statLabel: { marginTop: 2, fontSize: 13, lineHeight: 18, fontWeight: '400' },
  statWeek: { marginTop: 4, fontSize: 12, fontWeight: '700' },
  group: { marginTop: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, gap: 8 },
  groupLabel: { ...Type.label },
  groupLine: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupValue: { flex: 1, minWidth: 0, fontSize: 14, fontWeight: '700' },
  groupCount: { fontSize: 13, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
