import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getBusinessToday, viewsComparison, type BusinessToday } from '@/lib/business-today';
import { useMenuHistoryController } from '@/lib/controllers/useMenuHistoryController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { localMenuDate } from '@/lib/menu-date';
import { getFonditaId } from '@/lib/menu-store';
import { Fonts, Radius, Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const INITIALS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const dateOf = (day: string) => new Date(`${day}T12:00:00`);

// «Hoy» (v4 §3), lo primero que ve el negocio al tocar el resumen de las
// 18:00: como Tiempo en pantalla y Salud, el número que decide con su
// comparación y su gráfica en una sola tarjeta; debajo, listas agrupadas
// con la etiqueta a la izquierda y el valor en una sola columna a la derecha.
export default function HoyScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { streak } = useMenuHistoryController();
  const [today, setToday] = useState<BusinessToday | null>(null);

  useFocusEffect(useCallback(() => {
    const id = getFonditaId();
    if (!id) return;
    let alive = true;
    getBusinessToday(id).then((value) => { if (alive) setToday(value); }).catch(() => {});
    return () => { alive = false; };
  }, []));

  const day = localMenuDate();
  const weekday = dateOf(day).getDay();
  const views = today?.viewsToday ?? 0;
  const comparison = today ? viewsComparison(views, today.viewsUsual, weekday) : null;
  const week = today?.week.length ? today.week : [];
  const top = Math.max(1, ...week.map((entry) => entry.views));
  const dateLabel = dateOf(day).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; onPress?: () => void }[] = [
    { icon: 'flame', label: 'Racha', value: `${streak} ${streak === 1 ? 'día' : 'días'}`, onPress: () => router.push('/racha') },
    { icon: 'person-add-outline', label: 'Seguidores nuevos', value: (today?.followersToday ?? 0).toLocaleString('es-MX') },
    { icon: 'heart-outline', label: 'Me gusta en platillos', value: (today?.dishLikesToday ?? 0).toLocaleString('es-MX') },
    { icon: 'star-outline', label: 'Reseñas nuevas', value: (today?.reviewsToday ?? 0).toLocaleString('es-MX'), onPress: () => router.push('/resenas') },
  ];

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={c.text} />
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
        <Text style={[s.title, { color: c.text }]} accessibilityRole="header">Hoy</Text>

        <View
          style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}
          accessible
          accessibilityLabel={[`Vistas de tu menú hoy: ${views} ${views === 1 ? 'persona' : 'personas'}`, comparison].filter(Boolean).join('. ')}>
          <View style={s.cardHead}>
            <Text style={[s.cardLabel, { color: c.textSecondary }]}>{noWidow('Vistas de tu menú')}</Text>
            <Text style={[s.cardDate, { color: c.textMute }]}>{dateLabel}</Text>
          </View>
          <View style={s.bigRow}>
            <Text style={[s.big, { color: c.text }]}>{views.toLocaleString('es-MX')}</Text>
            <Text style={[s.bigUnit, { color: c.textSecondary }]}>{views === 1 ? 'persona' : 'personas'}</Text>
          </View>
          {!!comparison && (
            <View style={s.compareRow}>
              <Text style={[s.compare, { color: views >= (today?.viewsUsual ?? 0) ? c.accent : c.textSecondary }]}>{noWidow(comparison)}</Text>
              <Text style={[s.usual, { color: c.textMute }]}>{`prom. ${Math.round(today?.viewsUsual ?? 0).toLocaleString('es-MX')}`}</Text>
            </View>
          )}
          {!!week.length && (
            <View style={s.bars}>
              {week.map((entry) => {
                const isToday = entry.day === day;
                return (
                  <View key={entry.day} style={s.barColumn}>
                    <View style={s.barTrack}>
                      <View style={[s.bar, { height: `${Math.max(4, (entry.views / top) * 100)}%` as `${number}%`, backgroundColor: isToday ? c.accent : c.border }]} />
                    </View>
                    <Text style={[s.barDay, { color: isToday ? c.text : c.textMute }]} allowFontScaling={false}>{INITIALS[dateOf(entry.day).getDay()]}</Text>
                  </View>
                );
              })}
            </View>
          )}
          {!today && <Text style={[s.empty, { color: c.textSecondary }]}>{noWidow('Cuando la gente vea tu menú, aquí verás cuántas personas fueron.')}</Text>}
        </View>

        <Text style={[s.groupLabel, { color: c.textSecondary }]}>HOY TAMBIÉN</Text>
        <View style={[s.list, { backgroundColor: c.surface, borderColor: c.border }]}>
          {rows.map((row, index) => {
            const content = (
              <>
                <Ionicons name={row.icon} size={18} color={row.icon === 'flame' ? c.accent : c.textSecondary} />
                <Text style={[s.rowLabel, { color: c.text }]}>{noWidow(row.label)}</Text>
                <Text style={[s.rowValue, { color: c.text }]}>{row.value}</Text>
                {row.onPress && <Ionicons name="chevron-forward" size={15} color={c.textMute} />}
              </>
            );
            const style = [s.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }];
            return row.onPress
              ? <TouchableOpacity key={row.label} style={style} onPress={row.onPress} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel={`${row.label}, ${row.value}`}>{content}</TouchableOpacity>
              : <View key={row.label} style={style} accessible accessibilityLabel={`${row.label}, ${row.value}`}>{content}</View>;
          })}
        </View>

        {!!today?.topDishes.length && (
          <>
            <Text style={[s.groupLabel, { color: c.textSecondary }]}>LO QUE MÁS GUSTÓ</Text>
            <View style={[s.list, { backgroundColor: c.surface, borderColor: c.border }]}>
              {today.topDishes.map((dish, index) => (
                <View key={dish.name} style={[s.dishRow, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]} accessible accessibilityLabel={`${index + 1}. ${dish.name}, ${dish.likes} me gusta`}>
                  <Text style={[s.rank, { color: c.textMute }]}>{index + 1}</Text>
                  <Text style={[s.dishName, { color: c.text }]}>{noWidow(dish.name)}</Text>
                  <Ionicons name="heart" size={13} color={c.accent} style={s.dishHeart} />
                  <Text style={[s.dishLikes, { color: c.textSecondary }]}>{dish.likes.toLocaleString('es-MX')}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 4 },
  title: { ...Type.screen, marginBottom: 16 },
  card: { padding: 16, borderRadius: Radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  cardLabel: { flexShrink: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
  cardDate: { fontSize: 13, lineHeight: 18 },
  bigRow: { marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 8 },
  big: { fontFamily: Fonts.brand, fontSize: 40, lineHeight: 46, letterSpacing: -0.4, fontVariant: ['tabular-nums'] },
  bigUnit: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  compareRow: { marginTop: 2, flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  compare: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  usual: { fontSize: 13, lineHeight: 18, fontVariant: ['tabular-nums'] },
  bars: { marginTop: 16, height: 92, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  barColumn: { flex: 1, height: '100%', alignItems: 'center', gap: 6 },
  barTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 4, borderCurve: 'continuous' },
  barDay: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
  empty: { marginTop: 8, fontSize: 13, lineHeight: 18 },
  groupLabel: { ...Type.label, marginTop: 28, marginBottom: 8, marginLeft: 4 },
  list: { borderRadius: Radius.card, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 21, fontWeight: '400' },
  rowValue: { fontSize: 16, lineHeight: 21, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'right' },
  dishRow: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rank: { width: 18, fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: ['tabular-nums'] },
  dishName: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20, fontWeight: '400' },
  dishHeart: { marginTop: 4 },
  dishLikes: { minWidth: 22, fontSize: 15, lineHeight: 20, fontWeight: '600', fontVariant: ['tabular-nums'], textAlign: 'right' },
});
