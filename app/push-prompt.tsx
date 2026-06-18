import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { setAvisar } from '@/lib/notifications';
import { Fonts, Radius, useTheme, type Theme } from '@/lib/theme';

const HERO = require('../assets/hero/botanica-4.png');

export default function PushPromptScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);

  const finish = () => router.replace('/explorar');

  const handleAllow = async () => {
    if (busy) return;
    setBusy(true);
    await setAvisar(true); // dispara el diálogo nativo de permiso
    setBusy(false);
    finish();
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <Image source={HERO} style={s.bg} resizeMode="cover" blurRadius={20} />
      <LinearGradient
        colors={['rgba(17,18,20,0.5)', 'rgba(17,18,20,0.85)', '#111214']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[s.content, { paddingTop: insets.top + 80, paddingBottom: insets.bottom + 32 }]}>
        <View style={s.iconBadge}>
          <Ionicons name="notifications" size={28} color="#fff" />
        </View>
        <Text style={s.eyebrow} allowFontScaling={true}>Casi listo · 3 de 3</Text>
        <Text style={s.title} allowFontScaling={true}>Para avisarte cuando publiquen el menú de hoy.</Text>
        <Text style={s.body} allowFontScaling={true}>
          Solo te avisamos cuando tus lugares guardados publican — máximo uno al día. Sin spam.
        </Text>

        <View style={s.spacer} />

        <TouchableOpacity style={s.primaryBtn} onPress={handleAllow} disabled={busy} activeOpacity={0.86}>
          <Ionicons name="notifications-outline" size={16} color="#fff" />
          <Text style={s.primaryText} allowFontScaling={true}>{busy ? 'Un momento…' : 'Permitir notificaciones'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={finish} activeOpacity={0.7}>
          <Text style={s.ghostText} allowFontScaling={true}>Ahora no</Text>
        </TouchableOpacity>
        <Text style={s.hint} allowFontScaling={true}>Puedes cambiar esto en Ajustes</Text>
      </View>
    </View>
  );
}

function makeStyles(_t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#111214' },
    bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', opacity: 0.5 },
    content: { flex: 1, paddingHorizontal: 28 },
    iconBadge: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2612F', marginBottom: 24, shadowColor: '#F2612F', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 6 },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: '#FF6A3D', marginBottom: 12 },
    title: { fontSize: 32, fontWeight: '900', letterSpacing: -1, lineHeight: 36, color: '#F8F8F5', marginBottom: 14, fontFamily: Fonts.brand },
    body: { fontSize: 15, fontWeight: '300', lineHeight: 22, color: 'rgba(248,248,245,0.7)' },
    spacer: { flex: 1 },
    primaryBtn: { height: 54, borderRadius: Radius.card, backgroundColor: '#FF6A3D', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
    primaryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
    ghostBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
    ghostText: { fontSize: 15, fontWeight: '300', color: 'rgba(248,248,245,0.7)' },
    hint: { marginTop: 8, fontSize: 11, fontWeight: '300', color: 'rgba(248,248,245,0.45)', textAlign: 'center' },
  });
}
