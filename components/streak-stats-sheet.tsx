import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/glass-button';
import { getPeakTime, getProStatus } from '@/lib/business-pro';
import { getBusinessInsights, getDishLikeCounts, type BusinessInsights, type DishLikeCount } from '@/lib/business-stats';
import { fonderoPalette } from '@/lib/fondero-palette';
import { localMenuDate } from '@/lib/menu-date';
import { getFonditaId } from '@/lib/menu-store';
import { Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Al tocar la racha: cómo va tu negocio en Patio, en una sola hoja. La racha
// es la razón diaria para volver (lado difícil de la red); junto a ella van
// los números que dicen si publicar está sirviendo.

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

export function StreakStatsSheet({ visible, onClose, streak, publishedDates }: {
  visible: boolean;
  onClose: () => void;
  streak: number;
  publishedDates: string[];
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const [insights, setInsights] = useState<BusinessInsights | null>(null);
  const [topDish, setTopDish] = useState<DishLikeCount | null>(null);
  const [peak, setPeak] = useState<{ day: string; hour: number } | null>(null);
  const [hasPro, setHasPro] = useState(false);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible]);

  const month = localMenuDate().slice(0, 7);
  const thisMonth = new Set(publishedDates.filter((fecha) => fecha.startsWith(month))).size;
  const best = Math.max(bestStreak(publishedDates), streak);
  const publishedToday = publishedDates.includes(localMenuDate());
  const days = (n: number) => `${n} ${n === 1 ? 'día' : 'días'}`;

  const open = (path: '/resenas' | '/plan') => { onClose(); router.push(path); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: c.bg }]}>
        <View style={s.nav}>
          <View style={s.navSide} />
          <Text style={[s.navTitle, { color: c.text }]}>Tu racha</Text>
          <View style={s.navSide}><GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={onClose} /></View>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
          <View style={s.hero} accessible accessibilityLabel={`${days(streak)} seguidos publicando`}>
            <Ionicons name="flame" size={28} color={c.accent} />
            <Text style={[s.heroValue, { color: c.text }]}>{days(streak)}</Text>
            <Text style={[s.heroSub, { color: c.textSecondary }]}>
              {noWidow(publishedToday ? 'Hoy ya publicaste. Mañana la sigues.' : 'Publica hoy para no perderla.')}
            </Text>
          </View>

          <View style={[s.grid, { borderColor: c.border }]}>
            <Stat label="Mejor racha" value={days(best)} c={c} />
            <Stat label="Publicados este mes" value={String(thisMonth)} c={c} />
            <Stat label="Seguidores" value={insights ? String(insights.saves) : '—'} week={insights?.savesWeek} c={c} />
            <Stat label="Me gusta en platillos" value={insights ? String(insights.dishLikes) : '—'} week={insights?.dishLikesWeek} c={c} />
          </View>

          {!!topDish && (
            <View style={[s.row, { borderColor: c.border }]}>
              <Text style={[s.rowLabel, { color: c.textSecondary }]}>LO QUE MÁS GUSTA</Text>
              <View style={s.rowValueLine}>
                <Text style={[s.rowValue, { color: c.text }]} numberOfLines={1}>{topDish.displayName}</Text>
                <Ionicons name="heart" size={13} color={c.accent} />
                <Text style={[s.rowMeta, { color: c.textSecondary }]}>{topDish.likes}</Text>
              </View>
            </View>
          )}

          <TouchableOpacity style={[s.row, { borderColor: c.border }]} activeOpacity={0.7} disabled={hasPro} onPress={() => open('/plan')}
            accessibilityRole={hasPro ? undefined : 'button'}>
            <Text style={[s.rowLabel, { color: c.textSecondary }]}>CUÁNDO HAY MÁS INTERÉS</Text>
            <View style={s.rowValueLine}>
              <Text style={[s.rowValue, { color: hasPro ? c.text : c.textSecondary }]} numberOfLines={2}>
                {noWidow(hasPro ? (peak ? `Los ${peak.day} de ${peak.hour} a ${peak.hour + 1} h` : 'Aún juntamos datos de tu semana') : 'Disponible con Pro')}
              </Text>
              {!hasPro && <Ionicons name="chevron-forward" size={16} color={c.textMute} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={s.link} activeOpacity={0.7} onPress={() => open('/resenas')} accessibilityRole="button">
            <Text style={[s.linkText, { color: c.text }]}>{noWidow('Ver toda tu actividad')}</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMute} />
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

function Stat({ label, value, week, c }: { label: string; value: string; week?: number; c: ReturnType<typeof fonderoPalette> }) {
  return (
    <View style={s.stat} accessible accessibilityLabel={`${label}: ${value}${week ? `, ${week} esta semana` : ''}`}>
      <Text style={[s.statValue, { color: c.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: c.textSecondary }]}>{noWidow(label)}</Text>
      {!!week && <Text style={[s.statWeek, { color: c.accent }]}>{`+${week} esta semana`}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  navSide: { width: 44, alignItems: 'flex-end' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700' },
  hero: { alignItems: 'center', paddingTop: 16, paddingBottom: 24, gap: 4 },
  heroValue: { ...Type.screen, marginTop: 8 },
  heroSub: { fontSize: 15, lineHeight: 20, fontWeight: '400', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  stat: { width: '50%', paddingVertical: 12, gap: 2 },
  statValue: { fontSize: 22, lineHeight: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 13, lineHeight: 17, fontWeight: '400' },
  statWeek: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  row: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, gap: 4 },
  rowLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  rowValueLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  rowValue: { flexShrink: 1, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  rowMeta: { fontSize: 13, fontWeight: '400' },
  link: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkText: { fontSize: 16, fontWeight: '400' },
});
