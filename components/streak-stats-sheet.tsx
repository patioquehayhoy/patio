import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPeakTime, getProStatus } from '@/lib/business-pro';
import { getBusinessInsights, getDishLikeCounts, type BusinessInsights, type DishLikeCount } from '@/lib/business-stats';
import { fonderoPalette } from '@/lib/fondero-palette';
import { isVerticalSheetDrag, SHEET_DISMISS_MS, SHEET_SPRING, shouldDismissSheet } from '@/lib/sheet-motion';
import { localMenuDate } from '@/lib/menu-date';
import { getFonditaId } from '@/lib/menu-store';
import { Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Al tocar la racha: cómo va tu negocio en Patio, en una sola hoja. La racha
// es la razón diaria para volver (lado difícil de la red); junto a ella van
// los números que dicen si publicar está sirviendo. Misma hoja que el detalle
// de «me gusta» (dish-like-detail-sheet) y mismos estilos que el tablero de
// Actividad (resenas.tsx): números en Type.section, etiquetas Type.label.

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
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      translateY.setValue(screenHeight);
      setRendered(true);
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    } else if (rendered) {
      Animated.timing(translateY, { toValue: screenHeight, duration: SHEET_DISMISS_MS, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, screenHeight]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => isVerticalSheetDrag(gesture.dx, gesture.dy),
    onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_event, gesture) => {
      if (shouldDismissSheet(gesture.dy, gesture.vy)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onClose();
        return;
      }
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    },
    onPanResponderTerminate: () => { Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start(); },
  })).current;
  const backdropOpacity = translateY.interpolate({ inputRange: [0, screenHeight], outputRange: [1, 0], extrapolate: 'clamp' });

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

  const open = (path: '/resenas') => { onClose(); router.push(path); };

  if (!rendered) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Cerrar">
          <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[s.sheet, { maxHeight: screenHeight * 0.85, paddingBottom: insets.bottom || 20, transform: [{ translateY }] }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={[s.tint, { backgroundColor: theme.isDark ? 'rgba(20,21,24,0.72)' : 'rgba(255,255,255,0.70)' }]} />
          <View {...pan.panHandlers} style={s.handleArea}>
            <View style={s.grabber} />
          </View>
          <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
            {/* Identidad de la hoja: la racha manda (número de marca), lo
                demás la acompaña en el ritmo del tablero de Actividad. */}
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

            <TouchableOpacity style={s.link} activeOpacity={0.7} onPress={() => open('/resenas')} accessibilityRole="button">
              <Text style={[s.linkText, { color: c.text }]}>{noWidow('Ver toda tu actividad')}</Text>
              <Ionicons name="chevron-forward" size={16} color={c.textMute} />
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
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
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  tint: StyleSheet.absoluteFillObject,
  handleArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.4)' },
  scroll: { flexShrink: 1 },
  content: { paddingHorizontal: 20, paddingTop: 8 },
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
  link: { minHeight: 52, marginTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  linkText: { ...Type.body },
});
