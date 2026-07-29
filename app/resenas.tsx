import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { fonderoPalette } from '@/lib/fondero-palette';
import { getFonditaId } from '@/lib/menu-store';
import { getPublicPatioReviews, replyToReview, type PublicPatioReview } from '@/lib/ratings';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export default function ResenasScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { onScroll } = useTabBarScroll();
  const [reviews, setReviews] = useState<PublicPatioReview[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const load = useCallback(() => {
    const fonditaId = getFonditaId();
    if (!fonditaId) return;
    getPublicPatioReviews(fonditaId).then(setReviews).catch(() => setReviews([]));
  }, []);
  useFocusEffect(load);
  const sendReply = async (review: PublicPatioReview) => {
    const fonditaId = getFonditaId();
    if (!fonditaId || !reply.trim()) return;
    try {
      await replyToReview(fonditaId, review.userId, reply);
      setReply('');
      setReplyingTo(null);
      load();
    } catch {
      Alert.alert('No se pudo responder', 'Intenta nuevamente cuando tengas conexión.');
    }
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 130 }} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: c.accent }]}>MI PATIO</Text>
        <Text style={[s.title, { color: c.text }]}>Actividad</Text>
        <Text style={[s.subtitle, { color: c.textSecondary }]}>{noWidow('Cómo responde la gente a lo que publicas.')}</Text>

        {reviews.length ? (
          <>
            <Text style={[s.sectionLabel, { color: c.textMute }]}>ACONTECIMIENTOS RECIENTES</Text>
            <View style={[s.list, { borderColor: c.border }]}>
              {reviews.map((review, index) => (
                <View
                  key={`${review.author}-${index}`}
                  style={[s.reviewCard, index > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <View style={s.eventHead}>
                    <View style={[s.eventIcon, { backgroundColor: c.iconBg }]}><Ionicons name="chatbubble-outline" size={15} color={c.accent} /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.eventTitle, { color: c.text }]}>{review.author} dejó una reseña</Text>
                      <Text style={[s.reviewMeta, { color: c.textMute }]}>{new Date(review.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</Text>
                    </View>
                  </View>
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
                  </View>
                  <View style={s.tagsRow}>
                    {(review.reasons ?? []).map((tag) => (
                      <View key={tag} style={[s.tag, { backgroundColor: c.iconBg }]}>
                        <Text style={[s.tagText, { color: c.textSecondary }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  {!!review.note && <Text style={[s.reviewNote, { color: c.text }]}>{review.note}</Text>}
                  {!!review.businessReply ? (
                    <View style={[s.replyBox, { borderLeftColor: c.accent }]}>
                      <Text style={[s.replyLabel, { color: c.accent }]}>TU RESPUESTA</Text>
                      <Text style={[s.reviewNote, { color: c.textSecondary }]}>{review.businessReply}</Text>
                    </View>
                  ) : replyingTo === review.userId ? (
                    <View style={[s.replyComposer, { borderColor: c.border }]}>
                      <TextInput autoFocus multiline maxLength={600} value={reply} onChangeText={setReply} placeholder="Responde con claridad y respeto…" placeholderTextColor={c.textMute} style={[s.replyInput, { color: c.text }]} />
                      <TouchableOpacity onPress={() => sendReply(review)} disabled={!reply.trim()}><Text style={[s.replyAction, { color: reply.trim() ? c.accent : c.textMute }]}>Publicar respuesta</Text></TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity style={s.replyButton} onPress={() => { setReplyingTo(review.userId); setReply(''); }}>
                      <Ionicons name="return-down-forward-outline" size={15} color={c.accent} />
                      <Text style={[s.replyAction, { color: c.accent }]}>Responder</Text>
                    </TouchableOpacity>
                  )}
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
  eventHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  eventIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  eventTitle: { fontSize: 14, fontWeight: '700' },
  starsRow: { flexDirection: 'row', gap: 2 },
  reviewMeta: { fontSize: 11.5, fontWeight: '400' },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  tagText: { fontSize: 11, fontWeight: '500' },
  reviewNote: { marginTop: 8, fontSize: 13.5, lineHeight: 19, fontWeight: '400' },
  replyButton: { minHeight: 40, marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 6 },
  replyAction: { fontSize: 13, fontWeight: '700' },
  replyBox: { marginTop: 12, paddingLeft: 12, borderLeftWidth: 2 },
  replyLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  replyComposer: { marginTop: 12, padding: 12, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  replyInput: { minHeight: 70, fontSize: 14, lineHeight: 19, textAlignVertical: 'top' },

  empty: { marginTop: 34, padding: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '800' },
  emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
