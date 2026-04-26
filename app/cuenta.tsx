import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, type Theme } from '@/lib/theme';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: { paddingHorizontal: 24, paddingBottom: 34 },
    top: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    iconButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 18, fontWeight: '900', color: t.text },
    spacer: { width: 44 },
    header: { paddingTop: 26, paddingBottom: 24 },
    eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: t.textSecondary },
    name: { marginTop: 10, fontSize: 34, lineHeight: 38, fontWeight: '900', color: t.text },
    sub: { marginTop: 8, fontSize: 15, lineHeight: 21, color: t.textSecondary },
    sectionTitle: { marginTop: 24, marginBottom: 12, fontSize: 12, fontWeight: '900', letterSpacing: 1.6, color: t.text },
    panel: { borderRadius: 24, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    row: { minHeight: 62, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 },
    rowIcon: { width: 28, alignItems: 'center' },
    rowText: { flex: 1, fontSize: 17, color: t.text },
    rowSub: { marginTop: 3, fontSize: 12, color: t.textSecondary },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginLeft: 58 },
  });
}

export default function CuentaScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.top}>
          <TouchableOpacity style={s.iconButton} onPress={() => router.back()} activeOpacity={0.76}>
            <Ionicons name="chevron-back" size={26} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.title} allowFontScaling={true}>Cuenta</Text>
          <View style={s.spacer} />
        </View>

        <View style={s.header}>
          <Text style={s.eyebrow} allowFontScaling={true}>PATIO FOODIE</Text>
          <Text style={s.name} allowFontScaling={true}>Tu Patio</Text>
          <Text style={s.sub} allowFontScaling={true}>Busca platillos, guarda lugares y vuelve rápido a lo que ya te funciona.</Text>
        </View>

        <Text style={s.sectionTitle} allowFontScaling={true}>ACCESOS</Text>
        <View style={s.panel}>
          <TouchableOpacity style={s.row} onPress={() => router.push('/buscar')} activeOpacity={0.76}>
            <View style={s.rowIcon}>
              <Ionicons name="search-outline" size={24} color={theme.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText} allowFontScaling={true}>Buscar platillo</Text>
              <Text style={s.rowSub} allowFontScaling={true}>Mole, enchiladas, anís...</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={() => router.push('/favoritos')} activeOpacity={0.76}>
            <View style={s.rowIcon}>
              <Ionicons name="star-outline" size={24} color={theme.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowText} allowFontScaling={true}>Favoritos</Text>
              <Text style={s.rowSub} allowFontScaling={true}>Tus lugares guardados</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle} allowFontScaling={true}>SOPORTE</Text>
        <View style={s.panel}>
          <TouchableOpacity style={s.row} onPress={() => router.push('/manifiesto')} activeOpacity={0.76}>
            <View style={s.rowIcon}>
              <Ionicons name="sparkles-outline" size={24} color={theme.textSecondary} />
            </View>
            <Text style={s.rowText} allowFontScaling={true}>Manifiesto</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} activeOpacity={0.76}>
            <View style={s.rowIcon}>
              <Ionicons name="chatbubble-outline" size={24} color={theme.textSecondary} />
            </View>
            <Text style={s.rowText} allowFontScaling={true}>Contactar soporte</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} activeOpacity={0.76}>
            <View style={s.rowIcon}>
              <Ionicons name="star-outline" size={24} color={theme.textSecondary} />
            </View>
            <Text style={s.rowText} allowFontScaling={true}>Calificar la app</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.sectionTitle} allowFontScaling={true}>SESIÓN</Text>
        <View style={s.panel}>
          <TouchableOpacity style={s.row} onPress={() => router.replace('/')} activeOpacity={0.76}>
            <View style={s.rowIcon}>
              <Ionicons name="log-out-outline" size={24} color={theme.textSecondary} />
            </View>
            <Text style={s.rowText} allowFontScaling={true}>Salir</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
