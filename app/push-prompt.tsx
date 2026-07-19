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
      <LinearGradient
        colors={['rgba(0,0,0,0.24)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0.86)']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[s.content, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 32 }]}>
        <View style={s.iconBadge}>
          <Ionicons name="notifications" size={28} color="#fff" />
        </View>
        <Text style={s.eyebrow} allowFontScaling={true}>{noWidow('Tus guardados')}</Text>
        <Text style={s.title} allowFontScaling={true}>{noWidow('Te avisamos si hay.')}</Text>
        <Text style={s.body} allowFontScaling={true}>
          {noWidow('A la hora de la comida, te recordamos revisar tus lugares guardados. Sin spam, sin ruido.')}
        </Text>

        <View style={s.spacer} />

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
  );
}

function makeStyles(_t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#111214' },
    bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    content: { flex: 1, paddingHorizontal: 28 },
    iconBadge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2612F', marginBottom: 24, shadowColor: '#F2612F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 6 },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: '#FF6A3D', marginBottom: 12 },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 36, color: '#F8F8F5', marginBottom: 14, fontFamily: Fonts.brand },
    body: { fontSize: 15, fontWeight: '300', lineHeight: 22, color: 'rgba(248,248,245,0.7)' },
    spacer: { flex: 1 },
    primaryBtn: { minWidth: 190, height: 52, paddingHorizontal: 24, alignSelf: 'center', borderRadius: 26, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
    primaryText: { fontSize: 15, fontWeight: '700', color: '#111214' },
    ghostBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
    ghostText: { fontSize: 15, fontWeight: '300', color: 'rgba(248,248,245,0.7)' },
    hint: { marginTop: 8, fontSize: 11, fontWeight: '300', color: 'rgba(248,248,245,0.45)', textAlign: 'center' },
  });
}
