import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { AvatarCircle } from '@/components/avatar-circle';
import type { FollowingActivity } from '@/lib/profile-privacy';
import { Radius, Type, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// «De quienes sigues»: fila que se desliza de lado arriba de Patios con lo
// reciente de las personas que sigues.

const CARD_WIDTH = 232;
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
                <Text style={s.activityText} allowFontScaling>
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
    // Etiqueta de grupo del sistema (Type.label), como en Actividad.
    label: { ...Type.label, color: t.textSecondary, paddingHorizontal: 16, paddingTop: 8, marginBottom: 8 },
    row: { paddingHorizontal: 16, gap: 8 },
    card: { width: CARD_WIDTH, padding: 12, borderRadius: Radius.card, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    activityCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    activityBody: { flex: 1, minWidth: 0, gap: 2 },
    activityText: { fontSize: 13, fontWeight: '400', lineHeight: 17, color: t.text },
    actor: { fontWeight: '700' },
    activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: 12, fontWeight: '400', color: t.textSecondary },
  });
}
