import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchFonditaById, getPatioById, type Patio } from '@/lib/patios';
import { getPatioRating, savePatioRating } from '@/lib/ratings';
import { REVIEW_TAGS as TAGS } from '@/lib/review-tags';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingRight: 20, height: 44 },
    navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,18,20,0.05)', alignItems: 'center', justifyContent: 'center' },
    navHint: { fontSize: 14, fontWeight: '300', color: t.textSecondary },

    content: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 140 },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    title: { fontSize: 30, fontWeight: '900', letterSpacing: -1, lineHeight: 32, color: t.text, marginBottom: 4, fontFamily: Fonts.brand },
    subtitle: { fontSize: 13, fontWeight: '300', color: t.textSecondary, marginBottom: 22 },

    starsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
    star: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth },
    starOn: { backgroundColor: t.accentSoft, borderColor: 'rgba(242,97,47,0.25)' },
    starOff: { backgroundColor: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,18,20,0.04)', borderColor: 'transparent' },

    sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: t.textSecondary, marginBottom: 10 },
    tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
    tag: { paddingHorizontal: 13, paddingVertical: 7, borderRadius: 100, borderWidth: StyleSheet.hairlineWidth },
    tagOff: { backgroundColor: t.surface, borderColor: t.border },
    tagOn: { backgroundColor: t.text, borderColor: t.text },
    tagText: { fontSize: 13, fontWeight: '500', color: t.text },
    tagTextOn: { color: t.bg },

    noteCard: { padding: 16, borderRadius: 18, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, marginBottom: 14 },
    noteInput: { fontSize: 14, lineHeight: 20, color: t.text, minHeight: 64, padding: 0, textAlignVertical: 'top' },

    photoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, backgroundColor: t.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(17,18,20,0.04)', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    photoText: { fontSize: 12.5, color: t.textSecondary, flex: 1 },
    photoThumb: { width: 56, height: 56, borderRadius: 12 },

    ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14 },
    ctaFade: { position: 'absolute', left: 0, right: 0, top: -40, height: 40 },
    cta: { height: 54, borderRadius: Radius.card, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', shadowColor: t.accent, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 4 },
    ctaDisabled: { opacity: 0.4 },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#fff' },
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
  const [saving, setSaving] = useState(false);

  const starAnims = useRef([1, 2, 3, 4, 5].map(() => new Animated.Value(1))).current;

  useEffect(() => {
    if (!cleanId) return;
    const mock = getPatioById(cleanId);
    if (mock) { setPatio(mock); return; }
    fetchFonditaById(cleanId).then((found) => { if (found) setPatio(found); });
  }, [cleanId]);

  // Precargar reseña previa si existe.
  useEffect(() => {
    if (!cleanId) return;
    getPatioRating(cleanId).then((prev) => {
      if (!prev) return;
      setStars(prev.stars);
      setSelected(prev.reasons ?? []);
      setNote(prev.note ?? '');
      setPhotoUri(prev.photoUri);
    });
  }, [cleanId]);

  const pressStar = (n: number) => {
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

  const pickPhoto = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
  };

  const subtitle = (() => {
    const dishes = patio?.menu?.[0]?.items?.slice(0, 2).map((it) => it.name).join(' · ');
    return [dishes, patio?.price].filter(Boolean).join(' · ');
  })();

  const submit = async () => {
    if (!cleanId || stars === 0 || saving) return;
    setSaving(true);
    await savePatioRating(cleanId, { stars, reasons: selected, note, photoUri });
    setSaving(false);
    router.back();
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={{ paddingTop: insets.top + 8 }}>
        <View style={s.nav}>
          <TouchableOpacity style={s.navBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.navHint} allowFontScaling={true}>{stars > 0 ? 'Borrador guardado' : ''}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={s.eyebrow} allowFontScaling={true}>Tu visita · hoy</Text>
        <Text style={s.title} allowFontScaling={true}>¿Cómo estuvo {patio?.name ?? 'tu visita'}?</Text>
        {!!subtitle && <Text style={s.subtitle} allowFontScaling={true}>{subtitle}</Text>}

        <View style={s.starsRow}>
          {[1, 2, 3, 4, 5].map((n) => {
            const active = n <= stars;
            return (
              <TouchableOpacity key={n} activeOpacity={0.8} onPress={() => pressStar(n)}>
                <Animated.View style={[s.star, active ? s.starOn : s.starOff, { transform: [{ scale: starAnims[n - 1] }] }]}>
                  <Ionicons name={active ? 'star' : 'star-outline'} size={22} color={active ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(17,18,20,0.2)')} />
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.sectionLabel} allowFontScaling={true}>¿Qué destacó?</Text>
        <View style={s.tagsWrap}>
          {TAGS.map((t) => {
            const on = selected.includes(t);
            return (
              <TouchableOpacity key={t} activeOpacity={0.8} onPress={() => toggleTag(t)} style={[s.tag, on ? s.tagOn : s.tagOff]}>
                <Text style={[s.tagText, on && s.tagTextOn]} allowFontScaling={true}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={s.noteCard}>
          <TextInput
            style={s.noteInput}
            value={note}
            onChangeText={setNote}
            placeholder="¿Qué tal estuvo? Cuéntale a quien anda buscando…"
            placeholderTextColor={theme.textSecondary}
            multiline
            selectionColor={theme.accent}
            allowFontScaling={true}
          />
        </View>

        <TouchableOpacity style={s.photoRow} activeOpacity={0.8} onPress={pickPhoto}>
          {photoUri
            ? <Image source={{ uri: photoUri }} style={s.photoThumb} />
            : <Ionicons name="camera-outline" size={16} color={theme.accent} />}
          <Text style={s.photoText} allowFontScaling={true}>
            {photoUri ? 'Cambiar foto' : 'Foto opcional · le ayuda a quien busca'}
          </Text>
          {photoUri ? <Ionicons name="checkmark-circle" size={18} color={theme.accent} /> : null}
        </TouchableOpacity>
      </ScrollView>

      <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 20 }]}>
        <LinearGradient colors={['rgba(248,248,245,0)', theme.bg]} style={s.ctaFade} pointerEvents="none" />
        <TouchableOpacity style={[s.cta, stars === 0 && s.ctaDisabled]} onPress={submit} disabled={stars === 0 || saving} activeOpacity={0.86}>
          <Text style={s.ctaText} allowFontScaling={true}>{saving ? 'Publicando…' : 'Publicar reseña'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
