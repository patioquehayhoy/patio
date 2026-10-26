import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/action-sheet';
import { deleteCollection, getCollection, publishCollection, updateCollection, type PatioCollection } from '@/lib/collections';
import { PatioCardInfo } from '@/components/patio-card-info';
import { PatioIdentityIcon } from '@/components/patio-identity-icon';
import { patioCardAccessibilityLabel } from '@/lib/patio-card-info';
import { FoodieLoading } from '@/components/foodie-loading';
import { fetchPublicFonditas, type Patio } from '@/lib/patios';
import { useTheme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';


export default function CollectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<PatioCollection | null>(null);
  const itemRef = useRef<PatioCollection | null>(null);
  const confirmedItem = useRef<PatioCollection | null>(null);
  const editRevision = useRef(0);
  const actionPending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error' | 'missing'>('loading');
  const loadRequest = useRef(0);
  const [patios, setPatios] = useState<Patio[]>([]);
  const load = useCallback(async () => {
    const request = ++loadRequest.current;
    setLoadState('loading');
    try {
      const [collection, all] = await Promise.all([getCollection(String(id)), fetchPublicFonditas({ throwOnError: true })]);
      if (request !== loadRequest.current) return;
      setItem(collection);
      itemRef.current = collection;
      confirmedItem.current = collection;
      setPatios(collection ? all.filter((patio) => collection.patioIds.includes(patio.id)) : []);
      setLoadState(collection ? 'ready' : 'missing');
    } catch { if (request === loadRequest.current) setLoadState('error'); }
  }, [id]);
  useFocusEffect(useCallback(() => { void load(); return () => { loadRequest.current += 1; }; }, [load]));

  const patch = async (value: Partial<PatioCollection>) => {
    if (!itemRef.current || actionPending.current) return;
    const next = { ...itemRef.current, ...value };
    const revision = ++editRevision.current;
    itemRef.current = next;
    setItem(next);
    try {
      await updateCollection(next);
      confirmedItem.current = next;
    } catch {
      if (revision !== editRevision.current) return;
      itemRef.current = confirmedItem.current;
      setItem(confirmedItem.current);
      Alert.alert(noWidow('No pudimos guardar la lista'), noWidow('Se conserva la última versión guardada. Inténtalo de nuevo.'));
    }
  };
  const share = async () => {
    if (!item || actionPending.current) return;
    actionPending.current = true;
    setBusy(true);
    // Bug real corregido en auditoría 2026-08-23: antes, si la lista era
    // privada, NUNCA se publicaba — se compartía sin link, solo texto suelto.
    // Ahora sube automáticamente a `unlisted` para que el link sí funcione.
    try {
      const target = item.visibility === 'private' ? { ...item, visibility: 'unlisted' as const } : item;
      const published = await publishCollection(target);
      setItem(published);
      itemRef.current = published;
      confirmedItem.current = published;
      await Share.share({ message: `${published.title}\n${patios.map((patio) => `• ${patio.name}`).join('\n')}\n\npatio://coleccion-publica/${published.remoteId}` });
    } catch (error) {
      Alert.alert(noWidow('No pudimos compartir la lista'), noWidow(
        error instanceof Error && error.message === 'Inicia sesión para compartir esta lista.'
          ? error.message : 'Revisa tu conexión e inténtalo de nuevo.',
      ));
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  };

  const [actionsOpen, setActionsOpen] = useState(false);
  const moreRef = useRef<View | null>(null);

  const confirmDelete = () => {
    if (!item) return;
    Alert.alert(
      noWidow('Eliminar lista'),
      noWidow(`Se borrará "${item.title}". No se puede deshacer.`),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (actionPending.current) return;
            actionPending.current = true;
            setBusy(true);
            try {
              await deleteCollection(item.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              router.back();
            } catch {
              Alert.alert(noWidow('No pudimos eliminar la lista'), noWidow('La lista sigue disponible. Revisa tu conexión e inténtalo de nuevo.'));
            } finally {
              actionPending.current = false;
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  if (!item || loadState !== 'ready') return <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <TouchableOpacity style={s.navButton} accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.canGoBack() ? router.back() : router.replace('/favoritos')}><Ionicons name="chevron-back" size={23} color={theme.text} /></TouchableOpacity>
    {loadState === 'loading' ? <FoodieLoading label="Cargando lista" /> : <View style={s.empty}>
      <Text style={[s.emptyTitle, { color: theme.text }]}>{noWidow(loadState === 'error' ? 'No pudimos cargar la lista' : 'Esta lista no está disponible')}</Text>
      {loadState === 'error' && <TouchableOpacity style={s.explore} accessibilityRole="button" accessibilityLabel="Reintentar" onPress={() => { void load(); }}><Text style={{ color: theme.text }}>Reintentar</Text></TouchableOpacity>}
    </View>}
  </View>;
  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 42 }}>
        <View style={s.nav}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" style={s.navButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={23} color={theme.text} /></TouchableOpacity>
          <TouchableOpacity ref={moreRef} accessibilityRole="button" accessibilityLabel="Acciones de la lista" style={s.navButton} onPress={() => { Haptics.selectionAsync().catch(() => {}); setActionsOpen(true); }}><Ionicons name="ellipsis-horizontal" size={21} color={theme.text} /></TouchableOpacity>
        </View>

        <TextInput accessibilityLabel="Nombre de la lista" maxLength={60} value={item.title} editable={!busy} onChangeText={(title) => patch({ title })} multiline style={[s.title, { color: theme.text }]} />
        <TextInput
          accessibilityLabel="Descripción de la lista"
          maxLength={300}
          value={item.description}
          editable={!busy}
          onChangeText={(description) => patch({ description })}
          placeholder="Añade una nota a esta lista"
          placeholderTextColor={theme.textMute}
          multiline
          style={[s.description, { color: theme.textSecondary }]}
        />
        <Text style={[s.count, { color: theme.textSecondary }]}>{patios.length} {patios.length === 1 ? 'lugar guardado' : 'lugares guardados'}</Text>

        {!!patios.length && (
          <View style={s.actions}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ver esta lista en el mapa" style={[s.primaryAction, { backgroundColor: theme.accent }]} onPress={() => router.replace({ pathname: '/explorar', params: { collection: item.id } })}>
              <Ionicons name="map-outline" size={18} color="#FFFFFF" />
              <Text style={[s.primaryText, { color: '#FFFFFF' }]}>{noWidow('Ver en el mapa')}</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Compartir" disabled={busy} accessibilityState={{ disabled: busy, busy }} style={[s.shareButton, { borderColor: theme.border }]} onPress={share}>
              <Ionicons name="share-outline" size={19} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        {!!patios.length && <Text style={[s.section, { color: theme.textSecondary }]}>{noWidow('EN ESTA LISTA')}</Text>}
        <View style={[s.list, patios.length > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
          {patios.map((patio) => <TouchableOpacity key={patio.id} accessibilityRole="button" accessibilityLabel={patioCardAccessibilityLabel(patio)} style={[s.row, { borderBottomColor: theme.border }]} activeOpacity={0.72} onPress={() => router.push(`/patio/${patio.id}`)}>
            <PatioIdentityIcon patio={patio} />
            <PatioCardInfo patio={patio} />
            <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
          </TouchableOpacity>)}
        </View>

        {!patios.length && (
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: theme.surface }]}><Ionicons name="bookmark-outline" size={27} color={theme.textSecondary} /></View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>{noWidow('Esta lista está esperando')}</Text>
            <Text style={[s.emptyText, { color: theme.textSecondary }]}>{noWidow('Cuando guardes un lugar, podrás añadirlo aquí.')}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Explorar lugares" style={[s.explore, { borderColor: theme.border }]} onPress={() => router.replace('/explorar')}><Text style={[s.exploreText, { color: theme.text }]}>{noWidow('Explorar lugares')}</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
      <ActionSheet
        visible={actionsOpen}
        anchorRef={moreRef}
        title={item.title}
        onDismiss={() => setActionsOpen(false)}
        options={[
          { label: 'Compartir', icon: 'share-outline', onPress: share },
          { label: 'Eliminar lista', icon: 'trash-outline', destructive: true, onPress: confirmDelete },
        ]}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 }, nav: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { ...Type.screen, padding: 0 },
  description: { fontSize: 14.5, lineHeight: 20, marginTop: 8, padding: 0, minHeight: 24 }, count: { fontSize: 12.5, marginTop: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 }, primaryAction: { minHeight: 50, paddingVertical: 12, paddingHorizontal: 16, flex: 1, borderRadius: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { flexShrink: 1, fontSize: 15, fontWeight: '700' }, shareButton: { width: 50, height: 50, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 32, marginBottom: 9, fontSize: 10.5, fontWeight: '800', letterSpacing: 0.8 }, list: {},
  row: { paddingVertical: 12, minHeight: 94, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 }, rowBody: { flex: 1, minWidth: 0 },
  empty: { alignItems: 'center', paddingTop: 76, paddingHorizontal: 28 }, emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { ...Type.section, marginTop: 18 }, emptyText: { marginTop: 8, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  explore: { minHeight: 48, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, exploreText: { fontSize: 15, fontWeight: '700' },
});
