import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { saveUserRole } from '@/lib/entry-flow';
import { Fonts } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const DEV_VERSION = 'HOY · 2026.07.18';

// Entrada rediseñada 2026-07-18: mismo idioma que onboarding/acceso —
// botánica full-bleed, logo + par de marca al centro, acciones abajo en glass.
// Siempre oscura: el texto vive sobre la imagen.
// Movida fuera de index.tsx 2026-07-24 — index.tsx ahora es un boot puro que
// hace una transición de navegación real (vía /warmup) antes de mostrar esta
// pantalla; ver el comentario en index.tsx para el porqué.
const HERO = require('../assets/hero/botanica-5.jpg');
const LOGO_BLANCO = require('../assets/images/logo-blanco.png');

export default function EntradaScreen() {
  const insets = useSafeAreaInsets();

  const handleStart = () => {
    // La primera entrada presenta Patio antes de pedir una intención. La
    // decisión entre explorar y publicar vive al final de la introducción.
    router.push('/onboarding');
  };

  const handleDevFoodie = async () => {
    await saveUserRole('foodie').catch(() => {});
    router.replace('/explorar');
  };

  const handleDevFondero = async () => {
    await saveUserRole('fondero').catch(() => {});
    router.replace('/patio-smart');
  };

  const handleDevOnboarding = async () => {
    router.replace('/onboarding');
  };

  return (
    <View style={s.root}>
      {/* Botánica full-bleed + velo */}
      <Image source={HERO} style={s.bg} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Logo en el centro EXACTO de la pantalla (overlay independiente del
          layout); el par de marca cuelga debajo sin mover el ancla */}
      <View style={s.brandOverlay} pointerEvents="none">
        <View>
          <Image source={LOGO_BLANCO} style={s.logo} resizeMode="contain" />
          <View style={s.pairBelow}>
            <Text style={s.claim} allowFontScaling={true}>{noWidow('¿Qué hay hoy?')}</Text>
            <Text style={s.tagline} allowFontScaling={true}>Saaaaaaabes.</Text>
          </View>
        </View>
      </View>

      <View style={[s.content, { paddingBottom: insets.bottom + 18 }]}>
        {/* Acciones abajo */}
        <View style={s.actions}>
          <TouchableOpacity style={s.ctaGlass} onPress={handleStart} activeOpacity={0.86}>
            <BlurView intensity={16} tint="dark" style={s.ctaGlassInner}>
              <Text style={s.ctaGlassText} allowFontScaling={true}>{noWidow('Entrar a Patio')}</Text>
            </BlurView>
          </TouchableOpacity>

          {__DEV__ && (
            <>
              <Text style={s.devVersion} allowFontScaling={true}>DEV · {DEV_VERSION}</Text>
              <View style={s.devBar}>
                <TouchableOpacity style={s.devBtn} onPress={handleDevFoodie} activeOpacity={0.7}>
                  <Text style={s.devBtnText} allowFontScaling={true}>Foodie</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.devBtn} onPress={handleDevFondero} activeOpacity={0.7}>
                  <Text style={s.devBtnText} allowFontScaling={true}>Fondero</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.devBtn} onPress={handleDevOnboarding} activeOpacity={0.7}>
                  <Text style={s.devBtnText} allowFontScaling={true}>Onboarding</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0C' },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },

  content: { flex: 1, paddingHorizontal: 28, justifyContent: 'flex-end' },

  brandOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 230, height: 86 },
  pairBelow: { position: 'absolute', top: '100%', left: 0, right: 0, alignItems: 'center', marginTop: 14 },
  claim: { fontSize: 15, fontWeight: '900', fontFamily: Fonts.brand, textAlign: 'center', color: '#F8F8F5' },
  tagline: { fontSize: 15, fontWeight: '400', fontFamily: Fonts.brand, textAlign: 'center', color: 'rgba(248,248,245,0.7)' },

  actions: { alignItems: 'center', gap: 2 },
  ctaGlass: { alignSelf: 'stretch', borderRadius: 14, overflow: 'hidden' },
  ctaGlassInner: { height: 52, alignItems: 'center', justifyContent: 'center' },
  ctaGlassText: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', letterSpacing: -0.2 },
  secondaryBtn: { height: 44, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  secondaryText: { fontSize: 14, fontWeight: '400', color: 'rgba(248,248,245,0.7)' },

  devVersion: { marginTop: 6, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, color: 'rgba(248,248,245,0.35)' },
  devBar: { flexDirection: 'row', gap: 8, marginTop: 8 },
  devBtn: { paddingHorizontal: 14, height: 32, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },
  devBtnText: { fontSize: 12, fontWeight: '400', color: 'rgba(248,248,245,0.7)' },
});
