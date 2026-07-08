import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const ONBOARDING_KEY = 'onboarding_done';
const HERO_H = 380;

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  cta: string;
  icon: keyof typeof Ionicons.glyphMap;
  image: any;
};

// Copy alineado a identidad verbal (slide 2 corregido: sin "en su voz").
const SLIDES: Slide[] = [
  {
    eyebrow: 'Barrio vivo',
    title: 'Saber qué hay hoy.',
    body: 'Las cocinas de tu barrio publican su menú del día. Tú decides si vale la caminata.',
    cta: 'Continuar',
    icon: 'restaurant-outline',
    image: require('../assets/hero/botanica-3.png'),
  },
  {
    eyebrow: 'Menú real',
    title: 'Lo que se cocina hoy.',
    body: 'El menú escrito como te lo diría en persona. Tinga, bistec, sopa de fideo. Real.',
    cta: 'Continuar',
    icon: 'location-outline',
    image: require('../assets/hero/botanica-1.png'),
  },
  {
    eyebrow: 'Tus lugares',
    title: 'Te avisamos si abre.',
    body: 'Guarda tus lugares favoritos y te decimos cuando publican menú. Sin spam, sin notificaciones inútiles.',
    cta: 'Activar avisos',
    icon: 'notifications-outline',
    image: require('../assets/hero/botanica-2.png'),
  },
];

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    hero: { position: 'absolute', top: 0, left: 0, right: 0, height: HERO_H, backgroundColor: '#111214', overflow: 'hidden' },
    heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    heroFade: { ...StyleSheet.absoluteFillObject },
    content: { position: 'absolute', left: 0, right: 0, top: HERO_H - 40, bottom: 0, paddingHorizontal: 28, flexDirection: 'column' },
    iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center', marginBottom: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 28, elevation: 4 },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 10 },
    title: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: t.text, marginBottom: 14, fontFamily: Fonts.brand },
    body: { fontSize: 15, color: t.textSecondary, lineHeight: 22 },
    spacer: { flex: 1 },
    dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20 },
    dot: { height: 6, borderRadius: 3 },
    ctaBtn: { height: 54, borderRadius: Radius.card, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
    skipBtn: { height: 40, alignItems: 'center', justifyContent: 'center' },
    skipText: { fontSize: 13, color: t.textMute },
  });
}

async function finish(dest: '/' | '/push-prompt' = '/') {
  // Esperar el write antes de navegar; si no, la llave puede no guardarse
  // y el onboarding reaparece en el siguiente arranque.
  try { await AsyncStorage.setItem(ONBOARDING_KEY, '1'); } catch {}
  router.replace(dest);
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;
  const dotAnims = useRef(SLIDES.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;

  const animateDots = (next: number) => {
    SLIDES.forEach((_, i) => {
      Animated.spring(dotAnims[i], { toValue: i === next ? 1 : 0, useNativeDriver: false, stiffness: 380, damping: 32, mass: 1 }).start();
    });
  };

  const advance = () => {
    if (index === SLIDES.length - 1) { finish('/push-prompt'); return; }
    const next = index + 1;
    Animated.timing(fade, { toValue: 0, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }).start(() => {
      setIndex(next);
      animateDots(next);
      Animated.timing(fade, { toValue: 1, duration: 320, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
    });
  };

  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <View style={s.root}>
      {/* Hero botánico */}
      <View style={s.hero}>
        <Image source={slide.image} style={s.heroImg} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(17,18,20,0.15)', 'rgba(17,18,20,0)', 'rgba(248,248,245,0.4)', theme.bg]}
          locations={[0, 0.3, 0.8, 1]}
          style={s.heroFade}
        />
      </View>

      {/* Contenido */}
      <View style={[s.content, { paddingBottom: insets.bottom + 12 }]}>
        <View style={s.iconBox}>
          <Ionicons name={slide.icon} size={28} color={theme.accent} />
        </View>

        <Animated.View style={{ opacity: fade }}>
          <Text style={s.eyebrow} allowFontScaling={true}>{slide.eyebrow}</Text>
          <Text style={s.title} allowFontScaling={true}>{noWidow(slide.title)}</Text>
          <Text style={s.body} allowFontScaling={true}>{noWidow(slide.body)}</Text>
        </Animated.View>

        <View style={s.spacer} />

        {/* Dots */}
        <View style={s.dotsRow}>
          {SLIDES.map((_, i) => (
            <Animated.View
              key={i}
              style={[s.dot, {
                width: dotAnims[i].interpolate({ inputRange: [0, 1], outputRange: [6, 24] }),
                backgroundColor: i === index ? theme.accent : (theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(17,18,20,0.15)'),
              }]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[s.ctaBtn, { backgroundColor: isLast ? theme.accent : theme.text }]}
          onPress={advance}
          activeOpacity={0.86}>
          <Text style={[s.ctaText, !isLast && theme.isDark && { color: theme.bg }]} allowFontScaling={true}>{slide.cta}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.skipBtn} onPress={() => finish('/')} activeOpacity={0.7}>
          <Text style={s.skipText} allowFontScaling={true}>{isLast ? 'Ahora no' : 'Saltar'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
