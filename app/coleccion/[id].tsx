import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCollection, publishCollection, updateCollection, type PatioCollection } from '@/lib/collections';
import { todayDish } from '@/lib/controllers/useFavoritePatiosController';
import { fetchPublicFonditas, type Patio } from '@/lib/patios';
import { publicPrice } from '@/lib/prices';
import { Fonts, useTheme } from '@/lib/theme';

const GREEN = '#1F9D55';

export default function CollectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<PatioCollection | null>(null);
  const [patios, setPatios] = useState<Patio[]>([]);
  const load = useCallback(() => Promise.all([getCollection(String(id)), fetchPublicFonditas()]).then(([collection, all]) => {
    setItem(collection);
    setPatios(collection ? all.filter((patio) => collection.patioIds.includes(patio.id)) : []);
  }), [id]);
  useFocusEffect(useCallback(() => { load().catch(() => {}); }, [load]));

  const patch = async (value: Partial<PatioCollection>) => {
    if (!item) return;
    const next = { ...item, ...value };
    setItem(next);
    await updateCollection(next);
  };
  const share = async () => {
    if (!item) return;
    const published = item.visibility === 'private' ? item : await publishCollection(item);
    await Share.share({ message: `${item.title}\n${patios.map((patio) => `• ${patio.name}`).join('\n')}${published.remoteId ? `\n\npatio://coleccion-publica/${published.remoteId}` : ''}` });
  };

  if (!item) return <View style={[s.root, { backgroundColor: theme.bg }]} />;
  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: insets.bottom + 42 }}>
        <View style={s.nav}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Volver" style={s.navButton} onPress={() => router.back()}><Ionicons name="chevron-back" size={23} color={theme.text} /></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Compartir lista" style={s.navButton} onPress={share}><Ionicons name="share-outline" size={21} color={theme.text} /></TouchableOpacity>
        </View>

        <TextInput value={item.title} onChangeText={(title) => patch({ title })} multiline style={[s.title, { color: theme.text }]} />
        <TextInput
          value={item.description}
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
              <Text style={[s.primaryText, { color: '#FFFFFF' }]}>Ver en el mapa</Text>
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Compartir" style={[s.shareButton, { borderColor: theme.border }]} onPress={share}>
              <Ionicons name="share-outline" size={19} color={theme.text} />
            </TouchableOpacity>
          </View>
        )}

        {!!patios.length && <Text style={[s.section, { color: theme.textSecondary }]}>EN ESTA LISTA</Text>}
        <View style={[s.list, patios.length > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
          {patios.map((patio) => {
            const today = todayDish(patio);
            return (
              <TouchableOpacity key={patio.id} accessibilityRole="button" accessibilityLabel={`Abrir ${patio.name}`} style={[s.row, { borderBottomColor: theme.border }]} activeOpacity={0.72} onPress={() => router.push(`/patio/${patio.id}`)}>
                <View style={[s.monogram, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(17,18,20,0.05)' }]}>
                  <Text style={[s.monogramText, { color: theme.text }]}>{patio.name.trim().charAt(0).toUpperCase()}</Text>
                </View>
                <View style={s.rowBody}>
                  <View style={s.statusRow}>
                    <View style={[s.dot, { backgroundColor: today ? GREEN : theme.textMute }]} />
                    <Text style={[s.status, { color: today ? GREEN : theme.textMute }]}>{today ? 'MENÚ HOY' : (patio.categories[0] ?? 'Fondita').toUpperCase()}</Text>
                  </View>
                  <Text style={[s.name, { color: theme.text }]} numberOfLines={1}>{patio.name}</Text>
                  <Text style={[s.meta, { color: theme.textSecondary }]} numberOfLines={1}>{today || `${patio.categories[0] ?? 'Fondita'} · ${patio.area}`}</Text>
                  {today && <Text style={[s.area, { color: theme.textSecondary }]} numberOfLines={1}>{patio.area}</Text>}
                </View>
                {!!publicPrice(patio.price) && <Text style={[s.price, { color: theme.accent }]}>{publicPrice(patio.price)}</Text>}
                <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
              </TouchableOpacity>
            );
          })}
        </View>

        {!patios.length && (
          <View style={s.empty}>
            <View style={[s.emptyIcon, { backgroundColor: theme.surface }]}><Ionicons name="bookmark-outline" size={27} color={theme.textSecondary} /></View>
            <Text style={[s.emptyTitle, { color: theme.text }]}>Esta lista está esperando</Text>
            <Text style={[s.emptyText, { color: theme.textSecondary }]}>Cuando guardes un lugar, podrás añadirlo aquí.</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Explorar lugares" style={[s.explore, { borderColor: theme.border }]} onPress={() => router.replace('/explorar')}><Text style={[s.exploreText, { color: theme.text }]}>Explorar lugares</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 }, nav: { height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.brand, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1.1, padding: 0 },
  description: { fontSize: 14.5, lineHeight: 20, marginTop: 8, padding: 0, minHeight: 24 }, count: { fontSize: 12.5, marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24 }, primaryAction: { height: 50, flex: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontSize: 15, fontWeight: '800' }, shareButton: { width: 50, height: 50, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  section: { marginTop: 32, marginBottom: 9, fontSize: 10.5, fontWeight: '800', letterSpacing: 1.3 }, list: {},
  row: { minHeight: 94, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 }, monogram: { width: 48, height: 58, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  monogramText: { fontFamily: Fonts.brand, fontSize: 23, fontWeight: '900' }, rowBody: { flex: 1, minWidth: 0 }, statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 },
  dot: { width: 5, height: 5, borderRadius: 3 }, status: { fontSize: 9.5, fontWeight: '800', letterSpacing: 0.9 }, name: { fontSize: 17, fontWeight: '800', letterSpacing: -0.2 },
  meta: { fontSize: 12.5, marginTop: 3 }, area: { fontSize: 11.5, marginTop: 2 }, price: { fontSize: 14, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 76, paddingHorizontal: 28 }, emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: Fonts.brand, marginTop: 18, fontSize: 22, fontWeight: '900' }, emptyText: { marginTop: 8, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  explore: { height: 48, paddingHorizontal: 20, borderRadius: 15, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, exploreText: { fontSize: 15, fontWeight: '700' },
});
