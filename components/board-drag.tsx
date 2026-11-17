import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Dimensions, LayoutAnimation, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// Ordenar el menú como una lista de iOS en modo edición (HIG, «Lists and
// tables»; 2026-11-16, segunda vuelta). En Ordenar no se escribe, así que
// arrastrar no pelea con el texto: desde la manija (≡), al instante, o desde
// cualquier parte del renglón con un toque sostenido corto (deslizar sigue
// desplazando la lista). Un platillo va a cualquier lugar (también a otra
// sección o a la carta); una sección se mueve completa.
//
// Cómo se ve, igual que en iOS:
// - Lo que levantas sube un poco y sigue al dedo (`ghostStyle`: una copia
//   encima de la lista).
// - Los demás se recorren para abrirle lugar donde caería: el lugar de donde
//   salió se cierra y el hueco se abre en el nuevo. Sin línea de «aquí cae».
// - Al soltar, la copia se asienta en el hueco y el menú cambia de una vez.
//
// Para que el hueco no brinque de ida y vuelta: todo se mide al levantar
// (`slots`, cada lugar posible con el renglón ya fuera de la lista) y se elige
// el lugar cuya orilla de arriba queda más cerca de la de lo que arrastras.
//
// Nada se desmonta ni se cambia de lugar mientras arrastras: el renglón
// original sigue montado (invisible, y encogido cuando el hueco está en otro
// lado) porque su gesto vive en él. Los huecos son vistas siempre montadas
// que solo cambian de alto; al soltar, el menú y los huecos cambian en el
// mismo instante.
//
// LA REGLA (la que hacía que «al segundo se reseteara»): en el camino del
// dedo a la lista, ninguna vista puede pasar de «aplanada» a no aplanada a
// medio arrastre. React Native no le da vista propia a un View sin color ni
// efectos y cuelga a sus hijos más arriba; en cuanto ese View recibe
// opacidad, transform, zIndex o recorte, crea su vista y saca y vuelve a
// meter a sus hijos, y iOS cancela el toque de lo que tenías bajo el dedo.
// Por eso el renglón, su envoltorio, la tarjeta y la sección llevan
// `collapsable={false}` desde el principio (components/menu-composer.tsx).
//
// Quién gana el dedo: la lista es el ScrollView de gesture-handler y cada
// arrastre lo bloquea (`blocksExternalGesture`): la lista espera a que el
// arrastre falle antes de desplazarse. En la manija el arrastre empieza al
// primer movimiento, así que la lista nunca se lo gana; en el renglón espera
// un toque sostenido corto y, si el dedo se mueve antes, falla y la lista se
// desplaza. Sin esa relación, la lista empezaba a desplazarse y cancelaba el
// arrastre (no quitarla).

export type BoardDragItem = { kind: 'dish'; dishId: string; sectionId: string } | { kind: 'section'; sectionId: string };
/** Dónde caería: el índice cuenta sin lo que se mueve. */
export type BoardTarget = { kind: 'dish'; sectionId: string; index: number } | { kind: 'section'; index: number };
type Layout = { y: number; height: number };
type BoardSection = { id: string; platillos: { id: string }[] };
/** Un lugar posible y su orilla de arriba, en la lista sin lo que se mueve. */
type Slot = { top: number; target: BoardTarget };

const EDGE = 72;
// Toque sostenido para levantar un renglón desde cualquier parte.
const ROW_HOLD_MS = 180;
const MAX_SPEED = 14;
// Los demás se recorren; lo que sueltas se asienta.
const MOVE_MS = 200;
// Soltar: lo levantado se desliza a su lugar y la sombra se apaga.
const SETTLE_MS = 220;
const LIFT_MS = 150;
// Rastro en Metro (solo en desarrollo) para revisar un arrastre que no cae.
const trace = (...args: unknown[]) => { if (__DEV__) console.log('[ordenar]', ...args); };
export const sameTarget = (a: BoardTarget | null, b: BoardTarget | null) => JSON.stringify(a) === JSON.stringify(b);

