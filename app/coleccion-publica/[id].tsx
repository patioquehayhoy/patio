import { PlaceIcon } from '@/components/place-icon';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentSafetyMenu } from '@/components/content-safety-menu';
import { followProfile, getFollowStatus, unfollowProfile, type FollowStatus } from '@/lib/profile-privacy';
import { supabase } from '@/lib/supabase';
import { useTheme, Type } from '@/lib/theme';
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
  // Se sigue a la persona que armó la lista, como en Instagram se sigue la
  // cuenta y no cada publicación: sus listas viven en su perfil.
  const [ownerName, setOwnerName] = useState('');
  const [follow, setFollow] = useState<FollowStatus>('none');
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
    setOwnerName('');
    setFollow('none');
    setOwn(false);
    try {
      if (!id) { setState('missing'); return; }
      const [collection, rows, auth] = await Promise.all([
        supabase.from('collections').select('id,title,description,owner_id').eq('id', id).maybeSingle(),
        supabase.from('collection_places').select('negocio_id,sort_order,negocios(id,nombre,categorias)').eq('collection_id', id).order('sort_order'),
        supabase.auth.getUser(),
      ]);
      if (request !== requestRef.current) return;
      if (collection.error || rows.error) throw new Error('Collection unavailable');
      if (!collection.data) { setState('missing'); return; }
      const user = auth.data.user;
      const [owner, relation] = await Promise.all([
        supabase.from('user_profiles').select('display_name').eq('user_id', collection.data.owner_id).maybeSingle(),
        getFollowStatus(collection.data.owner_id),
      ]);
      if (request !== requestRef.current) return;
      setOwnerName(owner.data?.display_name?.trim() ?? '');
      setFollow(relation);
      setItem(collection.data);
      setPlaces((rows.data ?? []).flatMap((row): Place[] => {
        const place = Array.isArray(row.negocios) ? row.negocios[0] : row.negocios;
        return place ? [place as Place] : [];
      }));
      setOwn(user?.id === collection.data.owner_id);
      setState('ready');
    } catch {
      if (request === requestRef.current) setState('error');
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestRef.current += 1; };
  }, [load]));

  const toggleFollow = async () => {
    if (!item || own || savingRef.current) return;
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
      if (follow === 'none') {
        const next = await followProfile(item.owner_id);
        if (request === requestRef.current) setFollow(next);
      } else {
        await unfollowProfile(item.owner_id);
        if (request === requestRef.current) setFollow('none');
      }
    } catch {
      if (request === requestRef.current) Alert.alert(noWidow('No se pudo actualizar'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
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
  const blocked = () => { requestRef.current += 1; setItem(null); setPlaces([]); setFollow('none'); setState('missing'); };
  const firstName = ownerName.split(/\s+/)[0] ?? '';
  const followLabel = follow === 'accepted' ? 'Siguiendo' : follow === 'pending' ? 'Solicitado' : firstName ? `Seguir a ${firstName}` : 'Seguir';

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} accessibilityRole="button" accessibilityLabel="Volver" onPress={back}><Ionicons name="chevron-back" size={21} color={theme.text} /></TouchableOpacity>
        {item && <View style={s.navActions}>
          <TouchableOpacity style={s.navButton} accessibilityRole="button" accessibilityLabel="Compartir lista" onPress={share}><Ionicons name="share-outline" size={21} color={theme.text} /></TouchableOpacity>
          {!own && <ContentSafetyMenu targetType="collection" targetId={item.id} authorId={item.owner_id} onBlocked={blocked} />}
        </View>}
      </View>
      {state === 'loading' ? <ActivityIndicator style={s.feedback} color={theme.textSecondary} accessibilityLabel="Cargando lista" /> : state !== 'ready' ? (
        <View style={s.feedback}>
          <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow(state === 'error' ? 'No pudimos cargar esta lista.' : 'Esta lista no está disponible.')}</Text>
          {state === 'error' && <TouchableOpacity style={s.retry} accessibilityRole="button" accessibilityLabel="Reintentar carga de lista" onPress={() => { void load(); }}><Text style={{ color: theme.text }}>{noWidow('Intentar de nuevo')}</Text></TouchableOpacity>}
        </View>
      ) : item && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}>
          <Text style={[s.title, { color: theme.text }]}>{noWidow(item.title)}</Text>
          {!!item.description && <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow(item.description)}</Text>}
          {!own && <TouchableOpacity accessibilityRole="button" accessibilityLabel={follow === 'accepted' ? `Dejar de seguir a ${ownerName || 'esta persona'}` : follow === 'pending' ? 'Retirar solicitud para seguir' : `Seguir a ${ownerName || 'esta persona'}`} accessibilityState={{ disabled: saving, busy: saving, selected: follow !== 'none' }} disabled={saving} style={[s.button, follow === 'none' ? { backgroundColor: theme.accent } : { backgroundColor: theme.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border }, saving && { opacity: 0.6 }]} onPress={toggleFollow}>
            <Text style={{ color: follow === 'none' ? '#FFFFFF' : theme.text, fontWeight: '700' }}>{noWidow(followLabel)}</Text>
          </TouchableOpacity>}
          <TouchableOpacity accessibilityRole="button" style={[s.row, { borderColor: theme.border }]} onPress={() => router.push({ pathname: '/foodie/[id]', params: { id: item.owner_id } })}><Text style={{ color: theme.textSecondary }}>{noWidow(ownerName ? `Ver perfil de ${ownerName}` : 'Ver perfil de quien la armó')}</Text><Ionicons name="chevron-forward" size={16} color={theme.textMute} /></TouchableOpacity>
          {places.map((place) => <TouchableOpacity key={place.id} accessibilityRole="button" accessibilityLabel={`Abrir ${place.nombre}`} style={[s.row, { borderColor: theme.border }]} onPress={() => router.push(`/patio/${place.id}`)}>
            <View style={s.placeIcon}><PlaceIcon size={18} color={theme.textSecondary} /></View>
            <Text style={[s.placeName, { color: theme.text }]}>{noWidow(place.nombre)}</Text>
            <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
          </TouchableOpacity>)}
          {!places.length && <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow('Esta lista todavía no tiene lugares disponibles.')}</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  nav: { height: 52, marginHorizontal: -6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedback: { alignItems: 'center', marginTop: 40 },
  retry: { minHeight: 44, justifyContent: 'center', marginTop: 16 },
  title: { ...Type.screen, marginTop: 24 },
  desc: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  button: { minHeight: 54, paddingVertical: 12, borderRadius: 27, alignSelf: 'flex-start', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 26 },
  placeIcon: { width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  placeName: { flex: 1, minWidth: 0, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  row: { gap: 12, paddingVertical: 12, minHeight: 60, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
