import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getCollection, publishCollection, updateCollection, type PatioCollection } from '@/lib/collections';
import { fetchPublicFonditas, type Patio } from '@/lib/patios';
import { Fonts, useTheme } from '@/lib/theme';

export default function CollectionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<PatioCollection | null>(null);
  const [patios, setPatios] = useState<Patio[]>([]);
  const load = useCallback(() => Promise.all([getCollection(String(id)), fetchPublicFonditas()]).then(([c, all]) => {
    setItem(c); setPatios(c ? all.filter((p) => c.patioIds.includes(p.id)) : []);
  }), [id]);
  useFocusEffect(useCallback(() => {
    load().catch(() => {});
  }, [load]));
  const patch = async (value: Partial<PatioCollection>) => {
    if (!item) return;
    const next = { ...item, ...value };
    setItem(next);
    await updateCollection(next);
    if (value.visibility && value.visibility !== 'private') setItem(await publishCollection(next));
  };
  if (!item) return <View style={[s.root, { backgroundColor: theme.bg }]} />;
  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity>
        <TouchableOpacity onPress={async () => { const published = item.visibility === 'private' ? item : await publishCollection(item); await Share.share({ message: `${item.title}\n${patios.map((p) => `• ${p.name}`).join('\n')}${published.remoteId ? `\n\npatio://coleccion-publica/${published.remoteId}` : ''}` }); }}><Ionicons name="share-outline" size={21} color={theme.text} /></TouchableOpacity>
      </View>
      <TextInput value={item.title} onChangeText={(title) => patch({ title })} style={[s.title, { color: theme.text }]} />
      <TextInput value={item.description} onChangeText={(description) => patch({ description })} placeholder="Añade una nota opcional" placeholderTextColor={theme.textMute} style={[s.description, { color: theme.textSecondary }]} />
      {!!patios.length && (
        <TouchableOpacity style={[s.mapCta, { backgroundColor: theme.text }]} onPress={() => router.replace({ pathname: '/explorar', params: { collection: item.id } })}>
          <Ionicons name="map-outline" size={18} color={theme.bg} />
          <Text style={[s.mapCtaText, { color: theme.bg }]}>Ver esta colección en el mapa</Text>
        </TouchableOpacity>
      )}
      <Text style={[s.section, { color: theme.textSecondary }]}>{patios.length} LUGARES</Text>
      {patios.map((p) => <TouchableOpacity key={p.id} style={[s.row, { borderColor: theme.border }]} onPress={() => router.push(`/patio/${p.id}`)}><View style={{ flex: 1 }}><Text style={[s.name, { color: theme.text }]}>{p.name}</Text><Text style={[s.meta, { color: theme.textSecondary }]}>{p.category} · {p.area}</Text></View><Ionicons name="chevron-forward" size={17} color={theme.textMute} /></TouchableOpacity>)}
      {!patios.length && <Text style={[s.empty, { color: theme.textSecondary }]}>Guarda lugares y añádelos a esta colección.</Text>}
    </View>
  );
}
const s = StyleSheet.create({ root:{flex:1,paddingHorizontal:20},nav:{height:56,flexDirection:'row',alignItems:'center',justifyContent:'space-between'},title:{fontFamily:Fonts.brand,fontSize:34,fontWeight:'900',letterSpacing:-1,padding:0},description:{fontSize:14,marginTop:8,padding:0},mapCta:{alignSelf:'flex-start',height:44,marginTop:18,paddingHorizontal:17,borderRadius:22,flexDirection:'row',alignItems:'center',gap:8},mapCtaText:{fontSize:14,fontWeight:'700'},section:{fontSize:11,fontWeight:'700',letterSpacing:1.2,marginTop:30,marginBottom:6},row:{minHeight:66,borderBottomWidth:StyleSheet.hairlineWidth,flexDirection:'row',alignItems:'center'},name:{fontSize:16,fontWeight:'700'},meta:{fontSize:12,marginTop:3},empty:{marginTop:36,textAlign:'center',fontSize:14}});
