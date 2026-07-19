import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { completeOnboarding, saveUserRole, type UserRole } from '@/lib/entry-flow';
import { Fonts, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const KENBURNS_MS = 14000;
const XFADE_MS = 600;

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  image: any;
};

// Copy alineado a IDENTITY_VERBAL: sin "cocinas/fondas" como paraguas,
// genéricos = "lo de hoy" / "lugares", lo escribe quien cocina.
const SLIDES: Slide[] = [
  {
    eyebrow: 'Lo de hoy',
    title: 'Saber qué hay hoy.',
    body: 'Sin asomarte, sin preguntar. El menú del día está en Patio antes de que llegues.',
    image: require('../assets/hero/botanica-3.jpg'),
  },
  {
    eyebrow: 'El menú',
    title: 'Lo escribe quien cocina.',
    body: 'Tinga, bistec, sopa de fideo. Como te lo dirían en el mostrador.',
    image: require('../assets/hero/botanica-1.jpg'),
  },
  {
    eyebrow: 'Tu Patio',
    title: 'Entra por donde quieras.',
    body: 'Busca qué comer o publica lo que preparas hoy.',
    image: require('../assets/hero/botanica-2.jpg'),
  },
];

// Pantalla siempre oscura: el texto vive sobre la imagen, no sobre el tema.
function makeStyles(_t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0B0B0C' },
    img: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    veil: { ...StyleSheet.absoluteFillObject },
    closeBtn: { position: 'absolute', right: 16, borderRadius: 100, overflow: 'hidden' },
    closeInner: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
    content: { position: 'absolute', left: 28, right: 28 },
    eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 10 },
    title: { fontSize: 40, fontWeight: '900', letterSpacing: -1.2, lineHeight: 42, color: '#FFFFFF', marginBottom: 10, fontFamily: Fonts.brand },
    body: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.72)', lineHeight: 22 },
    ctaCol: { alignItems: 'stretch', gap: 2, marginTop: 28 },
    ctaGlass: { borderRadius: 14, overflow: 'hidden', alignSelf: 'center' },
    ctaGlassInner: { paddingHorizontal: 26, height: 42, alignItems: 'center', justifyContent: 'center' },
    ctaGlassText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 },
    roleButton: { minHeight: 66, borderRadius: 16, overflow: 'hidden', marginBottom: 9 },
    roleButtonInner: { minHeight: 66, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 13 },
    roleIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,106,61,0.16)', alignItems: 'center', justifyContent: 'center' },
    roleCopy: { flex: 1 },
    roleTitle: { fontSize: 15, lineHeight: 19, fontWeight: '700', color: '#FFFFFF' },
    roleHint: { marginTop: 2, fontSize: 12, lineHeight: 16, fontWeight: '300', color: 'rgba(255,255,255,0.62)' },
  });
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const [routing, setRouting] = useState(false);
  // Las 3 imágenes viven montadas siempre (sin flash de decode); cada una
  // con su propia opacidad y su propio Ken Burns. Al salir, la imagen
  // conserva la escala donde iba — sin brinco.
  const opacities = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const scales = useRef(SLIDES.map(() => new Animated.Value(0))).current;
  const textFade = useRef(new Animated.Value(1)).current;
  const indexRef = useRef(0);
  const finishingRef = useRef(false);
  indexRef.current = index;

  const isLast = index === SLIDES.length - 1;

  const chooseRole = async (role: UserRole) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setRouting(true);
    await saveUserRole(role).catch(() => {});
    if (role === 'foodie') {
      router.replace({ pathname: '/push-prompt', params: { intent: 'foodie' } });
      return;
    }
    const destination = await completeOnboarding('fondero');
    router.replace(destination);
  };

  const goTo = (next: number) => {
    const cur = indexRef.current;
    if (next < 0 || next >= SLIDES.length || next === cur) return;
    scales[cur].stopAnimation();
    Animated.parallel([
      Animated.timing(opacities[cur], { toValue: 0, duration: XFADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(opacities[next], { toValue: 1, duration: XFADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    textFade.setValue(0);
    setIndex(next);
    Animated.timing(textFade, { toValue: 1, duration: XFADE_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };

  // Ken Burns del slide activo — zoom lento y largo; el avance es solo humano
  // (Continuar o tap), decisión 2026-07-18.
  useEffect(() => {
    scales[index].setValue(0);
    Animated.timing(scales[index], { toValue: 1, duration: KENBURNS_MS, easing: Easing.linear, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const slide = SLIDES[index];

  return (
    <View style={s.root}>
      {/* Imagen ganadora: full-bleed, crossfade + Ken Burns por slide */}
      {SLIDES.map((sl, i) => (
        <Animated.Image
          key={i}
          source={sl.image}
          style={[s.img, {
            opacity: opacities[i],
            transform: [{ scale: scales[i].interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }],
          }]}
          resizeMode="cover"
        />
      ))}

      {/* Velo para legibilidad: oscuro abajo, sutil arriba */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.18, 0.52, 1]}
        style={s.veil}
      />

      {/* Tap zones estilo stories: izquierda regresa, derecha avanza */}
      <Pressable style={{ position: 'absolute', left: 0, top: 0, bottom: 200, width: '28%' }} onPress={() => goTo(index - 1)} />
      <Pressable style={{ position: 'absolute', right: 0, top: 0, bottom: 200, width: '72%' }} onPress={() => goTo(index + 1)} />

      {/* Cerrar/saltar: solo un tache sutil en glass */}
      <TouchableOpacity
        style={[s.closeBtn, { top: insets.top + 8 }]}
        onPress={() => goTo(SLIDES.length - 1)}
        accessibilityLabel="Saltar introducción"
        disabled={isLast}
        activeOpacity={0.7}>
        {!isLast && (
          <BlurView intensity={16} tint="dark" style={s.closeInner}>
            <Ionicons name="close" size={16} color="rgba(255,255,255,0.85)" />
          </BlurView>
        )}
      </TouchableOpacity>

      {/* Texto editorial + acción, todo abajo */}
      <View style={[s.content, { bottom: insets.bottom + 28 }]}>
        <Animated.View style={{ opacity: textFade }}>
          <Text style={s.eyebrow} allowFontScaling={true} maxFontSizeMultiplier={1.3}>{slide.eyebrow}</Text>
          <Text style={s.title} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.35}>{noWidow(slide.title)}</Text>
          <Text style={s.body} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.7}>{noWidow(slide.body)}</Text>
        </Animated.View>

        <View style={s.ctaCol}>
          {isLast ? (
            <>
              <TouchableOpacity accessibilityLabel="Ver qué hay hoy" disabled={routing} style={s.roleButton} onPress={() => chooseRole('foodie')} activeOpacity={0.84}>
                <BlurView intensity={24} tint="dark" style={s.roleButtonInner}>
                  <View style={s.roleIcon}><Ionicons name="map-outline" size={19} color="#FF6A3D" /></View>
                  <View style={s.roleCopy}>
                    <Text style={s.roleTitle} numberOfLines={1} maxFontSizeMultiplier={1.3}>{noWidow('Ver qué hay hoy')}</Text>
                    <Text style={s.roleHint} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.4}>Explorar lugares cerca de ti</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.46)" />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Publicar lo que preparo" disabled={routing} style={s.roleButton} onPress={() => chooseRole('fondero')} activeOpacity={0.84}>
                <BlurView intensity={24} tint="dark" style={s.roleButtonInner}>
                  <View style={s.roleIcon}><Ionicons name="restaurant-outline" size={19} color="#FF6A3D" /></View>
                  <View style={s.roleCopy}>
                    <Text style={s.roleTitle} numberOfLines={1} maxFontSizeMultiplier={1.3}>{noWidow('Publicar lo que preparo')}</Text>
                    <Text style={s.roleHint} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.4}>Crear el perfil de tu negocio</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.46)" />
                </BlurView>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.ctaGlass} onPress={() => goTo(index + 1)} activeOpacity={0.86}>
              <BlurView intensity={16} tint="dark" style={s.ctaGlassInner}>
                <Text style={s.ctaGlassText} allowFontScaling={true} numberOfLines={1} maxFontSizeMultiplier={1.3}>Continuar</Text>
              </BlurView>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
