import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSettings } from '@/components/account-settings';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { bottomTabClearance } from '@/lib/layout-metrics';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { useFoodieAccountController } from '@/lib/controllers/useFoodieAccountController';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { useTheme, type Theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    body: { paddingHorizontal: 18, paddingTop: 20 },
  });
}


export default function CuentaScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const sc = settingsColors(theme);
  const insets = useSafeAreaInsets();
  const { onScroll } = useTabBarScroll();
  const { hasSession } = useFoodieAccountController();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)).catch(() => {}); }, []);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottomTabClearance(insets.bottom) }]} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Pestaña raíz: sin flecha 'atrás' — se navega con la tab bar (modelo
            Instagram). El back solo existe en pantallas hijas. La identidad
            de la pestaña ya la da la tab bar; no se repite aquí arriba. */}
        <View style={s.body}>
          {/* Un solo nivel: quién eres arriba, ajustes abajo. */}
          <SettingsGroup c={sc} label="Perfil">
            <SettingsRow c={sc} icon="person-outline" title={hasSession ? 'Editar perfil' : 'Iniciar sesión'} sub={hasSession ? 'Nombre, foto y descripción' : 'Sincroniza listas y reseñas'} onPress={() => router.push(hasSession ? '/perfil-comunidad' : '/comunidad-acceso')} />
            {userId && <SettingsRow c={sc} icon="at-outline" title="Ver perfil público" divider onPress={() => router.push({ pathname: '/foodie/[id]', params: { id: userId } })} />}
            {userId && <SettingsRow c={sc} icon="heart-outline" title="Actividad" sub="Me gusta en tus reseñas" divider onPress={() => router.push('/notificaciones')} />}
          </SettingsGroup>

          {/* Publicar un negocio vive en Plan: se elige como plan, no como atajo. */}
          <SettingsGroup c={sc}>
            <SettingsRow c={sc} icon="rocket-outline" title="Plan" sub="Foodie, Creador o Negocio" onPress={() => router.push({ pathname: '/plan', params: { role: 'foodie' } })} />
          </SettingsGroup>

          <AccountSettings role="foodie" />
        </View>
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}
