import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/avatar-circle';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { DishLikeDetailSheet, type DishLikeAuthor } from '@/components/dish-like-detail-sheet';
import { formatLikeAuthors, markActivitySeen } from '@/lib/activity-feed';
import { getDishLikeDetail, getDishLikeEvents, type DishLikeEvent } from '@/lib/dish-likes';
import { fonderoPalette } from '@/lib/fondero-palette';
import { dateLabel, defaultHistoryTitle, useMenuHistoryController } from '@/lib/controllers/useMenuHistoryController';
import { getFonditaId, getFonditaName } from '@/lib/menu-store';
import { getPublicPatioReviews, replyToReview, type PublicPatioReview } from '@/lib/ratings';
import { getDemoPatioStats, type PatioStatsSnapshot } from '@/lib/patio-stats';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Una reseña trae texto y calificación propios — a diferencia de un "like"
// de Instagram, que no tiene contenido y por eso SÍ se puede fusionar en una
// fila ("Juan, María y 2 más..."). Fusionar reseñas reales perdería su texto
// y el botón Responder por evento; un like a un platillo (lib/dish-likes.ts)
// SÍ se fusiona, mismo criterio que usa Instagram (agrupa likes, nunca
// comentarios). Las dos conviven en una sola línea de tiempo, igual que en
// la pestaña de actividad real de Instagram.
type ActivityItem = {
  key: string;
  kind: 'review' | 'like';
  author: string;
  avatarUrl?: string;
  stars: number;
  note?: string;
  tags: string[];
  daysAgo: number;
  reviewId?: string;
  userId?: string;
  businessReply?: string;
  canReply: boolean;
  dishName?: string;
  likeCount?: number;
};

