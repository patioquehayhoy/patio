import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEV_MY_PATIO_ID } from '@/lib/demo';
import { getFonditaId, getFonditaName } from '@/lib/menu-store';
import { Fonts, Radius } from '@/lib/theme';

export default function MenuPublicadoScreen() {
  const insets = useSafeAreaInsets();
  const scale = useRef(new Animated.Value(0.4)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, stiffness: 320, damping: 20, mass: 0.8 }).start();
    Animated.timing(fade, { toValue: 1, duration: 400, delay: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [scale, fade]);

  const now = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  const patioId = getFonditaId() || (__DEV__ ? DEV_MY_PATIO_ID : null);
  const openProfile = () => patioId ? router.replace(`/patio/${patioId}`) : router.replace('/perfil');
  const shareMenu = () => {
    const name = getFonditaName() || 'Mi Patio';
    const url = patioId ? `patio://patio/${patioId}` : 'patio://explorar';
    Share.share({
      title: `${name} en Patio`,
      message: `Ya está publicado el menú de hoy de ${name}.\n\n${url}`,
      url,
    });
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.glow} />

      <View style={[s.content, { paddingTop: insets.top + 120, paddingBottom: insets.bottom + 32 }]}>
        <Animated.View style={[s.checkBadge, { transform: [{ scale }] }]}>
          <Ionicons name="checkmark" size={42} color="#fff" />
        </Animated.View>

        <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
          <Text style={s.eyebrow} allowFontScaling={true}>Publicado · {now}</Text>
          <Text style={s.title} allowFontScaling={true}>Tu menú está vivo.</Text>
          <Text style={s.body} allowFontScaling={true}>Ya aparece en tu perfil, tal como lo publicaste.</Text>

        </Animated.View>

        <View style={s.spacer} />

        <TouchableOpacity accessibilityLabel="Ver menú en mi perfil" style={s.primaryBtn} onPress={openProfile} activeOpacity={0.86}>
          <Ionicons name="person-circle-outline" size={17} color="#F8F8F5" />
          <Text style={s.primaryText} allowFontScaling={true}>Ver en mi perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghostBtn} onPress={shareMenu} activeOpacity={0.7}>
          <Ionicons name="share-outline" size={16} color="rgba(248,248,245,0.62)" />
          <Text style={s.ghostText} allowFontScaling={true}>Compartir menú</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111214' },
  glow: { position: 'absolute', top: -150, left: -100, right: -100, height: 600, backgroundColor: 'rgba(255,106,61,0.12)', borderRadius: 300 },
  content: { flex: 1, paddingHorizontal: 28, alignItems: 'center' },
  checkBadge: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#FF6A3D', alignItems: 'center', justifyContent: 'center', marginBottom: 28, shadowColor: '#FF6A3D', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.6, shadowRadius: 30, elevation: 10 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#FF6A3D', marginBottom: 12 },
  title: { fontSize: 38, fontWeight: '900', letterSpacing: -1.3, lineHeight: 38, color: '#F8F8F5', marginBottom: 12, textAlign: 'center', fontFamily: Fonts.brand },
  body: { fontSize: 15, fontWeight: '300', lineHeight: 22, color: 'rgba(248,248,245,0.55)', textAlign: 'center', maxWidth: 280 },
  viewersPill: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)' },
  viewersText: { fontSize: 13, color: 'rgba(248,248,245,0.8)' },
  viewersBold: { fontWeight: '700', color: '#F8F8F5' },
  spacer: { flex: 1 },
  primaryBtn: { alignSelf: 'stretch', height: 54, borderRadius: Radius.card, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 },
  primaryText: { fontSize: 15, fontWeight: '600', color: '#F8F8F5' },
  ghostBtn: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  ghostText: { fontSize: 14, fontWeight: '500', color: 'rgba(248,248,245,0.5)' },
});
