import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountDeletionRow } from '@/components/account-deletion-row';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import { signOutAccount } from '@/lib/account-session';
import { USER_ROLE_KEY } from '@/lib/entry-flow';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Ajustes detrás del engrane de Perfil, como Instagram: Perfil muestra quién
// eres y lo que publicas; aquí vive lo que se configura una vez. Lo que casi
// nadie usa (cuentas bloqueadas, eliminar) queda al final.
export default function AjustesScreen() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const fondero = role === 'fondero';
  const { theme, toggleTheme } = useTheme();
  const sc = settingsColors(theme);
  const insets = useSafeAreaInsets();
  const [hasSession, setHasSession] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => { if (active) setHasSession(!!data.session); }).catch(() => {});
    return () => { active = false; };
  }, []));

  const signOut = async () => {
    try {
      await signOutAccount();
      router.replace('/');
    } catch {
      Alert.alert(noWidow('No pudimos cerrar sesión'), noWidow('Inténtalo de nuevo. Tus datos siguen guardados.'));
    }
  };

  const switchToFoodie = async () => {
    await AsyncStorage.setItem(USER_ROLE_KEY, 'foodie').catch(() => {});
    router.replace('/explorar');
  };

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.navButton} onPress={() => router.canGoBack() ? router.back() : router.replace(fondero ? '/perfil' : '/cuenta')} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[s.navTitle, { color: theme.text }]}>Ajustes</Text>
        <View style={s.navButton} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <SettingsGroup c={sc} label="Preferencias">
          <SettingsRow
            c={sc}
            icon="notifications-outline"
            title="Notificaciones"
            sub={fondero ? 'Reseñas nuevas' : 'Menú de hoy de tus lugares'}
            onPress={() => router.push({ pathname: '/avisos', params: { role: fondero ? 'fondero' : 'foodie' } })}
          />
          <SettingsRow c={sc} icon={theme.isDark ? 'moon' : 'sunny-outline'} title="Apariencia" sub={theme.isDark ? 'Oscura' : 'Clara'} divider trailing={<ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} accessibilityLabel="Modo oscuro" />} />
        </SettingsGroup>

        <SettingsGroup c={sc} label="Ayuda">
          <SettingsRow c={sc} icon="chatbubble-outline" title="Ayuda y soporte" onPress={() => router.push({ pathname: '/soporte', params: { role: fondero ? 'fondero' : 'foodie' } })} />
          <SettingsRow c={sc} icon="sparkles-outline" title="Nuestro manifiesto" divider onPress={() => router.push('/manifiesto')} />
        </SettingsGroup>

        {(fondero || hasSession || __DEV__) && <SettingsGroup c={sc} label="Cuenta">
          {fondero && <SettingsRow c={sc} icon="repeat-outline" title="Cambiar a modo Foodie" onPress={switchToFoodie} />}
          {(hasSession || __DEV__) && <SettingsRow c={sc} icon="ban-outline" title="Cuentas bloqueadas" divider={fondero} onPress={() => router.push('/privacidad')} />}
          {(hasSession || fondero) && <SettingsRow c={sc} icon="log-out-outline" title="Cerrar sesión" divider={fondero || hasSession || __DEV__} onPress={signOut} />}
          {hasSession && <AccountDeletionRow c={sc} />}
        </SettingsGroup>}

        <Text style={[s.footer, { color: theme.textMute }]} allowFontScaling={true}>
          {noWidow(`Patio · v${Constants.expoConfig?.version ?? '1.0.0'} · CDMX`)}
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 15, fontWeight: '600' },
  footer: { marginTop: 24, textAlign: 'center', fontSize: 11, fontWeight: '400', letterSpacing: 0.5, textTransform: 'uppercase' },
});
