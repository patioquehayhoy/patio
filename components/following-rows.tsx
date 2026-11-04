import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AvatarCircle } from '@/components/avatar-circle';
import type { Patio } from '@/lib/patios';
import type { FollowingActivity } from '@/lib/profile-privacy';
import { Radius, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Dos filas que se deslizan de lado arriba de Guardados: lo que publicaron
// hoy los lugares que sigues y lo reciente de las personas que sigues.
// Comparten tarjeta, título y ritmo.

const CARD_WIDTH = 232;
const MAX_DISHES = 3;

function todayDishes(patio: Patio) {
  return patio.menu.flatMap((section) => section.items
    .filter((item) => item.name.trim())
    .map((item) => ({ name: item.name.trim(), price: item.price?.trim() || section.price?.trim() || '' })));
}

export function hasTodayDishes(patio: Patio): boolean {
  return !!patio.hasTodayMenu && todayDishes(patio).length > 0;
}

export function TodayFromFollowed({ patios, onOpen }: { patios: Patio[]; onOpen: (patio: Patio) => void }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const published = patios.filter(hasTodayDishes);
  if (!published.length) return null;
  return (
    <View style={s.block}>
      <Text style={s.label} allowFontScaling>HOY DE LOS QUE SIGUES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row} decelerationRate="fast" snapToInterval={CARD_WIDTH + 8} snapToAlignment="start">
        {published.map((patio) => {
          const dishes = todayDishes(patio);
          const more = dishes.length - MAX_DISHES;
          return (
            <TouchableOpacity key={patio.id} style={s.card} activeOpacity={0.7} onPress={() => onOpen(patio)}
              accessibilityRole="button"
              accessibilityLabel={`${patio.name}, menú de hoy: ${dishes.slice(0, MAX_DISHES).map((dish) => dish.name).join(', ')}`}>
              <Text style={s.cardTitle} numberOfLines={1} allowFontScaling>{patio.name}</Text>
              <View style={s.dishes}>
                {dishes.slice(0, MAX_DISHES).map((dish, index) => (
                  <View key={`${dish.name}-${index}`} style={s.dish}>
                    <Text style={s.dishName} numberOfLines={1} allowFontScaling>{dish.name}</Text>
                    {!!dish.price && <Text style={s.dishPrice} numberOfLines={1} allowFontScaling>{dish.price}</Text>}
                  </View>
                ))}
              </View>
              {more > 0 && <Text style={s.more} allowFontScaling>{`y ${more} más`}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function activityText(event: FollowingActivity): string {
  if (event.kind === 'follow') return `siguió ${event.placeName}`;
  if (event.kind === 'list') return `armó la lista «${event.listTitle}»`;
  return `calificó ${event.placeName} con ${event.stars} ${event.stars === 1 ? 'estrella' : 'estrellas'}`;
}

function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'ayer' : `hace ${days} días`;
}

export function FollowingActivityRow({ events, onOpen }: { events: FollowingActivity[]; onOpen: (event: FollowingActivity) => void }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  if (!events.length) return null;
  return (
    <View style={s.block}>
      <Text style={s.label} allowFontScaling>DE QUIENES SIGUES</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row} decelerationRate="fast" snapToInterval={CARD_WIDTH + 8} snapToAlignment="start">
        {events.map((event) => {
          const text = activityText(event);
          return (
            <TouchableOpacity key={event.key} style={[s.card, s.activityCard]} activeOpacity={0.7} onPress={() => onOpen(event)}
              accessibilityRole="button" accessibilityLabel={`${event.actorName} ${text}, ${timeAgo(event.at)}`}>
              <AvatarCircle name={event.actorName} avatarUrl={event.avatarUrl} backgroundColor={theme.iconBg} textColor={theme.textSecondary} size={36} />
              <View style={s.activityBody}>
                <Text style={s.activityText} numberOfLines={2} allowFontScaling>
                  <Text style={s.actor}>{event.actorName}</Text>{' '}{noWidow(text)}
                </Text>
                <View style={s.activityMeta}>
                  <Ionicons name={event.kind === 'list' ? 'list-outline' : event.kind === 'review' ? 'star-outline' : 'add-circle-outline'} size={12} color={theme.textSecondary} />
                  <Text style={s.metaText} allowFontScaling>{timeAgo(event.at)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    block: { paddingBottom: 16 },
    // Mismo estilo que «CERCA DE TI» / «GUARDADOS» del panel.
    label: { fontSize: 13, fontWeight: '700', color: t.textSecondary, paddingHorizontal: 16, paddingTop: 8, marginBottom: 8 },
    row: { paddingHorizontal: 16, gap: 8 },
    card: { width: CARD_WIDTH, padding: 12, borderRadius: Radius.card, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    cardTitle: { fontSize: 15, fontWeight: '700', color: t.text },
    dishes: { marginTop: 6, gap: 2 },
    dish: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
    dishName: { flex: 1, fontSize: 13, fontWeight: '400', color: t.text },
    dishPrice: { fontSize: 13, fontWeight: '500', color: t.textSecondary, fontVariant: ['tabular-nums'] },
    more: { marginTop: 4, fontSize: 12, fontWeight: '400', color: t.textSecondary },
    activityCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    activityBody: { flex: 1, minWidth: 0, gap: 2 },
    activityText: { fontSize: 13, fontWeight: '400', lineHeight: 17, color: t.text },
    actor: { fontWeight: '700' },
    activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '400', color: t.textSecondary },
  });
}