export default function ResenasScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { onScroll } = useTabBarScroll();
  const { menus } = useMenuHistoryController();
  const [reviews, setReviews] = useState<PublicPatioReview[]>([]);
  const [dishLikes, setDishLikes] = useState<DishLikeEvent[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [demo, setDemo] = useState<PatioStatsSnapshot | null>(null);
  const load = useCallback(() => {
    const fonditaId = getFonditaId();
    const demoSeed = fonditaId || getFonditaName() || 'patio-demo';
    setDemo(getDemoPatioStats(demoSeed));
    markActivitySeen().catch(() => {});
    if (!fonditaId) {
      setReviews([]);
      setDishLikes([]);
      return;
    }
    getPublicPatioReviews(fonditaId).then(setReviews).catch(() => setReviews([]));
    getDishLikeEvents(fonditaId).then(setDishLikes).catch(() => setDishLikes([]));
  }, []);
  useFocusEffect(load);
  const sendReply = async (item: ActivityItem) => {
    if (!item.reviewId || !reply.trim()) return;
    try {
      await replyToReview(item.reviewId, reply);
      setReply('');
      setReplyingTo(null);
      load();
    } catch {
      Alert.alert(noWidow('No se pudo responder'), noWidow('Intenta nuevamente cuando tengas conexión.'));
    }
  };

  // Nombre del MENÚ (no de la fecha en crudo) donde vivía el platillo ese
  // día — buscado fresco cada vez, nunca guardado: si renombras el menú
  // después, el detalle ya muestra el nombre nuevo solo, sin copia vieja.
  const menuLabelForFecha = (fecha: string) => {
    const menu = menus.find((m) => m.fecha === fecha);
    return menu ? (menu.nombre || defaultHistoryTitle(menu)) : dateLabel(fecha);
  };

  const [detailDish, setDetailDish] = useState<{ name: string; authors: DishLikeAuthor[] } | null>(null);
  const openDishLikeDetail = async (dishName: string) => {
    const fonditaId = getFonditaId();
    if (fonditaId) {
      const detail = await getDishLikeDetail(fonditaId, dishName).catch(() => null);
      if (detail) {
        setDetailDish({
          name: detail.dishName,
          authors: detail.authors.map((author) => ({ name: author.name, avatarUrl: author.avatarUrl, label: menuLabelForFecha(author.fecha) })),
        });
        return;
      }
    }
    // Demo/sin cuenta: junta todos los eventos de ejemplo de ese platillo
    // (puede haber más de uno) en vez de solo el grupo del día que se tocó.
    // No hay menú real que cruzar aquí — es texto relativo, no una fecha real.
    const authors = (demo?.dishLikes ?? [])
      .filter((event) => event.dishName === dishName)
      .flatMap((event) => event.authors.map((name) => ({
        name,
        label: event.daysAgo === 0 ? 'Hoy' : `Hace ${event.daysAgo} ${event.daysAgo === 1 ? 'día' : 'días'}`,
      })));
    setDetailDish({ name: dishName, authors });
  };

  const hasReal = reviews.length > 0 || dishLikes.length > 0;
  const items: ActivityItem[] = hasReal
    ? [
        ...reviews.map((review, index): ActivityItem => ({
          key: `review-${review.author}-${index}`,
          kind: 'review',
          author: review.author,
          avatarUrl: review.avatarUrl,
          stars: review.stars,
          note: review.note,
          tags: review.reasons ?? [],
          daysAgo: Math.max(0, Math.floor((Date.now() - review.timestamp) / 86400000)),
          reviewId: review.reviewId,
          userId: review.userId,
          businessReply: review.businessReply,
          canReply: true,
        })),
        ...dishLikes.map((event, index): ActivityItem => ({
          key: `like-${event.dishName}-${index}`,
          kind: 'like',
          author: formatLikeAuthors(event.authors.map((a) => a.name)),
          avatarUrl: event.authors[0]?.avatarUrl,
          stars: 0,
          tags: [],
          daysAgo: event.daysAgo,
          canReply: false,
          dishName: event.dishName,
          likeCount: event.count,
        })),
      ].sort((a, b) => a.daysAgo - b.daysAgo)
    : demo
    ? [
        ...demo.reviews.map((review, index): ActivityItem => ({
          key: `review-${review.author}-${index}`,
          kind: 'review',
          author: review.author,
          stars: review.stars,
          note: review.note,
          tags: review.tags,
          daysAgo: review.daysAgo,
          canReply: false,
        })),
        ...demo.dishLikes.map((event, index): ActivityItem => ({
          key: `like-${event.dishName}-${index}`,
          kind: 'like',
          author: formatLikeAuthors(event.authors),
          stars: 0,
          tags: [],
          daysAgo: event.daysAgo,
          canReply: false,
          dishName: event.dishName,
          likeCount: event.authors.length,
        })),
      ].sort((a, b) => a.daysAgo - b.daysAgo)
    : [];

  // Mismo agrupado por periodo que ya usa Menús (app/historial.tsx) — misma
  // etiqueta, mismos cortes de días, misma regla de ocultar el label si todo
  // cae en un solo periodo. Screens que resuelven el mismo problema
  // (ubicarse en el tiempo dentro de una lista) comparten el lenguaje.
  const groups = (() => {
    if (items.length === 0) return [];
    const buckets = [
      { key: 'week', label: 'Esta semana', items: [] as ActivityItem[] },
      { key: 'month', label: 'Este mes', items: [] as ActivityItem[] },
      { key: 'older', label: 'Anteriores', items: [] as ActivityItem[] },
    ];
    for (const item of items) {
      const bucket = item.daysAgo < 7 ? buckets[0] : item.daysAgo < 31 ? buckets[1] : buckets[2];
      bucket.items.push(item);
    }
    return buckets.filter((bucket) => bucket.items.length > 0);
  })();
  const showGroupLabels = groups.length > 1;

  const renderItem = (item: ActivityItem, index: number) => (
    <TouchableOpacity
      key={item.key}
      activeOpacity={item.kind === 'like' ? 0.7 : 1}
      disabled={item.kind !== 'like'}
      onPress={() => { if (item.dishName) openDishLikeDetail(item.dishName); }}
      style={[s.row, index > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
      <AvatarCircle name={item.author} avatarUrl={item.avatarUrl} backgroundColor={c.iconBg} textColor={c.textSecondary} />
      <View style={s.rowBody}>
        <View style={s.rowHead}>
          <Text style={[s.rowText, { color: c.text }]}>
            <Text style={s.rowAuthor}>{item.author}</Text>{item.kind === 'like'
              ? <> {item.likeCount === 1 ? 'le dio' : 'le dieron'} like a tu <Text style={s.rowAuthor}>{item.dishName}</Text></>
              : ' calificó tu menú'}
          </Text>
          <Text style={[s.rowTime, { color: c.textMute }]}>{item.daysAgo === 0 ? 'Hoy' : `${item.daysAgo}d`}</Text>
        </View>
        {item.kind === 'like' ? (
          <Ionicons name="heart" size={13} color={c.accent} style={{ marginTop: 6 }} />
        ) : (
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Ionicons key={n} name={n <= item.stars ? 'star' : 'star-outline'} size={12} color={n <= item.stars ? c.accent : c.textMute} />
            ))}
          </View>
        )}
        {!!item.note && <Text style={[s.reviewNote, { color: c.text }]}>{item.note}</Text>}
        {!!item.tags.length && (
          <View style={s.tagsRow}>
            {item.tags.map((tag) => (
              <View key={tag} style={[s.tag, { backgroundColor: c.iconBg }]}>
                <Text style={[s.tagText, { color: c.textSecondary }]}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {item.canReply && (
          !!item.businessReply ? (
            <View style={[s.replyBox, { borderLeftColor: c.accent }]}>
              <Text style={[s.replyLabel, { color: c.accent }]}>TU RESPUESTA</Text>
              <Text style={[s.reviewNote, { color: c.textSecondary }]}>{item.businessReply}</Text>
            </View>
          ) : replyingTo === item.userId ? (
            <View style={[s.replyComposer, { borderColor: c.border }]}>
              <TextInput autoFocus multiline maxLength={600} value={reply} onChangeText={setReply} placeholder="Responde con claridad y respeto…" placeholderTextColor={c.textMute} style={[s.replyInput, { color: c.text }]} />
              <TouchableOpacity onPress={() => sendReply(item)} disabled={!reply.trim()}><Text style={[s.replyAction, { color: reply.trim() ? c.accent : c.textMute }]}>{noWidow('Publicar respuesta')}</Text></TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={s.replyButton} onPress={() => { setReplyingTo(item.userId ?? null); setReply(''); }}>
              <Ionicons name="return-down-forward-outline" size={15} color={c.accent} />
              <Text style={[s.replyAction, { color: c.accent }]}>Responder</Text>
            </TouchableOpacity>
          )
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
        {groups.length ? (
          groups.map((group, groupIndex) => (
            <View key={group.key} style={{ marginTop: groupIndex === 0 ? 0 : 24 }}>
              {showGroupLabels && <Text style={[s.groupLabel, { color: c.textSecondary }]}>{noWidow(group.label)}</Text>}
              <View style={[s.list, { borderColor: c.border, marginTop: showGroupLabels ? 10 : 0 }]}>
                {group.items.map((item, index) => renderItem(item, index))}
              </View>
            </View>
          ))
        ) : (
          <View style={[s.empty, { borderColor: c.border }]}>
            <Ionicons name="heart-outline" size={28} color={c.textMute} />
            <Text style={[s.emptyTitle, { color: c.text }]}>{noWidow('Aún no hay nada que mostrar')}</Text>
            <Text style={[s.emptyBody, { color: c.textSecondary }]}>
              {noWidow('Cuando alguien deje una reseña en tu perfil, aparecerá aquí.')}
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomTabBar variant="fondero" />
      <DishLikeDetailSheet
        visible={!!detailDish}
        onClose={() => setDetailDish(null)}
        dishName={detailDish?.name ?? ''}
        authors={detailDish?.authors ?? []}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },

  list: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  // Fila estilo actividad de Instagram: avatar circular al frente, texto a
  // la derecha — nombre en bold seguido de la acción, hora a la derecha.
  row: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowBody: { flex: 1, minWidth: 0 },
  rowHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowText: { flex: 1, fontSize: 13.5, lineHeight: 18, fontWeight: '400' },
  rowAuthor: { fontWeight: '700' },
  rowTime: { fontSize: 11.5, fontWeight: '400' },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 6 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  tagText: { fontSize: 11, fontWeight: '500' },
  reviewNote: { marginTop: 8, fontSize: 13.5, lineHeight: 19, fontWeight: '400' },
  replyButton: { minHeight: 44, marginTop: 7, flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyAction: { fontSize: 13, fontWeight: '700' },
  replyBox: { marginTop: 12, paddingLeft: 12, borderLeftWidth: 2 },
  replyLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  replyComposer: { marginTop: 12, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  replyInput: { minHeight: 70, fontSize: 14, lineHeight: 19, textAlignVertical: 'top' },

  empty: { marginTop: 34, padding: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '800' },
  emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
