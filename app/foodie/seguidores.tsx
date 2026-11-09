import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/avatar-circle';
import { getPatioFollowers } from '@/lib/business-stats';
import { getFollowedPlaces, getFollowList, type FollowedPlace, type FollowListPerson } from '@/lib/profile-privacy';
import { Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Tab = 'seguidores' | 'siguiendo';

// Seguidores y siguiendo de un perfil, como al tocar los números en Instagram.
// Si el perfil es privado y no lo sigues, el servidor no entrega la lista.
// Con `patio`, la misma pantalla muestra quién sigue a ese lugar. Siguiendo
// incluye personas y lugares.
export default function FollowListScreen() {
  const params = useLocalSearchParams<{ id?: string; tipo?: string; patio?: string }>();
  const patioId = typeof params.patio === 'string' ? params.patio : '';
  const id = typeof params.id === 'string' ? params.id : '';
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>(params.tipo === 'siguiendo' ? 'siguiendo' : 'seguidores');
  const [people, setPeople] = useState<FollowListPerson[] | null>(null);
  const [places, setPlaces] = useState<FollowedPlace[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setPeople(null);
    setPlaces([]);
    setFailed(false);
    const load = patioId
      ? getPatioFollowers(patioId).then((list) => ({ list, placesList: [] as FollowedPlace[] }))
      : Promise.all([getFollowList(id, tab), tab === 'siguiendo' ? getFollowedPlaces(id) : Promise.resolve([])])
        .then(([list, placesList]) => ({ list, placesList }));
    load
      .then(({ list, placesList }) => { if (active) { setPeople(list); setPlaces(placesList); } })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [id, patioId, tab]);

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} onPress={() => router.canGoBack() ? router.back() : router.replace('/explorar')} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        {patioId ? <Text accessibilityRole="header" style={[s.navTitle, { color: theme.text }]}>Seguidores</Text> : <View style={[s.segmented, { borderColor: theme.border }]} accessibilityRole="tablist">
          {(['seguidores', 'siguiendo'] as const).map((item) => (
            <TouchableOpacity
              key={item}
              style={[s.segment, tab === item && { backgroundColor: theme.text }]}
              onPress={() => setTab(item)}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === item }}
              accessibilityLabel={item === 'seguidores' ? 'Seguidores' : 'Siguiendo'}>
              <Text style={[s.segmentText, { color: tab === item ? theme.bg : theme.textSecondary }]}>{item === 'seguidores' ? 'Seguidores' : 'Siguiendo'}</Text>
            </TouchableOpacity>
          ))}
        </View>}
        <View style={s.navButton} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 32 }}>
        {people === null && !failed ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={theme.textSecondary} accessibilityLabel="Cargando" />
        ) : failed ? (
          <Text style={[s.empty, { color: theme.textSecondary }]}>{noWidow('No pudimos cargar la lista. Revisa tu conexión.')}</Text>
        ) : !people?.length && !places.length ? (
          <Text style={[s.empty, { color: theme.textSecondary }]}>{noWidow(patioId ? 'Todavía nadie sigue este lugar.' : tab === 'seguidores' ? 'Todavía nadie sigue este perfil, o es privado.' : 'Este perfil todavía no sigue a nadie, o es privado.')}</Text>
        ) : (<>
          {!!places.length && !!people?.length && <Text style={[s.section, { color: theme.textSecondary }]}>Personas</Text>}
          {(people ?? []).map((person, index) => (
            <TouchableOpacity
              key={person.userId}
              style={[s.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}
              onPress={() => router.push({ pathname: '/foodie/[id]', params: { id: person.userId } })}
              accessibilityRole="button"
              accessibilityLabel={`Ver perfil de ${person.name}`}>
              <AvatarCircle name={person.name} avatarUrl={person.avatarUrl} backgroundColor={theme.surface2} textColor={theme.textSecondary} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[s.name, { color: theme.text }]}>{person.name}</Text>
                {!!person.handle && <Text style={[s.handle, { color: theme.textSecondary }]}>@{person.handle}</Text>}
              </View>
              <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
            </TouchableOpacity>
          ))}
          {!!places.length && <Text style={[s.section, { color: theme.textSecondary }]}>Lugares</Text>}
          {places.map((place, index) => (
            <TouchableOpacity
              key={place.id}
              style={[s.row, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}
              onPress={() => router.push({ pathname: '/patio/[id]', params: { id: place.id } })}
              accessibilityRole="button"
              accessibilityLabel={`Ver ${place.name}`}>
              <View style={[s.placeIcon, { backgroundColor: theme.surface2 }]}>
                <Ionicons name="storefront-outline" size={18} color={theme.textSecondary} />
              </View>
              <Text style={[s.name, { flex: 1, minWidth: 0, color: theme.text }]}>{noWidow(place.name)}</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
            </TouchableOpacity>
          ))}
        </>)}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  segmented: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  segment: { minWidth: 104, minHeight: 34, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13, fontWeight: '700' },
  row: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 15, fontWeight: '700' },
  handle: { marginTop: 2, fontSize: 13, fontWeight: '400' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 22, fontWeight: '700' },
  section: { ...Type.label, marginTop: 16, marginBottom: 4 },
  placeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  empty: { marginTop: 40, textAlign: 'center', fontSize: 14, lineHeight: 20 },
});
