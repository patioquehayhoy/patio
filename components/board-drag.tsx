import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent, ScrollView } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';

// Arrastrar en el pizarrón del editor (2026-11-16, Parco): mantener presionado
// un platillo o el título de una sección y moverlo con el dedo, en lugar de
// «···» con flechas. Un platillo va a cualquier lugar (también a otra sección
// o a la carta); una sección se mueve completa. Una línea marca dónde caerá;
// cerca de la orilla de arriba o de abajo, la lista se desplaza sola.

export type BoardDragItem = { kind: 'dish'; dishId: string; sectionId: string } | { kind: 'section'; sectionId: string };
type Layout = { y: number; height: number };
type BoardSection = { id: string; platillos: { id: string }[] };
type Target = { kind: 'dish'; sectionId: string; index: number } | { kind: 'section'; index: number };

const HOLD_MS = 320;
const EDGE = 72;
const MAX_SPEED = 14;

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
    const found = locate(pageY - viewport.current.top + scrollY.current, item);
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
  const autoScroll = (pageY: number) => {
    const { top, height } = viewport.current;
    const fromTop = pageY - top;
    const fromBottom = top + height - pageY;
    speed.current = fromTop < EDGE ? -MAX_SPEED * (1 - Math.max(0, fromTop) / EDGE)
      : fromBottom < EDGE ? MAX_SPEED * (1 - Math.max(0, fromBottom) / EDGE)
      : 0;
    if (!speed.current) { stopAutoScroll(); return; }
    if (timer.current) return;
    timer.current = setInterval(() => {
      const max = Math.max(0, contentHeight.current - viewport.current.height);
      const next = Math.max(0, Math.min(max, scrollY.current + speed.current));
      if (next === scrollY.current) return;
      scrollY.current = next;
      scrollRef.current?.scrollTo({ y: next, animated: false });
      update(lastPageY.current);
    }, 16);
  };

  const begin = (item: BoardDragItem, pageY: number) => {
    const host = scrollRef.current as unknown as { measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void } | null;
    host?.measureInWindow?.((_x, y, _width, height) => { viewport.current = { top: y, height }; });
    dragRef.current = item;
    target.current = null;
    start.current = { pageY, scrollY: scrollY.current };
    lastPageY.current = pageY;
    translateY.value = 0;
    setDrag(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    update(pageY);
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
    if (!commit || !where) return;
    if (item.kind === 'dish' && where.kind === 'dish') moveDishRef.current(item.dishId, where.sectionId, where.index);
    if (item.kind === 'section' && where.kind === 'section') moveSectionRef.current(item.sectionId, where.index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };
  useEffect(() => () => stopAutoScroll(), []);

  /**
   * Gesto para un platillo o una sección: mantener presionado y mover. Con
   * `onTap`, un toque corto hace lo de siempre (editar el nombre).
   */
  const gestureFor = (item: BoardDragItem, onTap?: () => void) => {
    const pan = Gesture.Pan()
      .activateAfterLongPress(HOLD_MS)
      .runOnJS(true)
      .onStart((event) => begin(item, event.absoluteY))
      .onUpdate((event) => move(event.absoluteY))
      .onEnd(() => finish(true))
      .onFinalize(() => finish(false));
    if (!onTap) return pan;
    const tap = Gesture.Tap()
      .maxDuration(HOLD_MS)
      .runOnJS(true)
      .onEnd((_event, success) => { if (success) onTap(); });
    return Gesture.Race(pan, tap);
  };

  return { drag, lineY, dragStyle, gestureFor, onScroll, onSectionLayout, onHeaderLayout, onDishLayout };
}
