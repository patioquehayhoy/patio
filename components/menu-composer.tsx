import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  AppState,
  BackHandler,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import ReAnimated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cleanMenu, emptyMenu, useFonderoMenuDraftController } from '@/lib/controllers/useFonderoMenuDraftController';
import { splitCarta } from '@/lib/menu-carta';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { canonicalSeccion, cartaSugerencias, getFonditaHorarioSemanal, getTipoNegocio, seccionSugerencias, type MenuData, type Platillo, type Seccion } from '@/lib/menu-store';
import { isAfterService, nextPublishSlots, scheduledLabel } from '@/lib/publish-timing';
import { Type, useTheme } from '@/lib/theme';
import { ActionSheet } from '@/components/action-sheet';
import { GlassIconButton } from '@/components/glass-button';
import { SectionBar } from '@/components/section-bar';
import { useBoardDrag, type BoardDragItem } from '@/components/board-drag';
import { closeOpenSwipeRow, closeSwipeRowOnTouch, SwipeRow } from '@/components/swipe-row';
import { mergeDescription, suggestDishSplit } from '@/lib/dish-split';
import { looksVegetarian } from '@/lib/dish-diet';
import { noWidow } from '@/lib/typography';
import { TEXT_LIMITS } from '@/lib/text-limits';
import { DishPhotoPermissionError, pickDishPhoto, uploadDishPhoto } from '@/lib/dish-photo';
import { getFonditaId } from '@/lib/user-store';

// Editor continuo (Parco, 22 nov): títulos de marca y espacio separan las
// secciones. Los platillos conservan sus columnas al crear, editar y mover.
// - Cada platillo tiene siempre sus cuatro lugares: la foto a la izquierda, el
//   nombre, la descripción debajo y el precio a la derecha. Lo vacío se ve en
//   gris: se ve que se puede llenar.
// - Escribir no mueve nada: cada campo está siempre en su lugar.
// - Sobre el teclado, lo del campo donde estás («Eliminar», «Siguiente»,
//   títulos sugeridos) y «Listo».
// - Arriba, como una barra de iOS (HIG, Toolbars; segunda vuelta del 16 nov,
//   docs/EDITOR_MENU_INVESTIGACION_2026-11-16.md §9): a la izquierda «‹» y el
//   nombre del menú; a la derecha la única acción destacada, «Publicar» (o
//   «Actualizar» en el menú que ya está publicado hoy).
// - Guardar no es un botón: el borrador se guarda solo. «‹» sale sin
//   preguntar. El menú publicado hoy lleva «×»: si cambiaste algo, pregunta
//   si actualizarlo o descartar.
// - Mover y quitar ahí mismo, como Recordatorios: mantener presionado un
//   platillo o un título lo levanta (los demás se recorren para abrirle lugar);
//   deslizarlo a la izquierda lo elimina. El modo aparte «Ordenar» se quitó el
//   21 nov (oculto desde el 16; en git, commit 7c036a0).
// Una barra sobre el teclado por tipo de campo. Cada una trae sus botones
// fijos (en un precio, «Siguiente» siempre está): no dependen de que la barra
// se vuelva a dibujar al pasar de un campo a otro.
const BAR_TEXT = 'menu-bar-text';
const BAR_PRICE = 'menu-bar-price';
const BAR_TITLE = 'menu-bar-title';
const NAV_HEIGHT = 54;
// «Deshacer» se va solo, como el aviso de Mail o Fotos: tiempo para leerlo y
// tocarlo sin que se quede pegado (Parco, 16 nov). Con VoiceOver no se va
// solo (WCAG 2.2.1: quien necesita más tiempo, lo tiene).
const UNDO_MS = 6000;
// Mantener presionado un platillo o un título antes de levantarlo: el medio
// segundo de iOS (UILongPressGestureRecognizer). Con 280 ms un toque normal un
// poco lento ya levantaba el platillo y se sentía «atorado».
const HOLD_IN_PLACE_MS = 500;
// Giros de comida corrida: la primera sección sugiere «MENÚ DEL DÍA», que con
// su precio es el «MENÚ $100» del pizarrón.
const MENU_PRICE_TYPES = new Set(['fondita', 'casa', 'restaurante']);


export { emptyMenu };

type Props = {
  initialData: MenuData;
  source: 'foto' | 'manual';
  onBack: () => void;
  onRetake?: () => void;
};

