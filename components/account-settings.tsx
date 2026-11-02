import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { AccountDeletionRow } from '@/components/account-deletion-row';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import { signOutAccount } from '@/lib/account-session';
import { saveUserRole } from '@/lib/entry-flow';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Ajustes en un solo nivel, al final de Perfil, como Claude y la mayoría de
// apps: Perfil → Notificaciones, nunca Perfil → Ajustes → Notificaciones.
// Lo comparten los dos roles; lo que casi nadie usa queda al final.
export function AccountSettings({ role }: { role: 'foodie' | 'fondero' }) {
  const fondero = role === 'fondero';
  const { theme, toggleTheme } = useTheme();
  const sc = settingsColors(theme);
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
    await saveUserRole('foodie').catch(() => {});
    router.replace('/explorar');
  };

  return (
    <>
      <SettingsGroup c={sc} label="Preferencias">
        <SettingsRow
          c={sc}
          icon="notifications-outline"
          title="Notificaciones"
          sub={fondero ? 'Reseñas, respuestas y recordatorio' : 'Menú de hoy, comentarios y recordatorio'}
          onPress={() => router.push({ pathname: '/avisos', params: { role } })}
        />
        <SettingsRow c={sc} icon={theme.isDark ? 'moon' : 'sunny-outline'} title="Apariencia" sub={theme.isDark ? 'Oscura' : 'Clara'} divider trailing={<ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} accessibilityLabel="Modo oscuro" />} />
      </SettingsGroup>

      <SettingsGroup c={sc} label="Ayuda">
        <SettingsRow c={sc} icon="chatbubble-outline" title="Ayuda y soporte" onPress={() => router.push({ pathname: '/soporte', params: { role } })} />
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
    </>
  );
}

const s = StyleSheet.create({
  footer: { marginTop: 24, textAlign: 'center', fontSize: 11, fontWeight: '400', letterSpacing: 0.5, textTransform: 'uppercase' },
});
