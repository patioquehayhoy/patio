import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentSafetyMenu } from '@/components/content-safety-menu';
import { supabase } from '@/lib/supabase';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Profile = { user_id: string; display_name: string; handle?: string; avatar_url?: string; bio?: string };
type PublicCollection = { id: string; title: string; description: string };
type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export default function FoodieProfile() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { theme } = useTheme();
  const ins = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lists, setLists] = useState<PublicCollection[]>([]);
  const [following, setFollowing] = useState(false);
  const [own, setOwn] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [state, setState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState(false);
  const requestRef = useRef(0);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setState('loading');
    setProfile(null);
    setLists([]);
    setFollowing(false);
    setOwn(false);
    try {
      if (!id) { setState('missing'); return; }
      const [person, collections, auth, followers, followingCount] = await Promise.all([
        supabase.from('user_profiles').select('user_id,display_name,handle,avatar_url,bio').eq('user_id', id).maybeSingle(),
        supabase.from('collections').select('id,title,description').eq('owner_id', id).eq('visibility', 'public'),
        supabase.auth.getUser(),
        supabase.from('profile_follows').select('*', { count: 'exact', head: true }).eq('followed_id', id),
        supabase.from('profile_follows').select('*', { count: 'exact', head: true }).eq('follower_id', id),
      ]);
      if (request !== requestRef.current) return;
      if (person.error || collections.error || followers.error || followingCount.error) throw new Error('Profile unavailable');
      if (!person.data) { setState('missing'); return; }
      const user = auth.data.user;
      let follows = false;
      if (user && !user.is_anonymous) {
        const relation = await supabase.from('profile_follows').select('followed_id')
          .eq('follower_id', user.id).eq('followed_id', id).maybeSingle();
        if (relation.error) throw relation.error;
        follows = !!relation.data;
      }
      if (request !== requestRef.current) return;
      setProfile(person.data);
      setLists(collections.data ?? []);
      setOwn(user?.id === id);
      setFollowing(follows);
      setCounts({ followers: followers.count ?? 0, following: followingCount.count ?? 0 });
      setState('ready');
    } catch {
      if (request === requestRef.current) setState('error');
    }
  }, [id]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestRef.current += 1; };
  }, [load]));

  const follow = async () => {
    if (!profile || own || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    const request = requestRef.current;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (request !== requestRef.current) return;
      if (!data.user || data.user.is_anonymous) {
        router.push({ pathname: '/comunidad-acceso', params: { returnTo: `/foodie/${id}` } });
        return;
      }
      if (error) throw error;
      const next = !following;
      const result = next
        ? await supabase.from('profile_follows').upsert({ follower_id: data.user.id, followed_id: id }, { onConflict: 'follower_id,followed_id', ignoreDuplicates: true })
        : await supabase.from('profile_follows').delete().eq('follower_id', data.user.id).eq('followed_id', id);
      if (result.error) throw result.error;
      if (request !== requestRef.current) return;
      setFollowing(next);
      setCounts((current) => ({ ...current, followers: Math.max(0, current.followers + (next ? 1 : -1)) }));
    } catch {
      if (request === requestRef.current) Alert.alert(noWidow('No se pudo actualizar'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/explorar'); };
  const blocked = () => { requestRef.current += 1; setProfile(null); setLists([]); setFollowing(false); setState('missing'); };

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: ins.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} accessibilityRole="button" accessibilityLabel="Volver" onPress={back}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        {profile && !own && <ContentSafetyMenu targetType="profile" targetId={profile.user_id} authorId={profile.user_id} onBlocked={blocked} />}
      </View>
      {state === 'loading' ? <ActivityIndicator style={s.feedback} color={theme.textSecondary} accessibilityLabel="Cargando perfil" /> : state !== 'ready' ? (
        <View style={s.feedback}>
          <Text style={[s.bio, { color: theme.textSecondary }]}>{noWidow(state === 'error' ? 'No pudimos cargar este perfil.' : 'Este perfil no está disponible.')}</Text>
          {state === 'error' && <TouchableOpacity style={s.retry} accessibilityRole="button" onPress={() => { void load(); }}><Text style={{ color: theme.text }}>{noWidow('Intentar de nuevo')}</Text></TouchableOpacity>}
        </View>
      ) : profile && (
        <ScrollView contentContainerStyle={{ paddingBottom: ins.bottom + 40 }}>
          <View style={s.head}>
            {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="person" size={30} color={theme.textMute} /></View>}
            <Text style={[s.name, { color: theme.text }]}>{noWidow(profile.display_name || 'Foodie')}</Text>
            {!!profile.handle && <Text style={[s.handle, { color: theme.textSecondary }]}>@{profile.handle}</Text>}
            <Text style={[s.handle, { color: theme.textSecondary }]}>{noWidow(`${counts.followers} seguidores · ${counts.following} siguiendo`)}</Text>
            {!!profile.bio && <Text style={[s.bio, { color: theme.textSecondary }]}>{noWidow(profile.bio)}</Text>}
            {!own && <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: saving, selected: following }} disabled={saving} style={[s.follow, { backgroundColor: following ? theme.surface : theme.accent, borderColor: theme.border, opacity: saving ? 0.6 : 1 }]} onPress={follow}><Text style={{ color: following ? theme.text : '#FFFFFF', fontWeight: '700' }}>{following ? 'Siguiendo' : 'Seguir'}</Text></TouchableOpacity>}
          </View>
          <Text style={[s.label, { color: theme.textSecondary }]}>COLECCIONES</Text>
          {lists.map((list) => <TouchableOpacity key={list.id} accessibilityRole="button" accessibilityLabel={`Abrir ${list.title}`} style={[s.row, { borderColor: theme.border }]} onPress={() => router.push({ pathname: '/coleccion-publica/[id]', params: { id: list.id } })}><View style={{ flex: 1 }}><Text style={[s.listName, { color: theme.text }]}>{noWidow(list.title)}</Text>{!!list.description && <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow(list.description)}</Text>}</View><Ionicons name="chevron-forward" size={17} color={theme.textMute} /></TouchableOpacity>)}
          {!lists.length && <Text style={[s.desc, { color: theme.textSecondary, marginTop: 16 }]}>{noWidow('Todavía no hay colecciones públicas.')}</Text>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  nav: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  feedback: { alignItems: 'center', marginTop: 40 },
  retry: { minHeight: 44, justifyContent: 'center', marginTop: 16 },
  head: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  name: { fontFamily: Fonts.brand, fontSize: 27, fontWeight: '900', marginTop: 12 },
  handle: { fontSize: 13, marginTop: 2 },
  bio: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 10, maxWidth: 300 },
  follow: { minHeight: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 24, paddingVertical: 10, justifyContent: 'center', marginTop: 16 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginTop: 18 },
  row: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  listName: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 3 },
});
