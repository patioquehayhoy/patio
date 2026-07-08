import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BottomTabBar } from '@/components/bottom-tab-bar';
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

const ROLE_KEY = '@patio_user_role';
const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';

type RowProps = {
  c: FonderoColors;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  onPress?: () => void;
  last?: boolean;
  trailing?: React.ReactNode;
};

function Row({ c, icon, title, onPress, last, trailing }: RowProps) {
  return (
    <TouchableOpacity
      style={[s.row, !last && { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}>
      <Ionicons name={icon} size={20} color={c.textSecondary} />
      <Text style={[s.rowText, { color: c.text }]}>{title}</Text>
      {trailing ?? <Ionicons name="chevron-forward" size={16} color={c.textMute} />}
    </TouchableOpacity>
  );
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

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 110 }} showsVerticalScrollIndicator={false}>
        <Text style={[s.eyebrow, { color: c.accent }]}>MI PATIO</Text>
        <Text style={[s.title, { color: c.text }]} numberOfLines={2}>{name || 'Tu negocio'}</Text>
        <Text style={[s.status, { color: c.textSecondary }]}>
          {hasMenu ? 'Menú publicado hoy' : 'Aún no publicas el menú de hoy'}
          {address ? ` · ${address}` : ''}
        </Text>

        <TouchableOpacity style={[s.primary, { backgroundColor: c.accent }]} onPress={() => router.push('/perfil-editar')} activeOpacity={0.86}>
          <Ionicons name="create-outline" size={19} color="#fff" />
          <Text style={s.primaryText}>Editar mi negocio</Text>
        </TouchableOpacity>

        <View style={[s.group, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Row c={c} icon="restaurant-outline" title="Publicar menú" onPress={() => router.replace('/menu')} />
          <Row c={c} icon="map-outline" title="Explorar como cliente" onPress={exploreAsClient} />
          <Row
            c={c}
            icon="moon-outline"
            title="Modo oscuro"
            trailing={<ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} activeColor={c.accent} />}
          />
          <Row c={c} icon="sparkles-outline" title="Nuestro manifiesto" onPress={() => router.push('/manifiesto')} />
          <Row c={c} icon="help-circle-outline" title="Soporte" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Soporte%20Patio`)} />
          <Row c={c} icon="log-out-outline" title="Cerrar sesión" last onPress={signOut} />
        </View>
      </ScrollView>
      <BottomTabBar variant="fondero" />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.3, fontFamily: Fonts.brand },
  status: { marginTop: 10, fontSize: 14, lineHeight: 20 },
  primary: { minHeight: 56, marginTop: 28, borderRadius: 18, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  group: { marginTop: 18, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { minHeight: 62, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center', gap: 13 },
  rowText: { flex: 1, fontSize: 16, fontWeight: '500' },
});
