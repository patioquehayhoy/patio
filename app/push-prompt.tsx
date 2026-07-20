import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { completeOnboarding } from '@/lib/entry-flow';
import { setAvisar } from '@/lib/notifications';
import { Fonts, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const HERO = require('../assets/hero/botanica-4.jpg');

export default function PushPromptScreen() {
  const { theme } = useTheme();
  const { intent } = useLocalSearchParams<{ intent?: string | string[] }>();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    const destination = await completeOnboarding(intent);
    router.replace(destination);
  };

  const handleAllow = async () => {
    if (busy) return;
    setBusy(true);
    await setAvisar(true).catch(() => false); // dispara el diálogo nativo de permiso
    setBusy(false);
    await finish();
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image source={HERO} style={s.bg} resizeMode="cover" />
      {/* Mismo velo que la introducción: la pantalla continúa ese recorrido. */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.72)']}
        locations={[0, 0.18, 0.52, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Texto editorial + acción, todo abajo — misma anatomía que la
          introducción y el acceso. */}
      <View style={[s.content, { paddingBottom: insets.bottom + 28 }]}>
        <View style={s.spacer} />
        <Text style={s.eyebrow} allowFontScaling={true} maxFontSizeMultiplier={1.3}>{noWidow('Avisos')}</Text>
        <Text style={s.title} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.35}>{noWidow('Te avisamos qué hay hoy.')}</Text>
        <Text style={s.body} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.7}>
          {noWidow('Solo un recordatorio a la hora de la comida. Sin spam, sin ruido.')}
        </Text>

        <View style={s.ctaCol}>
          <TouchableOpacity accessibilityLabel="Activar avisos" style={s.primaryBtn} onPress={handleAllow} disabled={busy} activeOpacity={0.86}>
            <Ionicons name="notifications-outline" size={16} color="#FF6A3D" />
            <Text style={s.primaryText} allowFontScaling={true}>{busy ? 'Un momento…' : noWidow('Activar avisos')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ghostBtn} onPress={finish} activeOpacity={0.7}>
            <Text style={s.ghostText} allowFontScaling={true}>{noWidow('Ahora no')}</Text>
          </TouchableOpacity>
          <Text style={s.hint} allowFontScaling={true}>{noWidow('Puedes cambiar esto en Ajustes')}</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(_t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#111214' },
    bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    content: { flex: 1, paddingHorizontal: 28 },
    // Escala editorial idéntica a la introducción (onboarding.tsx): esta
    // pantalla es la continuación visual de ese recorrido.
    eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 10 },
    title: { fontSize: 40, fontWeight: '900', letterSpacing: -1.2, lineHeight: 42, color: '#FFFFFF', marginBottom: 10, fontFamily: Fonts.brand },
    body: { fontSize: 15, fontWeight: '300', color: 'rgba(255,255,255,0.72)', lineHeight: 22 },
    spacer: { flex: 1 },
    // Columna de acciones con el mismo ritmo que la introducción: una
    // primaria en cápsula, la secundaria fantasma pegada, la nota al final.
    ctaCol: { alignItems: 'stretch', marginTop: 30 },
    primaryBtn: { minWidth: 200, height: 52, paddingHorizontal: 26, alignSelf: 'center', borderRadius: 26, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
    primaryText: { fontSize: 15, fontWeight: '700', color: '#111214' },
    ghostBtn: { marginTop: 6, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
    ghostText: { fontSize: 15, fontWeight: '300', color: 'rgba(248,248,245,0.7)' },
    hint: { marginTop: 2, fontSize: 11, fontWeight: '300', color: 'rgba(248,248,245,0.45)', textAlign: 'center' },
  });
}
