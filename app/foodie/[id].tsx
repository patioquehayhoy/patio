import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentSafetyMenu } from '@/components/content-safety-menu';
import { supabase } from '@/lib/supabase';
import { followProfile, getFollowStatus, getProfileStats, unfollowProfile, type FollowStatus, type ProfileStats } from '@/lib/profile-privacy';
import { useTheme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Profile = { user_id: string; display_name: string; handle?: string; avatar_url?: string; bio?: string; visibility?: string };
type PublicCollection = { id: string; title: string; description: string };
type LoadState = 'loading' | 'ready' | 'missing' | 'error';

export default function FoodieProfile() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { theme } = useTheme();
  const ins = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lists, setLists] = useState<PublicCollection[]>([]);
  const [follow, setFollow] = useState<FollowStatus>('none');
  const [own, setOwn] = useState(false);
  const [counts, setCounts] = useState<ProfileStats>({ reviews: 0, likes: 0, followers: 0, following: 0 });
  const [state, setState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState(false);
  const requestRef = useRef(0);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setState('loading');
    setProfile(null);
    setLists([]);
    setFollow('none');
    setOwn(false);
    try {
      if (!id) { setState('missing'); return; }
      // Las listas de un perfil privado solo llegan si ya lo sigues: el
      // servidor las filtra; aquí solo se explica por qué no se ven.
      const [person, collections, auth, followCounts, relation] = await Promise.all([
        supabase.from('user_profiles').select('user_id,display_name,handle,avatar_url,bio,visibility').eq('user_id', id).maybeSingle(),
        supabase.from('collections').select('id,title,description').eq('owner_id', id).eq('visibility', 'public'),
        supabase.auth.getUser(),
        getProfileStats(id),
        getFollowStatus(id),
      ]);
      if (request !== requestRef.current) return;
      if (person.error || collections.error) throw new Error('Profile unavailable');
      if (!person.data) { setState('missing'); return; }
      const user = auth.data.user;
      setProfile(person.data);
      setLists(collections.data ?? []);
      setOwn(user?.id === id);
      setFollow(relation);
      setCounts(followCounts);
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
      // Seguir, dejar de seguir o retirar la solicitud, como en Instagram.
      if (follow === 'none') {
        const next = await followProfile(id);
        if (request !== requestRef.current) return;
        setFollow(next);
        if (next === 'accepted') {
          setCounts((current) => ({ ...current, followers: current.followers + 1 }));
          void load();
        }
      } else {
        await unfollowProfile(id);
        if (request !== requestRef.current) return;
        if (follow === 'accepted') setCounts((current) => ({ ...current, followers: Math.max(0, current.followers - 1) }));
        setFollow('none');
        if (profile.visibility === 'private') setLists([]);
      }
    } catch {
      if (request === requestRef.current) Alert.alert(noWidow('No se pudo actualizar'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const back = () => { if (router.canGoBack()) router.back(); else router.replace('/explorar'); };
  const blocked = () => { requestRef.current += 1; setProfile(null); setLists([]); setFollow('none'); setState('missing'); };
  const locked = !!profile && profile.visibility === 'private' && !own && follow !== 'accepted';
  const followLabel = follow === 'accepted' ? 'Siguiendo' : follow === 'pending' ? 'Solicitado' : 'Seguir';

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
          {state === 'error' && <TouchableOpacity style={s.retry} accessibilityRole="button" accessibilityLabel="Reintentar carga de perfil" onPress={() => { void load(); }}><Text style={{ color: theme.text }}>{noWidow('Intentar de nuevo')}</Text></TouchableOpacity>}
        </View>
      ) : profile && (
        <ScrollView contentContainerStyle={{ paddingBottom: ins.bottom + 40 }}>
          <View style={s.head}>
            {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="person" size={30} color={theme.textMute} /></View>}
            <Text style={[s.name, { color: theme.text }]}>{noWidow(profile.display_name || 'Foodie')}</Text>
            {!!profile.handle && <Text style={[s.handle, { color: theme.textSecondary }]}>@{profile.handle}</Text>}
            {/* Como Instagram: los números del perfil se ven aunque sea privado. */}
            <View style={s.stats} accessibilityRole="summary">
              {([
                [counts.reviews, counts.reviews === 1 ? 'reseña' : 'reseñas', null],
                [counts.likes, 'me gusta', null],
                [counts.followers, counts.followers === 1 ? 'seguidor' : 'seguidores', 'seguidores'],
                [counts.following, 'siguiendo', 'siguiendo'],
              ] as const).map(([value, label, list]) => {
                const content = <>
                  <Text style={[s.statValue, { color: theme.text }]}>{value}</Text>
                  <Text style={[s.statLabel, { color: theme.textSecondary }]}>{label}</Text>
                </>;
                // Como Instagram: tocar seguidores o siguiendo abre la lista,
                // salvo en un perfil privado que todavía no sigues.
                return list && !locked && value > 0 ? (
                  <TouchableOpacity key={label} style={s.stat} accessibilityRole="button" accessibilityLabel={`${value} ${label}. Ver lista`}
                    onPress={() => router.push({ pathname: '/foodie/seguidores', params: { id: profile.user_id, tipo: list } })}>
                    {content}
                  </TouchableOpacity>
                ) : (
                  <View key={label} style={s.stat} accessible accessibilityLabel={`${value} ${label}`}>{content}</View>
                );
              })}
            </View>
            {!!profile.bio && <Text style={[s.bio, { color: theme.textSecondary }]}>{noWidow(profile.bio)}</Text>}
            {!own && <TouchableOpacity accessibilityRole="button" accessibilityLabel={follow === 'accepted' ? 'Dejar de seguir perfil' : follow === 'pending' ? 'Retirar solicitud para seguir' : 'Seguir perfil'} accessibilityState={{ disabled: saving, busy: saving, selected: follow !== 'none' }} disabled={saving} style={[s.follow, { backgroundColor: follow !== 'none' ? theme.surface : theme.accent, borderColor: theme.border, opacity: saving ? 0.6 : 1 }]} onPress={toggleFollow}><Text style={{ color: follow !== 'none' ? theme.text : '#FFFFFF', fontWeight: '700' }}>{followLabel}</Text></TouchableOpacity>}
          </View>
          {locked ? (
            <View style={[s.locked, { borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={22} color={theme.textSecondary} />
              <Text style={[s.listName, { color: theme.text, marginTop: 8 }]}>{noWidow('Este perfil es privado')}</Text>
              <Text style={[s.desc, { color: theme.textSecondary, textAlign: 'center' }]}>{noWidow(follow === 'pending' ? 'Cuando acepte tu solicitud, verás sus listas.' : 'Síguelo para ver sus listas.')}</Text>
            </View>
          ) : <>
          <Text style={[s.label, { color: theme.textSecondary }]}>COLECCIONES</Text>
          {lists.map((list) => <TouchableOpacity key={list.id} accessibilityRole="button" accessibilityLabel={`Abrir ${list.title}`} style={[s.row, { borderColor: theme.border }]} onPress={() => router.push({ pathname: '/coleccion-publica/[id]', params: { id: list.id } })}><View style={{ flex: 1 }}><Text style={[s.listName, { color: theme.text }]}>{noWidow(list.title)}</Text>{!!list.description && <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow(list.description)}</Text>}</View><Ionicons name="chevron-forward" size={17} color={theme.textMute} /></TouchableOpacity>)}
          {!lists.length && <Text style={[s.desc, { color: theme.textSecondary, marginTop: 16 }]}>{noWidow('Todavía no hay colecciones públicas.')}</Text>}
          </>}
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
  name: { ...Type.title, marginTop: 12 },
  handle: { fontSize: 13, marginTop: 2 },
  bio: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 10, maxWidth: 300 },
  follow: { minHeight: 44, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 24, paddingVertical: 10, justifyContent: 'center', marginTop: 16 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 18 },
  row: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  listName: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 3 },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  stat: { alignItems: 'center', minWidth: 56 },
  statValue: { fontSize: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 12, marginTop: 2 },
  locked: { alignItems: 'center', marginTop: 24, paddingVertical: 24, paddingHorizontal: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
});
