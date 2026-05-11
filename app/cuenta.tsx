import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, Stack } from 'expo-router';
import { Animated, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    sheetWrap: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-start' },
    panel: {
      marginHorizontal: 12,
      borderRadius: 28,
      backgroundColor: t.bg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: t.border,
      paddingHorizontal: 12,
      overflow: 'hidden',
    },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, paddingBottom: 10 },
    closeBtn: { width: 44, height: 44, borderRadius: 16, backgroundColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center' },
    iconGhost: { width: 44, height: 44 },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    identityLabel: { fontSize: 18, fontWeight: '900', color: t.text },
    identitySub: { marginTop: 2, fontSize: 13, fontWeight: '300', color: t.textSecondary },
    sectionLabel: { marginTop: 10, marginBottom: 8, paddingHorizontal: 2, fontSize: 12, fontWeight: '900', color: t.textSecondary },
    card: { borderRadius: 20, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    gap: { height: 12 },
    row: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
    rowBody: { flex: 1 },
    rowText: { fontSize: 17, lineHeight: 22, fontWeight: '900', color: t.text },
    rowSub: { marginTop: 1, fontSize: 13, lineHeight: 17, fontWeight: '300', color: t.textSecondary },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 54 },
    fonderoLink: { alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    fonderoLinkText: { fontSize: 13, fontWeight: '300', color: t.textSecondary },
  });
}

function ToggleSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
  }, [anim, value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackOff = theme.isDark ? 'rgba(245,245,240,0.22)' : '#E2E2DC';
  const trackOn = theme.accent;
  const trackBg = anim.interpolate({ inputRange: [0, 1], outputRange: [trackOff, trackOn] });

  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.85}>
      <Animated.View style={[tog.track, { backgroundColor: trackBg }]}>
        <Animated.View style={[tog.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const tog = StyleSheet.create({
  track: { width: 46, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 1 },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default function CuentaScreen() {
  const { theme, toggleTheme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const maxPanelHeight = Math.floor(Dimensions.get('window').height * 0.82);

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false, presentation: 'transparentModal' }} />

      <BlurView
        intensity={theme.isDark ? 36 : 28}
        tint={theme.isDark ? 'dark' : 'light'}
        style={s.backdrop}
      />

      <View style={[s.sheetWrap, { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 10 }]}>
        <View style={[s.panel, { maxHeight: maxPanelHeight }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}>

            <View style={s.topRow}>
              <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.76}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
              <View style={s.iconGhost} />
            </View>

            <View style={s.identity}>
              <View style={s.avatar}>
                <Ionicons name="person-outline" size={22} color={theme.textSecondary} />
              </View>
              <View>
                <Text style={s.identityLabel} allowFontScaling={true}>Explorador</Text>
                <Text style={s.identitySub} allowFontScaling={true}>Patio Foodie</Text>
              </View>
            </View>

            <Text style={s.sectionLabel} allowFontScaling={true}>Cuenta</Text>
            <View style={s.card}>
              <TouchableOpacity style={s.row} onPress={() => router.push('/buscar')} activeOpacity={0.76}>
                <Ionicons name="search-outline" size={22} color={theme.textSecondary} />
                <Text style={s.rowText} allowFontScaling={true}>Buscar</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
              <View style={s.divider} />
              <TouchableOpacity style={s.row} onPress={() => router.push('/favoritos')} activeOpacity={0.76}>
                <Ionicons name="heart-outline" size={22} color={theme.textSecondary} />
                <Text style={s.rowText} allowFontScaling={true}>Favoritos</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={s.gap} />

            <Text style={s.sectionLabel} allowFontScaling={true}>Aplicación</Text>
            <View style={s.card}>
              <TouchableOpacity style={s.row} onPress={() => router.push('/manifiesto')} activeOpacity={0.76}>
                <Ionicons name="sparkles-outline" size={22} color={theme.textSecondary} />
                <Text style={s.rowText} allowFontScaling={true}>Manifiesto</Text>
                <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
              <View style={s.divider} />
              <View style={s.row}>
                <Ionicons name="moon-outline" size={22} color={theme.textSecondary} />
                <View style={s.rowBody}>
                  <Text style={s.rowText} allowFontScaling={true}>Modo oscuro</Text>
                </View>
                <ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} />
              </View>
              <View style={s.divider} />
              <TouchableOpacity style={s.row} activeOpacity={0.76}>
                <Ionicons name="chatbubble-outline" size={22} color={theme.textSecondary} />
                <Text style={s.rowText} allowFontScaling={true}>Contactar soporte</Text>
              </TouchableOpacity>
              <View style={s.divider} />
              <TouchableOpacity style={s.row} activeOpacity={0.76}>
                <Ionicons name="star-outline" size={22} color={theme.textSecondary} />
                <Text style={s.rowText} allowFontScaling={true}>Calificar la app</Text>
              </TouchableOpacity>
            </View>

            <View style={s.gap} />

            <Text style={s.sectionLabel} allowFontScaling={true}>Sesión</Text>
            <View style={s.card}>
              <TouchableOpacity style={s.row} onPress={() => router.replace('/')} activeOpacity={0.76}>
                <Ionicons name="log-out-outline" size={22} color={theme.textSecondary} />
                <Text style={s.rowText} allowFontScaling={true}>Cerrar sesión</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </View>
      </View>

    </View>
  );
}
