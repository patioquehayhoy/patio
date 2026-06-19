import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { Animated, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

// Visibilidad del tab bar estilo Facebook: se oculta al scrollear hacia abajo,
// reaparece al jalar hacia arriba. Compartido vía contexto para que cualquier
// pantalla alimente su scroll y el BottomTabBar se traslade en consecuencia.

const HIDE_DISTANCE = 120;      // qué tan abajo viaja el pill al ocultarse
const THRESHOLD = 8;            // px de scroll para considerar un gesto (anti-jitter)

type TabBarCtx = {
  translateY: Animated.Value;   // 0 = visible, HIDE_DISTANCE = oculto
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  reveal: () => void;
};

const Ctx = createContext<TabBarCtx | null>(null);

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const shown = useRef(true);

  const animateTo = useCallback((to: number) => {
    Animated.spring(translateY, { toValue: to, useNativeDriver: true, speed: 18, bounciness: 0 }).start();
  }, [translateY]);

  const reveal = useCallback(() => {
    if (!shown.current) { shown.current = true; animateTo(0); }
  }, [animateTo]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;

    // Cerca del tope: siempre visible.
    if (y <= 4) { reveal(); return; }
    if (Math.abs(dy) < THRESHOLD) return;

    if (dy > 0 && shown.current) {            // scroll hacia abajo → ocultar
      shown.current = false;
      animateTo(HIDE_DISTANCE);
    } else if (dy < 0 && !shown.current) {    // jala hacia arriba → mostrar
      shown.current = true;
      animateTo(0);
    }
  }, [animateTo, reveal]);

  const value = useMemo(() => ({ translateY, onScroll, reveal }), [translateY, onScroll, reveal]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Para el BottomTabBar: el translateY a aplicar + reveal() para mostrarlo de
// nuevo al cambiar de pestaña. Si no hay provider, queda fijo.
export function useTabBarTranslate(): { translateY: Animated.Value | null; reveal: () => void } {
  const ctx = useContext(Ctx);
  return { translateY: ctx?.translateY ?? null, reveal: ctx?.reveal ?? (() => {}) };
}

// Para las pantallas con scroll: { onScroll } para pasar al ScrollView/FlatList.
// scrollEventThrottle=16 recomendado en el ScrollView.
export function useTabBarScroll() {
  const ctx = useContext(Ctx);
  return { onScroll: ctx?.onScroll, reveal: ctx?.reveal };
}
