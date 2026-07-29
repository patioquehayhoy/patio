import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Fonts, useTheme } from '@/lib/theme';

export default function PublicCollection() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<any>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from('collections').select('id,title,description,owner_id').eq('id', String(id)).maybeSingle(),
      supabase.from('collection_places').select('fondita_id,sort_order,fonditas(id,nombre,categoria)').eq('collection_id', String(id)).order('sort_order'),
    ]).then(([collection, rows]) => {
      setItem(collection.data);
      setPlaces(rows.data ?? []);
    });
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: existing } = await supabase.from('saved_collections').select('collection_id').eq('user_id', data.user.id).eq('collection_id', String(id)).maybeSingle();
      setSaved(!!existing);
    });
  }, [id]);

  const save = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) { router.push('/comunidad-acceso'); return; }
    if (saved) await supabase.from('saved_collections').delete().eq('user_id', data.user.id).eq('collection_id', String(id));
    else await supabase.from('saved_collections').insert({ user_id: data.user.id, collection_id: String(id) });
    setSaved(!saved);
  };

  return <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={s.nav}>
      <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity>
      <TouchableOpacity onPress={() => Share.share({ message: `${item?.title ?? 'Colección'}\npatio://coleccion-publica/${id}` })}><Ionicons name="share-outline" size={21} color={theme.text} /></TouchableOpacity>
    </View>
    <ScrollView showsVerticalScrollIndicator={false}>
      <Text style={[s.title, { color: theme.text }]}>{item?.title ?? 'Colección'}</Text>
      {!!item?.description && <Text style={[s.desc, { color: theme.textSecondary }]}>{item.description}</Text>}
      <TouchableOpacity style={[s.button, { backgroundColor: theme.text }]} onPress={save}>
        <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={17} color={theme.bg} />
        <Text style={{ color: theme.bg, fontWeight: '700' }}>{saved ? 'Lista guardada' : 'Guardar lista'}</Text>
      </TouchableOpacity>
      {item?.owner_id && <TouchableOpacity style={[s.row, { borderColor: theme.border }]} onPress={() => router.push({ pathname: '/foodie/[id]', params: { id: item.owner_id } })}><Text style={{ color: theme.textSecondary }}>Ver perfil del curador</Text><Ionicons name="chevron-forward" size={16} color={theme.textMute} /></TouchableOpacity>}
      {places.map((row) => {
        const place = Array.isArray(row.fonditas) ? row.fonditas[0] : row.fonditas;
        return place ? <TouchableOpacity key={row.fondita_id} style={[s.row, { borderColor: theme.border }]} onPress={() => router.push(`/patio/${place.id}`)}><View><Text style={{ color: theme.text, fontWeight: '700' }}>{place.nombre}</Text><Text style={{ color: theme.textSecondary, fontSize: 12, marginTop: 3 }}>{place.categoria}</Text></View><Ionicons name="chevron-forward" size={16} color={theme.textMute} /></TouchableOpacity> : null;
      })}
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  nav: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: Fonts.brand, fontSize: 38, fontWeight: '900', letterSpacing: -1.2, marginTop: 24 },
  desc: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  button: { height: 48, borderRadius: 24, alignSelf: 'flex-start', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 26 },
  row: { minHeight: 60, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
