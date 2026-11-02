import { router, usePathname } from 'expo-router';
import { BlurView } from 'expo-blur';
import { BottomContentFade } from '@/components/bottom-content-fade';
import { NewMenuSheet } from '@/components/new-menu-sheet';
import { Animated, Image, Keyboard, StyleSheet, Text, TouchableOpacity, View, type ImageSourcePropType } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';

import { hasUnseenActivity, hasUnseenFoodieActivity } from '@/lib/activity-feed';
import { getFonditaId } from '@/lib/menu-store';
import { useTheme, type Theme } from '@/lib/theme';
import { useTabBarTranslate } from '@/lib/tab-bar-visibility';
import { BOTTOM_TAB_HEIGHT, bottomTabOffset } from '@/lib/layout-metrics';
import { floatingSurfaceShadow } from '@/lib/surface-styles';

// Destinos raíz por tarea, con la Ley de Jakob (Nielsen): inicio a la
// izquierda, Perfil a la derecha y la acción de crear al centro, como en las
// apps que la gente ya usa. «+» abre el sheet de nuevo menú; no es una ruta.

type Tab = {
  path: string; // '+' = crear menú
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  selectedIcon: keyof typeof Ionicons.glyphMap;
  /** Ícono propio (PNG teñible) en lugar de Ionicons. */
  image?: { off: ImageSourcePropType; on: ImageSourcePropType };
};

// Mi Patio: puestito con piso, a propósito ambiguo entre puesto y local.
// Fuente en assets/icons/mi-patio*.svg (retícula de Ionicons, trazo 32).
const MI_PATIO_IMAGE = {
  off: require('../assets/icons/mi-patio.png'),
  on: require('../assets/icons/mi-patio-filled.png'),
};

const FOODIE_TABS: Tab[] = [
  { path: '/explorar',  label: 'Mapa',      icon: 'map-outline',      selectedIcon: 'map' },
  { path: '/favoritos', label: 'Guardados', icon: 'bookmark-outline', selectedIcon: 'bookmark' },
  { path: '/cuenta',    label: 'Perfil',    icon: 'person-outline',   selectedIcon: 'person' },
];

const FONDERO_TABS: Tab[] = [
  { path: '/historial', label: 'Menús',     icon: 'book-outline', selectedIcon: 'book' },
  { path: '/resenas',   label: 'Actividad', icon: 'heart-outline',      selectedIcon: 'heart' },
  { path: '+',          label: 'Publicar', icon: 'add-circle-outline', selectedIcon: 'add-circle' },
  { path: '/mi-patio',  label: 'Mi Patio',  icon: 'storefront-outline', selectedIcon: 'storefront', image: MI_PATIO_IMAGE },
  { path: '/perfil',    label: 'Perfil',    icon: 'person-outline',     selectedIcon: 'person' },
];

export function BottomTabBar({ variant = 'fondero', fade = true }: { variant?: 'foodie' | 'fondero'; fade?: boolean } = {}) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { translateY, reveal } = useTabBarTranslate();
  useEffect(() => {
    reveal();
  }, [pathname, reveal]);

  // Punto de "hay algo nuevo" en Actividad — no hay push todavía (ver
  // docs/TASKS.md), así que esto es lo único que avisa sin tener que entrar
  // a revisar. Se recalcula cada vez que se aterriza en cualquier pantalla
  // Fondero; se limpia cuando resenas.tsx marca la visita (markActivitySeen).
  const [hasUnseen, setHasUnseen] = useState(false);
  const [newMenuVisible, setNewMenuVisible] = useState(false);
  useEffect(() => {
    if (variant === 'fondero') {
      hasUnseenActivity(getFonditaId()).then(setHasUnseen).catch(() => {});
    } else {
      hasUnseenFoodieActivity().then(setHasUnseen).catch(() => {});
    }
  }, [variant, pathname]);
  // El COLOR de la barra sigue el tema real de la app (claro/oscuro), no el rol.
  // Antes usaba `variant === 'fondero'` → en modo oscuro + pantalla Foodie la barra
  // salía blanca. `variant` ahora SOLO decide qué tabs se muestran.
  const isDark = theme.isDark;
  const tabs = variant === 'foodie' ? FOODIE_TABS : FONDERO_TABS;
  return (
    <Animated.View pointerEvents="box-none" style={[styles.wrap, { bottom: bottomTabOffset(insets.bottom) }, translateY ? { transform: [{ translateY }] } : null]}>
      {/* Desvanece listas que pasan bajo la barra. Sobre el mapa no va: el mapa
          llega hasta el borde, como en Apple Maps. */}
      {fade && <BottomContentFade height={BOTTOM_TAB_HEIGHT + bottomTabOffset(insets.bottom) + 16} bottom={-bottomTabOffset(insets.bottom)} />}
      <View style={styles.pill} accessibilityRole="tablist">
        <BlurView
          intensity={isDark ? 16 : 20}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {tabs.map(({ path, label, icon, selectedIcon, image }) => {
          const active = pathname === path || (variant === 'foodie' && path === '/cuenta' && pathname === '/notificaciones');
          const hasNews = hasUnseen && !active && (
            (variant === 'fondero' && path === '/resenas') ||
            (variant === 'foodie' && path === '/cuenta')
          );
          const onTabPress = () => {
            Keyboard.dismiss();
            if (path === '+') { setNewMenuVisible(true); return; }
            // Reemplazar la ruta activa puede remontar la pantalla en Expo Router
            // y reiniciar scroll, búsqueda y controles locales. Un segundo toque
            // sobre el tab seleccionado conserva exactamente el estado visible.
            if (active) return;
            reveal();
            router.replace(path as any);
          };
          return (
            <TouchableOpacity
              key={path}
              accessibilityRole={path === '+' ? 'button' : 'tab'}
              accessibilityLabel={path === '+' ? 'Publicar menú' : label}
              accessibilityState={path === '+' ? undefined : { selected: active }}
              accessibilityValue={hasNews ? { text: 'Novedades' } : undefined}
              style={styles.tab}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 0, right: 0 }}
              onPress={onTabPress}>
              <View style={styles.icon} pointerEvents="none">
                {image
                  ? <Image source={active ? image.on : image.off} style={[styles.image, { tintColor: active ? theme.accent : theme.textSecondary }]} />
                  : <Ionicons name={active ? selectedIcon : icon} size={path === '+' ? 24 : 22} color={active ? theme.accent : theme.textSecondary} />}
                {hasNews && <View style={styles.dot} />}
              </View>
              <Text style={[styles.label, { color: active ? theme.accent : theme.textSecondary }]} numberOfLines={1} maxFontSizeMultiplier={1.15}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {variant === 'fondero' && <NewMenuSheet visible={newMenuVisible} onClose={() => setNewMenuVisible(false)} />}
    </Animated.View>
  );
}

const makeStyles = (t: Theme) => StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  pill: {
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 28,
    height: BOTTOM_TAB_HEIGHT,
    backgroundColor: t.glass,
    borderColor: t.isDark ? t.border : 'rgba(255,255,255,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    ...floatingSurfaceShadow(t.isDark),
  },
  tab: {
    width: 58,
    height: 48,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  icon: { width: 28, height: 24, alignItems: 'center', justifyContent: 'center' },
  image: { width: 22, height: 22 },
  label: { fontSize: 10, lineHeight: 12, fontWeight: '700' },
  dot: { position: 'absolute', top: -1, right: -2, width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent, borderColor: t.surface, borderWidth: StyleSheet.hairlineWidth },
});
