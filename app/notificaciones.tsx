import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/avatar-circle';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { usePullRefresh } from '@/lib/use-pull-refresh';
import { bottomTabClearance } from '@/lib/layout-metrics';
import { formatLikeAuthors, markReviewLikesSeen } from '@/lib/activity-feed';
import { getDemoReviewLikeEvents, getMyReviewLikeEvents, type MyReviewLikeEvent } from '@/lib/review-likes';
import { commentTimeLabel, getMyCommentEvents, type MyCommentEvent } from '@/lib/review-comments';
import { acceptFollowRequest, declineFollowRequest, getFollowRequests, type FollowRequest } from '@/lib/profile-privacy';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Type, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Espejo de app/resenas.tsx (Actividad, Fondero) del lado Foodie: la misma
// reciprocidad, aplicada a quien escribe una reseña en vez de a quien
// publica un menú — grounded en The Cold Start Problem (compromiso mutuo en
// ambos lados de la red, no solo en el lado que publica).
type ActivityEvent =
  | ({ type: 'like' } & MyReviewLikeEvent)
  | ({ type: 'comment'; daysAgo: number } & MyCommentEvent);

export default function NotificacionesScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const { onScroll } = useTabBarScroll();
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [answering, setAnswering] = useState<string | null>(null);
  // Likes, comentarios y respuestas en una sola línea de tiempo; las
  // solicitudes para seguirte van primero porque esperan una respuesta.
  const load = useCallback(() => {
    markReviewLikesSeen().catch(() => {});
    const now = Date.now();
    return Promise.all([
      getMyReviewLikeEvents().catch(() => [] as MyReviewLikeEvent[]),
      getMyCommentEvents().catch(() => [] as MyCommentEvent[]),
      getFollowRequests().catch(() => [] as FollowRequest[]),
    ]).then(([likes, comments, pending]) => {
      const likeEvents = (likes.length || comments.length ? likes : getDemoReviewLikeEvents('foodie-demo'))
        .map((event): ActivityEvent => ({ type: 'like', ...event }));
      const commentEvents = comments.map((event): ActivityEvent => ({
        type: 'comment', ...event, daysAgo: Math.max(0, Math.floor((now - new Date(event.createdAt).getTime()) / 86400000)),
      }));
      setEvents([...commentEvents, ...likeEvents].sort((a, b) => a.daysAgo - b.daysAgo));
      setRequests(pending);
    });
  }, []);

  const answer = async (request: FollowRequest, accept: boolean) => {
    if (answering) return;
    setAnswering(request.followerId);
    try {
      if (accept) await acceptFollowRequest(request.followerId);
      else await declineFollowRequest(request.followerId);
      setRequests((current) => current.filter((item) => item.followerId !== request.followerId));
    } catch {
      Alert.alert(noWidow('No se guardó tu respuesta'), noWidow('Revisa tu conexión e inténtalo de nuevo.'));
    } finally {
      setAnswering(null);
    }
  };
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const pull = usePullRefresh(load);

  // Mismo agrupado por periodo que ya usan Menús y Actividad — mismas
  // etiquetas, mismos cortes de días, misma regla de ocultar el label si
  // todo cae en un solo periodo.
  const groups = (() => {
    if (events.length === 0) return [];
    const buckets = [
      { key: 'week', label: 'Esta semana', items: [] as ActivityEvent[] },
      { key: 'month', label: 'Este mes', items: [] as ActivityEvent[] },
      { key: 'older', label: 'Anteriores', items: [] as ActivityEvent[] },
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
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[s.navTitle, { color: theme.text }]}>Actividad</Text>
        <View style={s.navButton} />
      </View>
      <ScrollView
        refreshControl={<RefreshControl refreshing={pull.refreshing} onRefresh={pull.onRefresh} tintColor={theme.textSecondary} />}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomTabClearance(insets.bottom) }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={onScroll}>
        {!!requests.length && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[s.groupLabel, { color: theme.textSecondary }]}>{noWidow('Solicitudes para seguirte')}</Text>
            <View style={[s.list, { borderColor: theme.border, marginTop: 10 }]}>
              {requests.map((request, index) => (
                <View key={request.followerId} style={[s.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Ver perfil de ${request.name}`} onPress={() => router.push({ pathname: '/foodie/[id]', params: { id: request.followerId } })}>
                    <AvatarCircle name={request.name} avatarUrl={request.avatarUrl} backgroundColor={theme.surface2} textColor={theme.textSecondary} />
                  </TouchableOpacity>
                  <View style={s.rowBody}>
                    <Text style={[s.rowText, { color: theme.text }]}><Text style={s.rowAuthor}>{request.name}</Text> quiere seguirte</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.requestPrimary, { backgroundColor: theme.text, opacity: answering === request.followerId ? 0.5 : 1 }]}
                    disabled={!!answering}
                    onPress={() => { void answer(request, true); }}
                    accessibilityRole="button"
                    accessibilityLabel={`Confirmar a ${request.name}`}>
                    <Text style={[s.requestPrimaryText, { color: theme.bg }]}>Confirmar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.requestSecondary, { borderColor: theme.border, opacity: answering === request.followerId ? 0.5 : 1 }]}
                    disabled={!!answering}
                    onPress={() => { void answer(request, false); }}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar la solicitud de ${request.name}`}>
                    <Text style={[s.requestSecondaryText, { color: theme.text }]}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
        {groups.length ? (
          groups.map((group, groupIndex) => (
            <View key={group.key} style={{ marginTop: groupIndex === 0 ? 0 : 24 }}>
              {showGroupLabels && <Text style={[s.groupLabel, { color: theme.textSecondary }]}>{noWidow(group.label)}</Text>}
              <View style={[s.list, { borderColor: theme.border, marginTop: showGroupLabels ? 10 : 0 }]}>
                {group.items.map((event, index) => event.type === 'comment' ? (
                  <TouchableOpacity
                    key={event.id}
                    style={[s.row, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
                    onPress={() => { if (event.fonditaId) router.push({ pathname: '/patio/[id]', params: { id: event.fonditaId } }); }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Ver ${event.fonditaName}`}>
                    <AvatarCircle name={event.author} avatarUrl={event.avatarUrl} backgroundColor={theme.surface2} textColor={theme.textSecondary} />
                    <View style={s.rowBody}>
                      <Text style={[s.rowText, { color: theme.text }]} numberOfLines={3}>
                        <Text style={s.rowAuthor}>{event.author}</Text>{event.kind === 'reply' ? ' te respondió: ' : ' comentó tu reseña: '}{event.body}
                      </Text>
                      <Text style={[s.rowTime, { color: theme.textMute }]}>{commentTimeLabel(event.createdAt)} · {event.fonditaName}</Text>
                    </View>
                    <Ionicons name="chatbubble" size={15} color={theme.accent} />
                  </TouchableOpacity>
                ) : (
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
              {noWidow('Cuando alguien comente o le guste una reseña tuya, aparecerá aquí.')}
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
    nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    navTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
    groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },

    list: { borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    rowBody: { flex: 1, minWidth: 0 },
    rowText: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
    rowAuthor: { fontWeight: '700' },
    rowTime: { marginTop: 3, fontSize: 12, fontWeight: '400' },
    requestPrimary: { minHeight: 32, paddingHorizontal: 12, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
    requestPrimaryText: { fontSize: 13, fontWeight: '700' },
    requestSecondary: { minHeight: 32, paddingHorizontal: 12, borderRadius: 14, borderCurve: 'continuous', borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
    requestSecondaryText: { fontSize: 13, fontWeight: '700' },

    empty: { marginTop: 34, padding: 24, borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
    emptyTitle: { marginTop: 14, ...Type.section, textAlign: 'center' },
    emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  });
}
