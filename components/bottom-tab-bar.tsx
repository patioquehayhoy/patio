import { router, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useEffect } from 'react';
import { Animated, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTabBarTranslate } from '@/lib/tab-bar-visibility';

// TabBar exacta a Figma Make: pill flotante glass con 3 tabs.
// Foodie (claro): Hoy / Guardados / Yo.
// Fondero (oscuro): Hoy / Historial / Fonda.

type Tab = {
  path: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const FOODIE_TABS: Tab[] = [
  { path: '/explorar',  label: 'Hoy',       icon: 'map-outline' },
  { path: '/favoritos', label: 'Guardados', icon: 'bookmark-outline' },
  { path: '/cuenta',    label: 'Yo',        icon: 'person-outline' },
];

const FONDERO_TABS: Tab[] = [
  { path: '/menu',      label: 'Hoy',       icon: 'sparkles-outline' },
  { path: '/historial', label: 'Historial', icon: 'stats-chart-outline' },
  { path: '/perfil',    label: 'Mi Patio',  icon: 'person-outline' },
];

const DARK = {
  pill: 'rgba(20,21,24,0.78)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#FF6A3D',
  accentBg: 'rgba(255,106,61,0.14)',
  ink: '#F8F8F5',
  mute: 'rgba(248,248,245,0.55)',
};
const LIGHT = {
  pill: 'rgba(248,248,245,0.92)',
  border: 'rgba(255,255,255,0.85)',
  accent: '#F2612F',
  accentBg: 'rgba(242,97,47,0.10)',
  ink: '#111214',
  mute: '#8A8A85',
};

export function BottomTabBar({ variant = 'fondero' }: { variant?: 'foodie' | 'fondero' } = {}) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const isDark = variant === 'fondero';
  const c = isDark ? DARK : LIGHT;
  const tabs = variant === 'foodie' ? FOODIE_TABS : FONDERO_TABS;
  const { translateY, reveal } = useTabBarTranslate();

  // Al cambiar de pestaña, el tab bar siempre reaparece (no llegar a la nueva
  // pantalla con la barra escondida del scroll anterior).
  useEffect(() => { reveal(); }, [pathname, reveal]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { bottom: (insets.bottom || 10) + 4 },
        translateY ? { transform: [{ translateY }] } : null,
      ]}>
      <View style={[styles.pill, { backgroundColor: c.pill, borderColor: c.border }]}>
        <BlurView
          intensity={isDark ? 40 : 36}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        {tabs.map(({ path, label, icon }) => {
          const active = pathname === path;
          const onTabPress = () => {
            Keyboard.dismiss();
            // Navegamos SIEMPRE, sin guard. Antes el `if (!active)` dependía de
            // usePathname (que puede ir un frame atrasado) y "a veces no navegaba".
            // router.replace a la ruta actual es no-op visual en expo-router, así que
            // navegar incondicionalmente es seguro y elimina la intermitencia.
            router.replace(path as any);
          };
          return (
            <TouchableOpacity
              key={path}
              style={[styles.tab, active && { backgroundColor: c.accentBg }]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              onPress={onTabPress}>
              <Ionicons name={icon} size={20} color={active ? c.accent : c.mute} />
              <Text style={[styles.label, { color: active ? c.accent : c.mute, fontWeight: active ? '700' : '500' }]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 12, right: 12, zIndex: 100, elevation: 100 },
  pill: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 8,
  },
  tab: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 20, alignItems: 'center', gap: 3 },
  label: { fontSize: 10.5, letterSpacing: -0.1 },
});
