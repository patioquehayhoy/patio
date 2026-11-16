import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/action-sheet';
import { fetchFonditaById, fetchPublicFonditas, getPatioById, type Patio } from '@/lib/patios';
import { patioCardPrice } from '@/lib/patio-card-info';
import { getRatedPatioIds, savePatioRating } from '@/lib/ratings';
import { pickPlacePhoto, PlacePhotoPermissionError, type PlacePhotoSource } from '@/lib/place-photo';
import { similarPlaces } from '@/lib/recommendations';
import { writeErrorMessage } from '@/lib/content-safety';
import { reviewTags } from '@/lib/review-tags';
import { useTheme, type Theme, Type } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { noWidow } from '@/lib/typography';
import { TEXT_LIMITS } from '@/lib/text-limits';

/** El mismo precio típico de las tarjetas; nada si el lugar no publica precios. */
function typicalPrice(place: Patio): string | null {
  const price = patioCardPrice(place);
  return price.source === 'missing' ? null : price.label;
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, height: 52 },
    navBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    navHint: { fontSize: 14, fontWeight: '400', color: t.textSecondary },

    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 140 },
    title: { ...Type.title, color: t.text, marginBottom: 4 },
    subtitle: { fontSize: 13, fontWeight: '400', color: t.textSecondary, marginBottom: 22 },

    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    star: { width: 48, height: 48, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
    starOn: { backgroundColor: t.accentSoft, borderColor: 'rgba(242,97,47,0.25)' },
    starOff: { backgroundColor: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,18,20,0.04)', borderColor: 'transparent' },

    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: t.textSecondary, marginBottom: 10 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    tag: { minHeight: 44, maxWidth: '100%', justifyContent: 'center', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
    tagOff: { backgroundColor: t.surface, borderColor: t.border },
    tagOn: { backgroundColor: t.text, borderColor: t.text },
    tagText: { fontSize: 13, fontWeight: '500', color: t.text },
    tagTextOn: { color: t.bg },

    noteCard: { padding: 16, borderRadius: 18, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, marginBottom: 14 },
    noteInput: { fontSize: 14, lineHeight: 20, color: t.text, minHeight: 64, padding: 0, textAlignVertical: 'top' },

    photoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, borderCurve: 'continuous', backgroundColor: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,18,20,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    photoText: { fontSize: 13, color: t.textSecondary, flex: 1 },
    dishPick: { marginTop: 18 },
    photoThumb: { width: 56, height: 56, borderRadius: 12, borderCurve: 'continuous' },

    ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14 },
    ctaFade: { position: 'absolute', left: 0, right: 0, top: -40, height: 40 },
    cta: { minHeight: 54, paddingVertical: 12, paddingHorizontal: 20, borderRadius: 27, borderCurve: 'continuous', backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },

    // Confirmación (vacío homologado: ícono de 32 en caja de 68, radio 20).
    doneContent: { paddingHorizontal: 20, paddingTop: 48 },
    doneHead: { alignItems: 'center', marginBottom: 40 },
    doneIcon: { width: 68, height: 68, borderRadius: 20, borderCurve: 'continuous', backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center' },
    doneTitle: { ...Type.section, color: t.text, marginTop: 18, textAlign: 'center' },
    doneBody: { maxWidth: 310, marginTop: 9, fontSize: 15, lineHeight: 21, fontWeight: '400', color: t.textSecondary, textAlign: 'center' },
    similarCard: { borderRadius: 18, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    similarRow: { minHeight: 56, paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    similarDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    similarCopy: { flex: 1, minWidth: 0 },
    similarName: { fontSize: 16, lineHeight: 21, fontWeight: '700', color: t.text },
    similarMeta: { marginTop: 2, fontSize: 13, lineHeight: 17, fontWeight: '400', color: t.textSecondary },
  });
}

export default function ResenaScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { id, stars: starsParam } = useLocalSearchParams<{ id?: string; stars?: string }>();
  const cleanId = Array.isArray(id) ? id[0] : id;
  const initialStars = Number(Array.isArray(starsParam) ? starsParam[0] : starsParam) || 0;

  const [patio, setPatio] = useState<Patio | null>(null);
  const [stars, setStars] = useState(initialStars);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  // ¿De qué platillo es la foto? (2026-11-15): así sale en la ficha al
  // mantener presionado ese platillo. Opcional.
  const [photoDish, setPhotoDish] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  // Después de publicar: «Parecidos cerca» para seguir buscando lugares.
  const [similar, setSimilar] = useState<Patio[] | null>(null);

  const starAnims = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (!cleanId) return;
    const mock = getPatioById(cleanId);
    if (mock) { setPatio(mock); return; }
    fetchFonditaById(cleanId).then((found) => { if (found) setPatio(found); });
  }, [cleanId]);

  const { label: tagLabel, tags: TAGS } = reviewTags(patio?.categories ?? [], stars);

  const pressStar = (n: number) => {
    // Cruzar de «destacó» a «faltó» cambia las etiquetas: lo elegido ya no aplica.
    if ((n <= 3) !== (stars <= 3)) setSelected([]);
    setStars(n);
    // Pulso de las estrellas activas, escalonado (como Figma).
    [1, 2, 3, 4, 5].forEach((i) => {
      if (i <= n) {
        Animated.sequence([
          Animated.delay(i * 40),
          Animated.spring(starAnims[i - 1], { toValue: 1.15, useNativeDriver: true, stiffness: 400, damping: 10, mass: 0.6 }),
          Animated.spring(starAnims[i - 1], { toValue: 1, useNativeDriver: true, stiffness: 400, damping: 12, mass: 0.6 }),
        ]).start();
      }
    });
  };

  const toggleTag = (t: string) => {
    setSelected((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const choosePhoto = async (source: PlacePhotoSource) => {
    try {
      const asset = await pickPlacePhoto(source);
      if (asset) setPhotoUri(asset.uri);
    } catch (error) {
      if (error instanceof PlacePhotoPermissionError) {
        Alert.alert(
          noWidow(source === 'camera' ? 'Patio no tiene acceso a la cámara' : 'Patio no tiene acceso a tus fotos'),
          noWidow('Puedes darle permiso en Ajustes.'),
          [{ text: 'Ahora no', style: 'cancel' }, { text: 'Abrir Ajustes', onPress: () => { Linking.openSettings().catch(() => {}); } }],
        );
      } else {
        Alert.alert(noWidow('No pudimos abrir la foto'), noWidow('Inténtalo otra vez.'));
      }
    }
  };
  // Tomarla ahí mismo o elegir de Fotos; con foto, también quitarla. Menú
  // anclado de Patio, el mismo de la foto de un platillo en el editor.
  const photoRowRef = useRef<View>(null);
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);
  const photoOptions = [
    { label: 'Tomar foto', icon: 'camera-outline' as const, afterDismiss: true, onPress: () => { void choosePhoto('camera'); } },
    { label: 'Elegir de Fotos', icon: 'images-outline' as const, afterDismiss: true, onPress: () => { void choosePhoto('library'); } },
    ...(photoUri ? [{ label: 'Quitar foto', icon: 'trash-outline' as const, destructive: true, onPress: () => { setPhotoUri(undefined); setPhotoDish(undefined); } }] : []),
  ];

  const dishOptions = [...new Set([...(patio?.menu ?? []), ...(patio?.carta ?? [])].flatMap((section) => section.items.map((item) => item.name)))].slice(0, 24);

  const subtitle = (() => {
    const dishes = patio?.menu?.[0]?.items?.slice(0, 2).map((it) => it.name).join(' · ');
    const price = patio ? patioCardPrice(patio) : null;
    return [dishes, price && price.source !== 'missing' ? price.label : null].filter(Boolean).join(' · ');
  })();

  const submit = async () => {
    if (!cleanId || stars === 0 || saving) return;
    const { data } = await supabase.auth.getSession();
    if (!data.session?.user.user_metadata?.profile_complete) {
      router.push({ pathname: '/comunidad-acceso', params: { returnTo: `/resena/${cleanId}` } });
      return;
    }
    setSaving(true);
    try {
      await savePatioRating(cleanId, { stars, reasons: selected, note, photoUri, photoDish });
      const suggestions = patio
        ? await Promise.all([fetchPublicFonditas(), getRatedPatioIds()])
          .then(([all, rated]) => similarPlaces(patio, all, rated))
          .catch(() => [] as Patio[])
        : [];
      if (suggestions.length) setSimilar(suggestions);
      else router.back();
    } catch (error) {
      Alert.alert(noWidow('No pudimos publicar tu reseña'), noWidow(error instanceof Error && error.message === 'REVIEW_PHOTO_UPLOAD_FAILED'
        ? 'No se pudo subir la foto. Revisa tu conexión o quítala y publica sin ella.'
        : writeErrorMessage(error, 'Revisa tu conexión e inténtalo otra vez.')));
    } finally {
      setSaving(false);
    }
  };

  if (similar) {
    // Confirmación con el lugar al centro y, abajo, lugares parecidos: la
    // reseña también lleva a conocer otros (búsqueda por parecido).
    return (
      <View style={[s.root, { paddingTop: insets.top + 8 }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ScrollView contentContainerStyle={[s.doneContent, { paddingBottom: insets.bottom + 120 }]} showsVerticalScrollIndicator={false}>
          <View style={s.doneHead}>
            <View style={s.doneIcon}><Ionicons name="checkmark" size={32} color={theme.accent} /></View>
            <Text style={s.doneTitle} accessibilityRole="header" allowFontScaling={true}>{noWidow('Reseña publicada')}</Text>
            <Text style={s.doneBody} allowFontScaling={true}>{noWidow(`Le llega a ${patio?.name ?? 'el lugar'} y ayuda a quien busca dónde comer.`)}</Text>
          </View>
          <Text style={s.sectionLabel} allowFontScaling={true}>Parecidos cerca</Text>
          <View style={s.similarCard}>
            {similar.map((place, index) => (
              <TouchableOpacity
                key={place.id}
                style={[s.similarRow, index > 0 && s.similarDivider]}
                onPress={() => router.replace({ pathname: '/patio/[id]', params: { id: place.id } })}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={`${place.name}, ${[place.area, place.categories[0]].filter(Boolean).join(', ')}`}>
                <View style={s.similarCopy}>
                  <Text style={s.similarName} allowFontScaling={true}>{place.name}</Text>
                  <Text style={s.similarMeta} allowFontScaling={true}>{[place.area, place.categories[0], typicalPrice(place)].filter(Boolean).join(' · ')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={s.cta} onPress={() => router.back()} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Listo">
            <Text style={s.ctaText} allowFontScaling={true}>Listo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top + 8 }}>
        <View style={s.nav}>
          <TouchableOpacity style={s.navBtn} onPress={() => router.back()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Regresar">
            <Ionicons name="chevron-back" size={21} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.navHint} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.title} allowFontScaling={true}>{noWidow(`¿Cómo estuvo ${patio?.name ?? 'tu visita'}?`)}</Text>
        {!!subtitle && <Text style={s.subtitle} allowFontScaling={true}>{subtitle}</Text>}

        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n <= stars;
            return (
              <TouchableOpacity key={n} activeOpacity={0.85} onPress={() => pressStar(n)} accessibilityRole="button" accessibilityLabel={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`} accessibilityState={{ selected: active }}>
                <Animated.View style={[s.star, active ? s.starOn : s.starOff, { transform: [{ scale: starAnims[n - 1] }] }]}>
                  <Ionicons name={active ? 'star' : 'star-outline'} size={22} color={active ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(17,18,20,0.2)')} />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.sectionLabel} allowFontScaling={true}>{noWidow(tagLabel)}</Text>
        <View style={s.tagsWrap}>
          {TAGS.map((t) => {
            const on = selected.includes(t);
            return (
              <TouchableOpacity key={t} activeOpacity={0.85} onPress={() => toggleTag(t)} style={[s.tag, on ? s.tagOn : s.tagOff]} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} accessibilityRole="button" accessibilityState={{ selected: on }}>
                <Text style={[s.tagText, on && s.tagTextOn]} allowFontScaling={true}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.noteCard}>
          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={(value) => setNote(value.slice(0, TEXT_LIMITS.reviewNote))}
            placeholder="¿Qué tal estuvo? Cuéntale a quien anda buscando…"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Comentario de la reseña"
            multiline
            selectionColor={theme.accent}
            allowFontScaling={true}
          />
        </View>

        <View ref={photoRowRef} collapsable={false}>
        <TouchableOpacity style={s.photoRow} activeOpacity={0.85} onPress={() => setPhotoMenuOpen(true)} accessibilityRole="button" accessibilityLabel={photoUri ? 'Cambiar foto de la reseña' : 'Agregar foto opcional a la reseña'}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={s.photoThumb} />
            : <Ionicons name="camera-outline" size={16} color={theme.accent} />}
          <Text style={s.photoText} allowFontScaling={true}>
            {photoUri ? 'Cambiar foto' : 'Foto opcional · le ayuda a quien busca'}
          </Text>
          {photoUri ? <Ionicons name="checkmark-circle" size={18} color={theme.accent} /> : null}
        </TouchableOpacity>
        </View>
        {/* Con foto: ¿de qué platillo es? Los del menú de hoy y la carta. */}
        {!!photoUri && dishOptions.length > 0 && (
          <View style={s.dishPick}>
            <Text style={s.sectionLabel}>{noWidow('¿De qué platillo es?')}</Text>
            <View style={s.tagsWrap}>
              {dishOptions.map((name) => {
                const on = photoDish === name;
                return (
                  <TouchableOpacity key={name} activeOpacity={0.85} onPress={() => setPhotoDish(on ? undefined : name)} style={[s.tag, on ? s.tagOn : s.tagOff]} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }} accessibilityRole="button" accessibilityState={{ selected: on }}>
                    <Text style={[s.tagText, on && s.tagTextOn]} allowFontScaling={true}>{name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 20 }]}>
        <LinearGradient colors={[`${theme.bg}00`, theme.bg]} style={s.ctaFade} pointerEvents="none" />
        <TouchableOpacity style={[s.cta, (stars === 0 || saving) && s.ctaDisabled]} onPress={submit} disabled={stars === 0 || saving} activeOpacity={0.85} accessibilityRole="button" accessibilityState={{ disabled: stars === 0 || saving, busy: saving }} accessibilityLabel={saving ? 'Publicando reseña' : stars === 0 ? 'Elige las estrellas' : 'Publicar reseña'}>
          <Text style={s.ctaText} allowFontScaling={true}>{noWidow(saving ? 'Publicando…' : stars === 0 ? 'Elige las estrellas' : 'Publicar reseña')}</Text>
        </TouchableOpacity>
      </View>
      <ActionSheet
        visible={photoMenuOpen}
        anchorRef={photoRowRef}
        title="Foto de tu visita"
        onDismiss={() => setPhotoMenuOpen(false)}
        options={photoOptions}
      />
    </KeyboardAvoidingView>
  );
}
