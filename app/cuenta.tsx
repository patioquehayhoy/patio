import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { SettingsGroup, SettingsRow, type SettingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import { useFoodieAccountController } from '@/lib/controllers/useFoodieAccountController';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    // Header editorial
    header: { paddingHorizontal: 22, paddingTop: 8, paddingBottom: 12 },
    closeBtn: { width: 40, height: 40, borderRadius: 20, marginLeft: -8, marginBottom: 6, alignItems: 'center', justifyContent: 'center' },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    title: { fontSize: 36, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: t.text, fontFamily: Fonts.brand },

    body: { paddingHorizontal: 18, paddingTop: 12 },

    // Identidad card con degradado tibio
    idCard: { borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    statsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 18 },
    statCol: { flex: 1, alignItems: 'center' },
    statNum: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8, color: t.text, lineHeight: 30, fontFamily: Fonts.brand },
    statLabel: { marginTop: 4, fontSize: 10.5, fontWeight: '300', letterSpacing: 0.4, textTransform: 'uppercase', color: t.textSecondary },
    statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: 4, backgroundColor: t.border },

    // Footer marca
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
    footerText: { fontSize: 11, fontWeight: '300', letterSpacing: 0.5, textTransform: 'uppercase', color: t.textMute },
  });
}

function settingsColors(t: Theme): SettingsColors {
  return {
    surface: t.surface,
    border: t.border,
    text: t.text,
    textSecondary: t.textSecondary,
    textMute: t.textMute,
    accent: t.accent,
    iconBg: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,18,20,0.04)',
    accentBg: t.accentSoft,
  };
}

export default function CuentaScreen() {
  const { theme, toggleTheme } = useTheme();
  const s = makeStyles(theme);
  const sc = settingsColors(theme);
  const insets = useSafeAreaInsets();
  const { onScroll } = useTabBarScroll();
  const { handleDevFondero, handleFonderoAccess, handleSignOut, hasSession, stats } = useFoodieAccountController();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Pestaña raíz: sin flecha 'atrás' — se navega con la tab bar (modelo
            Instagram). El back solo existe en pantallas hijas. */}
        <View style={s.header}>
          <Text style={s.eyebrow} allowFontScaling={true}>Cuenta</Text>
          <Text style={s.title} allowFontScaling={true}>{noWidow('Tu Patio')}</Text>
        </View>

        <View style={s.body}>
          {/* Resumen útil: solo datos reales, sin métricas decorativas. */}
          {(stats.viewed > 0 || stats.saved > 0) && <View style={s.idCard}>
            <LinearGradient
              colors={theme.isDark ? [theme.surface, theme.surface] : ['#FFFFFF', theme.accentSoft]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}>
              <View style={s.statsRow}>
                <TouchableOpacity style={s.statCol} activeOpacity={0.7} onPress={() => router.push('/vistos' as any)}>
                  <Text style={s.statNum} allowFontScaling={true}>{stats.viewed}</Text>
                  <Text style={s.statLabel} allowFontScaling={true}>lugares vistos</Text>
                </TouchableOpacity>
                <View style={s.statDivider} />
                <TouchableOpacity style={s.statCol} activeOpacity={0.7} onPress={() => router.push('/favoritos' as any)}>
                  <Text style={s.statNum} allowFontScaling={true}>{stats.saved}</Text>
                  <Text style={s.statLabel} allowFontScaling={true}>guardadas</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>}

          {/* Grupos por propósito, no por lo que "quepa junto": preferencias
              de la app, después ayuda/marca, y al final las salidas del
              contexto juntas — la puerta al otro lado en tinta neutra
              (acción ocasional, no compite con el contenido) y cerrar sesión.
              Las stats de arriba YA son la puerta a vistos/guardados, sin
              filas redundantes aquí. */}
          <SettingsGroup c={sc} label="Preferencias">
            <SettingsRow c={sc} icon="moon-outline" title="Modo oscuro" trailing={<ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} />} />
          </SettingsGroup>

          <SettingsGroup c={sc} label="Ayuda">
            <SettingsRow c={sc} icon="sparkles-outline" title="Nuestro manifiesto" onPress={() => router.push('/manifiesto')} />
            <SettingsRow c={sc} icon="chatbubble-outline" title="Contactar soporte" divider onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Patio`)} />
          </SettingsGroup>

          <SettingsGroup c={sc} label="Cuenta">
            {__DEV__ ? (
              <SettingsRow
                c={sc}
                icon="construct-outline"
                title="Publicar mi menú · DEV"
                sub="Entrar sin iniciar sesión"
                onPress={handleDevFondero}
              />
            ) : (
              <SettingsRow
                c={sc}
                icon="storefront-outline"
                title="Publicar mi menú"
                sub="Para cocinas y fonditas"
                onPress={handleFonderoAccess}
              />
            )}
            {(hasSession || __DEV__) && <SettingsRow c={sc} icon="log-out-outline" title="Cerrar sesión" divider onPress={handleSignOut} />}
          </SettingsGroup>

          <View style={s.footer}>
            <Ionicons name="ellipse" size={6} color={theme.textMute} />
            <Text style={s.footerText} allowFontScaling={true}>Patio · v0.1 · CDMX</Text>
          </View>
        </View>
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}
