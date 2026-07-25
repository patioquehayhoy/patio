import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { SettingsGroup, SettingsRow, type SettingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import {
  getFonditaDireccion,
  getFonditaName,
  getMenuData,
} from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';
import { Fonts, useTheme } from '@/lib/theme';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { noWidow } from '@/lib/typography';

const ROLE_KEY = '@patio_user_role';
const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';

function settingsColorsFrom(c: FonderoColors, accentBg: string): SettingsColors {
  return {
    surface: c.surface,
    border: c.border,
    text: c.text,
    textSecondary: c.textSecondary,
    textMute: c.textMute,
    accent: c.accent,
    iconBg: c.iconBg,
    accentBg,
  };
}

export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { theme, toggleTheme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { onScroll } = useTabBarScroll();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [hasMenu, setHasMenu] = useState(false);

  useFocusEffect(useCallback(() => {
    setName(getFonditaName());
    setAddress(getFonditaDireccion());
    setHasMenu(!!getMenuData()?.secciones.some(section => section.platillos.some(dish => dish.nombre.trim())));
  }, []));

  const signOut = async () => {
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(ROLE_KEY).catch(() => {});
    router.replace('/');
  };

  const exploreAsClient = async () => {
    await AsyncStorage.setItem(ROLE_KEY, 'foodie').catch(() => {});
    router.replace('/explorar');
  };

  const sc = settingsColorsFrom(c, theme.accentSoft);

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: c.accent }]}>MI PATIO</Text>
        <Text style={[s.title, { color: c.text }]} numberOfLines={2}>{name || 'Tu negocio'}</Text>

        {/* Estado en vivo (¿publiqué hoy o no?), separado de la dirección: son
            dos tipos de información distintos y no deben vivir en una sola
            línea. El punto de color es el indicador de estado; la dirección
            se mueve a la fila "Editar mi negocio", que es donde realmente
            vive ese dato. */}
        <View style={s.statusRow}>
          <View style={[s.statusDot, { backgroundColor: hasMenu ? c.accent : c.textMute }]} />
          <Text style={[s.statusText, { color: hasMenu ? c.accent : c.textSecondary }]} numberOfLines={1}>
            {noWidow(hasMenu ? 'Menú publicado hoy' : 'Aún no publicas el menú de hoy')}
          </Text>
        </View>

        {/* Grupos por propósito, no por lo que "quepa junto" — espejo real
            de Cuenta (Foodie): tu negocio primero, después preferencias y
            ayuda/marca; al final, las salidas del contexto juntas: la
            puerta al otro lado en tinta neutra y cerrar sesión. Sin
            botonzote — editar el negocio es una acción ocasional, no LA
            acción. */}
        <SettingsGroup c={sc} label="Negocio">
          <SettingsRow c={sc} icon="restaurant-outline" title="Publicar menú" onPress={() => router.replace('/menu')} />
          <SettingsRow c={sc} icon="create-outline" title="Editar mi negocio" sub={address || undefined} divider onPress={() => router.push('/perfil-editar')} />
          <SettingsRow c={sc} icon="star-outline" title="Reseñas" divider onPress={() => router.push('/resenas' as any)} />
        </SettingsGroup>

        <SettingsGroup c={sc} label="Preferencias">
          <SettingsRow
            c={sc}
            icon="moon-outline"
            title="Modo oscuro"
            trailing={<ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} activeColor={c.accent} />}
          />
        </SettingsGroup>

        <SettingsGroup c={sc} label="Ayuda">
          <SettingsRow c={sc} icon="sparkles-outline" title="Nuestro manifiesto" onPress={() => router.push('/manifiesto')} />
          <SettingsRow c={sc} icon="help-circle-outline" title="Soporte" divider onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Patio`)} />
        </SettingsGroup>

        <SettingsGroup c={sc} label="Cuenta">
          <SettingsRow c={sc} icon="map-outline" title="Explorar como cliente" onPress={exploreAsClient} />
          <SettingsRow c={sc} icon="log-out-outline" title="Cerrar sesión" divider onPress={signOut} />
        </SettingsGroup>
      </ScrollView>
      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.3, fontFamily: Fonts.brand },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
});
