import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Ordenar el menú (2026-11-16, noche; Jev: 61 % prefiere un modo «Ordenar»):
// en el modo Ordenar no se escribe, así que arrastrar ya no pelea con el texto.
// Se arrastra desde la manija (≡), al instante, o desde cualquier parte del
// renglón con un toque sostenido corto (así deslizar sigue desplazando la
// lista). Un platillo va a cualquier lugar (también a otra sección o a la
// carta); una sección se mueve completa. Una línea marca dónde caerá; cerca de
// la orilla de arriba o de abajo, la lista se desplaza sola.
//
// Como las listas de iOS en modo Edición (HIG, Lists and tables): botón rojo a
// la izquierda, manija a la derecha.
//
// Quién gana el dedo: la lista es el ScrollView de gesture-handler y cada
// arrastre lo bloquea (`blocksExternalGesture`): la lista espera a que el
// arrastre falle antes de desplazarse. En la manija el arrastre empieza al
// primer movimiento, así que la lista nunca se lo gana; en el renglón espera
// un toque sostenido corto y, si el dedo se mueve antes, falla y la lista se
// desplaza. Sin esa relación, la lista empezaba a desplazarse y cancelaba el
// arrastre (por eso «no servía»).

export type BoardDragItem = { kind: 'dish'; dishId: string; sectionId: string } | { kind: 'section'; sectionId: string };
type Layout = { y: number; height: number };
type BoardSection = { id: string; platillos: { id: string }[] };
type Target = { kind: 'dish'; sectionId: string; index: number } | { kind: 'section'; index: number };

const EDGE = 72;
// Toque sostenido para levantar un renglón desde cualquier parte.
const ROW_HOLD_MS = 180;
const MAX_SPEED = 14;
// Rastro en Metro (solo en desarrollo) para revisar un arrastre que no cae.
const trace = (...args: unknown[]) => { if (__DEV__) console.log('[ordenar]', ...args); };

