import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSettings } from '@/components/account-settings';
import { getBusinessStats } from '@/lib/business-stats';
import { DEMO_BUSINESS_ID } from '@/lib/business-demo';
import { getDevPublishedMenu } from '@/lib/demo';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { bottomTabClearance } from '@/lib/layout-metrics';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { fonderoPalette } from '@/lib/fondero-palette';
import {
  getFonditaDireccion,
  getFonditaName,
  normalizeMenuData,
} from '@/lib/menu-store';
import { localMenuDate } from '@/lib/menu-date';
import { getFonditaId } from '@/lib/user-store';
import { getMyRole } from '@/lib/team';
import { supabase } from '@/lib/supabase';
import { Layout, Spacing, useTheme, Type } from '@/lib/theme';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { noWidow } from '@/lib/typography';


export default function PerfilScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { onScroll } = useTabBarScroll();
  const [address, setAddress] = useState('');
  const [hasMenu, setHasMenu] = useState<boolean | null>(null);
  const [fonditaName, setFonditaName] = useState('');
  // Seguidores del negocio; tocar el número abre quién lo sigue.
  const [followers, setFollowers] = useState<number | null>(null);
  // El plan lo ve y lo paga solo el propietario principal (Equipo, fase 1).
  const [principal, setPrincipal] = useState(true);
  const demoMode = __DEV__ && !getFonditaId();
  const businessId = getFonditaId() || (demoMode ? DEMO_BUSINESS_ID : null);

  useFocusEffect(useCallback(() => {
    let active = true;
    setAddress(getFonditaDireccion());
    setHasMenu(null);
    setFonditaName(getFonditaName() || (__DEV__ && !getFonditaId() ? 'Fonda Doña Rosa' : ''));
    const actualId = getFonditaId();
    const id = actualId || (__DEV__ ? DEMO_BUSINESS_ID : null);
    if (id) getBusinessStats(id).then((stats) => { if (active && stats) setFollowers(stats.saves); }).catch(() => {});
    if (actualId) getMyRole(actualId).then((role) => { if (active && role) setPrincipal(role.principal); }).catch(() => {});
    if (actualId) {
      // Un borrador en memoria nunca confirma que el menú sea público.
      void supabase.from('menus').select('secciones').eq('negocio_id', actualId)
        .eq('fecha', localMenuDate()).maybeSingle()
        .then(({ data, error }) => {
          if (!active || error) return;
          const menu = normalizeMenuData(data?.secciones);
          setHasMenu(!!menu?.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim())));
        }, () => {});
    } else if (__DEV__) {
      getDevPublishedMenu().then((menu) => { if (active) setHasMenu(!!menu?.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim()))); });
    } else setHasMenu(false);
    return () => { active = false; };
  }, []));

  const sc = settingsColors(theme);

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: Layout.screen, paddingTop: Spacing.lg, paddingBottom: bottomTabClearance(insets.bottom) }} showsVerticalScrollIndicator={false}>
        {/* Identidad primero: el nombre de la fondita es el héroe de la
            pantalla (patrón de tarjeta de cuenta de Apple — Settings/App
            Store ponen la identidad antes del grouped list, nunca después).
            El estado en vivo (¿publiqué hoy o no?) vive debajo como
            subtítulo de esa identidad, separado de la dirección: son dos
            tipos de información distintos. La dirección vive en la fila
            "Editar mi negocio", que es donde realmente pertenece. */}
        <View style={s.identity}>
          <Text style={[s.fonditaName, { color: c.text }]}>
            {fonditaName || 'Tu negocio'}
          </Text>
          {followers !== null && (
            <TouchableOpacity activeOpacity={0.7} disabled={!businessId} accessibilityRole="button"
              accessibilityLabel={`${followers} ${followers === 1 ? 'seguidor' : 'seguidores'}, ver quién te sigue`}
              onPress={() => router.push({ pathname: '/foodie/seguidores', params: { patio: businessId } })}>
              <Text style={[s.followers, { color: c.text }]}>
                <Text style={s.followersValue}>{followers}</Text> {followers === 1 ? 'seguidor' : 'seguidores'}
              </Text>
            </TouchableOpacity>
          )}
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: hasMenu ? c.accent : c.textMute }]} />
            <Text style={[s.statusText, { color: hasMenu ? c.accent : c.textSecondary }]}>
              {noWidow(hasMenu === null ? 'Estado del menú por confirmar' : hasMenu ? 'Menú publicado hoy' : 'Aún no publicas el menú de hoy')}
            </Text>
          </View>
        </View>
        {demoMode && <Text style={[s.demoLabel, { color: c.textSecondary }]}>{noWidow('Datos de ejemplo · acceso sin registro')}</Text>}

        {/* Grupos por propósito, no por lo que "quepa junto" — espejo real
            de Cuenta (Foodie): tu negocio primero, después preferencias y
            ayuda/marca; al final, las salidas del contexto juntas: la
            puerta al otro lado en tinta neutra y cerrar sesión. Sin
            botonzote — editar el negocio es una acción ocasional, no LA
            acción. */}
        <SettingsGroup c={sc} label="Negocio">
          <SettingsRow c={sc} icon="stats-chart-outline" title="Hoy" sub="Resumen, vistas y lo que más gustó" onPress={() => router.push('/hoy')} />
          <SettingsRow c={sc} icon="book-outline" title="Mis menús y listas" divider onPress={() => router.push('/historial')} />
          <SettingsRow c={sc} icon="create-outline" title="Editar mi negocio" divider sub={address || undefined} onPress={() => router.push('/perfil-editar')} />
          <SettingsRow c={sc} icon="people-outline" title="Equipo" sub="Quién más publica en tu negocio" divider onPress={() => router.push('/equipo')} />
          {principal && <SettingsRow
            c={sc}
            icon="rocket-outline"
            title="Plan"
            sub="Patio Gratis para negocios"
            divider
            onPress={() => router.push('/plan')}
          />}
        </SettingsGroup>

        <AccountSettings role="fondero" />
      </ScrollView>
      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  identity: { marginBottom: 8 },
  demoLabel: { fontSize: 13, lineHeight: 18, marginTop: 4, marginBottom: 12 },
  followers: { marginTop: 6, fontSize: 14, lineHeight: 19, fontWeight: '400' },
  followersValue: { fontWeight: '700' },
  fonditaName: { ...Type.screen },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, minHeight: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { flexShrink: 1, fontSize: 13, lineHeight: 18, fontWeight: '300' },
});