export function useBoardDrag({ sections, scrollRef, onMoveDish, onMoveSection, onLift }: {
  /** En el orden del menú. */
  sections: BoardSection[];
  scrollRef: React.RefObject<ScrollView | null>;
  onMoveDish: (dishId: string, toSectionId: string, toIndex: number) => void;
  onMoveSection: (sectionId: string, toIndex: number) => void;
  /** Al levantar algo (por ejemplo, para cerrar un «Eliminar» abierto). */
  onLift?: () => void;
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
  const liftRef = useRef(onLift);
  liftRef.current = onLift;

  const scrollY = useRef(0);
  const contentHeight = useRef(0);
  const viewport = useRef({ top: 0, height: 0 });
  const lastPageY = useRef(0);
  const dragRef = useRef<BoardDragItem | null>(null);
  const slots = useRef<Slot[]>([]);
  const origin = useRef<BoardTarget | null>(null);
  const targetRef = useRef<BoardTarget | null>(null);
  // Dónde estaba el dedo y la orilla de arriba de lo levantado (en la lista) al levantarlo.
  const lifted = useRef({ pageY: 0, top: 0, height: 0 });
  const settling = useRef(false);
  const liftedAt = useRef(0);
  const speed = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [drag, setDrag] = useState<BoardDragItem | null>(null);
  const [target, setTarget] = useState<BoardTarget | null>(null);
  const [gapHeight, setGapHeight] = useState(0);
  const ghostY = useSharedValue(0);
  // Levantar: sin crecer (las letras no brincan); solo aparece la sombra.
  const lift = useSharedValue(0);
  const ghostStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ghostY.value }], shadowOpacity: 0.18 * lift.value }));

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
  // arrastre (la barra de secciones pudo moverla).
  const measureViewport = useCallback(() => {
    const host = scrollRef.current as unknown as { measureInWindow?: (callback: (x: number, y: number, width: number, height: number) => void) => void } | null;
    host?.measureInWindow?.((_x, y, _width, height) => {
      if (height) viewport.current = { top: y, height };
    });
  }, [scrollRef]);
  const onViewportLayout = useCallback(() => { measureViewport(); }, [measureViewport]);
  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.current = event.nativeEvent.contentOffset.y;
    contentHeight.current = event.nativeEvent.contentSize.height;
  }, []);
  // Si aún no se midió, la lista ocupa la pantalla.
  const viewportNow = () => (viewport.current.height ? viewport.current : { top: 0, height: Dimensions.get('window').height });

  // Cada lugar donde puede caer lo que levantas, medido con eso ya fuera de la
  // lista: lo que estaba debajo sube lo que medía.
  const buildSlots = (item: BoardDragItem): { slots: Slot[]; top: number; height: number; origin: BoardTarget } | null => {
    const list = sectionsRef.current;
    if (item.kind === 'section') {
      const own = sectionLayouts.current.get(item.sectionId);
      if (!own) return null;
      const others = list.filter((section) => section.id !== item.sectionId);
      const found: Slot[] = [];
      for (const [index, section] of others.entries()) {
        const layout = sectionLayouts.current.get(section.id);
        if (!layout) return null;
        found.push({ top: layout.y, target: { kind: 'section', index } });
      }
      const last = others.length ? sectionLayouts.current.get(others[others.length - 1].id) : undefined;
      found.push({ top: last ? last.y + last.height : own.y, target: { kind: 'section', index: others.length } });
      const bottom = own.y + own.height;
      return {
        slots: found.map((slot) => (slot.top >= bottom - 0.5 ? { ...slot, top: slot.top - own.height } : slot)),
        top: own.y,
        height: own.height,
        origin: { kind: 'section', index: Math.max(0, list.findIndex((section) => section.id === item.sectionId)) },
      };
    }
    const home = sectionLayouts.current.get(item.sectionId);
    const ownLayout = dishLayouts.current.get(item.dishId);
    if (!home || !ownLayout) return null;
    const top = home.y + ownLayout.y;
    const bottom = top + ownLayout.height;
    const found: Slot[] = [];
    for (const section of list) {
      const layout = sectionLayouts.current.get(section.id);
      if (!layout) return null;
      const others = section.platillos.filter((dish) => dish.id !== item.dishId);
      for (const [index, dish] of others.entries()) {
        const dishLayout = dishLayouts.current.get(dish.id);
        if (dishLayout) found.push({ top: layout.y + dishLayout.y, target: { kind: 'dish', sectionId: section.id, index } });
      }
      const lastDish = others.length ? dishLayouts.current.get(others[others.length - 1].id) : undefined;
      const header = headerLayouts.current.get(section.id);
      const end = lastDish ? layout.y + lastDish.y + lastDish.height : layout.y + (header ? header.y + header.height : 0);
      found.push({ top: end, target: { kind: 'dish', sectionId: section.id, index: others.length } });
    }
    const homeSection = list.find((section) => section.id === item.sectionId);
    return {
      slots: found.map((slot) => (slot.top >= bottom - 0.5 ? { ...slot, top: slot.top - ownLayout.height } : slot)),
      top,
      height: ownLayout.height,
      origin: { kind: 'dish', sectionId: item.sectionId, index: Math.max(0, homeSection?.platillos.findIndex((dish) => dish.id === item.dishId) ?? 0) },
    };
  };

  const update = (pageY: number) => {
    if (!dragRef.current) return;
    const { height: viewHeight } = viewportNow();
    const { height } = lifted.current;
    // Lo levantado sigue al dedo sin salirse de la lista.
    const top = Math.max(-height / 2, Math.min(viewHeight - height / 2, lifted.current.top + pageY - lifted.current.pageY));
    ghostY.value = top;
    const at = top + scrollY.current;
    let best: Slot | null = null;
    for (const slot of slots.current) {
      if (!best || Math.abs(slot.top - at) < Math.abs(best.top - at)) best = slot;
    }
    if (!best || sameTarget(best.target, targetRef.current)) return;
    targetRef.current = best.target;
    Haptics.selectionAsync().catch(() => {});
    // Los demás se recorren hacia su lugar nuevo.
    LayoutAnimation.configureNext(LayoutAnimation.create(MOVE_MS, 'easeInEaseOut', 'opacity'));
    setTarget(best.target);
  };
  const stopAutoScroll = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    speed.current = 0;
  };
  // Cerca de la orilla de arriba o de abajo, la lista se desplaza sola.
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
    if (dragRef.current || settling.current) return;
    const built = buildSlots(item);
    if (!built) { trace('sin medidas', item); return; }
    liftRef.current?.();
    dragRef.current = item;
    slots.current = built.slots;
    origin.current = built.origin;
    targetRef.current = built.origin;
    lifted.current = { pageY, top: built.top - scrollY.current, height: built.height };
    lastPageY.current = pageY;
    liftedAt.current = Date.now();
    ghostY.value = lifted.current.top;
    lift.value = 0;
    lift.value = withTiming(1, { duration: LIFT_MS });
    // Al levantar nada se mueve: el renglón se queda (invisible) en su lugar
    // y la copia aparece justo encima.
    setGapHeight(built.height);
    setTarget(built.origin);
    setDrag(item);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    trace('levanta', item.kind, item.kind === 'dish' ? item.dishId : item.sectionId, { lugares: built.slots.length });
    measureViewport();
  };
  const move = (pageY: number) => {
    lastPageY.current = pageY;
    update(pageY);
    autoScroll(pageY);
  };
  const finish = (commit: boolean) => {
    stopAutoScroll();
    const item = dragRef.current;
    if (!item) return;
    dragRef.current = null;
    const where = targetRef.current;
    const from = origin.current;
    const moved = commit && !!where && !!from && !sameTarget(where, from);
    const destination = moved ? where : from;
    // Si no cambia de lugar (lo regresaste, o el sistema canceló el toque), su
    // lugar se vuelve a abrir mientras lo levantado regresa.
    if (!moved && from && !sameTarget(targetRef.current, from)) {
      targetRef.current = from;
      LayoutAnimation.configureNext(LayoutAnimation.create(SETTLE_MS, 'easeInEaseOut', 'opacity'));
      setTarget(from);
    }
    // Al aterrizar, el menú y los huecos cambian en el mismo instante (sin
    // animación de por medio): la copia ya está exactamente en su lugar.
    const land = () => {
      settling.current = false;
      targetRef.current = null;
      origin.current = null;
      trace(commit ? 'suelta' : 'cancela', where ?? 'sin lugar', { ms: Date.now() - liftedAt.current });
      if (moved && where) {
        if (item.kind === 'dish' && where.kind === 'dish') moveDishRef.current(item.dishId, where.sectionId, where.index);
        if (item.kind === 'section' && where.kind === 'section') moveSectionRef.current(item.sectionId, where.index);
      }
      setDrag(null);
      setTarget(null);
    };
    const slot = destination ? slots.current.find((entry) => sameTarget(entry.target, destination)) : undefined;
    const to = slot ? slot.top - scrollY.current : null;
    if (commit) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    lift.value = withTiming(0, { duration: SETTLE_MS });
    // Ya está en su lugar (lo mantuviste sin moverlo): termina al instante.
    if (to == null || Math.abs(ghostY.value - to) < 2) { land(); return; }
    settling.current = true;
    ghostY.value = withTiming(to, { duration: SETTLE_MS, easing: Easing.out(Easing.cubic) });
    setTimeout(land, SETTLE_MS);
  };
  useEffect(() => () => stopAutoScroll(), []);
  // Nunca se queda nada flotando: si la app se va al fondo (una llamada, el
  // centro de control) a medio arrastre, todo regresa a su lugar.
  const finishRef = useRef(finish);
  finishRef.current = finish;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && dragRef.current) finishRef.current(false);
    });
    return () => subscription.remove();
  }, []);

  const dragFrom = (item: BoardDragItem, pan: ReturnType<typeof Gesture.Pan>) => pan
    // La lista no se desplaza mientras este arrastre pueda empezar.
    .blocksExternalGesture(scrollRef as unknown as Parameters<typeof pan.blocksExternalGesture>[0])
    .runOnJS(true)
    .onStart((event) => begin(item, event.absoluteY))
    .onUpdate((event) => move(event.absoluteY))
    // Solo cae si el dedo se levantó; si el sistema canceló el toque, regresa.
    .onEnd((_event, success) => finish(success))
    .onFinalize(() => finish(false));
  /** La manija (≡) de un platillo o una sección: el renglón sigue al dedo, sin esperar. */
  const handleFor = (item: BoardDragItem) => dragFrom(item, Gesture.Pan().minDistance(0));
  /** Todo el renglón: un toque sostenido corto lo levanta; deslizar desplaza la lista. */
  const rowFor = (item: BoardDragItem, holdMs = ROW_HOLD_MS) => dragFrom(item, Gesture.Pan().activateAfterLongPress(holdMs));

  /** ¿El hueco está donde salió lo que levantas? Entonces su lugar sigue abierto ahí. */
  const atOrigin = !target || !origin.current || sameTarget(target, origin.current);

  return { drag, target, atOrigin, gapHeight, ghostStyle, handleFor, rowFor, onScroll, onViewportLayout, onSectionLayout, onHeaderLayout, onDishLayout };
}
