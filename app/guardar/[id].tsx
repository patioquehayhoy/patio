import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { noWidow } from '@/lib/typography';

import {
  createCollection,
  getCollections,
  getSavedPatioMeta,
  saveSavedPatioMeta,
  togglePatioInCollection,
  type PatioCollection,
  type SavedPatioMeta,
} from '@/lib/collections';
import { getFavoritePatioIds, setFavoritePatioIds } from '@/lib/favorites';
import { Fonts, useTheme } from '@/lib/theme';

export default function SavePlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patioId = String(id);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [meta, setMeta] = useState<SavedPatioMeta>({ patioId });
  const [newTitle, setNewTitle] = useState('');

  const load = useCallback(async () => {
    const [items, savedMeta, favoriteIds] = await Promise.all([
      getCollections(),
      getSavedPatioMeta(patioId),
      getFavoritePatioIds(),
    ]);
    if (!favoriteIds.includes(patioId)) await setFavoritePatioIds([...favoriteIds, patioId]);
    setCollections(items);
    setMeta(savedMeta);
  }, [patioId]);

  useEffect(() => { load().catch(() => {}); }, [load]);

  const updateMeta = async (patch: Partial<SavedPatioMeta>) => {
    const next = { ...meta, ...patch };
    setMeta(next);
    await saveSavedPatioMeta(next);
  };

  const create = async () => {
    if (!newTitle.trim()) return;
    const collection = await createCollection(newTitle);
    await togglePatioInCollection(collection.id, patioId);
    setNewTitle('');
    await load();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Cerrar">
          <Ionicons name="close" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.navTitle, { color: theme.text }]}>{noWidow('Guardar en')}</Text>
        <TouchableOpacity style={s.navButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Listo">
          <Text style={[s.done, { color: theme.accent }]}>Listo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}>
        <Text style={[s.heroTitle, { color: theme.text }]}>{noWidow('Tus listas')}</Text>
        <Text style={[s.heroBody, { color: theme.textSecondary }]}>{noWidow('Elige una o varias. El lugar queda guardado aunque no elijas ninguna.')}</Text>

        <View style={[s.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {collections.map((collection, index) => {
            const selected = collection.patioIds.includes(patioId);
            return (
              <TouchableOpacity
                key={collection.id}
                style={[s.listRow, index > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={collection.title}
                onPress={async () => {
                  await togglePatioInCollection(collection.id, patioId);
                  await load();
                  await Haptics.selectionAsync();
                }}>
                <View style={[s.listGlyph, { backgroundColor: selected ? theme.accentSoft : theme.bg }]}>
                  <Ionicons name="bookmark-outline" size={18} color={selected ? theme.accent : theme.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.listTitle, { color: theme.text }]}>{collection.title}</Text>
                  <Text style={[s.listMeta, { color: theme.textSecondary }]}>{collection.patioIds.length} {collection.patioIds.length === 1 ? 'lugar' : 'lugares'}</Text>
                </View>
                <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={selected ? theme.accent : theme.textMute} />
              </TouchableOpacity>
            );
          })}
          <View style={[s.newRow, collections.length > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={[s.listGlyph, { backgroundColor: theme.bg }]}>
              <Ionicons name="add" size={20} color={theme.textSecondary} />
            </View>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Nueva lista"
              placeholderTextColor={theme.textMute}
              style={[s.newInput, { color: theme.text }]}
              returnKeyType="done"
              onSubmitEditing={create}
            />
            {!!newTitle.trim() && <TouchableOpacity onPress={create} hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Crear lista"><Text style={[s.create, { color: theme.accent }]}>Crear</Text></TouchableOpacity>}
          </View>
        </View>

        <Text style={[s.sectionLabel, { color: theme.textMute }]}>{noWidow('SOLO PARA TI')}</Text>
        <View style={[s.privateCard, { borderColor: theme.border }]}>
          <BlurView intensity={theme.isDark ? 26 : 44} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={s.statusRow}>
            {([
              ['want_to_go', 'Quiero ir', 'sparkles-outline'],
              ['visited', 'Ya fui', 'checkmark-outline'],
            ] as const).map(([key, label, icon]) => {
              const selected = meta.status === key;
              return (
                <TouchableOpacity
                  key={key}
                  onPress={() => updateMeta({ status: selected ? undefined : key })}
                  style={[s.statusChip, { backgroundColor: selected ? theme.text : theme.surface }]}
                  hitSlop={{ top: 3, bottom: 3, left: 3, right: 3 }}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}>
                  <Ionicons name={icon} size={15} color={selected ? theme.bg : theme.textSecondary} />
                  <Text style={[s.statusText, { color: selected ? theme.bg : theme.text }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            multiline
            maxLength={300}
            value={meta.note ?? ''}
            onChangeText={(note) => updateMeta({ note })}
            placeholder="Qué pedir, quién te lo recomendó, cuándo volver…"
            placeholderTextColor={theme.textMute}
            style={[s.note, { color: theme.text, borderColor: theme.border }]}
          />
          <View style={s.ratingRow}>
            <Text style={[s.ratingLabel, { color: theme.textSecondary }]}>{noWidow('Tu calificación')}</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[1, 2, 3, 4, 5].map((value) => (
                <TouchableOpacity
                  key={value}
                  onPress={() => updateMeta({ rating: meta.rating === value ? undefined : value })}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={`${value} ${value === 1 ? 'estrella' : 'estrellas'}`}
                  accessibilityState={{ selected: value <= (meta.rating ?? 0) }}>
                  <Ionicons name={value <= (meta.rating ?? 0) ? 'star' : 'star-outline'} size={21} color={value <= (meta.rating ?? 0) ? theme.accent : theme.textMute} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <Text style={[s.sectionLabel, { color: theme.textMute }]}>PÚBLICO</Text>
        <TouchableOpacity
          style={[s.publicRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
          accessibilityRole="button"
          accessibilityLabel="Escribir una reseña"
          onPress={() => router.push({ pathname: '/resena/[id]', params: { id: patioId } })}>
          <View style={[s.listGlyph, { backgroundColor: theme.accentSoft }]}>
            <Ionicons name="chatbubble-outline" size={17} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.listTitle, { color: theme.text }]}>{noWidow('Escribir una reseña')}</Text>
            <Text style={[s.listMeta, { color: theme.textSecondary }]}>{noWidow('Se publicará con tu perfil.')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  nav: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700' },
  done: { fontSize: 16, fontWeight: '700' },
  heroTitle: { marginTop: 14, fontFamily: Fonts.brand, fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1 },
  heroBody: { marginTop: 7, maxWidth: 340, fontSize: 14, lineHeight: 20 },
  listCard: { marginTop: 22, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  listRow: { minHeight: 64, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  listGlyph: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 15, lineHeight: 19, fontWeight: '700' },
  listMeta: { marginTop: 2, fontSize: 12.5, lineHeight: 16 },
  newRow: { minHeight: 60, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  newInput: { flex: 1, height: 52, fontSize: 15 },
  create: { fontSize: 14, fontWeight: '700' },
  sectionLabel: { marginTop: 28, marginBottom: 9, paddingHorizontal: 5, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4 },
  privateCard: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: 15 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusChip: { minHeight: 38, paddingHorizontal: 13, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  note: { minHeight: 88, marginTop: 13, padding: 13, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  ratingRow: { minHeight: 48, marginTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ratingLabel: { fontSize: 13.5 },
  publicRow: { minHeight: 68, paddingHorizontal: 14, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
