import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, Stack } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    backdrop: { ...StyleSheet.absoluteFillObject },
    dismiss: { flex: 1 },
    panel: { backgroundColor: t.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24 },
    grabber: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)', marginTop: 10, marginBottom: 4 },
    topRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, paddingBottom: 16 },
    closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.07)', alignItems: 'center', justifyContent: 'center' },
    identity: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingBottom: 20 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    identityLabel: { fontSize: 17, fontWeight: '900', color: t.text },
    identitySub: { marginTop: 2, fontSize: 13, fontWeight: '300', color: t.textSecondary },
    card: { borderRadius: 20, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    gap: { height: 12 },
    row: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
    rowBody: { flex: 1 },
    rowText: { fontSize: 16, fontWeight: '900', color: t.text },
    rowSub: { marginTop: 1, fontSize: 12, fontWeight: '300', color: t.textSecondary },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 54 },
    fonderoLink: { alignItems: 'center', paddingTop: 14 },
    fonderoLinkText: { fontSize: 13, fontWeight: '300', color: t.textSecondary },
  });
}

export default function CuentaScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false, presentation: 'transparentModal' }} />

      <BlurView
        intensity={theme.isDark ? 80 : 50}
        tint={theme.isDark ? 'dark' : 'light'}
        style={s.backdrop}
      />

      <TouchableOpacity style={s.dismiss} onPress={() => router.back()} activeOpacity={1} />

      <View style={[s.panel, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.grabber} />

        <View style={s.topRow}>
          <TouchableOpacity style={s.closeBtn} onPress={() => router.back()} activeOpacity={0.76}>
            <Ionicons name="close" size={18} color={theme.text} />
          </TouchableOpacity>
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

        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => router.push('/buscar')} activeOpacity={0.76}>
            <Ionicons name="search-outline" size={22} color={theme.textSecondary} />
            <View style={s.rowBody}>
              <Text style={s.rowText} allowFontScaling={true}>Buscar</Text>
              <Text style={s.rowSub} allowFontScaling={true}>Mole, enchiladas, agua de jamaica…</Text>
            </View>
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

        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => router.push('/manifiesto')} activeOpacity={0.76}>
            <Ionicons name="sparkles-outline" size={22} color={theme.textSecondary} />
            <Text style={s.rowText} allowFontScaling={true}>Manifiesto</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
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

        <View style={s.card}>
          <TouchableOpacity style={s.row} onPress={() => router.replace('/')} activeOpacity={0.76}>
            <Ionicons name="log-out-outline" size={22} color={theme.textSecondary} />
            <Text style={s.rowText} allowFontScaling={true}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={s.fonderoLink} onPress={() => router.replace('/')} activeOpacity={0.76}>
          <Text style={s.fonderoLinkText} allowFontScaling={true}>Tengo un negocio →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
