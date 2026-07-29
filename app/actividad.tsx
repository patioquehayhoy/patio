import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { createCollection, getCollections, type PatioCollection } from '@/lib/collections';
import { getFavoritePatioIds } from '@/lib/favorites';
import { Fonts, useTheme } from '@/lib/theme';

export default function CollectionsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [savedCount, setSavedCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');

  const load = useCallback(() => {
    Promise.all([getCollections(), getFavoritePatioIds()]).then(([items, ids]) => {
      setCollections(items);
      setSavedCount(ids.length);
    }).catch(() => {});
  }, []);
  useFocusEffect(load);

  const saveNew = async () => {
    if (!title.trim()) return;
    await createCollection(title);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTitle('');
    setCreating(false);
    load();
  };

  const shareCollection = async (collection: PatioCollection) => {
    if (!collection.patioIds.length) {
      Alert.alert('Esta colección está vacía', 'Añade lugares antes de compartirla.');
      return;
    }
    await Share.share({ message: `${collection.title}\nUna colección de Patio · ${collection.patioIds.length} lugares` });
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: theme.text }]}>Colecciones</Text>
          <Text style={[s.meta, { color: theme.textSecondary }]}>{savedCount} {savedCount === 1 ? 'lugar guardado' : 'lugares guardados'}</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Nueva colección" style={[s.add, { backgroundColor: theme.text }]} onPress={() => setCreating(true)}>
          <Ionicons name="add" size={24} color={theme.bg} />
        </TouchableOpacity>
      </View>

      {creating && (
        <View style={[s.composer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <TextInput
            autoFocus
            value={title}
            onChangeText={setTitle}
            placeholder="Nombre de la colección"
            placeholderTextColor={theme.textMute}
            style={[s.input, { color: theme.text }]}
            returnKeyType="done"
            onSubmitEditing={saveNew}
          />
          <TouchableOpacity onPress={saveNew} disabled={!title.trim()}><Text style={[s.done, { color: title.trim() ? theme.accent : theme.textMute }]}>Crear</Text></TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={[s.savedHero, { backgroundColor: theme.text }]} onPress={() => router.replace({ pathname: '/explorar', params: { saved: '1' } })}>
        <View style={{ flex: 1 }}>
          <Text style={[s.heroEyebrow, { color: theme.bg }]}>TODOS TUS GUARDADOS</Text>
          <Text style={[s.heroCount, { color: theme.bg }]}>{savedCount}</Text>
          <Text style={[s.heroMeta, { color: theme.bg }]}>{savedCount === 1 ? 'lugar en tu mapa' : 'lugares en tu mapa'}</Text>
        </View>
        <View style={[s.heroIcon, { backgroundColor: theme.bg }]}><Ionicons name="map-outline" size={22} color={theme.text} /></View>
      </TouchableOpacity>

      {!!collections.length && <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>TUS COLECCIONES</Text>}
      <View style={s.collectionGrid}>{collections.map((collection) => (
        <TouchableOpacity key={collection.id} style={[s.collectionCard, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={() => router.push({ pathname: '/coleccion/[id]', params: { id: collection.id } })} onLongPress={() => shareCollection(collection)}>
          <View style={[s.icon, { backgroundColor: theme.accentSoft }]}><Ionicons name="layers-outline" size={20} color={theme.accent} /></View>
          <View style={s.copy}>
            <Text style={[s.rowTitle, { color: theme.text }]}>{collection.title}</Text>
            <Text style={[s.rowMeta, { color: theme.textSecondary }]}>{collection.patioIds.length} {collection.patioIds.length === 1 ? 'lugar' : 'lugares'}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={`Ver ${collection.title} en el mapa`}
            style={[s.mapButton, { backgroundColor: theme.text }]}
            onPress={(event) => {
              event.stopPropagation();
              router.replace({ pathname: '/explorar', params: { collection: collection.id } });
            }}>
            <Ionicons name="map-outline" size={16} color={theme.bg} />
          </TouchableOpacity>
        </TouchableOpacity>
      ))}</View>

      {!collections.length && !creating && (
        <View style={s.empty}>
          <Ionicons name="layers-outline" size={30} color={theme.textMute} />
          <Text style={[s.emptyTitle, { color: theme.text }]}>Haz tu primer mapa</Text>
          <Text style={[s.emptyText, { color: theme.textSecondary }]}>Cafés para trabajar, tacos favoritos o el plan del sábado. Tú le pones nombre.</Text>
        </View>
      )}
      <BottomTabBar variant="foodie" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 18, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Fonts.brand, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.2 },
  meta: { marginTop: 3, fontSize: 13 },
  add: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  composer: { height: 58, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 16 },
  done: { fontSize: 15, fontWeight: '700' },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  savedHero: { minHeight: 150, padding: 20, borderRadius: 26, flexDirection: 'row', alignItems: 'center' },
  heroEyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.2, opacity: 0.62 },
  heroCount: { marginTop: 8, fontSize: 42, lineHeight: 44, fontWeight: '900' },
  heroMeta: { marginTop: 2, fontSize: 13, opacity: 0.62 },
  heroIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { marginTop: 26, marginBottom: 10, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  collectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  collectionCard: { width: '48%', minHeight: 154, padding: 14, borderRadius: 20, justifyContent: 'space-between', borderWidth: StyleSheet.hairlineWidth },
  mapButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  rowMeta: { marginTop: 3, fontSize: 12.5 },
  count: { fontSize: 14, fontWeight: '600' },
  empty: { marginTop: 64, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { marginTop: 16, fontSize: 21, fontWeight: '800' },
  emptyText: { marginTop: 8, maxWidth: 300, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
