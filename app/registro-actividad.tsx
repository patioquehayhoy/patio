import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/avatar-circle';
import { localMenuDate } from '@/lib/menu-date';
import { activityDay, activityTime, describeActivity, getActivity, type ActivityEntry } from '@/lib/team';
import { Type, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { usePullRefresh } from '@/lib/use-pull-refresh';
import { getFonditaId } from '@/lib/user-store';

// Registro de actividad (Equipo): quién publicó o cambió algo y a qué hora,
// como el de Meta y Square. Lo ven quienes manejan el equipo; quien come
// nunca ve quién fue. Cada persona con su nombre, nunca «Tú».
export default function RegistroActividadScreen() {
  const { theme } = useTheme();
  const s = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const negocioId = getFonditaId();
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [more, setMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    if (!negocioId) { setLoading(false); return; }
    try {
      const rows = await getActivity(negocioId);
      setEntries(rows);
      setMore(rows.length >= 60);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [negocioId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const pull = usePullRefresh(load);

  const loadMore = async () => {
    if (!negocioId || loadingMore || !entries.length) return;
    setLoadingMore(true);
    try {
      const rows = await getActivity(negocioId, entries[entries.length - 1].at);
      setEntries((current) => [...current, ...rows]);
      setMore(rows.length >= 60);
    } catch {
      // Se queda lo que ya se ve; el botón sigue para volver a intentar.
    } finally {
      setLoadingMore(false);
    }
  };

  const groups = useMemo(() => {
    const today = localMenuDate();
    const yesterday = localMenuDate(new Date(Date.now() - 86_400_000));
    const byDay = new Map<string, ActivityEntry[]>();
    for (const entry of entries) {
      const day = activityDay(entry.at);
      byDay.set(day, [...(byDay.get(day) ?? []), entry]);
    }
    return [...byDay.entries()].map(([day, items]) => ({
      day,
      label: day === today ? 'Hoy' : day === yesterday ? 'Ayer'
        : new Date(`${day}T12:00:00`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
      items,
    }));
  }, [entries]);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/equipo')} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={s.navTitle}>Registro de actividad</Text>
        <View style={s.navButton} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={theme.textSecondary} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator style={{ marginTop: 32 }} color={theme.textSecondary} accessibilityLabel="Cargando el registro" /> : failed ? (
          <TouchableOpacity onPress={() => { setLoading(true); void load(); }} accessibilityRole="button" style={s.retry}>
            <Text style={{ color: theme.accent, fontSize: 15 }}>{noWidow('No pudimos cargar el registro. Reintentar.')}</Text>
          </TouchableOpacity>
        ) : groups.length === 0 ? (
          <View style={s.empty}>
            <Ionicons name="time-outline" size={28} color={theme.textMute} />
            <Text style={s.emptyTitle}>{noWidow('Todavía no hay cambios')}</Text>
            <Text style={s.emptyBody}>{noWidow('Cuando alguien del equipo publique, marque lo que se acabó o cambie algo, aparecerá aquí con su nombre y la hora.')}</Text>
          </View>
        ) : (
          <>
            {groups.map((group, groupIndex) => (
              <View key={group.day} style={{ marginTop: groupIndex === 0 ? 0 : 24 }}>
                <Text style={s.groupLabel}>{group.label}</Text>
                <View style={s.list}>
                  {group.items.map((entry, index) => {
                    const what = describeActivity(entry);
                    const time = activityTime(entry.at);
                    return (
                      <View key={entry.id} style={[s.row, index > 0 && s.rowDivider]} accessible accessibilityLabel={`${entry.name} ${what}, ${time}`}>
                        <AvatarCircle name={entry.name} backgroundColor={theme.surface2} textColor={theme.textSecondary} size={32} />
                        <View style={s.rowBody}>
                          <Text style={s.rowText}><Text style={s.rowAuthor}>{entry.name}</Text> {what}</Text>
                          <Text style={s.rowTime}>{time}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))}
            {more && (
              <TouchableOpacity style={s.more} onPress={() => { void loadMore(); }} disabled={loadingMore} accessibilityRole="button" accessibilityLabel="Ver anteriores">
                {loadingMore ? <ActivityIndicator color={theme.textSecondary} /> : <Text style={{ color: theme.accent, fontSize: 15, fontWeight: '500' }}>Ver anteriores</Text>}
              </TouchableOpacity>
            )}
            <Text style={s.footnote}>{noWidow('Se guardan los últimos 180 días.')}</Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    navTitle: { flexShrink: 1, fontSize: 17, lineHeight: 22, fontWeight: '700', color: t.text, textAlign: 'center' },
    retry: { minHeight: 44, justifyContent: 'center', marginTop: 16 },
    groupLabel: { ...Type.label, color: t.textSecondary, marginBottom: 8 },
    list: { borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden', backgroundColor: t.surface },
    row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    rowBody: { flex: 1, minWidth: 0 },
    rowText: { fontSize: 14, lineHeight: 20, fontWeight: '400', color: t.text },
    rowAuthor: { fontWeight: '700' },
    rowTime: { marginTop: 2, fontSize: 12, lineHeight: 16, color: t.textSecondary },
    more: { marginTop: 16, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    footnote: { marginTop: 16, fontSize: 12, lineHeight: 16, color: t.textSecondary, textAlign: 'center' },
    empty: { marginTop: 24, padding: 24, borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center' },
    emptyTitle: { marginTop: 14, ...Type.section, color: t.text, textAlign: 'center' },
    emptyBody: { maxWidth: 280, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20, color: t.textSecondary },
  });
}
