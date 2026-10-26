import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { Animated, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

// Visibilidad del tab bar estilo Facebook: se oculta al scrollear hacia abajo,
// reaparece al jalar hacia arriba. Compartido vía contexto para que cualquier
// pantalla alimente su scroll y el BottomTabBar se traslade en consecuencia.

const HIDE_DISTANCE = 120;      // qué tan abajo viaja el pill al ocultarse
const THRESHOLD = 18;           // recorrido acumulado antes de cambiar estado
const TOP_ZONE = 24;           // px desde el tope donde la barra siempre se ve

type TabBarCtx = {
  translateY: Animated.Value;   // 0 = visible, HIDE_DISTANCE = oculto
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  reveal: () => void;
  hide: () => void;
};

const Ctx = createContext<TabBarCtx | null>(null);

export function TabBarVisibilityProvider({ children }: { children: React.ReactNode }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const lastY = useRef(0);
  const travel = useRef(0);
  const shown = useRef(true);

  const animateTo = useCallback((to: number) => {
    // useNativeDriver: false a propósito. Con el driver nativo el transform se
    // aplica solo en el hilo de UI y el área tappeable de los botones NO sigue a
    // la barra → quedaba desfasada (el primer tap caía en zona muerta y "solo
    // navegaba si tocabas primero otro lado"). Con el driver de JS el layout se
    // recalcula cada frame y los toques siguen a la barra. La distancia es corta
    // y la vista pequeña, así que no hay costo de rendimiento perceptible.
    Animated.spring(translateY, { toValue: to, useNativeDriver: false, speed: 18, bounciness: 0 }).start();
  }, [translateY]);

  const reveal = useCallback(() => {
    // Al cambiar de pestaña reseteamos el offset de referencia: la nueva
    // pantalla arranca en y=0 y no debe heredar el lastY de la anterior
    // (heredarlo producía un dy negativo enorme en el primer scroll y
    // desincronizaba la lógica).
    lastY.current = 0;
    travel.current = 0;
    if (!shown.current) { shown.current = true; animateTo(0); }
  }, [animateTo]);

  // Para hojas y tarjetas que suben desde abajo: la barra no se queda detrás.
  const hide = useCallback(() => {
    travel.current = 0;
    if (shown.current) { shown.current = false; animateTo(HIDE_DISTANCE); }
  }, [animateTo]);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;

    // Cerca del tope (incluido el rebote negativo de iOS) siempre visible,
    // sin resetear la referencia a cero en cada frame; ese reset hacía que
    // el primer evento fuera de la zona pareciera un salto grande aunque el
    // gesto hubiera sido suave.
    if (y <= TOP_ZONE) {
      travel.current = 0;
      if (!shown.current) { shown.current = true; animateTo(0); }
      return;
    }
    // Los eventos llegan cada ~16 ms y rara vez avanzan 24 pt en un solo
    // frame. Acumulamos el recorrido en la misma dirección para distinguir
    // un gesto real de los micro rebotes sin volver inerte la barra.
    if ((travel.current > 0 && dy < 0) || (travel.current < 0 && dy > 0)) travel.current = 0;
    travel.current += dy;
    if (Math.abs(travel.current) < THRESHOLD) return;

    if (travel.current > 0 && shown.current) { // scroll hacia abajo → ocultar
      shown.current = false;
      travel.current = 0;
      animateTo(HIDE_DISTANCE);
    } else if (travel.current < 0 && !shown.current) { // jala hacia arriba → mostrar
      shown.current = true;
      travel.current = 0;
      animateTo(0);
    }
  }, [animateTo]);

  const value = useMemo(() => ({ translateY, onScroll, reveal, hide }), [translateY, onScroll, reveal, hide]);
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
  return { onScroll: ctx?.onScroll, reveal: ctx?.reveal, hide: ctx?.hide };
}

// Hojas que suben desde abajo: mientras están abiertas, la navegación se esconde.
export function useHideTabBarWhile(visible: boolean) {
  const ctx = useContext(Ctx);
  const hide = ctx?.hide; const reveal = ctx?.reveal;
  useEffect(() => {
    if (!visible) return;
    hide?.();
    return () => { reveal?.(); };
  }, [visible, hide, reveal]);
}
