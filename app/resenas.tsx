import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { useMenuHistoryController } from '@/lib/controllers/useMenuHistoryController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { getFonditaId, getFonditaName } from '@/lib/menu-store';
import { getDemoPatioStats } from '@/lib/patio-stats';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export default function ResenasScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { menus } = useMenuHistoryController();
  const { onScroll } = useTabBarScroll();

  // Sin backend real todavía (ver docs/TASKS.md ciclo 2026-07-23): sintético
  // y solo en __DEV__, visible cuando ya publicó al menos un menú antes.
  const stats = menus.length > 0 ? getDemoPatioStats(getFonditaId() || getFonditaName() || 'demo') : null;

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: c.accent }]}>MI PATIO</Text>
        <Text style={[s.title, { color: c.text }]}>Actividad</Text>
        <Text style={[s.subtitle, { color: c.textSecondary }]}>{noWidow('Cómo responde la gente a lo que publicas.')}</Text>

        {stats ? (
          <>
            <Text style={[s.sectionLabel, { color: c.textMute }]}>RESEÑAS RECIENTES</Text>
            <View style={[s.list, { borderColor: c.border }]}>
              {stats.reviews.map((review, index) => (
                <View
                  key={`${review.author}-${index}`}
                  style={[s.reviewCard, index > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <View style={s.reviewHead}>
                    <View style={s.starsRow}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Ionicons
                          key={n}
                          name={n <= review.stars ? 'star' : 'star-outline'}
                          size={13}
                          color={n <= review.stars ? c.accent : c.textMute}
                        />
                      ))}
                    </View>
                    <Text style={[s.reviewMeta, { color: c.textMute }]}>{review.author} · hace {review.daysAgo}d</Text>
                  </View>
                  <View style={s.tagsRow}>
                    {review.tags.map((tag) => (
                      <View key={tag} style={[s.tag, { backgroundColor: c.iconBg }]}>
                        <Text style={[s.tagText, { color: c.textSecondary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={[s.reviewNote, { color: c.text }]}>{review.note}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={[s.empty, { borderColor: c.border }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={c.textMute} />
            <Text style={[s.emptyTitle, { color: c.text }]}>Aún no hay nada que mostrar</Text>
            <Text style={[s.emptyBody, { color: c.textSecondary }]}>
              {noWidow('Cuando alguien deje una reseña en tu perfil, aparecerá aquí.')}
            </Text>
          </View>
        )}
      </ScrollView>
      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 34, lineHeight: 37, fontWeight: '900', letterSpacing: -1.2, fontFamily: Fonts.brand },
  subtitle: { marginTop: 8, fontSize: 14, lineHeight: 20 },

  sectionLabel: { marginTop: 28, marginBottom: 8, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase' },
  list: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  reviewCard: { paddingHorizontal: 16, paddingVertical: 14 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewMeta: { fontSize: 11.5, fontWeight: '300' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  tagText: { fontSize: 11, fontWeight: '500' },
  reviewNote: { marginTop: 8, fontSize: 13.5, lineHeight: 19, fontWeight: '300' },

  empty: { marginTop: 34, padding: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '800' },
  emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
