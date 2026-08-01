import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: theme.text }]}>Guardados</Text>
          <Text style={[s.meta, { color: theme.textSecondary }]}>{savedCount} {savedCount === 1 ? 'lugar guardado' : 'lugares guardados'}</Text>
        </View>
        <TouchableOpacity accessibilityLabel="Nueva lista" style={[s.add, { backgroundColor: theme.glass, borderColor: theme.border }]} onPress={() => setCreating(true)}>
          <BlurView intensity={theme.isDark ? 30 : 42} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <Ionicons name="add" size={22} color={theme.text} />
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

      {!!collections.length && <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>TUS LISTAS</Text>}
      <View style={[s.collectionList, { backgroundColor: theme.surface, borderColor: theme.border }]}>{collections.map((collection, index) => (
        <TouchableOpacity key={collection.id} style={[s.collectionCard, { borderColor: theme.border, backgroundColor: theme.surface }]} onPress={() => router.replace({ pathname: '/explorar', params: { collection: collection.id } })} onLongPress={() => shareCollection(collection)}>
          <View style={[s.icon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,18,20,0.04)' }]}><Ionicons name="folder-outline" size={20} color={theme.textSecondary} /></View>
          <View style={s.copy}>
            <Text style={[s.rowTitle, { color: theme.text }]}>{collection.title}</Text>
            <Text style={[s.rowMeta, { color: theme.textSecondary }]}>{collection.patioIds.length} {collection.patioIds.length === 1 ? 'lugar' : 'lugares'}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={`Editar ${collection.title}`}
            style={s.mapButton}
            onPress={(event) => {
              event.stopPropagation();
              router.push({ pathname: '/coleccion/[id]', params: { id: collection.id } });
            }}>
            <Ionicons name="ellipsis-horizontal" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          <Ionicons name="map-outline" size={17} color={theme.textMute} />
          {index < collections.length - 1 && <View style={[s.rowDivider, { backgroundColor: theme.border }]} />}
        </TouchableOpacity>
      ))}</View>

      {!collections.length && !creating && (
        <View style={s.empty}>
          <Ionicons name="layers-outline" size={30} color={theme.textMute} />
          <Text style={[s.emptyTitle, { color: theme.text }]}>Crea tu primera lista</Text>
          <Text style={[s.emptyText, { color: theme.textSecondary }]}>Agrupa tus lugares por plan, antojo o barrio.</Text>
        </View>
      )}
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  header: { paddingTop: 18, paddingBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Fonts.brand, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.2 },
  meta: { marginTop: 3, fontSize: 13 },
  add: { width: 44, height: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  composer: { height: 58, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, fontSize: 16 },
  done: { fontSize: 15, fontWeight: '700' },
  sectionLabel: { marginTop: 14, marginBottom: 10, paddingHorizontal: 6, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },
  collectionList: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  collectionCard: { minHeight: 72, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12, position: 'relative' },
  rowDivider: { position: 'absolute', left: 68, right: 0, bottom: 0, height: StyleSheet.hairlineWidth },
  mapButton: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  copy: { flex: 1, minWidth: 0 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  rowMeta: { marginTop: 3, fontSize: 12.5 },
  count: { fontSize: 14, fontWeight: '600' },
  empty: { marginTop: 64, alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { marginTop: 16, fontSize: 21, fontWeight: '800' },
  emptyText: { marginTop: 8, maxWidth: 300, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
