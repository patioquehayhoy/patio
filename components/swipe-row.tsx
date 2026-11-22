import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View, type LayoutChangeEvent, type ScrollView, type StyleProp, type ViewStyle } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import ReAnimated, { Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

// Acciones al deslizar, como las listas de iOS (Recordatorios, Mail), al pie
// de la letra (2026-11-16):
// - Se desliza la fila completa, con su fondo, y las acciones aparecen
//   detrás, a la derecha, a todo lo alto. No se desliza solo el texto.
// - Los botones están quietos detrás de la fila y la fila los destapa, como
//   una cortina: las palabras nunca se mueven ni se estiran («no bailan»).
//   Cada botón mide lo que su palabra (mínimo 76, como iOS), así «Eliminar»
//   nunca se corta.
// - Al soltar, se abre o se cierra; nunca se queda a medias. Pasada la mitad
//   (o con un jalón rápido) se queda abierta; si no, se cierra.
// - Una sola fila abierta a la vez: tocar otra fila, tocar fuera, desplazar
//   la lista o empezar a arrastrar la cierra. Tocar la fila abierta solo la
//   cierra (no hace lo de la fila).
// - Con `fullSwipe`, deslizar hasta el fondo hace la última acción (Eliminar)
//   con un golpecito al pasar el punto, y la fila se va.
// - Mantener presionado (el arrastre que llega en `drag`) compite con
//   deslizar: el primero que empieza gana (`Gesture.Race`).
//
// Regla del arrastre (components/board-drag.tsx): todo en el camino del dedo
// lleva `collapsable={false}`; si no, iOS cancela el toque al cambiar estilos.

export type SwipeAction = { label: string; color: string; onPress: () => void; accessibilityLabel?: string };

// Ancho de cada botón: su palabra y aire a los lados (mínimo el de iOS).
const actionWidth = (label: string) => Math.max(76, Math.round(label.length * 9.5 + 32));
const FULL_SWIPE = 0.55;
// Abrir y cerrar como iOS: un resorte sin rebote que sigue con la velocidad
// del dedo (WWDC23, «Animate with springs»). Con Reducir movimiento, un
// cambio corto sin resorte (HIG: «tightening animation springs»).
const SNAP_MS = 350;
const SPRING = { duration: SNAP_MS, dampingRatio: 1 };
const QUICK = { duration: 120, easing: Easing.out(Easing.cubic) };
// Eliminar: la fila sale completa hacia la izquierda.
const OUT = { duration: 200, easing: Easing.out(Easing.cubic) };

// La fila abierta (solo una): se cierra cuando se toca cualquier otra cosa.
type OpenRow = { id: number; close: () => void; rect: { x: number; y: number; width: number; height: number } | null };
let openRow: OpenRow | null = null;
let nextId = 1;
/** Cierra la fila abierta (al desplazar la lista, al arrastrar algo…). */
export function closeOpenSwipeRow(except?: number) {
  if (!openRow || openRow.id === except) return;
  const row = openRow;
  openRow = null;
  row.close();
}
/** Un toque en la lista fuera de la fila abierta la cierra (como en iOS). */
export function closeSwipeRowOnTouch(pageX: number, pageY: number) {
  const rect = openRow?.rect;
  if (!openRow || !rect) return;
  const inside = pageX >= rect.x && pageX <= rect.x + rect.width && pageY >= rect.y && pageY <= rect.y + rect.height;
  if (!inside) closeOpenSwipeRow();
}

export function SwipeRow({ children, drag, enabled, actions, fullSwipe = false, background, scrollRef, style, outerStyle, onLayout, rowRef }: {
  children: ReactNode;
  /** El arrastre para mover (mantener presionado), si lo hay. */
  drag?: GestureType;
  enabled: boolean;
  /** De izquierda a derecha; la última es la de deslizar hasta el fondo. */
  actions: SwipeAction[];
  fullSwipe?: boolean;
  /** El fondo de la fila, en capas (p. ej. el lienzo y encima la tarjeta), para que se deslice completa. */
  background: [string, string?];
  /** La lista: espera a que deslizar falle antes de desplazarse. */
  scrollRef?: React.RefObject<ScrollView | null>;
  style?: StyleProp<ViewStyle>;
  /** El contenedor: p. ej. a todo lo ancho de la pantalla para que las acciones lleguen a la orilla. */
  outerStyle?: StyleProp<ViewStyle>;
  onLayout?: (event: LayoutChangeEvent) => void;
  rowRef?: (view: View | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const id = useRef(0);
  if (!id.current) id.current = nextId++;
  const outer = useRef<View | null>(null);
  const x = useSharedValue(0);
  const start = useSharedValue(0);
  const width = useSharedValue(0);
  const armed = useSharedValue(false);
  const [isOpen, setIsOpen] = useState(false);
  const actionsRef = useRef(actions);
  actionsRef.current = actions;
  const widths = actions.map((action) => actionWidth(action.label));
  const total = widths.reduce((sum, item) => sum + item, 0);
  // Lo que se destapa más allá de los botones toma el color del botón que se
  // estira: el de hasta el fondo (Eliminar) o el primero (como iOS).
  const fill = (fullSwipe ? actions[actions.length - 1] : actions[0])?.color;

  const close = () => {
    x.value = reduceMotion ? withTiming(0, QUICK) : withSpring(0, SPRING);
    if (openRow?.id === id.current) openRow = null;
    setIsOpen(false);
  };
  const closeRef = useRef(close);
  closeRef.current = close;
  // Quedó abierta o cerrada: se anota como la única abierta (y se mide, para
  // saber si un toque cae fuera).
  const settle = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      if (openRow?.id === id.current) openRow = null;
      return;
    }
    closeOpenSwipeRow(id.current);
    const row: OpenRow = { id: id.current, close: () => closeRef.current(), rect: null };
    openRow = row;
    outer.current?.measureInWindow((rx, ry, rw, rh) => { row.rect = { x: rx, y: ry, width: rw, height: rh }; });
  };
  // Tocar esta fila cierra la que esté abierta en otro lado.
  const touched = () => closeOpenSwipeRow(id.current);
  const tick = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); };
  // Hacer una acción: la de hasta el fondo saca la fila; las demás la cierran primero.
  const run = (index: number, slideOut: boolean) => {
    const action = actionsRef.current[index];
    if (!action) return;
    if (openRow?.id === id.current) openRow = null;
    setIsOpen(false);
    if (slideOut) {
      action.onPress();
      // Si la fila sigue aquí (la acción no se pudo, p. ej. la única sección
      // de hoy), regresa: nunca se queda empujada.
      setTimeout(() => { if (mounted.current) x.value = reduceMotion ? withTiming(0, QUICK) : withSpring(0, SPRING); }, 260);
      return;
    }
    x.value = reduceMotion ? withTiming(0, QUICK) : withSpring(0, SPRING);
    action.onPress();
  };
  const slideOutAndRun = (index: number) => {
    x.value = withTiming(-width.value, OUT, (finished) => {
      if (finished) runOnJS(run)(index, true);
    });
  };

  // Escribiendo no se desliza: si se apaga, se cierra. Al irse, deja de estar abierta.
  useEffect(() => { if (!enabled) closeRef.current(); }, [enabled]);
  const mounted = useRef(true);
  useEffect(() => () => {
    mounted.current = false;
    if (openRow?.id === id.current) openRow = null;
  }, []);

  const last = actions.length - 1;
  // El gesto se crea una vez (rapidez al escribir: rehacerlo en cada letra lo
  // volvía a mandar al hilo de la interfaz). Lo que hace en cada momento lo
  // lee de `live`; prenderlo o apagarlo cambia su configuración en su lugar.
  const live = useRef({ touched, tick, run, settle });
  live.current = { touched, tick, run, settle };
  const onTouched = useRef(() => live.current.touched()).current;
  const onTick = useRef(() => live.current.tick()).current;
  const onRun = useRef((index: number, slideOut: boolean) => live.current.run(index, slideOut)).current;
  const onSettle = useRef((open: boolean) => live.current.settle(open)).current;
  const reduce = reduceMotion;
  const swipe = useMemo(() => {
    const pan = Gesture.Pan()
    .activeOffsetX([-14, 14])
    .failOffsetY([-10, 10])
    .onBegin(() => { runOnJS(onTouched)(); })
    .onStart(() => { start.value = x.value; armed.value = false; })
    .onUpdate((event) => {
      let next = Math.min(0, start.value + event.translationX);
      if (fullSwipe) {
        next = Math.max(-width.value, next);
        const past = -next > width.value * FULL_SWIPE;
        if (past !== armed.value) { armed.value = past; runOnJS(onTick)(); }
      } else if (-next > total) {
        // Más allá de los botones, resiste (como iOS).
        next = -(total + (-next - total) * 0.3);
      }
      x.value = next;
    })
    .onEnd((event) => {
      const open = -x.value;
      if (fullSwipe && armed.value) {
        x.value = withTiming(-width.value, OUT, (finished) => { if (finished) runOnJS(onRun)(last, true); });
        return;
      }
      const stays = event.velocityX < -500 || (open > total / 2 && event.velocityX < 500);
      x.value = reduce ? withTiming(stays ? -total : 0, QUICK) : withSpring(stays ? -total : 0, { ...SPRING, velocity: event.velocityX });
      runOnJS(onSettle)(stays);
    });
    return scrollRef ? pan.blocksExternalGesture(scrollRef as unknown as Parameters<typeof pan.blocksExternalGesture>[0]) : pan;
  }, [fullSwipe, total, last, scrollRef, reduce, x, start, width, armed, onTouched, onTick, onRun, onSettle]);
  swipe.enabled(enabled);
  const gesture = useMemo(() => (drag ? Gesture.Race(drag, swipe) : swipe), [drag, swipe]);

  const content = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  // Detrás de la fila, quietas a la derecha; solo crece el color si se
  // desliza más allá de los botones. Solo existen mientras la fila está
  // desplazada: en reposo, al levantarla para moverla (su lugar se encoge y
  // se vuelve invisible) o mientras los demás se recorren, nada asoma detrás.
  const reveal = useAnimatedStyle(() => ({ width: Math.max(total, -x.value), opacity: x.value < -0.5 ? 1 : 0 }));

  return (
    <View
      ref={(view) => { outer.current = view; rowRef?.(view); }}
      collapsable={false}
      style={outerStyle}
      onLayout={(event) => { width.value = event.nativeEvent.layout.width; onLayout?.(event); }}>
      <ReAnimated.View
        style={[styles.reveal, { backgroundColor: fill }, reveal]}
        accessibilityElementsHidden={!isOpen}
        importantForAccessibility={isOpen ? 'auto' : 'no-hide-descendants'}>
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.label}
            style={[styles.action, { width: widths[index], backgroundColor: action.color }]}
            onPress={() => (fullSwipe && index === last ? slideOutAndRun(index) : run(index, false))}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={action.accessibilityLabel ?? action.label}>
            <Text style={styles.actionText} numberOfLines={1} maxFontSizeMultiplier={1.2}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ReAnimated.View>
      <GestureDetector gesture={gesture}>
        <ReAnimated.View collapsable={false} style={[style, { backgroundColor: background[0] }, content]}>
          {/* La fila se desliza con su fondo: el lienzo y, encima, el de la tarjeta. */}
          {!!background[1] && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: background[1] }]} />}
          {children}
          {/* Abierta, tocarla solo la cierra. */}
          {isOpen && (
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeRef.current()} accessibilityRole="button" accessibilityLabel="Cerrar acciones" />
          )}
        </ReAnimated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  reveal: { position: 'absolute', top: 0, bottom: 0, right: 0, flexDirection: 'row', justifyContent: 'flex-end' },
  // A todo lo alto de la fila, la palabra al centro.
  action: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