export function useBoardDrag({ sections, scrollRef, onMoveDish, onMoveSection }: {
  /** En el orden del menú. */
  sections: BoardSection[];
  scrollRef: React.RefObject<ScrollView | null>;
  onMoveDish: (dishId: string, toSectionId: string, toIndex: number) => void;
  onMoveSection: (sectionId: string, toIndex: number) => void;
}) {
  const sectionLayouts = useRef(new Map<string, Layout>());
  const headerLayouts = useRef(new Map<string, Layout>());
  const dishLayouts = useRef(new Map<string, Layout>());
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  const moveDishRef = useRef(onMoveDish);
  moveDishRef.current = onMoveDish;
  const moveSectionRef = useRef(onMoveSection);
  moveSectionRef.current = onMoveSection;

  const scrollY = useRef(0);
  const contentHeight = useRef(0);
  const viewport = useRef({ top: 0, height: 0 });
  const start = useRef({ pageY: 0, scrollY: 0 });
  const lastPageY = useRef(0);
  const dragRef = useRef<BoardDragItem | null>(null);
  const target = useRef<Target | null>(null);
  const speed = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [drag, setDrag] = useState<BoardDragItem | null>(null);
  const [lineY, setLineY] = useState<number | null>(null);
  const translateY = useSharedValue(0);
  const dragStyle = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }, { scale: 1.02 }] }));

  const onSectionLayout = useCallback((id: string) => (event: LayoutChangeEvent) => {
    sectionLayouts.current.set(id, { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height });
  }, []);
  const onHeaderLayout = useCallback((id: string) => (event: LayoutChangeEvent) => {
    headerLayouts.current.set(id, { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height });
  }, []);
  const onDishLayout = useCallback((id: string) => (event: LayoutChangeEvent) => {
    dishLayouts.current.set(id, { y: event.nativeEvent.layout.y, height: event.nativeEvent.layout.height });
  }, []);
  // Dónde está la lista en la pantalla: se mide al acomodarse y al empezar cada
  // arrastre (el teclado o la barra de secciones pudieron moverla).
  const measureViewport = useCallback((then?: () => void) => {
    const host = scrollRef.current as unknown as { measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void } | null;
    if (!host?.measureInWindow) { then?.(); return; }
    host.measureInWindow((_x, y, _width, height) => {
      if (height) viewport.current = { top: y, height };
      then?.();
    });
  }, [scrollRef]);
  const onViewportLayout = useCallback(() => { measureViewport(); }, [measureViewport]);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    contentHeight.current = event.nativeEvent.contentSize.height;
  }, []);

  // Dónde caería lo que se arrastra, con el dedo en `y` (coordenadas del contenido).
  const locate = (y: number, item: BoardDragItem): { target: Target; line: number } | null => {
    const list = sectionsRef.current;
    if (item.kind === 'section') {
      const others = list.filter((section) => section.id !== item.sectionId);
      let index = 0;
      for (const section of others) {
        const layout = sectionLayouts.current.get(section.id);
        if (layout && layout.y + layout.height / 2 < y) index++;
      }
      const at = sectionLayouts.current.get(others[index]?.id ?? '');
      const last = sectionLayouts.current.get(others[others.length - 1]?.id ?? '');
      const line = at ? at.y : last ? last.y + last.height : null;
      return line == null ? null : { target: { kind: 'section', index }, line };
    }
    let current = list[0];
    for (const section of list) {
      const layout = sectionLayouts.current.get(section.id);
      if (layout && layout.y <= y) current = section;
    }
    const sectionLayout = current && sectionLayouts.current.get(current.id);
    if (!current || !sectionLayout) return null;
    const dishes = current.platillos.filter((dish) => dish.id !== item.dishId);
    let index = 0;
    for (const dish of dishes) {
      const layout = dishLayouts.current.get(dish.id);
      if (layout && sectionLayout.y + layout.y + layout.height / 2 < y) index++;
    }
    const at = dishLayouts.current.get(dishes[index]?.id ?? '');
    const last = dishLayouts.current.get(dishes[dishes.length - 1]?.id ?? '');
    const header = headerLayouts.current.get(current.id);
    const line = at
      ? sectionLayout.y + at.y
      : last
        ? sectionLayout.y + last.y + last.height
        : sectionLayout.y + (header ? header.y + header.height : 0);
    return { target: { kind: 'dish', sectionId: current.id, index }, line };
  };
  const same = (a: Target | null, b: Target | null) => JSON.stringify(a) === JSON.stringify(b);
  const update = (pageY: number) => {
    const item = dragRef.current;
    if (!item) return;
    translateY.value = pageY - start.current.pageY + (scrollY.current - start.current.scrollY);
    const found = locate(pageY - viewportNow().top + scrollY.current, item);
    if (!found) return;
    if (!same(found.target, target.current)) {
      if (target.current) Haptics.selectionAsync().catch(() => {});
      target.current = found.target;
    }
    setLineY(found.line);
  };
  const stopAutoScroll = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    speed.current = 0;
  };
  // Si aún no se midió, la lista ocupa la pantalla: nunca se deja de marcar.
  const viewportNow = () => (viewport.current.height ? viewport.current : { top: 0, height: Dimensions.get('window').height });
  const autoScroll = (pageY: number) => {
    const { top, height } = viewportNow();
    const fromTop = pageY - top;
    const fromBottom = top + height - pageY;
    speed.current = fromTop < EDGE ? -MAX_SPEED * (1 - Math.max(0, fromTop) / EDGE)
      : fromBottom < EDGE ? MAX_SPEED * (1 - Math.max(0, fromBottom) / EDGE)
      : 0;
    if (!speed.current) { stopAutoScroll(); return; }
    if (timer.current) return;
    timer.current = setInterval(() => {
      const max = Math.max(0, contentHeight.current - viewportNow().height);
      const next = Math.max(0, Math.min(max, scrollY.current + speed.current));
      if (next === scrollY.current) return;
      scrollY.current = next;
      scrollRef.current?.scrollTo({ y: next, animated: false });
      update(lastPageY.current);
    }, 16);
  };

  const begin = (item: BoardDragItem, pageY: number) => {
    dragRef.current = item;
    target.current = null;
    start.current = { pageY, scrollY: scrollY.current };
    lastPageY.current = pageY;
    translateY.value = 0;
    setDrag(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    trace('levanta', item.kind, item.kind === 'dish' ? item.dishId : item.sectionId, { secciones: sectionLayouts.current.size, platillos: dishLayouts.current.size });
    update(pageY);
    measureViewport(() => { trace('lista', viewport.current); if (dragRef.current) update(lastPageY.current); });
  };
  const move = (pageY: number) => {
    lastPageY.current = pageY;
    update(pageY);
    autoScroll(pageY);
  };
  const finish = (commit: boolean) => {
    stopAutoScroll();
    const item = dragRef.current;
    const where = target.current;
    dragRef.current = null;
    target.current = null;
    if (!item) return;
    translateY.value = 0;
    setDrag(null);
    setLineY(null);
    trace(commit ? 'suelta' : 'cancela', where ?? 'sin lugar');
    if (!commit || !where) return;
    if (item.kind === 'dish' && where.kind === 'dish') moveDishRef.current(item.dishId, where.sectionId, where.index);
    if (item.kind === 'section' && where.kind === 'section') moveSectionRef.current(item.sectionId, where.index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  useEffect(() => () => stopAutoScroll(), []);

  const dragFrom = (item: BoardDragItem, pan: ReturnType<typeof Gesture.Pan>) => pan
    // La lista no se desplaza mientras este arrastre pueda empezar.
    .blocksExternalGesture(scrollRef as unknown as Parameters<typeof pan.blocksExternalGesture>[0])
    .runOnJS(true)
    .onStart((event) => begin(item, event.absoluteY))
    .onUpdate((event) => move(event.absoluteY))
    .onEnd(() => finish(true))
    .onFinalize(() => finish(false));
  /** La manija (≡) de un platillo o una sección: el renglón sigue al dedo, sin esperar. */
  const handleFor = (item: BoardDragItem) => dragFrom(item, Gesture.Pan().minDistance(0));
  /** Todo el renglón: un toque sostenido corto lo levanta; deslizar desplaza la lista. */
  const rowFor = (item: BoardDragItem) => dragFrom(item, Gesture.Pan().activateAfterLongPress(ROW_HOLD_MS));

  return { drag, lineY, dragStyle, handleFor, rowFor, onScroll, onViewportLayout, onSectionLayout, onHeaderLayout, onDishLayout };
}
