import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentSafetyMenu } from '@/components/content-safety-menu';
import { supabase } from '@/lib/supabase';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Collection = { id: string; title: string; description: string; owner_id: string };
type Place = { id: string; nombre: string };
type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export default function PublicCollection() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<Collection | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [saved, setSaved] = useState(false);
  const [own, setOwn] = useState(false);
  const [state, setState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState(false);
  const requestRef = useRef(0);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setState('loading');
    setItem(null);
    setPlaces([]);
    setSaved(false);
    setOwn(false);
    try {
      if (!id) { setState('missing'); return; }
      const [collection, rows, auth] = await Promise.all([
        supabase.from('collections').select('id,title,description,owner_id').eq('id', id).maybeSingle(),
        supabase.from('collection_places').select('fondita_id,sort_order,fonditas(id,nombre,categorias)').eq('collection_id', id).order('sort_order'),
        supabase.auth.getUser(),
      ]);
      if (request !== requestRef.current) return;
      if (collection.error || rows.error) throw new Error('Collection unavailable');
      if (!collection.data) { setState('missing'); return; }
      const user = auth.data.user;
      let isSaved = false;
      if (user && !user.is_anonymous) {
        const relation = await supabase.from('saved_collections').select('collection_id')
          .eq('user_id', user.id).eq('collection_id', id).maybeSingle();
        if (relation.error) throw relation.error;
        isSaved = !!relation.data;
      }
      if (request !== requestRef.current) return;
      setItem(collection.data);
      setPlaces((rows.data ?? []).flatMap((row): Place[] => {
        const place = Array.isArray(row.fonditas) ? row.fonditas[0] : row.fonditas;
        return place ? [place as Place] : [];
      }));
      setOwn(user?.id === collection.data.owner_id);
      setSaved(isSaved);
      setState('ready');
    } catch {
      if (request === requestRef.current) setState('error');
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestRef.current += 1; };
  }, [load]));

  const save = async () => {
    if (!item || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const request = requestRef.current;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (request !== requestRef.current) return;
      if (!data.user || data.user.is_anonymous) {
        router.push({ pathname: '/comunidad-acceso', params: { returnTo: `/coleccion-publica/${id}` } });
        return;
      }
      if (error) throw error;
      const next = !saved;
      const result = next
        ? await supabase.from('saved_collections').upsert({ user_id: data.user.id, collection_id: item.id }, { onConflict: 'user_id,collection_id', ignoreDuplicates: true })
        : await supabase.from('saved_collections').delete().eq('user_id', data.user.id).eq('collection_id', item.id);
      if (result.error) throw result.error;
      if (request === requestRef.current) setSaved(next);
    } catch {
      if (request === requestRef.current) Alert.alert(noWidow('No se pudo actualizar la lista'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const share = async () => {
    if (!item) return;
    try {
      await Share.share({ message: `${item.title}\npatio://coleccion-publica/${item.id}` });
    } catch {
      Alert.alert(noWidow('No se pudo compartir'), noWidow('Inténtalo otra vez.'));
    }
  };
  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/explorar'); };
  const blocked = () => { requestRef.current += 1; setItem(null); setPlaces([]); setSaved(false); setState('missing'); };

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} accessibilityRole="button" accessibilityLabel="Volver" onPress={back}><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity>
        {item && <View style={s.navActions}>
          <TouchableOpacity style={s.navButton} accessibilityRole="button" accessibilityLabel="Compartir lista" onPress={share}><Ionicons name="share-outline" size={21} color={theme.text} /></TouchableOpacity>
          {!own && <ContentSafetyMenu targetType="collection" targetId={item.id} authorId={item.owner_id} onBlocked={blocked} />}
        </View>}
      </View>
      {state === 'loading' ? <ActivityIndicator style={s.feedback} color={theme.textSecondary} accessibilityLabel="Cargando lista" /> : state !== 'ready' ? (
        <View style={s.feedback}>
          <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow(state === 'error' ? 'No pudimos cargar esta lista.' : 'Esta lista no está disponible.')}</Text>
          {state === 'error' && <TouchableOpacity style={s.retry} accessibilityRole="button" onPress={() => { void load(); }}><Text style={{ color: theme.text }}>{noWidow('Intentar de nuevo')}</Text></TouchableOpacity>}
        </View>
      ) : item && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <Text style={[s.title, { color: theme.text }]}>{noWidow(item.title)}</Text>
          {!!item.description && <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow(item.description)}</Text>}
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving, selected: saved }} disabled={saving} style={[s.button, { backgroundColor: theme.accent, opacity: saving ? 0.6 : 1 }]} onPress={save}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={17} color="#FFFFFF" />
            <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>{noWidow(saved ? 'Lista guardada' : 'Guardar lista')}</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" style={[s.row, { borderColor: theme.border }]} onPress={() => router.push({ pathname: '/foodie/[id]', params: { id: item.owner_id } })}><Text style={{ color: theme.textSecondary }}>{noWidow('Ver perfil del curador')}</Text><Ionicons name="chevron-forward" size={16} color={theme.textMute} /></TouchableOpacity>
          {places.map((place) => <TouchableOpacity key={place.id} accessibilityRole="button" accessibilityLabel={`Abrir ${place.nombre}`} style={[s.row, { borderColor: theme.border }]} onPress={() => router.push(`/patio/${place.id}`)}>
            <View style={s.placeIcon}><Ionicons name="restaurant-outline" size={18} color={theme.textSecondary} /></View>
            <Text numberOfLines={2} ellipsizeMode="tail" style={[s.placeName, { color: theme.text }]}>{noWidow(place.nombre)}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
          </TouchableOpacity>)}
          {!places.length && <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow('Esta lista todavía no tiene lugares disponibles.')}</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 22 },
  nav: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedback: { alignItems: 'center', marginTop: 40 },
  retry: { minHeight: 44, justifyContent: 'center', marginTop: 16 },
  title: { fontFamily: Fonts.brand, fontSize: 38, fontWeight: '900', letterSpacing: -1.2, marginTop: 24 },
  desc: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  button: { minHeight: 48, paddingVertical: 12, borderRadius: 24, alignSelf: 'flex-start', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 26 },
  placeIcon: { width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  placeName: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  row: { gap: 12, paddingVertical: 12, minHeight: 60, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
