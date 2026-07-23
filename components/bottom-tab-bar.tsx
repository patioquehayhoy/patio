import { router, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Animated, Keyboard, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useTabBarTranslate } from '@/lib/tab-bar-visibility';
import { useTheme } from '@/lib/theme';

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
  // Corazón: guardar SIEMPRE es corazón en toda la app (pin del mapa, ficha,
  // guardados) — un solo símbolo para un solo concepto.
  { path: '/favoritos', label: 'Guardados', icon: 'heart-outline' },
  { path: '/cuenta',    label: 'Yo',        icon: 'person-outline' },
];

const FONDERO_TABS: Tab[] = [
  { path: '/menu',      label: 'Hoy',       icon: 'sparkles-outline' },
  { path: '/historial', label: 'Historial', icon: 'receipt-outline' },
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
  const { theme } = useTheme();
  // Al scrollear hacia abajo la barra se ENCOGE (estilo liquid glass): baja un
  // poco, se hace chica y pierde presencia, pero sigue visible y tocable. Al
  // jalar hacia arriba recupera tamaño. El provider vive en el root; las
  // pantallas con scroll alimentan onScroll de useTabBarScroll. El driver va
  // de 0 (reposo) a 120 (scrolleando) y aquí se mapea a escala/desplazamiento.
  const { translateY, reveal } = useTabBarTranslate();
  const shrink = translateY
    ? {
        opacity: translateY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.88] }),
        transform: [
          { translateY: translateY.interpolate({ inputRange: [0, 120], outputRange: [0, 12] }) },
          { scale: translateY.interpolate({ inputRange: [0, 120], outputRange: [1, 0.82] }) },
        ],
      }
    : null;
  // El COLOR de la barra sigue el tema real de la app (claro/oscuro), no el rol.
  // Antes usaba `variant === 'fondero'` → en modo oscuro + pantalla Foodie la barra
  // salía blanca. `variant` ahora SOLO decide qué tabs se muestran.
  const isDark = theme.isDark;
  const c = isDark ? DARK : LIGHT;
  const tabs = variant === 'foodie' ? FOODIE_TABS : FONDERO_TABS;
  return (
    <Animated.View
      style={[
        styles.wrap,
        { bottom: (insets.bottom || 10) + 4 },
        shrink,
      ]}>
      {__DEV__ && <Text style={[styles.version, { color: c.mute }]}>DEV</Text>}
      <View style={[styles.pill, { backgroundColor: c.pill, borderColor: c.border }]}>
        <BlurView
          intensity={isDark ? 40 : 36}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {tabs.map(({ path, label, icon }) => {
          const active = pathname === path;
          const onTabPress = () => {
            Keyboard.dismiss();
            // La nueva pantalla arranca en y=0: la barra debe verse y resetear
            // su referencia de scroll.
            reveal();
            // Navegamos SIEMPRE, sin guard. Antes el `if (!active)` dependía de
            // usePathname (que puede ir un frame atrasado) y "a veces no navegaba".
            // router.replace a la ruta actual es no-op visual en expo-router, así que
            // navegar incondicionalmente es seguro y elimina la intermitencia.
            router.replace(path as any);
          };
          return (
            <TouchableOpacity
              key={path}
              accessibilityLabel={label}
              style={[styles.tab, active && { backgroundColor: c.accentBg }]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              onPress={onTabPress}>
              <Ionicons name={icon} size={25} color={active ? c.accent : c.mute} />
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100, elevation: 100 },
  version: { marginBottom: 5, textAlign: 'center', fontSize: 9, fontWeight: '700', letterSpacing: 0.6 },
  pill: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 30,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 8,
  },
  tab: { width: 54, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
});
