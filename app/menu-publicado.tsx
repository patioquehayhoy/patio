import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { Fonts, useTheme } from '@/lib/theme';

export default function MenuPublicadoScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = useMemo(() => makeStyles(c), [c]);
  const scale = useRef(new Animated.Value(0.82)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, stiffness: 360, damping: 28, mass: 0.8 }),
      Animated.timing(fade, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  const editMenu = () => router.replace({ pathname: '/menu-editar', params: { reuse: '1' } });

  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={s.top}>
        <View style={s.topSpacer} />
        <TouchableOpacity style={s.editButton} onPress={editMenu} activeOpacity={0.7}>
          <Text style={s.editText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <Animated.View style={[s.content, { opacity: fade }]}>
        <Animated.View style={[s.check, { transform: [{ scale }] }]}>
          <Ionicons name="checkmark" size={23} color="#FFFFFF" />
        </Animated.View>
        <Text style={s.eyebrow}>PUBLICADO</Text>
        <Text style={s.title}>Menú de hoy</Text>
      </Animated.View>

      <View style={s.actions}>
        <TouchableOpacity
          accessibilityLabel="Ver el menú publicado"
          style={s.primary}
          onPress={() => router.replace('/preview')}
          activeOpacity={0.84}>
          <Ionicons name="eye-outline" size={17} color="#FFFFFF" />
          <Text style={s.primaryText}>Ver menú publicado</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondary} onPress={() => router.replace('/perfil')} activeOpacity={0.72}>
          <Text style={s.secondaryText}>Listo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg, paddingHorizontal: 22 },
    top: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    topSpacer: { width: 56 },
    editButton: { minWidth: 56, minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
    editText: { fontSize: 15, fontWeight: '600', color: c.accent },
    content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 44 },
    check: { width: 54, height: 54, borderRadius: 27, marginBottom: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent },
    eyebrow: { marginBottom: 8, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: c.accent },
    title: { fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.2, color: c.text, fontFamily: Fonts.brand },
    actions: { paddingBottom: 18 },
    primary: { height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.accent },
    primaryText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
    secondary: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
    secondaryText: { fontSize: 15, fontWeight: '600', color: c.textSecondary },
  });
}