export function MenuComposer({ initialData, source, onBack, onRetake }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = useMemo(() => makeStyles(c), [c]);
  const {
    addSection,
    data,
    draftSaveState,
    declineLink,
    dismissUndo,
    fillKnownPhotos,
    flushDraft,
    hasUnsavedChanges,
    insertDishAfter,
    lastRemoved,
    linkDish,
    linkSuggestion,
    live,
    moveDishTo,
    moveSectionTo,
    nombre,
    patchDish,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeSection,
    saveNombre,
    setDishPhoto,
    setNombre,
    setSoldOut,
    undoRemove,
  } = useFonderoMenuDraftController(initialData, source);
  // Dejar listo el menú de otro día (2026-11-21), como «Enviar más tarde» de
  // Mail: mantener presionado «Publicar» ofrece «Publicar ahora» o «Mañana a las
  // 9 am» (una hora antes de abrir, la hora del aviso). Ya pasado el servicio de
  // hoy, tocarlo ofrece primero mañana: publicar «hoy» de noche no le sirve a
  // nadie (se va a la medianoche y no se avisa a nadie).
  const publishRef = useRef<View>(null);
  const scheduleRef = useRef<View>(null);
  const [scheduleMenu, setScheduleMenu] = useState<'evening' | 'hold' | null>(null);
  const horario = getFonditaHorarioSemanal();
  // Los siguientes días que abre: mañana y, para dejar lista la semana, los demás.
  const slots = scheduleMenu ? nextPublishSlots(horario) : [];
  const schedulingOptions = slots.length ? (() => {
    const now = { label: 'Publicar ahora', icon: 'paper-plane-outline' as const, accessibilityHint: 'Sale ya en tu ficha y avisa a quienes te siguen.', onPress: () => { void publish(); } };
    const later = slots.map((slot) => ({ label: slot.label, icon: 'time-outline' as const, accessibilityHint: 'Queda listo y sale solo a esa hora.', onPress: () => { void publish({ fecha: slot.fecha, publishAt: slot.at.toISOString() }); } }));
    return scheduleMenu === 'evening' ? [later[0], now, ...later.slice(1)] : [now, ...later];
  })() : [];
  const onPublishPress = () => {
    if (!live && isAfterService(horario)) { setScheduleMenu('evening'); return; }
    void publish();
  };
  // Un menú programado que se abre para cambiarlo: dice cuándo sale.
  const scheduledFor = live && initialData.localFecha && initialData.localPublishAt && Date.parse(initialData.localPublishAt) > Date.now() ? scheduledLabel(initialData.localPublishAt) : null;
  const dataRef = useRef(data);
  dataRef.current = data;
  // Solo se anima lo que llega o se va (un platillo, una sección), en la
  // duración estándar de UIKit (0.25 s). Con Reducir movimiento, de una vez.
  const reduceMotion = useReducedMotion();
  const smoothly = () => { if (!reduceMotion) LayoutAnimation.configureNext(LayoutAnimation.create(250, 'easeInEaseOut', 'opacity')); };

  // ─── Campos y cursor ─────────────────────────────────────────────────────
  // Claves: `t-` título · `sp-` precio de sección · `n-` nombre · `d-`
  // descripción · `p-` precio del platillo.
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const pendingFocus = useRef<string | null>(null);
  const registerInput = (key: string) => (ref: TextInput | null) => {
    inputRefs.current[key] = ref;
    if (ref && pendingFocus.current === key) {
      pendingFocus.current = null;
      requestAnimationFrame(() => ref.focus());
    }
  };
  const focusKey = (key: string) => {
    const ref = inputRefs.current[key];
    if (ref) { ref.focus(); return; }
    pendingFocus.current = key;
  };
  // El campo con el cursor decide qué ofrece la barra sobre el teclado. Al
  // pasar de un campo a otro hay un instante sin cursor: la barra se queda con
  // lo del último para no parpadear.
  const [focused, setFocused] = useState<string | null>(null);
  const focusedRef = useRef<string | null>(null);
  focusedRef.current = focused;
  const lastFocused = useRef<string | null>(null);
  if (focused) lastFocused.current = focused;

  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useRef(0);
  const keyboardTop = useRef<number | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const navBottom = insets.top + 6 + NAV_HEIGHT;
  // El renglón que escribes nunca queda tapado: ni por el teclado ni arriba.
  const ensureVisible = (key: string) => {
    if (Platform.OS !== 'ios') return; // Android lo acomoda solo al enfocar.
    setTimeout(() => {
      const input = inputRefs.current[key];
      const top = keyboardTop.current;
      if (!input || top == null) return;
      input.measureInWindow((_x, y, _width, height) => {
        const below = y + height + 28 - top;
        const above = navBottom + 8 - y;
        if (below > 0) scrollRef.current?.scrollTo({ y: scrollY.current + below, animated: true });
        else if (above > 0) scrollRef.current?.scrollTo({ y: Math.max(0, scrollY.current - above), animated: true });
      });
    }, 80);
  };
  const onFieldFocus = (key: string) => () => {
    setFocused(key);
    ensureVisible(key);
  };
  const onFieldBlur = (key: string) => setFocused((current) => (current === key ? null : current));

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      setKeyboardHeight(event.endCoordinates.height);
      setKeyboardOpen(true);
    });
    const shown = Keyboard.addListener('keyboardDidShow', (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      if (focusedRef.current) ensureVisible(focusedRef.current);
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      keyboardTop.current = null;
      setKeyboardHeight(0);
      setKeyboardOpen(false);
    });
    return () => { show.remove(); shown.remove(); hide.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Foto del platillo (2026-11-15) ──────────────────────────────────────
  // Se elige en el cuadro de la izquierda; se sube al elegirla.
  const photoRefs = useRef<Map<string, View | null>>(new Map());
  const [photoMenu, setPhotoMenu] = useState<{ sectionId: string; dishId: string } | null>(null);
  const photoMenuRef = useRef<{ sectionId: string; dishId: string } | null>(null);
  const openPhotoMenu = (sectionId: string, dishId: string) => {
    photoMenuRef.current = { sectionId, dishId };
    setPhotoMenu({ sectionId, dishId });
    Keyboard.dismiss();
  };
  const closePhotoMenu = () => {
    photoMenuRef.current = null;
    setPhotoMenu(null);
  };
  const [photoBusy, setPhotoBusy] = useState<Record<string, boolean>>({});
  const photoTarget = photoMenu
    ? data.secciones.find((section) => section.id === photoMenu.sectionId)?.platillos.find((dish) => dish.id === photoMenu.dishId) ?? null
    : null;
  const choosePhoto = async (sectionId: string, dish: Platillo, from: 'camera' | 'library') => {
    closePhotoMenu();
    if (!getFonditaId()) {
      Alert.alert(noWidow('Primero entra a tu negocio'), noWidow('Inicia sesión para poner fotos de tus platillos.'));
      return;
    }
    try {
      const asset = await pickDishPhoto(from);
      if (!asset) return;
      setPhotoBusy((current) => ({ ...current, [dish.id]: true }));
      const uploaded = await uploadDishPhoto(asset, dish.nombre);
      setDishPhoto(sectionId, dish.id, { foto: uploaded.url, ...(uploaded.hash ? { fotoHash: uploaded.hash } : {}) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      if (error instanceof DishPhotoPermissionError) {
        Alert.alert(
          noWidow(from === 'camera' ? 'Patio no tiene acceso a la cámara' : 'Patio no tiene acceso a tus fotos'),
          noWidow('Puedes darle permiso en Ajustes.'),
          [{ text: 'Ahora no', style: 'cancel' }, { text: 'Abrir Ajustes', onPress: () => { Linking.openSettings().catch(() => {}); } }],
        );
      } else {
        Alert.alert(noWidow('No pudimos subir la foto'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
      }
    } finally {
      setPhotoBusy((current) => ({ ...current, [dish.id]: false }));
    }
  };
  const photoOptions = photoMenu && photoTarget ? [
    { label: 'Tomar foto', icon: 'camera-outline' as const, onPress: () => { void choosePhoto(photoMenu.sectionId, photoTarget, 'camera'); } },
    { label: 'Elegir de Fotos', icon: 'images-outline' as const, onPress: () => { void choosePhoto(photoMenu.sectionId, photoTarget, 'library'); } },
    ...(photoTarget.foto ? [{ label: 'Quitar foto', icon: 'trash-outline' as const, destructive: true, onPress: () => { setDishPhoto(photoMenu.sectionId, photoTarget.id, null); closePhotoMenu(); } }] : []),
  ] : [];
  // Sin un platillo de hoy no hay qué publicar: «Publicar» se ve apagado.
  const menuEmpty = !splitCarta(cleanMenu(data)).hoy.secciones.some((section) => section.platillos.length);
  // En el menú publicado hoy, «Actualizar» se enciende cuando algo cambió.
  const changed = hasUnsavedChanges();

  // ─── Nombre del menú (nav) ───────────────────────────────────────────────
  // Como el título de una nota: se guarda al salir del campo. Es solo tuyo
  // (no sale en el menú), así que en el menú publicado no pide «Actualizar».
  const nombreInputRef = useRef<TextInput | null>(null);
  const nombreOnFocus = useRef('');
  const focusNombre = () => { nombreOnFocus.current = nombre; };
  const confirmNombre = async () => {
    if (nombre === nombreOnFocus.current) return;
    if (live) await saveNombre(); else await flushDraft();
  };

  // Las opciones de la pantalla solo cambian cuando de verdad cambian (no en
  // cada letra ni a medio arrastre).
  const swipeBack = !(live && changed);
  const screenOptions = useMemo(() => ({ headerShown: false, gestureEnabled: swipeBack }), [swipeBack]);
  const sectionY = useRef<Record<string, number>>({});
  const board = useBoardDrag({
    sections: data.secciones,
    scrollRef,
    // Al soltar, el menú cambia de una vez: lo levantado ya se asentó en su hueco.
    onMoveDish: moveDishTo,
    onMoveSection: moveSectionTo,
    onLift: () => closeOpenSwipeRow(),
  });

  // Barra de secciones (menús largos): marca la sección en pantalla y lleva a
  // la que toques. Se esconde con el teclado abierto.
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);
  const followSections = (y: number) => {
    let current = 0;
    data.secciones.forEach((section, index) => {
      const top = sectionY.current[section.id];
      if (top != null && top <= y + 16) current = index;
    });
    if (current !== activeSectionRef.current) {
      activeSectionRef.current = current;
      setActiveSection(current);
    }
  };
  const jumpToSection = (index: number) => {
    const section = data.secciones[index];
    const y = section ? sectionY.current[section.id] : undefined;
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 8), animated: true });
  };

  // ─── Llenar en cualquier orden ───────────────────────────────────────────
  const isBlank = (dish: Platillo) => !dish.nombre.trim() && !dish.descripcion.trim() && !dish.precio.trim() && !dish.foto;
  const allDishes = () => data.secciones.flatMap((section) => section.platillos.map((dish) => ({ section, dish })));
  // «Platillo» al final de cada tarjeta: uno nuevo ahí mismo, con el cursor.
  const addDishTo = (section: Seccion) => {
    const last = section.platillos[section.platillos.length - 1];
    if (last && isBlank(last)) { focusKey(`n-${last.id}`); return; }
    smoothly();
    pendingFocus.current = `n-${insertDishAfter(section.id, last?.id ?? null)}`;
  };
  const newLineAfter = (section: Seccion, dish: Platillo) => {
    smoothly();
    pendingFocus.current = `n-${insertDishAfter(section.id, dish.id)}`;
  };
  // «siguiente» (Parco, 16 nov): del nombre a su descripción; de la
  // descripción al platillo de abajo (o a uno nuevo al final de la tarjeta).
  // El precio va aparte: de precio en precio, por todo el menú. En un nombre
  // vacío, termina: el teclado se va y el renglón también.
  const submitName = (dish: Platillo) => {
    if (!dish.nombre.trim()) { Keyboard.dismiss(); return; }
    focusKey(`d-${dish.id}`);
  };
  const submitDescription = (section: Seccion, dish: Platillo) => {
    const below = section.platillos[section.platillos.findIndex((item) => item.id === dish.id) + 1];
    if (below) focusKey(`n-${below.id}`); else newLineAfter(section, dish);
  };
  // De precio en precio por todo el menú, en el orden en que se ve: el de cada
  // sección y, debajo, el de cada platillo. El teclado de números no trae
  // «siguiente»: lo da la barra de arriba del teclado.
  const priceKeys = () => data.secciones.flatMap((section) => [
    `sp-${section.id}`,
    ...section.platillos.filter((dish) => dish.nombre.trim()).map((dish) => `p-${dish.id}`),
  ]);
  const nextPriceKey = (key: string) => {
    const order = priceKeys();
    const at = order.indexOf(key);
    return at >= 0 ? order[at + 1] : undefined;
  };
  // Después del último precio, «Siguiente» abre un platillo nuevo: así nunca
  // falta el botón para seguir.
  const goToNextPrice = (key: string) => {
    const next = nextPriceKey(key);
    if (next) { focusKey(next); return; }
    if (key.startsWith('sp-')) {
      const section = data.secciones.find((item) => item.id === key.slice(3));
      if (section) addDishTo(section); else Keyboard.dismiss();
      return;
    }
    const found = allDishes().find((item) => item.dish.id === key.slice(2));
    if (found) newLineAfter(found.section, found.dish); else Keyboard.dismiss();
  };
  // «siguiente» en un título: a su primer platillo, o a uno nuevo.
  const submitTitle = (section: Seccion) => {
    const first = section.platillos[0];
    if (first) focusKey(`n-${first.id}`); else addDishTo(section);
  };
  // «Pastor $25»: escribir «$» lleva al precio de ese renglón.
  const changeName = (section: Seccion, dish: Platillo, text: string) => {
    const clean = text.replace(/\n/g, ' ');
    if (clean.endsWith('$')) {
      patchDish(section.id, dish.id, { nombre: clean.slice(0, -1).trimEnd().slice(0, TEXT_LIMITS.dishName) });
      focusKey(`p-${dish.id}`);
      return;
    }
    patchDish(section.id, dish.id, { nombre: clean.slice(0, TEXT_LIMITS.dishName) });
  };
  const changeTitle = (section: Seccion, text: string) => {
    const clean = text.replace(/\n/g, ' ').toUpperCase();
    if (clean.endsWith('$')) {
      patchSection(section.id, { nombre: clean.slice(0, -1).trimEnd().slice(0, TEXT_LIMITS.sectionName) });
      focusKey(`sp-${section.id}`);
      return;
    }
    patchSection(section.id, { nombre: clean.slice(0, TEXT_LIMITS.sectionName) });
  };
  // «Eliminar» sobre el teclado: se va el platillo y el cursor pasa al de abajo
  // (o al de arriba), así se limpian varios seguidos (el menú de ayer). Lo que
  // tenía algo se puede deshacer.
  const deleteFocusedDish = (section: Seccion, dish: Platillo) => {
    const index = section.platillos.findIndex((item) => item.id === dish.id);
    const neighbor = section.platillos[index + 1] ?? section.platillos[index - 1];
    if (neighbor) focusKey(`n-${neighbor.id}`); else Keyboard.dismiss();
    smoothly();
    removeDish(section.id, dish.id);
    Haptics.selectionAsync().catch(() => {});
  };
  const deleteFocusedSection = (section: Seccion) => {
    Keyboard.dismiss();
    smoothly();
    removeSection(section.id);
  };
  // Lo que se queda vacío desaparece al salir de él: un renglón sin nada y una
  // sección nueva sin título ni platillos (como en Recordatorios).
  const dishFocused = (dishId: string) => ['n', 'd', 'p'].some((kind) => inputRefs.current[`${kind}-${dishId}`]?.isFocused?.());
  const dropIfEmpty = (sectionId: string, dishId?: string) => {
    setTimeout(() => {
      const section = dataRef.current.secciones.find((item) => item.id === sectionId);
      if (!section || board.drag) return;
      if (dishId) {
        const dish = section.platillos.find((item) => item.id === dishId);
        if (!dish || dishFocused(dishId) || photoMenuRef.current?.dishId === dishId || !isBlank(dish)) return;
        smoothly();
        removeDish(sectionId, dishId);
        return;
      }
      if (inputRefs.current[`t-${sectionId}`]?.isFocused?.() || inputRefs.current[`sp-${sectionId}`]?.isFocused?.()) return;
      if (section.nombre.trim() || section.precio.trim() || section.platillos.length) return;
      // La única sección de hoy se queda: el menú necesita una.
      if (!section.carta && dataRef.current.secciones.filter((item) => !item.carta).length <= 1) return;
      smoothly();
      removeSection(sectionId);
    }, 0);
  };

  // Menú nuevo y vacío, hecho a mano: el cursor espera en el primer platillo.
  const startedRef = useRef(false);
  useEffect(() => {
    if (startedRef.current || source !== 'manual') return;
    startedRef.current = true;
    if (data.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim()))) return;
    const first = data.secciones.find((section) => !section.carta)?.platillos[0];
    if (!first) return;
    const timer = setTimeout(() => focusKey(`n-${first.id}`), 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ─── Secciones ───────────────────────────────────────────────────────────
  // Pizarrón (2026-11-16): solo secciones con su título y su precio. Desde el
  // título «CARTA» hacia abajo es la carta y se queda para los días que siguen
  // (lib/menu-carta.ts).
  const cartaHeadingId = data.secciones.find((section) => section.carta)?.id ?? null;
  const todaySections = data.secciones.filter((section) => !section.carta);
  const firstSectionHint = MENU_PRICE_TYPES.has(getTipoNegocio() ?? '')
    ? 'MENÚ DEL DÍA'
    : seccionSugerencias(getTipoNegocio())[0] ?? 'MENÚ DEL DÍA';
  // Títulos sugeridos sobre el teclado mientras el título está vacío: los del
  // giro que aún no se usan y, si no hay carta, «CARTA».
  const titleSuggestions = (section: Seccion): string[] => {
    const used = new Set(data.secciones.map((item) => canonicalSeccion(item.nombre)).filter(Boolean));
    const todayIndex = todaySections.findIndex((item) => item.id === section.id);
    const base = section.carta
      ? cartaSugerencias(getTipoNegocio())
      : [
          ...(todayIndex === 0 ? [firstSectionHint] : []),
          ...seccionSugerencias(getTipoNegocio()),
          ...(!cartaHeadingId && todayIndex > 0 ? ['CARTA'] : []),
        ];
    return [...new Set(base)].filter((name) => !used.has(canonicalSeccion(name)));
  };
  const pickTitle = (section: Seccion, name: string) => {
    patchSection(section.id, { nombre: name });
    Haptics.selectionAsync().catch(() => {});
    submitTitle(section);
  };
  // «Sección» al final de lo de hoy (y de la carta): nace vacía, con su título
  // listo para escribirse.
  const addSectionFocused = (carta: boolean) => {
    smoothly();
    pendingFocus.current = `t-${addSection('', carta)}`;
  };

  // ─── Salir ───────────────────────────────────────────────────────────────
  // «‹» (borrador): sale sin preguntar; lo escrito ya está guardado (HIG: el
  // botón estándar de regresar, sin texto).
  // «×» (el menú publicado hoy): si cambiaste algo, pregunta ahí mismo si
  // actualizarlo o descartar los cambios, como Calendario al editar.
  const leaveRef = useRef<View>(null);
  const [leaveMenu, setLeaveMenu] = useState(false);
  const leavingRef = useRef(false);
  const leave = () => {
    Keyboard.dismiss();
    if (live) {
      if (!hasUnsavedChanges()) { onBack(); return; }
      setLeaveMenu(true);
      return;
    }
    if (leavingRef.current) return;
    leavingRef.current = true;
    void flushDraft(true).then((saved) => {
      leavingRef.current = false;
      if (saved) { onBack(); return; }
      Alert.alert(noWidow('No se pudo guardar el menú'), noWidow('Inténtalo otra vez.'), [
        { text: 'Quedarme', style: 'cancel' },
        { text: 'Salir sin guardar', style: 'destructive', onPress: onBack },
      ]);
    });
  };
  const leaveOptions = [
    ...(menuEmpty ? [] : [{ label: 'Actualizar menú', icon: 'checkmark-circle-outline' as const, afterDismiss: true, onPress: () => { void publish(); } }]),
    { label: 'Descartar cambios', icon: 'trash-outline' as const, destructive: true, afterDismiss: true, onPress: onBack },
  ];
  // Android: el botón de atrás hace lo mismo que «‹» o «×».
  const backRef = useRef(leave);
  backRef.current = leave;
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { backRef.current(); return true; });
    return () => subscription.remove();
  }, []);
  // «Deshacer» se va solo; cada eliminación nueva vuelve a contar. Mientras
  // arrastras no corre (el aviso está escondido).
  useEffect(() => {
    if (!lastRemoved || board.drag) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    AccessibilityInfo.isScreenReaderEnabled()
      .then((reading) => { if (active && !reading) timer = setTimeout(dismissUndo, UNDO_MS); })
      .catch(() => { if (active) timer = setTimeout(dismissUndo, UNDO_MS); });
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [lastRemoved, board.drag, dismissUndo]);
  // Si la app se va al fondo (una llamada, otra app), lo escrito se guarda.
  const flushRef = useRef(flushDraft);
  flushRef.current = flushDraft;
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => { if (state !== 'active') void flushRef.current(); });
    return () => subscription.remove();
  }, []);

  // ─── Barra sobre el teclado ──────────────────────────────────────────────
  // Solo un ícono en la barra (la hojita de vegetariano).
  const barIcon = (icon: keyof typeof Ionicons.glyphMap, onPress: () => void, a11y: string) => (
    <TouchableOpacity key={icon} style={s.barButton} onPress={onPress} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={a11y}>
      <Ionicons name={icon} size={19} color={c.text} />
    </TouchableOpacity>
  );
  const barButton = (label: string, onPress: () => void, options: { strong?: boolean; icon?: keyof typeof Ionicons.glyphMap; a11y?: string } = {}) => (
    <TouchableOpacity
      key={label}
      style={s.barButton}
      onPress={onPress}
      activeOpacity={0.6}
      accessibilityRole="button"
      accessibilityLabel={options.a11y ?? label}>
      <Text style={options.strong ? s.barDone : s.barText} maxFontSizeMultiplier={1.2}>{label}</Text>
      {options.icon && <Ionicons name={options.icon} size={15} color={c.text} />}
    </TouchableOpacity>
  );
  const renderBar = (): ReactNode => {
    const key = focused ?? lastFocused.current;
    if (!key) return null;
    const doneKey = barButton('Listo', () => Keyboard.dismiss(), { strong: true });
    const sectionById = (id: string) => data.secciones.find((item) => item.id === id);
    if (key.startsWith('t-')) {
      const section = sectionById(key.slice(2));
      if (!section) return doneKey;
      const suggestions = section.nombre.trim() ? [] : titleSuggestions(section);
      if (suggestions.length) {
        return (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" style={s.barSpacer} contentContainerStyle={s.barChips}>
              {suggestions.map((name) => (
                <TouchableOpacity
                  key={name}
                  style={s.barChip}
                  onPress={() => pickTitle(section, name)}
                  activeOpacity={0.6}
                  accessibilityRole="button"
                  accessibilityLabel={`Llamar a la sección ${name}`}>
                  <Text style={s.barChipText} maxFontSizeMultiplier={1.2}>{name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {doneKey}
          </>
        );
      }
      return (
        <>
          {barButton('Eliminar', () => deleteFocusedSection(section), { a11y: `Eliminar la sección ${section.nombre || ''}`.trim() })}
          <View style={s.barSpacer} />
          {doneKey}
        </>
      );
    }
    if (key.startsWith('p-') || key.startsWith('sp-')) {
      return (
        <>
          {barButton('Siguiente', () => goToNextPrice(key), { icon: 'chevron-down', a11y: nextPriceKey(key) ? 'Siguiente precio' : 'Siguiente platillo' })}
          <View style={s.barSpacer} />
          {doneKey}
        </>
      );
    }
    const found = allDishes().find((item) => item.dish.id === key.slice(2));
    if (!found) return doneKey;
    return (
      <>
        {barButton('Eliminar', () => deleteFocusedDish(found.section, found.dish), { a11y: `Eliminar ${found.dish.nombre || 'platillo'}` })}
        <View style={s.barSpacer} />
        {barIcon('leaf-outline', () => barActions.current.toggleVeggie(), 'Vegetariano: marcar o quitar')}
        {doneKey}
      </>
    );
  };

  // Lo que hacen los botones de las barras del teclado, siempre con el campo y
  // el menú de este momento.
  const barActions = useRef({ nextPrice: () => {}, remove: () => {}, pickTitle: (_name: string) => {}, toggleVeggie: () => {} });
  barActions.current = {
    // Vegetariano: la hojita marca o quita el platillo que escribes.
    toggleVeggie: () => {
      const key = lastFocused.current;
      if (!key || !(key.startsWith('n-') || key.startsWith('d-'))) return;
      const found = allDishes().find((item) => item.dish.id === key.slice(2));
      if (!found) return;
      patchDish(found.section.id, found.dish.id, { vegetariano: !found.dish.vegetariano });
      Haptics.selectionAsync().catch(() => {});
    },
    nextPrice: () => {
      const key = lastFocused.current;
      if (key && (key.startsWith('p-') || key.startsWith('sp-'))) goToNextPrice(key);
    },
    remove: () => {
      const key = lastFocused.current;
      if (!key) return;
      if (key.startsWith('t-')) {
        const section = data.secciones.find((item) => item.id === key.slice(2));
        if (section) deleteFocusedSection(section);
        return;
      }
      const found = allDishes().find((item) => item.dish.id === key.slice(2));
      if (found) deleteFocusedDish(found.section, found.dish);
    },
    pickTitle: (name: string) => {
      const key = lastFocused.current;
      const section = key?.startsWith('t-') ? data.secciones.find((item) => item.id === key.slice(2)) : undefined;
      if (section) pickTitle(section, name);
    },
  };
  const listoKey = barButton('Listo', () => Keyboard.dismiss(), { strong: true });
  // Barra de un título: vacío, los títulos sugeridos; con nombre, «Eliminar».
  const renderTitleBar = (): ReactNode => {
    const key = focused ?? lastFocused.current;
    const section = key?.startsWith('t-') ? data.secciones.find((item) => item.id === key.slice(2)) : undefined;
    const suggestions = section && !section.nombre.trim() ? titleSuggestions(section) : [];
    if (suggestions.length) {
      return (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" style={s.barSpacer} contentContainerStyle={s.barChips}>
            {suggestions.map((name) => (
              <TouchableOpacity
                key={name}
                style={s.barChip}
                onPress={() => barActions.current.pickTitle(name)}
                activeOpacity={0.6}
                accessibilityRole="button"
                accessibilityLabel={`Llamar a la sección ${name}`}>
                <Text style={s.barChipText} maxFontSizeMultiplier={1.2}>{name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {listoKey}
        </>
      );
    }
    return (
      <>
        {barButton('Eliminar', () => barActions.current.remove(), { a11y: 'Eliminar la sección' })}
        <View style={s.barSpacer} />
        {listoKey}
      </>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  // La copia de lo que arrastras, encima de la lista: igual al renglón (mismas
  // líneas, «Descripción» y «$» en gris, misma columna de precio), así al
  // levantar y al soltar ninguna letra se mueve. Solo cambia la sombra.
  const ghostDishRow = (dish: Platillo, divider: boolean) => (
    <View key={dish.id} style={s.dish}>
      {divider && <View style={s.dishDivider} />}
      <View style={s.slot}>
        {dish.foto
          ? <Image source={{ uri: dish.foto }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
          : <Ionicons name="camera-outline" size={19} color={c.textMute} />}
      </View>
      <View style={s.body}>
        {!!dish.revision && !/precio|\$|importe/i.test(dish.revision) && (
          <View style={s.reviewNote}>
            <Ionicons name="alert-circle-outline" size={13} color={c.accent} />
            <Text style={s.reviewNoteText}>{dish.revision}</Text>
          </View>
        )}
        {/* Los mismos campos que el renglón (sin editar): cada letra cae en el mismo pixel. */}
        <View style={s.nameRow}>
          <TextInput editable={false} style={[s.dishName, s.nameField]} value={dish.nombre} placeholder="Platillo" placeholderTextColor={c.textMute} multiline scrollEnabled={false} />
          {dish.vegetariano === true && <Ionicons name="leaf-outline" size={14} color={c.textMute} style={s.nameLeaf} />}
        </View>
        <TextInput editable={false} style={s.description} value={dish.descripcion} placeholder="Descripción" placeholderTextColor={c.textMute} multiline scrollEnabled={false} />
      </View>
      <View style={s.price}>
        <Text style={[s.currency, !!dish.precio && s.currencyOn]}>$</Text>
        <TextInput editable={false} style={s.priceInput} value={dish.precio} />
      </View>
    </View>
  );
  const renderGhost = (item: BoardDragItem) => {
    if (item.kind === 'dish') {
      const dish = data.secciones.find((section) => section.id === item.sectionId)?.platillos.find((entry) => entry.id === item.dishId);
      return dish ? ghostDishRow(dish, false) : null;
    }
    const section = data.secciones.find((entry) => entry.id === item.sectionId);
    if (!section) return null;
    {
      const todayIndex = todaySections.findIndex((entry) => entry.id === section.id);
      return (
        <>
          <View style={s.head}>
            <View style={s.body}>
              <TextInput editable={false} style={s.title} value={section.nombre} placeholder={todayIndex === 0 ? firstSectionHint : 'SECCIÓN'} placeholderTextColor={c.textMute} multiline scrollEnabled={false} />
            </View>
            <View style={s.price}>
              <Text style={[s.currency, !!section.precio && s.currencyOn]}>$</Text>
              <TextInput editable={false} style={s.priceInput} value={section.precio} />
            </View>
          </View>
          {section.platillos.map((dish, index) => ghostDishRow(dish, index > 0))}
          <View style={[s.addDish, !!section.platillos.length && s.addDishDivider]}>
            <Ionicons name="add" size={18} color={c.accent} />
            <Text style={s.addText}>Platillo</Text>
          </View>
        </>
      );
    }
  };
  // Mientras arrastras un platillo, cada tarjeta abre su hueco donde caería.
  const dishTarget = board.drag?.kind === 'dish' && board.target?.kind === 'dish' && !board.atOrigin ? board.target : null;
  const draggedDishId = board.drag?.kind === 'dish' ? board.drag.dishId : null;
  const sectionTarget = board.drag?.kind === 'section' && board.target?.kind === 'section' && !board.atOrigin ? board.target : null;
  const draggedSectionId = board.drag?.kind === 'section' ? board.drag.sectionId : null;
  // Un hueco: siempre montado, solo cambia de alto (así nada se desmonta mientras arrastras).
  const gap = (open: boolean, line: boolean) => (
    <View pointerEvents="none" style={{ height: open ? board.gapHeight : 0 }}>
      {open && line && <View style={s.dishDivider} />}
    </View>
  );
  // Sin modo aparte (2026-11-16, como Recordatorios): en el panel mismo,
  // mantener presionado un platillo o un título lo levanta para moverlo y
  // deslizarlo a la izquierda abre «Eliminar». Escribiendo no hay gestos: el
  // texto se selecciona como siempre (y «Eliminar» está en la barra del teclado).
  // Ojo: no apagarlos mientras arrastras (apagar un gesto activo lo cancela).
  const gesturesOn = !keyboardOpen;

  const renderDish = (section: Seccion, dish: Platillo, index: number) => {
    const nameKey = `n-${dish.id}`;
    const busy = !!photoBusy[dish.id];
    const split = !keyboardOpen ? suggestDishSplit(dish.nombre) : null;
    // «¿Es vegetariano?»: solo si lo parece y nunca lo ha contestado (quien cocina decide).
    const askVeggie = !keyboardOpen && dish.vegetariano === undefined && !!dish.nombre.trim() && looksVegetarian(dish.nombre, dish.descripcion);
    const link = !keyboardOpen ? linkSuggestion(dish) : null;
    // Mientras arrastras: lo levantado se queda montado (invisible, y encogido
    // si el hueco está en otro lado) y los demás abren su hueco.
    const lifted = draggedDishId === dish.id;
    const before = section.platillos.slice(0, index).filter((item) => item.id !== draggedDishId).length;
    const gapAbove = !lifted && !!dishTarget && dishTarget.sectionId === section.id && dishTarget.index === before;
    const belowLifted = board.atOrigin && index > 0 && section.platillos[index - 1].id === draggedDishId;
    return (
      <View key={dish.id} collapsable={false} onLayout={board.onDishLayout(dish.id)} style={lifted && !board.atOrigin && s.collapsed}>
        {!lifted && gap(gapAbove, before > 0)}
        <SwipeRow
          drag={board.rowFor({ kind: 'dish', dishId: dish.id, sectionId: section.id }, HOLD_IN_PLACE_MS).enabled(gesturesOn)}
          enabled={gesturesOn}
          fullSwipe
          actions={[
            // En el menú ya publicado, lo de hoy se marca «Se acabó» al instante.
            ...(live && !section.carta ? [{
              label: dish.agotado ? 'Ya hay' : 'Se acabó',
              color: c.textMute,
              accessibilityLabel: dish.agotado ? `Ya hay ${dish.nombre || 'platillo'}` : `Se acabó ${dish.nombre || 'platillo'}`,
              onPress: () => { void setSoldOut(section.id, dish.id, !dish.agotado); },
            }] : []),
            { label: 'Eliminar', color: c.danger, accessibilityLabel: `Eliminar ${dish.nombre || 'platillo'}`, onPress: () => { smoothly(); removeDish(section.id, dish.id); } },
          ]}
          background={[c.bg]}
          scrollRef={scrollRef}
          style={[s.dish, lifted && s.away]}>
        {(before > 0 || gapAbove || belowLifted) && <View pointerEvents="none" style={s.dishDivider} />}
        {/* La foto: el cuadro de la izquierda. Tocarlo abre ahí mismo
            Tomar foto, Elegir de Fotos y Quitar foto. */}
        <Pressable
          ref={(el) => { photoRefs.current.set(dish.id, el); }}
          style={s.slot}
          disabled={busy}
          onPress={() => openPhotoMenu(section.id, dish.id)}
          accessibilityRole="button"
          accessibilityLabel={busy ? 'Subiendo foto' : dish.foto ? `Foto de ${dish.nombre || 'platillo'}. Cambiar o quitar` : `Agregar foto a ${dish.nombre || 'platillo'}`}
          accessibilityState={{ busy }}>
          {busy
            ? <ActivityIndicator size="small" color={c.textSecondary} />
            : dish.foto
              ? <Image source={{ uri: dish.foto }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" accessibilityIgnoresInvertColors />
              : <Ionicons name="camera-outline" size={19} color={c.textMute} />}
        </Pressable>
        <View style={s.body}>
          {!!dish.revision && !/precio|\$|importe/i.test(dish.revision) && (
            <View style={s.reviewNote}>
              <Ionicons name="alert-circle-outline" size={13} color={c.accent} />
              <Text style={s.reviewNoteText}>{dish.revision}</Text>
            </View>
          )}
          <View style={s.nameRow}>
          <TextInput
            ref={registerInput(nameKey)}
            style={[s.dishName, s.nameField]}
            value={dish.nombre}
            onChangeText={(text) => changeName(section, dish, text)}
            onFocus={onFieldFocus(nameKey)}
            onBlur={() => { onFieldBlur(nameKey); fillKnownPhotos(); dropIfEmpty(section.id, dish.id); }}
            onSubmitEditing={() => submitName(dish)}
            placeholder="Platillo"
            placeholderTextColor={c.textMute}
            multiline
            scrollEnabled={false}
            submitBehavior="submit"
            returnKeyType="next"
            inputAccessoryViewID={Platform.OS === 'ios' ? BAR_TEXT : undefined}
            accessibilityLabel={dish.nombre ? `Platillo ${dish.nombre}${dish.vegetariano ? ', vegetariano' : ''}` : 'Platillo nuevo'}
            accessibilityActions={[
              ...(index > 0 ? [{ name: 'moveUp', label: 'Subir' }] : []),
              ...(index < section.platillos.length - 1 ? [{ name: 'moveDown', label: 'Bajar' }] : []),
            ]}
            onAccessibilityAction={(event) => {
              const direction = event.nativeEvent.actionName === 'moveUp' ? -1 : event.nativeEvent.actionName === 'moveDown' ? 1 : 0;
              if (direction) moveDishTo(dish.id, section.id, index + direction);
            }}
          />
          {/* Vegetariano: solo la hojita, como en la ficha. */}
          {dish.vegetariano === true && <Ionicons name="leaf-outline" size={14} color={c.textMute} style={s.nameLeaf} />}
          </View>
          <TextInput
            ref={registerInput(`d-${dish.id}`)}
            style={s.description}
            value={dish.descripcion}
            onChangeText={(descripcion) => patchDish(section.id, dish.id, { descripcion: descripcion.replace(/\n/g, ' ').slice(0, TEXT_LIMITS.dishDescription) })}
            onFocus={onFieldFocus(`d-${dish.id}`)}
            onBlur={() => { onFieldBlur(`d-${dish.id}`); dropIfEmpty(section.id, dish.id); }}
            onSubmitEditing={() => submitDescription(section, dish)}
            placeholder="Descripción"
            placeholderTextColor={c.textMute}
            multiline
            scrollEnabled={false}
            submitBehavior="submit"
            returnKeyType="next"
            inputAccessoryViewID={Platform.OS === 'ios' ? BAR_TEXT : undefined}
            accessibilityLabel={`Descripción de ${dish.nombre || 'platillo'}`}
          />
          {dish.agotado && <Text style={s.soldOutTag} accessibilityLabel="Se acabó hoy">Se acabó</Text>}
          {askVeggie && (
            <View style={s.linkHint}>
              <Text style={s.linkHintText}>{noWidow('¿Es vegetariano? Así lo encuentra quien no come carne.')}</Text>
              <View style={s.linkActions}>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                  onPress={() => { smoothly(); patchDish(section.id, dish.id, { vegetariano: true }); Haptics.selectionAsync().catch(() => {}); }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Sí, ${dish.nombre} es vegetariano`}>
                  <Text style={s.hintAction}>Sí</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  onPress={() => { smoothly(); patchDish(section.id, dish.id, { vegetariano: false }); }}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`No, ${dish.nombre} no es vegetariano`}>
                  <Text style={s.hintAction}>No</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {/* Sugerencias del sistema, solo con el teclado cerrado: mientras
              escribes, nada aparece ni se mueve. */}
          {!!split && (
            <TouchableOpacity
              style={s.hint}
              onPress={() => {
                smoothly();
                patchDish(section.id, dish.id, { nombre: split.name, descripcion: mergeDescription(split.description, dish.descripcion ?? '').slice(0, TEXT_LIMITS.dishDescription) });
                Haptics.selectionAsync().catch(() => {});
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Mover «${split.description}» a la descripción`}>
              <Ionicons name="arrow-down" size={13} color={c.accent} />
              <Text style={s.hintAction}>{noWidow(`Mover «${split.description.charAt(0).toLocaleLowerCase('es-MX') + split.description.slice(1)}» a la descripción`)}</Text>
            </TouchableOpacity>
          )}
          {/* Identidad del platillo (lib/dish-identity.ts): si el nombre se parece
              a otro que ya tiene fotos («Pozole rojo» y «Pozole»), se pregunta una
              vez. Sí: se juntan sus fotos. No: no vuelve a salir para ese par. */}
          {!!link && (() => {
            const what = [
              link.foto && !dish.foto ? 'su foto' : null,
              link.customerPhotos ? `${link.customerPhotos.toLocaleString('es-MX')} ${link.customerPhotos === 1 ? 'foto' : 'fotos'} de clientes` : null,
            ].filter(Boolean).join(' y ');
            return (
              <View style={s.linkHint}>
                <Text style={s.linkHintText}>{noWidow(`¿Es el mismo platillo que «${link.name}»?${what ? ` Se juntan ${what}.` : ''}`)}</Text>
                <View style={s.linkActions}>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                    onPress={() => { smoothly(); linkDish(section.id, dish.id, link); Haptics.selectionAsync().catch(() => {}); }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Sí, ${dish.nombre} es el mismo platillo que ${link.name}`}>
                    <Text style={s.hintAction}>Sí, es el mismo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={() => { smoothly(); declineLink(dish, link); }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`No, ${dish.nombre} es otro platillo`}>
                    <Text style={s.linkNo}>No</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })()}
        </View>
        {/* El precio, en la columna de la derecha: «$» en gris mientras no tiene. */}
        <Pressable
          style={s.price}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          onPress={() => focusKey(`p-${dish.id}`)}
          accessibilityRole="button"
          accessibilityLabel={dish.precio ? `Precio de ${dish.nombre || 'platillo'}, ${dish.precio} pesos` : `Agregar precio a ${dish.nombre || 'platillo'}`}>
          <Text style={[s.currency, !!dish.precio && s.currencyOn]}>$</Text>
          <TextInput
            ref={registerInput(`p-${dish.id}`)}
            style={s.priceInput}
            value={dish.precio}
            onChangeText={(precio) => patchDish(section.id, dish.id, { precio: precio.replace(/[^0-9.]/g, '').slice(0, TEXT_LIMITS.dishPrice) })}
            onFocus={onFieldFocus(`p-${dish.id}`)}
            onBlur={() => {
              onFieldBlur(`p-${dish.id}`);
              // Arrepentirse deja el platillo sin precio: vacío o «0» no se guarda.
              if (dish.precio && !Number(dish.precio)) patchDish(section.id, dish.id, { precio: '' });
              dropIfEmpty(section.id, dish.id);
            }}
            keyboardType="decimal-pad"
            returnKeyType="next"
            onSubmitEditing={() => goToNextPrice(`p-${dish.id}`)}
            inputAccessoryViewID={Platform.OS === 'ios' ? BAR_PRICE : undefined}
            selectTextOnFocus
            importantForAccessibility="no"
            accessibilityElementsHidden
          />
        </Pressable>
        </SwipeRow>
      </View>
    );
  };

  const renderSection = (section: Seccion, index: number) => {
    const titleKey = `t-${section.id}`;
    const todayIndex = todaySections.findIndex((item) => item.id === section.id);
    // «Sección» va después de la última tarjeta de hoy y de la última de la carta.
    const lastToday = !section.carta && index === todaySections.length - 1;
    const lastOverall = index === data.secciones.length - 1;
    // Al arrastrar: la tarjeta levantada se queda montada (invisible y, si el
    // hueco está en otro lado, encogida); las demás abren su hueco arriba de ellas.
    const lifted = draggedSectionId === section.id;
    const sectionBefore = data.secciones.slice(0, index).filter((item) => item.id !== draggedSectionId).length;
    const sectionGapAbove = !lifted && !!sectionTarget && sectionTarget.index === sectionBefore;
    const sectionLabel = section.nombre || `la sección ${index + 1}`;
    const remaining = section.platillos.filter((item) => item.id !== draggedDishId).length;
    return (
      // El envoltorio mide la sección dentro de la lista (para moverla y para
      // la barra de secciones).
      <View
        key={section.id}
        collapsable={false}
        style={lifted && !board.atOrigin && s.collapsed}
        onLayout={(event) => {
          sectionY.current[section.id] = event.nativeEvent.layout.y;
          board.onSectionLayout(section.id)(event);
        }}>
        {!lifted && gap(sectionGapAbove, false)}
        <View collapsable={false} style={[s.card, lifted && s.away]}>
          {/* El título también: mantenerlo presionado mueve la sección
              completa; deslizarlo, la elimina (con «Deshacer»). */}
          <SwipeRow
            drag={board.rowFor({ kind: 'section', sectionId: section.id }, HOLD_IN_PLACE_MS).enabled(gesturesOn)}
            enabled={gesturesOn}
            fullSwipe
            actions={[{ label: 'Eliminar', color: c.danger, accessibilityLabel: `Eliminar ${sectionLabel}`, onPress: () => { smoothly(); removeSection(section.id); } }]}
            background={[c.bg]}
            scrollRef={scrollRef}
            onLayout={board.onHeaderLayout(section.id)}
            style={s.head}>
            <View style={s.body}>
              <TextInput
                ref={registerInput(titleKey)}
                style={s.title}
                value={section.nombre}
                onChangeText={(text) => changeTitle(section, text)}
                onFocus={onFieldFocus(titleKey)}
                onBlur={() => { onFieldBlur(titleKey); dropIfEmpty(section.id); }}
                onSubmitEditing={() => submitTitle(section)}
                placeholder={todayIndex === 0 ? firstSectionHint : 'SECCIÓN'}
                placeholderTextColor={c.textMute}
                autoCapitalize="characters"
                multiline
                scrollEnabled={false}
                submitBehavior="submit"
                returnKeyType="next"
                inputAccessoryViewID={Platform.OS === 'ios' ? BAR_TITLE : undefined}
                accessibilityLabel={`Título de la sección ${index + 1}`}
                accessibilityActions={[
                  ...(index > 0 ? [{ name: 'moveUp', label: 'Subir' }] : []),
                  ...(index < data.secciones.length - 1 ? [{ name: 'moveDown', label: 'Bajar' }] : []),
                ]}
                onAccessibilityAction={(event) => {
                  const direction = event.nativeEvent.actionName === 'moveUp' ? -1 : event.nativeEvent.actionName === 'moveDown' ? 1 : 0;
                  if (direction) moveSectionTo(section.id, index + direction);
                }}
              />
            </View>
            {/* «MENÚ DEL DÍA $100», «GUISADOS $85», «CARTA $110». */}
            <Pressable
              style={s.price}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              onPress={() => focusKey(`sp-${section.id}`)}
              accessibilityRole="button"
              accessibilityLabel={section.precio ? `Precio de ${section.nombre || 'la sección'}, ${section.precio} pesos` : `Agregar precio a ${section.nombre || 'la sección'}`}
              accessibilityHint="El precio del menú completo o el de cada platillo de la sección.">
              <Text style={[s.currency, !!section.precio && s.currencyOn]}>$</Text>
              <TextInput
                ref={registerInput(`sp-${section.id}`)}
                style={s.priceInput}
                value={section.precio}
                onChangeText={(precio) => patchSection(section.id, { precio: precio.replace(/[^0-9.]/g, '').slice(0, TEXT_LIMITS.dishPrice) })}
                onFocus={onFieldFocus(`sp-${section.id}`)}
                onBlur={() => {
                  onFieldBlur(`sp-${section.id}`);
                  if (section.precio && !Number(section.precio)) patchSection(section.id, { precio: '' });
                  dropIfEmpty(section.id);
                }}
                keyboardType="decimal-pad"
                returnKeyType="next"
                onSubmitEditing={() => goToNextPrice(`sp-${section.id}`)}
                inputAccessoryViewID={Platform.OS === 'ios' ? BAR_PRICE : undefined}
                selectTextOnFocus
                importantForAccessibility="no"
                accessibilityElementsHidden
              />
            </Pressable>
          </SwipeRow>
          {section.platillos.map((dish, dishIndex) => renderDish(section, dish, dishIndex))}
          {/* Al arrastrar: el hueco al final de la tarjeta (también en una vacía). */}
          {gap(!!dishTarget && dishTarget.sectionId === section.id && dishTarget.index === remaining, remaining > 0)}
          <TouchableOpacity
            style={[s.addDish, !!section.platillos.length && s.addDishDivider]}
            onPress={() => addDishTo(section)}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={`Agregar platillo a ${section.nombre || 'la sección'}`}>
            <Ionicons name="add" size={18} color={c.accent} />
            <Text style={s.addText}>Platillo</Text>
          </TouchableOpacity>
        </View>
        {(lastToday || (lastOverall && !!section.carta)) && (
          <TouchableOpacity
            style={s.addSection}
            onPress={() => addSectionFocused(!!section.carta)}
            activeOpacity={0.6}
            accessibilityRole="button"
            accessibilityLabel={section.carta ? 'Agregar sección a la carta' : 'Agregar sección'}>
            <Ionicons name="add" size={18} color={c.accent} />
            <Text style={s.addText}>Sección</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={s.root}>
      {/* Deslizar para regresar hace lo mismo que «‹» (lo escrito ya está
          guardado); no se permite con cambios sin actualizar en el menú
          publicado hoy (ahí «×» pregunta). */}
      <Stack.Screen options={screenOptions} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="height" enabled={Platform.OS === 'android'}>
        {/* Arriba, como una barra de iOS (HIG, Toolbars): a la izquierda «‹»
            (o «×» en el menú publicado hoy) y el nombre del menú; a la derecha
            la única acción destacada, «Publicar» o «Actualizar». */}
        <View style={[s.nav, { paddingTop: insets.top + 6 }]}>
          <View ref={leaveRef} collapsable={false} style={s.navLead}>
            <GlassIconButton
              icon={live ? 'close' : 'chevron-back'}
              accessibilityLabel={live ? 'Cerrar' : 'Volver a Menús'}
              onPress={leave}
            />
          </View>
          <TextInput
            ref={nombreInputRef}
            style={[s.navTitle, { color: nombre.trim() ? c.text : c.textSecondary }]}
            value={nombre}
            onChangeText={setNombre}
            onFocus={focusNombre}
            onBlur={confirmNombre}
            onSubmitEditing={() => nombreInputRef.current?.blur()}
            placeholder="Nombre del menú"
            placeholderTextColor={c.textMute}
            maxLength={TEXT_LIMITS.menuName}
            maxFontSizeMultiplier={1.2}
            returnKeyType="done"
            accessibilityLabel="Nombre del menú"
          />
          {(() => {
            // Apagado únicamente si no hay un platillo de hoy.
            // El detector informa; no impide enviar el contenido visible.
            const idle = menuEmpty;
            const label = live ? 'Actualizar' : 'Publicar';
            return (
              <View ref={publishRef} collapsable={false}>
              <TouchableOpacity
                style={[s.primary, idle && s.primaryIdle]}
                onPress={onPublishPress}
                disabled={idle || publishing}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 8 }}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={publishing ? (live ? 'Actualizando menú' : 'Publicando menú') : `${label} menú`}
                accessibilityHint={menuEmpty ? 'Escribe al menos un platillo de hoy.' : live ? 'Guarda este menú en tu ficha.' : undefined}
                accessibilityState={{ disabled: idle || publishing, busy: publishing }}
                >
                {/* Mientras publica, el indicador ocupa el lugar del texto: el botón no cambia de tamaño. */}
                <Text style={[s.primaryText, idle && s.primaryTextIdle, publishing && s.invisible]} maxFontSizeMultiplier={1.2}>{label}</Text>
                {publishing && <ActivityIndicator style={StyleSheet.absoluteFill} size="small" color="#fff" />}
              </TouchableOpacity>
              </View>
            );
          })()}
        </View>

        <View style={s.statusRow}>
          <Text style={s.statusText} accessibilityLiveRegion="polite">
            {noWidow(live
              ? changed ? 'Cambios sin publicar' : scheduledFor ? `Programado · ${scheduledFor}` : 'Publicado hoy'
              : draftSaveState === 'error' ? 'No se pudo guardar el borrador'
                : draftSaveState === 'saving' || changed ? 'Guardando borrador…' : draftSaveState === 'saved' ? 'Borrador guardado' : 'Borrador · se guarda solo')}
          </Text>
          {!live && <View ref={scheduleRef} collapsable={false}>
            <TouchableOpacity style={s.scheduleButton} disabled={menuEmpty || publishing} onPress={() => { Keyboard.dismiss(); setScheduleMenu('hold'); }} accessibilityRole="button" accessibilityLabel="Programar menú" accessibilityState={{ disabled: menuEmpty || publishing }}>
              <Ionicons name="time-outline" size={16} color={c.textSecondary} />
              <Text style={s.scheduleText}>Programar</Text>
            </TouchableOpacity>
          </View>}
        </View>

        {data.secciones.length >= 4 && !keyboardOpen && (
          <SectionBar
            names={data.secciones.map((section) => section.nombre)}
            active={activeSection}
            onSelect={jumpToSection}
            colors={{ text: c.text, textSecondary: c.textSecondary, bg: c.bg, border: c.border, glass: theme.glass, isDark: theme.isDark }}
          />
        )}
        {/* La lista y, encima, la copia de lo que arrastras (recortada a la
            lista: nunca tapa la barra de arriba). */}
        <View style={s.listArea}>
          {/* El ScrollView de gesture-handler: cada arrastre lo bloquea
              mientras puede empezar (components/board-drag.tsx). */}
          <GestureScrollView
            ref={scrollRef}
            onLayout={board.onViewportLayout}
            onScroll={(event) => {
              board.onScroll(event);
              scrollY.current = event.nativeEvent.contentOffset.y;
              if (data.secciones.length >= 4) followSections(event.nativeEvent.contentOffset.y);
            }}
            // Desplazar o tocar fuera cierra un «Eliminar» abierto, como en iOS.
            onScrollBeginDrag={() => closeOpenSwipeRow()}
            onTouchStart={(event) => { board.releaseIfOrphaned(); closeSwipeRowOnTouch(event.nativeEvent.pageX, event.nativeEvent.pageY); }}
            scrollEventThrottle={16}
            scrollEnabled={!board.drag}
            automaticallyAdjustKeyboardInsets
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 32 + (lastRemoved ? 64 : 0) }}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Menú programado: cuándo sale. */}
            {!!scheduledFor && (
              <View style={s.retake} accessible accessibilityLabel={`Programado: sale solo ${scheduledFor.toLowerCase()}`}>
                <Ionicons name="time-outline" size={16} color={c.textSecondary} />
                <Text style={s.retakeText}>{noWidow(`Sale solo ${scheduledFor.charAt(0).toLowerCase()}${scheduledFor.slice(1)}`)}</Text>
              </View>
            )}
            {/* Menú leído de una foto: si salió mal, otra foto. */}
            {source === 'foto' && onRetake && (
              <TouchableOpacity style={s.retake} onPress={onRetake} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Tomar otra foto">
                <Ionicons name="camera-outline" size={16} color={c.textSecondary} />
                <Text style={s.retakeText}>Tomar otra foto</Text>
              </TouchableOpacity>
            )}
            {data.secciones.map((section, index) => renderSection(section, index))}
            {/* Al arrastrar: el hueco al final del menú, para una sección que va al último. */}
            {gap(!!sectionTarget && sectionTarget.index === data.secciones.filter((item) => item.id !== draggedSectionId).length, false)}
          </GestureScrollView>
          {board.drag && (
            <ReAnimated.View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[s.ghost, board.drag.kind === 'dish' ? s.ghostRow : s.ghostCard, { top: board.ghostTop }, board.ghostStyle]}>
              {/* El mismo fondo que la tarjeta: el lienzo y encima la superficie. */}
              <View style={[StyleSheet.absoluteFill, s.ghostTint, board.drag.kind === 'dish' ? s.ghostRow : s.ghostCardTint]} />
              {renderGhost(board.drag)}
            </ReAnimated.View>
          )}
        </View>
        {/* Android: la barra va arriba del teclado, dentro de la pantalla. */}
        {Platform.OS === 'android' && keyboardOpen && <View style={s.bar}>{renderBar()}</View>}
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && (
        <>
          <InputAccessoryView nativeID={BAR_TEXT}>
            <View style={s.bar}>
              {barButton('Eliminar', () => barActions.current.remove(), { a11y: 'Eliminar el platillo' })}
              <View style={s.barSpacer} />
              {barIcon('leaf-outline', () => barActions.current.toggleVeggie(), 'Vegetariano: marcar o quitar')}
              {listoKey}
            </View>
          </InputAccessoryView>
          <InputAccessoryView nativeID={BAR_PRICE}>
            <View style={s.bar}>
              {barButton('Siguiente', () => barActions.current.nextPrice(), { icon: 'chevron-down', a11y: 'Siguiente precio' })}
              <View style={s.barSpacer} />
              {listoKey}
            </View>
          </InputAccessoryView>
          <InputAccessoryView nativeID={BAR_TITLE}>
            <View style={s.bar}>{renderTitleBar()}</View>
          </InputAccessoryView>
        </>
      )}

      {/* Deshacer lo último que se eliminó: se va solo a los pocos segundos
          (`UNDO_MS`), al cerrarlo o al eliminar otra cosa. Con el teclado
          abierto, va arriba de él. */}
      {!!lastRemoved && !board.drag && (
        <View style={[s.undoBar, { bottom: keyboardHeight ? keyboardHeight + 8 : insets.bottom + 12 }]} accessibilityLiveRegion="polite">
          <Text style={s.undoText} numberOfLines={1}>
            {`Se eliminó «${lastRemoved.kind === 'section' ? lastRemoved.section.nombre || 'la sección' : lastRemoved.dish.nombre || 'el platillo'}»`}
          </Text>
          <TouchableOpacity onPress={() => { smoothly(); undoRemove(); Haptics.selectionAsync().catch(() => {}); }} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Deshacer">
            <Text style={s.undoAction}>Deshacer</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={dismissUndo} hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Cerrar">
            <Ionicons name="close" size={16} color={c.textMute} />
          </TouchableOpacity>
        </View>
      )}
      <ActionSheet
        visible={!!scheduleMenu}
        anchorRef={scheduleMenu === 'hold' ? scheduleRef : publishRef}
        onDismiss={() => setScheduleMenu(null)}
        options={schedulingOptions}
      />
      <ActionSheet
        visible={!!photoMenu}
        anchorRef={{ current: photoMenu ? photoRefs.current.get(photoMenu.dishId) ?? null : null }}
        title="Foto del platillo"
        onDismiss={closePhotoMenu}
        options={photoOptions}
      />
      {/* «×» con cambios en el menú publicado hoy: ahí mismo, actualizarlo o
          descartar (tocar fuera es seguir editando). */}
      <ActionSheet
        visible={leaveMenu}
        anchorRef={leaveRef}
        title="Tus clientes todavía ven el menú de antes"
        onDismiss={() => setLeaveMenu(false)}
        options={leaveOptions}
      />
    </View>
  );
}

// Un campo y su texto miden lo mismo siempre: sin relleno propio del sistema.
const flat = Platform.select({
  android: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0, includeFontPadding: false, textAlignVertical: 'top' as const },
  default: { paddingTop: 0, paddingBottom: 0, paddingHorizontal: 0 },
});
// Cuadro de la foto (44) + su espacio (12) + la orilla de la tarjeta (16):
// las líneas entre platillos empiezan donde empieza el texto.
const TEXT_INSET = 44 + 12;

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    // Barra de arriba (HIG, Toolbars): «‹» y el nombre a la izquierda;
    // El nombre del menú y, a la derecha, la acción destacada.
    nav: { minHeight: NAV_HEIGHT, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    navLead: { width: 40, minHeight: 44, justifyContent: 'center' },
    navTitle: { flex: 1, minWidth: 0, paddingVertical: 0, fontSize: 17, fontWeight: '700', color: c.textSecondary },
    statusRow: { paddingHorizontal: 20, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
    statusText: { flex: 1, fontSize: 13, lineHeight: 18, color: c.textSecondary, paddingVertical: 8 },
    scheduleButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 5 },
    scheduleText: { fontSize: 14, fontWeight: '600', color: c.textSecondary },
    // «Publicar» / «Actualizar»: cápsula naranja, la única con color.
    primary: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: c.accent },
    primaryIdle: { backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    primaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    primaryTextIdle: { color: c.textMute },
    invisible: { opacity: 0 },
    listArea: { flex: 1, overflow: 'hidden' },
    retake: { minHeight: 36, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    retakeText: { fontSize: 14, fontWeight: '400', color: c.textSecondary },
    soldOutTag: { marginTop: 3, fontSize: 12, lineHeight: 16, fontWeight: '600', color: c.textSecondary },
    nameRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
    nameField: { flex: 1 },
    nameLeaf: { marginTop: 3 },
    // Tarjeta de sección: recorta sus esquinas, así lo que se desliza (la fila
    // y su «Eliminar») queda dentro, como en una lista agrupada de iOS. Lo que
    // se arrastra va en una copia encima de la lista, no dentro.
    card: { marginBottom: 24, backgroundColor: c.bg },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingTop: 8, paddingBottom: 12 },
    title: { ...Type.section, ...flat, margin: 0, color: c.text },
    body: { flex: 1, minWidth: 0 },
    dish: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 10 },
    dishDivider: { position: 'absolute', top: 0, left: TEXT_INSET, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    slot: { width: 44, height: 44, borderRadius: 10, borderCurve: 'continuous', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: c.iconBg },
    dishName: { ...flat, margin: 0, fontSize: 16, fontWeight: '700', color: c.text },
    // Nombre y descripción, una sola unidad.
    description: { ...flat, margin: 0, marginTop: 2, fontSize: 13, fontWeight: '400', color: c.textSecondary },
    price: { minHeight: 20, flexDirection: 'row', alignItems: 'center' },
    currency: { fontSize: 15, fontWeight: '400', color: c.textMute },
    currencyOn: { fontWeight: '700', color: c.text },
    priceInput: { ...flat, margin: 0, minWidth: 4, fontSize: 15, fontWeight: '700', color: c.text, textAlign: 'right' },
    reviewNote: { marginBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewNoteText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '400', color: c.accent },
    hint: { minHeight: 28, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    hintAction: { flexShrink: 1, fontSize: 13, lineHeight: 17, fontWeight: '700', color: c.accent },
    linkHint: { marginTop: 6, gap: 4 },
    linkHintText: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: c.textSecondary },
    linkActions: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 20 },
    linkNo: { fontSize: 13, lineHeight: 17, fontWeight: '400', color: c.textSecondary },
    // «Platillo» al final de cada tarjeta; «Sección» debajo de la última.
    addDish: { minHeight: 46, flexDirection: 'row', alignItems: 'center', gap: 4 },
    addDishDivider: {},
    addSection: { minHeight: 44, marginTop: -4, marginBottom: 14, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    addText: { fontSize: 15, fontWeight: '700', color: c.accent },
    // Al arrastrar: lo levantado deja su lugar (invisible) y, si el hueco está
    // en otro lado, se encoge; la copia que sigue al dedo va encima de la lista.
    collapsed: { height: 0, overflow: 'hidden' },
    away: { opacity: 0 },
    // La copia: el mismo fondo que la tarjeta (lienzo + superficie, opaco
    // también en oscuro) y una sombra que aparece al levantar
    // (`ghostStyle` anima su opacidad).
    ghost: {
      position: 'absolute', top: 0, left: 20, right: 20, backgroundColor: c.bg,
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, elevation: 8,
    },
    ghostTint: { backgroundColor: c.bg },
    ghostRow: { borderRadius: 12, borderCurve: 'continuous' },
    ghostCard: {},
    ghostCardTint: {},
    // Barra sobre el teclado: lo del campo donde estás y «Listo».
    bar: { minHeight: 44, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', backgroundColor: c.surface2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    barButton: { minHeight: 44, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4 },
    barText: { fontSize: 16, fontWeight: '400', color: c.text },
    barDone: { fontSize: 16, fontWeight: '700', color: c.accent },
    barSpacer: { flex: 1 },
    barChips: { alignItems: 'center', gap: 8, paddingHorizontal: 6 },
    barChip: { minHeight: 32, paddingHorizontal: 12, borderRadius: 100, justifyContent: 'center', backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    barChipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: c.text },
    undoBar: { position: 'absolute', left: 16, right: 16, minHeight: 48, paddingHorizontal: 16, borderRadius: 24, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: c.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    undoText: { flex: 1, fontSize: 15, fontWeight: '400', color: c.text },
    undoAction: { fontSize: 15, fontWeight: '700', color: c.accent },
  });
}
