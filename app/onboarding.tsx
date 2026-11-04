import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { completeOnboarding, saveUserRole, type UserRole } from '@/lib/entry-flow';
import { useTheme, type Theme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const KENBURNS_MS = 14000;
const HERO = require('../assets/hero/botanica-2.jpg');
const LOGO_BLANCO = require('../assets/images/logo-blanco.png');
const MI_PATIO = require('../assets/icons/mi-patio.png');

// Una sola pantalla después de la entrada (decisión de Parco, 2026-11-03):
// la marca, qué es Patio en una frase y la elección. Antes eran tres
// diapositivas; el valor llega dos toques antes. Copy alineado a
// IDENTITY_VERBAL: «lo de hoy» y «lugares», lo escribe quien cocina.
// Pantalla siempre oscura: el texto vive sobre la imagen, no sobre el tema.
function makeStyles(_t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: '#0B0B0C' },
    img: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
    veil: { ...StyleSheet.absoluteFillObject },
    content: { position: 'absolute', left: 28, right: 28 },
    logo: { width: 160, height: 60, marginBottom: 20 },
    title: { ...Type.hero, color: '#FFFFFF', marginBottom: 10 },
    body: { fontSize: 15, fontWeight: '400', color: 'rgba(255,255,255,0.72)', lineHeight: 22 },
    ctaCol: { alignItems: 'stretch', gap: 4, marginTop: 28 },
    roleButton: { minHeight: 66, borderRadius: 16, overflow: 'hidden', marginBottom: 9 },
    roleButtonInner: { minHeight: 66, paddingVertical: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    roleIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,106,61,0.16)', alignItems: 'center', justifyContent: 'center' },
    roleImage: { width: 20, height: 20, tintColor: '#FF6A3D' },
    roleCopy: { flex: 1 },
    roleTitle: { fontSize: 15, lineHeight: 19, fontWeight: '700', color: '#FFFFFF' },
    roleHint: { marginTop: 2, fontSize: 12, lineHeight: 16, fontWeight: '400', color: 'rgba(255,255,255,0.62)' },
  });
}

export default function OnboardingScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const [routing, setRouting] = useState(false);
  const scale = useRef(new Animated.Value(0)).current;
  const finishingRef = useRef(false);

  const chooseRole = async (role: UserRole) => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setRouting(true);
    await saveUserRole(role).catch(() => {});
    // iOS notification permission is requested later, after a person follows
    // a Patio or enables a concrete reminder. Onboarding should earn intent,
    // not spend the system prompt.
    const destination = await completeOnboarding(role);
    router.replace(destination);
  };

  // Ken Burns lento sobre la foto, como en la entrada.
  useEffect(() => {
    Animated.timing(scale, { toValue: 1, duration: KENBURNS_MS, easing: Easing.linear, useNativeDriver: true }).start();
  }, [scale]);

  return (
    <View style={s.root}>
      <Animated.Image
        source={HERO}
        style={[s.img, { transform: [{ scale: scale.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}
        resizeMode="cover"
      />
      {/* Velo para legibilidad: oscuro abajo, sutil arriba */}
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.18, 0.45, 1]}
        style={s.veil}
      />

      <ScrollView style={[s.content, { top: insets.top + 58, bottom: insets.bottom + 28 }]} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} showsVerticalScrollIndicator={false}>
        <Image source={LOGO_BLANCO} style={s.logo} resizeMode="contain" accessibilityLabel="Patio" />
        <Text style={s.title} allowFontScaling={true} lineBreakStrategyIOS="push-out">{noWidow('Pásale, aquí es.')}</Text>
        <Text style={s.body} allowFontScaling={true} lineBreakStrategyIOS="push-out">
          {noWidow('Lo que preparan hoy los lugares cerca de ti, con precio y a qué distancia. Y si tú cocinas, aquí te encuentran.')}
        </Text>

        <View style={s.ctaCol}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Ver qué hay hoy" accessibilityState={{ disabled: routing }} disabled={routing} style={s.roleButton} onPress={() => chooseRole('foodie')} activeOpacity={0.85}>
            <BlurView intensity={24} tint="dark" style={s.roleButtonInner}>
              <View style={s.roleIcon}><Ionicons name="map-outline" size={19} color="#FF6A3D" /></View>
              <View style={s.roleCopy}>
                <Text style={s.roleTitle}>{noWidow('Ver qué hay hoy')}</Text>
                <Text style={s.roleHint}>{noWidow('Explorar lugares cerca de ti')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.46)" />
            </BlurView>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Publicar lo que preparo" accessibilityState={{ disabled: routing }} disabled={routing} style={s.roleButton} onPress={() => chooseRole('fondero')} activeOpacity={0.85}>
            <BlurView intensity={24} tint="dark" style={s.roleButtonInner}>
              {/* Mapa y Mi Patio: el ícono de cada lado en su barra. */}
              <View style={s.roleIcon}><Image source={MI_PATIO} style={s.roleImage} /></View>
              <View style={s.roleCopy}>
                <Text style={s.roleTitle}>{noWidow('Publicar lo que preparo')}</Text>
                <Text style={s.roleHint}>{noWidow('Crear el perfil de tu negocio')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.46)" />
            </BlurView>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
