import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

  useFocusEffect(useCallback(() => {
    let active = true;
    setAddress(getFonditaDireccion());
    setHasMenu(null);
    setFonditaName(getFonditaName());
    const id = getFonditaId();
    if (id) {
      // Un borrador en memoria nunca confirma que el menú sea público.
      void supabase.from('menus').select('secciones').eq('fondita_id', id)
        .eq('fecha', localMenuDate()).maybeSingle()
        .then(({ data, error }) => {
          if (!active || error) return;
          const menu = normalizeMenuData(data?.secciones);
          setHasMenu(!!menu?.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim())));
        }, () => {});
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
          <TouchableOpacity style={s.gear} onPress={() => router.push({ pathname: '/ajustes', params: { role: 'fondero' } })} accessibilityRole="button" accessibilityLabel="Ajustes" hitSlop={8}>
            <Ionicons name="settings-outline" size={22} color={c.text} />
          </TouchableOpacity>
          <Text style={[s.fonditaName, { color: c.text }]}>
            {fonditaName || 'Tu fondita'}
          </Text>
          <View style={s.statusRow}>
            <View style={[s.statusDot, { backgroundColor: hasMenu ? c.accent : c.textMute }]} />
            <Text style={[s.statusText, { color: hasMenu ? c.accent : c.textSecondary }]}>
              {noWidow(hasMenu === null ? 'Estado del menú por confirmar' : hasMenu ? 'Menú publicado hoy' : 'Aún no publicas el menú de hoy')}
            </Text>
          </View>
        </View>

        {/* Grupos por propósito, no por lo que "quepa junto" — espejo real
            de Cuenta (Foodie): tu negocio primero, después preferencias y
            ayuda/marca; al final, las salidas del contexto juntas: la
            puerta al otro lado en tinta neutra y cerrar sesión. Sin
            botonzote — editar el negocio es una acción ocasional, no LA
            acción. */}
        {/* Modelo Instagram: Perfil es tu negocio tal como se publica; lo que
            se configura una vez vive en Ajustes, detrás del engrane. */}
        <SettingsGroup c={sc}>
          <SettingsRow c={sc} icon="storefront-outline" title="Ver mi ficha" sub="Así te ve la gente" accent onPress={() => router.push('/mi-patio')} />
        </SettingsGroup>

        <SettingsGroup c={sc} label="Negocio">
          <SettingsRow c={sc} icon="create-outline" title="Editar mi negocio" sub={address || undefined} onPress={() => router.push('/perfil-editar')} />
          <SettingsRow
            c={sc}
            icon="rocket-outline"
            title="Plan"
            sub="Patio Gratis para negocios"
            divider
            onPress={() => router.push({ pathname: '/plan', params: { role: 'fondero' } })}
          />
        </SettingsGroup>
      </ScrollView>
      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  identity: { marginBottom: 8 },
  gear: { alignSelf: 'flex-end', width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: -Spacing.lg, marginRight: -10 },
  fonditaName: { ...Type.screen },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, minHeight: 20 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { flexShrink: 1, fontSize: 13, lineHeight: 18, fontWeight: '300' },
});
