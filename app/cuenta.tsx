import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { SettingsGroup, SettingsRow, type SettingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import { useFoodieAccountController } from '@/lib/controllers/useFoodieAccountController';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { useTheme, type Theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { noWidow } from '@/lib/typography';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    body: { paddingHorizontal: 18, paddingTop: 20 },

    // Footer marca
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 },
    footerText: { fontSize: 11, fontWeight: '400', letterSpacing: 0.5, textTransform: 'uppercase', color: t.textMute },
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
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)).catch(() => {}); }, []);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 130 }]} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Pestaña raíz: sin flecha 'atrás' — se navega con la tab bar (modelo
            Instagram). El back solo existe en pantallas hijas. La identidad
            de la pestaña ya la da la tab bar; no se repite aquí arriba. */}
        <View style={s.body}>
          <SettingsGroup c={sc} label="Perfil">
            <SettingsRow c={sc} icon="person-outline" title={hasSession ? 'Editar perfil' : 'Iniciar sesión'} sub={hasSession ? 'Nombre, foto y descripción' : 'Sincroniza listas y reseñas'} onPress={() => router.push(hasSession ? '/perfil-comunidad' : '/comunidad-acceso')} />
            {userId && <SettingsRow c={sc} icon="at-outline" title="Ver perfil público" divider onPress={() => router.push({ pathname: '/foodie/[id]', params: { id: userId } })} />}
            {userId && <SettingsRow c={sc} icon="heart-outline" title="Notificaciones" sub="Cuando alguien le da like a tu reseña" divider onPress={() => router.push('/notificaciones')} />}
          </SettingsGroup>

          <SettingsGroup c={sc} label="Preferencias">
            <SettingsRow
              c={sc}
              icon="notifications-outline"
              title="Avisos"
              sub="Menús nuevos"
              onPress={() => router.push({ pathname: '/avisos', params: { role: 'foodie' } })}
            />
            <SettingsRow c={sc} icon="lock-closed-outline" title="Privacidad" divider onPress={() => router.push('/privacidad')} />
            <SettingsRow c={sc} icon="rocket-outline" title="Plan" sub="Patio Gratis" divider onPress={() => router.push({ pathname: '/plan', params: { role: 'foodie' } })} />
            <SettingsRow c={sc} icon={theme.isDark ? 'moon' : 'sunny-outline'} title="Apariencia" sub={theme.isDark ? 'Oscura' : 'Clara'} divider trailing={<ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} accessibilityLabel="Modo oscuro" />} />
          </SettingsGroup>

          <SettingsGroup c={sc} label="Ayuda">
            <SettingsRow c={sc} icon="sparkles-outline" title="Nuestro manifiesto" onPress={() => router.push('/manifiesto')} />
            <SettingsRow c={sc} icon="chatbubble-outline" title="Ayuda y soporte" divider onPress={() => router.push('/soporte')} />
          </SettingsGroup>

          <SettingsGroup c={sc} label="Para negocios">
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
            <Text style={s.footerText} allowFontScaling={true}>{noWidow('Patio · v0.1 · CDMX')}</Text>
          </View>
        </View>
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}
