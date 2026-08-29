import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/avatar-circle';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { formatLikeAuthors, markReviewLikesSeen } from '@/lib/activity-feed';
import { getDemoReviewLikeEvents, getMyReviewLikeEvents, type MyReviewLikeEvent } from '@/lib/review-likes';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Espejo de app/resenas.tsx (Actividad, Fondero) del lado Foodie: la misma
// reciprocidad, aplicada a quien escribe una reseña en vez de a quien
// publica un menú — grounded en The Cold Start Problem (compromiso mutuo en
// ambos lados de la red, no solo en el lado que publica).
export default function NotificacionesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [events, setEvents] = useState<MyReviewLikeEvent[]>([]);
  const load = useCallback(() => {
    markReviewLikesSeen().catch(() => {});
    getMyReviewLikeEvents()
      .then((real) => setEvents(real.length ? real : getDemoReviewLikeEvents('foodie-demo')))
      .catch(() => setEvents(getDemoReviewLikeEvents('foodie-demo')));
  }, []);
  useFocusEffect(load);

  // Mismo agrupado por periodo que ya usan Menús y Actividad — mismas
  // etiquetas, mismos cortes de días, misma regla de ocultar el label si
  // todo cae en un solo periodo.
  const groups = (() => {
    if (events.length === 0) return [];
    const buckets = [
      { key: 'week', label: 'Esta semana', items: [] as MyReviewLikeEvent[] },
      { key: 'month', label: 'Este mes', items: [] as MyReviewLikeEvent[] },
      { key: 'older', label: 'Anteriores', items: [] as MyReviewLikeEvent[] },
    ];
    for (const event of events) {
      const bucket = event.daysAgo < 7 ? buckets[0] : event.daysAgo < 31 ? buckets[1] : buckets[2];
      bucket.items.push(event);
    }
    return buckets.filter((bucket) => bucket.items.length > 0);
  })();
  const showGroupLabels = groups.length > 1;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
        {groups.length ? (
          groups.map((group, groupIndex) => (
            <View key={group.key} style={{ marginTop: groupIndex === 0 ? 0 : 24 }}>
              {showGroupLabels && <Text style={[s.groupLabel, { color: theme.textSecondary }]}>{noWidow(group.label)}</Text>}
              <View style={[s.list, { borderColor: theme.border, marginTop: showGroupLabels ? 10 : 0 }]}>
                {group.items.map((event, index) => (
                  <TouchableOpacity
                    key={`${event.reviewId}-${index}`}
                    style={[s.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
                    onPress={() => { if (event.fonditaId) router.push({ pathname: '/patio/[id]', params: { id: event.fonditaId } }); }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${event.fonditaName}`}>
                    <AvatarCircle
                      name={event.authors[0]?.name ?? '?'}
                      avatarUrl={event.authors[0]?.avatarUrl}
                      backgroundColor={theme.surface2}
                      textColor={theme.textSecondary}
                    />
                    <View style={s.rowBody}>
                      <Text style={[s.rowText, { color: theme.text }]}>
                        <Text style={s.rowAuthor}>{formatLikeAuthors(event.authors.map((author) => author.name))}</Text> le gustó tu reseña sobre <Text style={s.rowAuthor}>{event.fonditaName}</Text>
                      </Text>
                      <Text style={[s.rowTime, { color: theme.textMute }]}>{event.daysAgo === 0 ? 'Hoy' : `Hace ${event.daysAgo} ${event.daysAgo === 1 ? 'día' : 'días'}`}</Text>
                    </View>
                    <Ionicons name="heart" size={16} color={theme.accent} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        ) : (
          <View style={[s.empty, { borderColor: theme.border }]}>
            <Ionicons name="heart-outline" size={28} color={theme.textMute} />
            <Text style={[s.emptyTitle, { color: theme.text }]}>{noWidow('Aún no hay nada que mostrar')}</Text>
            <Text style={[s.emptyBody, { color: theme.textSecondary }]}>
              {noWidow('Cuando a alguien le guste una reseña tuya, aparecerá aquí.')}
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },

    list: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    rowBody: { flex: 1, minWidth: 0 },
    rowText: { fontSize: 13.5, lineHeight: 18, fontWeight: '400' },
    rowAuthor: { fontWeight: '700' },
    rowTime: { marginTop: 3, fontSize: 11.5, fontWeight: '400' },

    empty: { marginTop: 34, padding: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
    emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '800' },
    emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  });
}
