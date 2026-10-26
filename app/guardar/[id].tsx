import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { noWidow } from '@/lib/typography';
import { LibraryListRow } from '@/components/library-list-row';
import { FoodieLoading } from '@/components/foodie-loading';

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
import { useTheme } from '@/lib/theme';

export default function SavePlaceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const patioId = String(id);
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [meta, setMeta] = useState<SavedPatioMeta>({ patioId });
  const [newTitle, setNewTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [writeError, setWriteError] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const created = useRef<{ title: string; id: string } | null>(null);

  const load = useCallback(async (includeMeta = true) => {
    const [items, savedMeta, favoriteIds] = await Promise.all([
      getCollections(),
      getSavedPatioMeta(patioId),
      getFavoritePatioIds(),
    ]);
    if (!favoriteIds.includes(patioId)) await setFavoritePatioIds([...favoriteIds, patioId]);
    setCollections(items);
    if (includeMeta) setMeta(savedMeta);
  }, [patioId]);

  const reload = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try { await load(); } catch { setLoadError(true); } finally { setLoading(false); }
  }, [load]);
  useEffect(() => { void reload(); }, [reload]);

  const mutate = async (operation: () => Promise<void>) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      await operation();
      await load(false);
      void Haptics.selectionAsync().catch(() => {});
    } catch {
      Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Inténtalo otra vez. Tu selección se conserva.'));
    } finally { pending.current = false; setBusy(false); }
  };

  const updateMeta = async (patch: Partial<SavedPatioMeta>) => {
    const next = { ...meta, ...patch };
    setMeta(next);
    try { await saveSavedPatioMeta(next); setWriteError(false); } catch { setWriteError(true); }
  };

  const create = async () => {
    const title = newTitle.trim();
    if (!title) return;
    await mutate(async () => {
      if (created.current?.title !== title) {
        const collection = await createCollection(title);
        created.current = { title, id: collection.id };
      }
      const target = (await getCollections()).find((collection) => collection.id === created.current!.id);
      if (!target?.patioIds.includes(patioId)) await togglePatioInCollection(created.current!.id, patioId);
      created.current = null;
      setNewTitle('');
    });
  };

  return (
    <KeyboardAvoidingView style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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

      <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 36 }}>
        <Text style={[s.heroBody, { color: theme.textSecondary }]}>{noWidow('Elige una o varias. El lugar queda guardado aunque no elijas ninguna.')}</Text>

        {loading ? <FoodieLoading label="Cargando listas" /> : loadError ? <TouchableOpacity accessibilityRole="button" accessibilityLabel="Reintentar carga de listas" style={s.retry} onPress={reload}><Text style={{ color: theme.text }}>{noWidow('No pudimos cargar tus listas. Reintentar.')}</Text></TouchableOpacity> : <View style={[s.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {collections.map((collection, index) => {
            const selected = collection.patioIds.includes(patioId);
            return (
              <LibraryListRow key={collection.id} title={collection.title} count={collection.patioIds.length} unit="lugar" checked={selected} disabled={busy} divider={index > 0}
                onPress={() => { void mutate(async () => { await togglePatioInCollection(collection.id, patioId); }); }} />
            );
          })}
          <View style={[s.newRow, collections.length > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
            <View style={[s.listGlyph, { backgroundColor: theme.bg }]}>
              <Ionicons name="add" size={20} color={theme.textSecondary} />
            </View>
            <TextInput
              value={newTitle}
              maxLength={60}
              editable={!busy}
              accessibilityLabel="Nombre de nueva lista"
              onChangeText={setNewTitle}
              placeholder="Nueva lista"
              placeholderTextColor={theme.textMute}
              style={[s.newInput, { color: theme.text }]}
              returnKeyType="done"
              onSubmitEditing={create}
            />
            {!!newTitle.trim() && <TouchableOpacity disabled={busy} accessibilityState={{ disabled: busy, busy }} style={s.createButton} onPress={create} accessibilityRole="button" accessibilityLabel="Crear lista"><Text style={[s.create, { color: theme.accent }]}>{busy ? 'Guardando…' : 'Crear'}</Text></TouchableOpacity>}
          </View>
        </View>}

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
            accessibilityLabel="Nota privada sobre este lugar"
            onChangeText={(note) => updateMeta({ note })}
            placeholder="Qué pedir, quién te lo recomendó, cuándo volver…"
            placeholderTextColor={theme.textMute}
            style={[s.note, { color: theme.text, borderColor: theme.border }]}
          />
          {writeError && <TouchableOpacity style={s.retry} accessibilityRole="button" accessibilityLabel="Reintentar guardado de tus datos privados" onPress={() => { void updateMeta({}); }}><Text style={{ color: theme.textSecondary }}>{noWidow('No pudimos guardar tus cambios. Reintentar.')}</Text></TouchableOpacity>}
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
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  nav: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, fontWeight: '700' },
  done: { fontSize: 16, fontWeight: '700' },
  heroBody: { marginTop: 7, maxWidth: 340, fontSize: 14, lineHeight: 20 },
  listCard: { marginTop: 22, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  listGlyph: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  listTitle: { fontSize: 15, lineHeight: 19, fontWeight: '700' },
  listMeta: { marginTop: 2, fontSize: 12.5, lineHeight: 16 },
  newRow: { minHeight: 60, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  newInput: { flex: 1, minWidth: 0, minHeight: 52, paddingVertical: 12, fontSize: 15 },
  createButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  retry: { minHeight: 44, paddingVertical: 12, justifyContent: 'center' },
  create: { fontSize: 14, fontWeight: '700' },
  sectionLabel: { marginTop: 28, marginBottom: 9, paddingHorizontal: 5, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.8 },
  privateCard: { borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', padding: 15 },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusChip: { minHeight: 44, paddingVertical: 10, paddingHorizontal: 13, borderRadius: 22, flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  note: { minHeight: 88, marginTop: 13, padding: 13, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, fontSize: 14, lineHeight: 20, textAlignVertical: 'top' },
  ratingRow: { minHeight: 48, marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' },
  ratingLabel: { fontSize: 13.5 },
  publicRow: { minHeight: 68, paddingHorizontal: 14, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
});
