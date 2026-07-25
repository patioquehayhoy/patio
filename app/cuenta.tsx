import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { SettingsGroup, SettingsRow, type SettingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import { useFoodieAccountController } from '@/lib/controllers/useFoodieAccountController';
import { getNotifPrefs, setAvisar } from '@/lib/notifications';
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
  const { handleDevFondero, handleFonderoAccess, handleSignOut, hasSession } = useFoodieAccountController();
  const [notificationsOn, setNotificationsOn] = useState(false);

  useFocusEffect(useCallback(() => {
    let mounted = true;
    getNotifPrefs().then((prefs) => {
      if (mounted) setNotificationsOn(prefs.avisar);
    });
    return () => { mounted = false; };
  }, []));

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Pestaña raíz: sin flecha 'atrás' — se navega con la tab bar (modelo
            Instagram). El back solo existe en pantallas hijas. */}
        <View style={s.header}>
          <Text style={s.eyebrow} allowFontScaling={true}>Perfil</Text>
          <Text style={s.title} allowFontScaling={true}>{noWidow('Tu cuenta')}</Text>
        </View>

        <View style={s.body}>
          {/* El historial de uso vive en Actividad; Perfil conserva solamente
              preferencias, ayuda y cuenta. */}
          <SettingsGroup c={sc} label="Preferencias">
            <SettingsRow
              c={sc}
              icon="notifications-outline"
              title="Avisos de tus Patios"
              sub="Recibe novedades de los lugares que guardas"
              trailing={<ToggleSwitch value={notificationsOn} onValueChange={async (value) => setNotificationsOn(await setAvisar(value))} />}
            />
            <SettingsRow c={sc} icon="moon-outline" title="Modo oscuro" divider trailing={<ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} />} />
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
