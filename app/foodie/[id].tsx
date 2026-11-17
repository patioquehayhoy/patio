import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Image as PhotoImage } from 'expo-image';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContentSafetyMenu } from '@/components/content-safety-menu';
import { supabase } from '@/lib/supabase';
import { followProfile, getFollowStatus, getProfileStats, getTopPlaces, unfollowProfile, type FollowStatus, type ProfileStats, type TopPlace } from '@/lib/profile-privacy';
import { demoReviewsByAuthor } from '@/lib/controllers/usePatioDetailController';
import { photoPlaceholder } from '@/lib/photo-hash';
import { getReviewsByAuthor, type AuthorReview } from '@/lib/ratings';
import { useTheme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Profile = { user_id: string; display_name: string; handle?: string; avatar_url?: string; bio?: string; visibility?: string };
type PublicCollection = { id: string; title: string; description: string };
type LoadState = 'loading' | 'ready' | 'missing' | 'error';
// Secciones del perfil (2026-11-16), como en las redes: una fila para cambiar
// entre lo que comió (fotos), lo que contó (reseñas) y lo que recomienda
// (sus lugares y sus listas).
type ProfileSection = 'fotos' | 'resenas' | 'listas';
const SECTIONS: { key: ProfileSection; label: string }[] = [
  { key: 'fotos', label: 'Fotos' },
  { key: 'resenas', label: 'Reseñas' },
  { key: 'listas', label: 'Listas' },
];

export default function FoodieProfile() {
  const params = useLocalSearchParams<{ id: string | string[]; name?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const demoName = Array.isArray(params.name) ? params.name[0] : params.name;
  // Se llama como función para que este perfil y el de la pestaña Perfil
  // compartan exactamente la misma pantalla.
  return ProfileView({ id, demoName });
}

/**
 * Un perfil, tal como lo ven los demás. Con `root` es la pestaña Perfil: tu
 * propio perfil, sin flecha atrás, con la campana (Actividad) y el engrane
 * (Ajustes) arriba a la derecha.
 */
export function ProfileView({ id, demoName, root = false, hasNews = false, bottomInset, onScroll }: {
  id?: string;
  demoName?: string;
  root?: boolean;
  hasNews?: boolean;
  bottomInset?: number;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
}) {
  // Perfil de prueba (solo en desarrollo): la gente de las reseñas «Dev».
  const demo = typeof __DEV__ !== 'undefined' && __DEV__ && !!id?.startsWith('demo-');
  const { theme } = useTheme();
  const ins = useSafeAreaInsets();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lists, setLists] = useState<PublicCollection[]>([]);
  // Sus lugares: lo primero que se quiere ver de alguien que recomienda
  // dónde comer, aunque no haya armado ninguna lista.
  const [places, setPlaces] = useState<TopPlace[]>([]);
  // Sus fotos y sus reseñas (2026-11-15): lo que comió y lo que contó.
  const [activity, setActivity] = useState<AuthorReview[]>([]);
  const { width: screenWidth } = useWindowDimensions();
  const [follow, setFollow] = useState<FollowStatus>('none');
  const [own, setOwn] = useState(false);
  const [counts, setCounts] = useState<ProfileStats>({ reviews: 0, likes: 0, followers: 0, following: 0 });
  const [state, setState] = useState<LoadState>('loading');
  const [saving, setSaving] = useState(false);
  const [picked, setPicked] = useState<ProfileSection | null>(null);
  const requestRef = useRef(0);
  const savingRef = useRef(false);

  const load = useCallback(async () => {
    const request = ++requestRef.current;
    setState('loading');
    setProfile(null);
    setLists([]);
    setPlaces([]);
    setActivity([]);
    setFollow('none');
    setOwn(false);
    try {
      if (!id) { setState('missing'); return; }
      if (demo) {
        const reviews = demoReviewsByAuthor(id);
        setProfile({ user_id: id, display_name: demoName || 'Persona de prueba', visibility: 'public' });
        setActivity(reviews);
        setCounts({ reviews: reviews.length, likes: 12, followers: 48, following: 31 });
        setState('ready');
        return;
      }
      // Las listas de un perfil privado solo llegan si ya lo sigues: el
      // servidor las filtra; aquí solo se explica por qué no se ven.
      const [person, collections, auth, followCounts, relation, topPlaces, reviews] = await Promise.all([
        supabase.from('user_profiles').select('user_id,display_name,handle,avatar_url,bio,visibility').eq('user_id', id).maybeSingle(),
        supabase.from('collections').select('id,title,description').eq('owner_id', id).eq('visibility', 'public'),
        supabase.auth.getUser(),
        getProfileStats(id),
        getFollowStatus(id),
        getTopPlaces(id).catch(() => [] as TopPlace[]),
        getReviewsByAuthor(id).catch(() => [] as AuthorReview[]),
      ]);
      if (request !== requestRef.current) return;
      if (person.error || collections.error) throw new Error('Profile unavailable');
      if (!person.data) { setState('missing'); return; }
      const user = auth.data.user;
      setProfile(person.data);
      setLists(collections.data ?? []);
      setPlaces(topPlaces);
      setActivity(reviews);
      setOwn(user?.id === id);
      setFollow(relation);
      setCounts(followCounts);
      setState('ready');
    } catch {
      if (request === requestRef.current) setState('error');
    }
  }, [id, demo, demoName]);

  useFocusEffect(useCallback(() => {
    void load();
    return () => { requestRef.current += 1; };
  }, [load]));

  const toggleFollow = async () => {
    if (!profile || own || savingRef.current) return;
    // De prueba: solo cambia aquí, sin servidor.
    if (demo) {
      setFollow((current) => (current === 'none' ? 'accepted' : 'none'));
      setCounts((current) => ({ ...current, followers: current.followers + (follow === 'none' ? 1 : -1) }));
      return;
    }
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
        const next = await followProfile(id!);
        if (request !== requestRef.current) return;
        setFollow(next);
        if (next === 'accepted') {
          setCounts((current) => ({ ...current, followers: current.followers + 1 }));
          void load();
        }
      } else {
        await unfollowProfile(id!);
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
  const blocked = () => { requestRef.current += 1; setProfile(null); setLists([]); setActivity([]); setFollow('none'); setState('missing'); };
  const photos = activity.filter((review) => !!review.photoUrl);
  // Cuadrícula de 3, como un perfil de fotos; el ancho sale de la pantalla.
  const tile = Math.floor((screenWidth - 40 - 4) / 3);
  const locked = !!profile && profile.visibility === 'private' && !own && follow !== 'accepted';
  const followLabel = follow === 'accepted' ? 'Siguiendo' : follow === 'pending' ? 'Solicitado' : 'Seguir';
  // Abre en la primera sección que tiene algo.
  const section: ProfileSection = picked ?? (photos.length ? 'fotos' : activity.length ? 'resenas' : 'listas');
  const isMine = own || root;

  // La pestaña Perfil: campana (Actividad, con su punto) y engrane (Ajustes).
  const rootActions = (
    <View style={s.navActions}>
      <TouchableOpacity style={s.navButton} onPress={() => router.push('/notificaciones')} accessibilityRole="button" accessibilityLabel="Actividad" accessibilityValue={hasNews ? { text: 'Tienes novedades' } : undefined}>
        <Ionicons name="notifications-outline" size={22} color={theme.text} />
        {hasNews && <View style={[s.dot, { backgroundColor: theme.accent }]} />}
      </TouchableOpacity>
      <TouchableOpacity style={s.navButton} onPress={() => router.push('/ajustes')} accessibilityRole="button" accessibilityLabel="Ajustes">
        <Ionicons name="settings-outline" size={22} color={theme.text} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: ins.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        {root ? <View style={s.navButton} /> : (
          <TouchableOpacity style={s.navButton} accessibilityRole="button" accessibilityLabel="Volver" onPress={back}>
            <Ionicons name="chevron-back" size={21} color={theme.text} />
          </TouchableOpacity>
        )}
        {root ? rootActions : profile && !own && <ContentSafetyMenu targetType="profile" targetId={profile.user_id} authorId={profile.user_id} onBlocked={blocked} />}
      </View>
      {state === 'loading' ? <ActivityIndicator style={s.feedback} color={theme.textSecondary} accessibilityLabel="Cargando perfil" /> : state !== 'ready' ? (
        root && state === 'missing' ? (
          // Tu perfil todavía no tiene nombre: el primer paso es ponérselo.
          <View style={s.head}>
            <View style={[s.avatar, { backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="person" size={30} color={theme.textMute} /></View>
            <Text style={[s.name, { color: theme.text }]}>{noWidow('Tu perfil')}</Text>
            <Text style={[s.bio, { color: theme.textSecondary }]}>{noWidow('Ponle tu nombre y tu foto para reseñar y armar listas.')}</Text>
            <TouchableOpacity style={[s.follow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/perfil-comunidad')} accessibilityRole="button" accessibilityLabel="Editar perfil">
              <Text style={{ color: theme.text, fontWeight: '700' }}>Editar perfil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.feedback}>
            <Text style={[s.bio, { color: theme.textSecondary }]}>{noWidow(state === 'error' ? 'No pudimos cargar este perfil.' : 'Este perfil no está disponible.')}</Text>
            {state === 'error' && <TouchableOpacity style={s.retry} accessibilityRole="button" accessibilityLabel="Reintentar carga de perfil" onPress={() => { void load(); }}><Text style={{ color: theme.text }}>{noWidow('Intentar de nuevo')}</Text></TouchableOpacity>}
          </View>
        )
      ) : profile && (
        <ScrollView contentContainerStyle={{ paddingBottom: bottomInset ?? ins.bottom + 40 }} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false}>
          <View style={s.head}>
            {profile.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={s.avatar} /> : <View style={[s.avatar, { backgroundColor: theme.surface, alignItems: 'center', justifyContent: 'center' }]}><Ionicons name="person" size={30} color={theme.textMute} /></View>}
            <Text style={[s.name, { color: theme.text }]}>{noWidow(profile.display_name || 'Foodie')}</Text>
            {!!profile.handle && <Text style={[s.handle, { color: theme.textSecondary }]}>@{profile.handle}</Text>}
            {/* Como Instagram: los números del perfil se ven aunque sea privado. */}
            <View style={s.stats} accessibilityRole="summary">
              {([
                [counts.reviews, counts.reviews === 1 ? 'reseña' : 'reseñas', null],
                [counts.followers, counts.followers === 1 ? 'seguidor' : 'seguidores', 'seguidores'],
                [counts.following, 'siguiendo', 'siguiendo'],
              ] as const).map(([value, label, list]) => {
                const content = <>
                  <Text style={[s.statValue, { color: theme.text }]}>{value.toLocaleString('es-MX')}</Text>
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
            {isMine ? (
              <TouchableOpacity style={[s.follow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => router.push('/perfil-comunidad')} accessibilityRole="button" accessibilityLabel="Editar perfil">
                <Text style={{ color: theme.text, fontWeight: '700' }}>Editar perfil</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={follow === 'accepted' ? 'Dejar de seguir perfil' : follow === 'pending' ? 'Retirar solicitud para seguir' : 'Seguir perfil'} accessibilityState={{ disabled: saving, busy: saving, selected: follow !== 'none' }} disabled={saving} style={[s.follow, { backgroundColor: follow !== 'none' ? theme.surface : theme.accent, borderColor: theme.border, opacity: saving ? 0.6 : 1 }]} onPress={toggleFollow}><Text style={{ color: follow !== 'none' ? theme.text : '#FFFFFF', fontWeight: '700' }}>{followLabel}</Text></TouchableOpacity>
            )}
          </View>
          {locked ? (
            <View style={[s.locked, { borderColor: theme.border }]}>
              <Ionicons name="lock-closed-outline" size={22} color={theme.textSecondary} />
              <Text style={[s.listName, { color: theme.text, marginTop: 8 }]}>{noWidow('Este perfil es privado')}</Text>
              <Text style={[s.desc, { color: theme.textSecondary, textAlign: 'center' }]}>{noWidow(follow === 'pending' ? 'Cuando acepte tu solicitud, verás sus fotos, reseñas y listas.' : 'Síguelo para ver sus fotos, reseñas y listas.')}</Text>
            </View>
          ) : <>
            {/* Una fila para cambiar de sección. */}
            <View style={[s.segmented, { borderColor: theme.border }]} accessibilityRole="tablist">
              {SECTIONS.map((item) => {
                const selected = section === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    style={[s.segment, selected && { backgroundColor: theme.text }]}
                    onPress={() => setPicked(item.key)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected }}
                    accessibilityLabel={item.label}>
                    <Text style={[s.segmentText, { color: selected ? theme.bg : theme.textSecondary }]} maxFontSizeMultiplier={1.3}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Lo que comió: tocar una foto abre el lugar con ese platillo abierto. */}
            {section === 'fotos' && (photos.length ? (
              <View style={s.grid}>
                {photos.map((review) => (
                  <TouchableOpacity
                    key={review.reviewId}
                    activeOpacity={0.85}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={`${review.photoDish ?? 'Foto'} en ${review.placeName}`}
                    onPress={() => router.push({ pathname: '/patio/[id]', params: { id: review.placeId, ...(review.photoDish ? { platillo: review.photoDish } : {}) } })}>
                    <PhotoImage
                      source={{ uri: review.photoUrl }}
                      placeholder={photoPlaceholder(review.photoHash)}
                      placeholderContentFit="cover"
                      style={[s.gridPhoto, { width: tile, height: tile, backgroundColor: theme.border }]}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      transition={120}
                      accessibilityIgnoresInvertColors
                    />
                  </TouchableOpacity>
                ))}
              </View>
            ) : <Text style={[s.empty, { color: theme.textSecondary }]}>{noWidow('Todavía no hay fotos.')}</Text>)}

            {/* Lo que contó, completo: tocar una reseña abre el lugar. */}
            {section === 'resenas' && (activity.length ? activity.map((review) => (
              <TouchableOpacity
                key={review.reviewId}
                activeOpacity={0.7}
                style={[s.reviewRow, { borderColor: theme.border }]}
                accessibilityRole="button"
                accessibilityLabel={`${review.placeName}, ${review.stars} estrellas${review.note ? `. ${review.note}` : ''}`}
                onPress={() => router.push({ pathname: '/patio/[id]', params: { id: review.placeId } })}>
                <View style={s.reviewHead}>
                  <Text style={[s.listName, { flex: 1, minWidth: 0, color: theme.text }]}>{noWidow(review.placeName)}</Text>
                  <View style={s.placeStars}>
                    <Ionicons name="star" size={13} color={theme.accent} />
                    <Text style={[s.placeStarsText, { color: theme.textSecondary }]}>{review.stars}</Text>
                  </View>
                </View>
                <Text style={[s.desc, { color: theme.textSecondary }]}>
                  {new Date(review.timestamp).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {!!review.note && <Text style={[s.reviewNote, { color: theme.text }]}>{review.note}</Text>}
              </TouchableOpacity>
            )) : <Text style={[s.empty, { color: theme.textSecondary }]}>{noWidow('Todavía no hay reseñas.')}</Text>)}

            {/* Lo que recomienda: sus lugares mejor calificados y sus listas. */}
            {section === 'listas' && (places.length || lists.length ? <>
              {!!places.length && <>
                <Text style={[s.label, { color: theme.textSecondary }]}>LUGARES</Text>
                {places.map((place, index) => <TouchableOpacity key={place.id} accessibilityRole="button"
                  accessibilityLabel={`${index + 1}. ${place.name}${place.stars ? `, ${place.stars} estrellas` : ''}`}
                  style={[s.placeRow, { borderColor: theme.border }]} onPress={() => router.push({ pathname: '/patio/[id]', params: { id: place.id } })}>
                  <Text style={[s.placeRank, { color: theme.textMute }]}>{index + 1}</Text>
                  <Text style={[s.listName, { flex: 1, minWidth: 0, color: theme.text }]}>{noWidow(place.name)}</Text>
                  {!!place.stars && <View style={s.placeStars}>
                    <Ionicons name="star" size={13} color={theme.accent} />
                    <Text style={[s.placeStarsText, { color: theme.textSecondary }]}>{place.stars}</Text>
                  </View>}
                  <Ionicons name="chevron-forward" size={17} color={theme.textMute} />
                </TouchableOpacity>)}
              </>}
              {!!lists.length && <>
                <Text style={[s.label, { color: theme.textSecondary }]}>LISTAS</Text>
                {lists.map((list) => <TouchableOpacity key={list.id} accessibilityRole="button" accessibilityLabel={`Abrir ${list.title}`} style={[s.row, { borderColor: theme.border }]} onPress={() => router.push({ pathname: '/coleccion-publica/[id]', params: { id: list.id } })}><View style={{ flex: 1 }}><Text style={[s.listName, { color: theme.text }]}>{noWidow(list.title)}</Text>{!!list.description && <Text style={[s.desc, { color: theme.textSecondary }]}>{noWidow(list.description)}</Text>}</View><Ionicons name="chevron-forward" size={17} color={theme.textMute} /></TouchableOpacity>)}
              </>}
            </> : <Text style={[s.empty, { color: theme.textSecondary }]}>{noWidow('Todavía no hay listas públicas.')}</Text>)}
          </>}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 20 },
  nav: { height: 52, marginHorizontal: -6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navActions: { flexDirection: 'row', alignItems: 'center' },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4 },
  feedback: { alignItems: 'center', marginTop: 40 },
  retry: { minHeight: 44, justifyContent: 'center', marginTop: 16 },
  head: { alignItems: 'center', paddingVertical: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  name: { ...Type.title, marginTop: 12, textAlign: 'center' },
  handle: { fontSize: 13, marginTop: 2 },
  bio: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 10, maxWidth: 300 },
  follow: { minHeight: 44, borderRadius: 22, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 24, paddingVertical: 10, justifyContent: 'center', marginTop: 16 },
  segmented: { flexDirection: 'row', borderRadius: 14, borderCurve: 'continuous', borderWidth: 1, overflow: 'hidden', marginBottom: 12 },
  segment: { flex: 1, minHeight: 36, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  segmentText: { fontSize: 13, fontWeight: '700' },
  empty: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 24 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginTop: 14 },
  placeRow: { minHeight: 52, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 12 },
  placeRank: { width: 20, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  placeStars: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  placeStarsText: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  row: { minHeight: 70, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridPhoto: { borderRadius: 4 },
  reviewRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  reviewNote: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  listName: { fontSize: 16, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 3 },
  stats: { flexDirection: 'row', justifyContent: 'center', gap: 24, marginTop: 16 },
  stat: { alignItems: 'center', minWidth: 56 },
  statValue: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'], lineHeight: 22 },
  statLabel: { fontSize: 12, marginTop: 2 },
  locked: { alignItems: 'center', marginTop: 24, paddingVertical: 24, paddingHorizontal: 16, borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth },
});
