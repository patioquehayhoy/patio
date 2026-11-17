import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { GestureDetector, ScrollView as GestureScrollView } from 'react-native-gesture-handler';
import ReAnimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cleanMenu, emptyMenu, useFonderoMenuDraftController } from '@/lib/controllers/useFonderoMenuDraftController';
import { splitCarta } from '@/lib/menu-carta';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { canonicalSeccion, cartaSugerencias, getTipoNegocio, seccionSugerencias, type MenuData, type Platillo, type Seccion } from '@/lib/menu-store';
import { useTheme } from '@/lib/theme';
import { ActionSheet } from '@/components/action-sheet';
import { SectionBar } from '@/components/section-bar';
import { useBoardDrag } from '@/components/board-drag';
import { mergeDescription, suggestDishSplit } from '@/lib/dish-split';
import { noWidow } from '@/lib/typography';
import { TEXT_LIMITS } from '@/lib/text-limits';
import { DishPhotoPermissionError, pickDishPhoto, uploadDishPhoto } from '@/lib/dish-photo';
import { getFonditaId } from '@/lib/user-store';

// Editor con tarjetas (2026-11-16, noche; docs/EDITOR_MENU_INVESTIGACION_2026-11-16.md).
// - Cada sección es una tarjeta: su título y su precio arriba, sus platillos
//   adentro y «Platillo» al final, para llenar en cualquier orden (de la sopa
//   al guisado y de regreso).
// - Cada platillo tiene siempre sus cuatro lugares: la foto a la izquierda, el
//   nombre, la descripción debajo y el precio a la derecha. Lo vacío se ve en
//   gris: se ve que se puede llenar.
// - Escribir no mueve nada: cada campo está siempre en su lugar.
// - Sobre el teclado, lo del campo donde estás («Borrar», «Siguiente»,
//   títulos sugeridos) y «Listo».
// - Arriba: «Ordenar» (modo con manijas para mover y botón rojo para borrar)
//   y «Listo» (guarda y cierra). Jev, 16 nov: «Listo» 53 % frente a «×» 29 %;
//   modo «Ordenar» 61 % frente a mantener presionado 38 %.
// Una barra sobre el teclado por tipo de campo. Cada una trae sus botones
// fijos (en un precio, «Siguiente» siempre está): no dependen de que la barra
// se vuelva a dibujar al pasar de un campo a otro.
const BAR_TEXT = 'menu-bar-text';
const BAR_PRICE = 'menu-bar-price';
const BAR_TITLE = 'menu-bar-title';
const NAV_HEIGHT = 54;
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
    canSaveDraft,
    data,
    declineLink,
    dismissUndo,
    fillKnownPhotos,
    hasUnsavedChanges,
    insertDishAfter,
    lastRemoved,
    linkDish,
    linkSuggestion,
    moveDishTo,
    moveSectionTo,
    nombre,
    patchDish,
    patchSection,
    publish,
    publishing,
    removeDish,
    removeSection,
    saveDraft,
    saveNombre,
    setDishPhoto,
    setNombre,
    undoRemove,
  } = useFonderoMenuDraftController(initialData, source);
  const dataRef = useRef(data);
  dataRef.current = data;
  // Solo se anima lo que llega o se va (un platillo, una sección).
  const smoothly = () => LayoutAnimation.configureNext(LayoutAnimation.create(180, 'easeInEaseOut', 'opacity'));

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
  // El botón dice qué falta en vez de fallar al tocarlo.
  const menuEmpty = !splitCarta(cleanMenu(data)).hoy.secciones.some((section) => section.platillos.length);

  // ─── Nombre del menú (nav) ───────────────────────────────────────────────
  // Como el título de una nota: se guarda al salir del campo.
  const nombreInputRef = useRef<TextInput | null>(null);
  const nombreOnFocus = useRef('');
  const focusNombre = () => { nombreOnFocus.current = nombre; };
  const confirmNombre = async () => {
    if (nombre === nombreOnFocus.current) return;
    await saveNombre();
  };

  // ─── Ordenar ─────────────────────────────────────────────────────────────
  // «Ordenar» arriba: cada platillo y cada título muestran un botón rojo para
  // borrar y su manija (≡) para moverlos (components/board-drag.tsx). Escribir
  // y ordenar son dos momentos distintos: así ningún gesto pelea con el texto.
  const [ordering, setOrdering] = useState(false);
  const startOrdering = () => {
    Keyboard.dismiss();
    smoothly();
    setOrdering(true);
    Haptics.selectionAsync().catch(() => {});
  };
  const sectionY = useRef<Record<string, number>>({});
  const board = useBoardDrag({
    sections: data.secciones,
    scrollRef,
    onMoveDish: (dishId, toSectionId, toIndex) => { smoothly(); moveDishTo(dishId, toSectionId, toIndex); },
    onMoveSection: (sectionId, toIndex) => { smoothly(); moveSectionTo(sectionId, toIndex); },
  });
  // Con VoiceOver, «Subir» y «Bajar» hacen lo mismo que arrastrar un lugar.
  const nudgeDish = (sectionId: string, dishId: string, direction: -1 | 1) => {
    const sectionIndex = data.secciones.findIndex((section) => section.id === sectionId);
    const section = data.secciones[sectionIndex];
    const index = section?.platillos.findIndex((dish) => dish.id === dishId) ?? -1;
    if (!section || index < 0) return;
    const next = index + direction;
    if (next >= 0 && next < section.platillos.length) { smoothly(); moveDishTo(dishId, sectionId, next); return; }
    const neighbor = data.secciones[sectionIndex + direction];
    if (neighbor) { smoothly(); moveDishTo(dishId, neighbor.id, direction < 0 ? neighbor.platillos.length : 0); }
  };

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
  // «Borrar» sobre el teclado: se va el platillo y el cursor pasa al de abajo
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

  // ─── Listo ───────────────────────────────────────────────────────────────
  // «Listo» arriba a la derecha: en Ordenar, termina de ordenar; si no, guarda
  // lo escrito y cierra (Jev: es con lo que más seguro se siente el negocio de
  // no perder nada). Publicar sigue siendo la cápsula naranja de abajo.
  const done = () => {
    if (ordering) { smoothly(); setOrdering(false); return; }
    Keyboard.dismiss();
    if (!hasUnsavedChanges()) { onBack(); return; }
    if (canSaveDraft) { void saveDraft().then((saved) => { if (saved) onBack(); }); return; }
    // Sin un platillo de hoy no hay qué guardar: lo demás se perdería.
    Alert.alert(noWidow('¿Salir sin guardar?'), noWidow('Para guardar, escribe al menos un platillo de hoy.'), [
      { text: 'Seguir escribiendo', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: onBack },
    ]);
  };

  // ─── Barra sobre el teclado ──────────────────────────────────────────────
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
          {barButton('Borrar', () => deleteFocusedSection(section), { a11y: `Borrar la sección ${section.nombre || ''}`.trim() })}
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
        {barButton('Borrar', () => deleteFocusedDish(found.section, found.dish), { a11y: `Borrar ${found.dish.nombre || 'platillo'}` })}
        <View style={s.barSpacer} />
        {doneKey}
      </>
    );
  };

  // Lo que hacen los botones de las barras del teclado, siempre con el campo y
  // el menú de este momento.
  const barActions = useRef({ nextPrice: () => {}, remove: () => {}, pickTitle: (_name: string) => {} });
  barActions.current = {
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
  // Barra de un título: vacío, los títulos sugeridos; con nombre, «Borrar».
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
        {barButton('Borrar', () => barActions.current.remove(), { a11y: 'Borrar la sección' })}
        <View style={s.barSpacer} />
        {listoKey}
      </>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  // Botón rojo de borrar y manija de mover, en el modo Ordenar.
  const removeButton = (label: string, onPress: () => void) => (
    <TouchableOpacity style={s.minus} onPress={onPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={label}>
      <View style={s.minusCircle}><View style={s.minusBar} /></View>
    </TouchableOpacity>
  );
  const moveHandle = (item: Parameters<typeof board.handleFor>[0], label: string, onUp: () => void, onDown: () => void) => (
    <GestureDetector gesture={board.handleFor(item)}>
      <View
        style={s.handle}
        collapsable={false}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={`Mover ${label}`}
        accessibilityActions={[{ name: 'increment', label: 'Bajar' }, { name: 'decrement', label: 'Subir' }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === 'decrement') onUp();
          if (event.nativeEvent.actionName === 'increment') onDown();
        }}>
        <Ionicons name="reorder-three" size={24} color={c.textMute} />
      </View>
    </GestureDetector>
  );

  const renderDish = (section: Seccion, dish: Platillo, index: number) => {
    const nameKey = `n-${dish.id}`;
    const dragging = board.drag?.kind === 'dish' && board.drag.dishId === dish.id;
    const busy = !!photoBusy[dish.id];
    if (ordering) {
      return (
        <ReAnimated.View
          key={dish.id}
          style={[s.dish, s.orderRow, dragging && [s.dragging, board.dragStyle]]}
          onLayout={board.onDishLayout(dish.id)}>
          {index > 0 && !dragging && <View pointerEvents="none" style={s.orderDivider} />}
          {removeButton(`Borrar ${dish.nombre || 'platillo'}`, () => { smoothly(); removeDish(section.id, dish.id); })}
          {/* En Ordenar no se escribe: todo el renglón se arrastra. */}
          <GestureDetector gesture={board.rowFor({ kind: 'dish', dishId: dish.id, sectionId: section.id })}>
            <View style={s.orderGrab} collapsable={false}>
              <View style={s.body}>
                <Text style={s.dishName}>{dish.nombre || 'Platillo'}</Text>
                {!!dish.descripcion && <Text style={s.description} numberOfLines={1}>{dish.descripcion}</Text>}
              </View>
              {!!dish.precio && <Text style={[s.currency, s.currencyOn]}>{`$${dish.precio}`}</Text>}
            </View>
          </GestureDetector>
          {moveHandle({ kind: 'dish', dishId: dish.id, sectionId: section.id }, dish.nombre || 'platillo', () => nudgeDish(section.id, dish.id, -1), () => nudgeDish(section.id, dish.id, 1))}
        </ReAnimated.View>
      );
    }
    const split = !keyboardOpen ? suggestDishSplit(dish.nombre) : null;
    const link = !keyboardOpen ? linkSuggestion(dish) : null;
    return (
      <View key={dish.id} style={s.dish} onLayout={board.onDishLayout(dish.id)}>
        {index > 0 && <View pointerEvents="none" style={s.dishDivider} />}
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
              ? <Image source={{ uri: dish.foto }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
              : <Ionicons name="camera-outline" size={19} color={c.textMute} />}
        </Pressable>
        <View style={s.body}>
          {!!dish.revision && !/precio|\$|importe/i.test(dish.revision) && (
            <View style={s.reviewNote}>
              <Ionicons name="alert-circle-outline" size={13} color={c.accent} />
              <Text style={s.reviewNoteText}>{dish.revision}</Text>
            </View>
          )}
          <TextInput
            ref={registerInput(nameKey)}
            style={s.dishName}
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
            accessibilityLabel={dish.nombre ? `Platillo ${dish.nombre}` : 'Platillo nuevo'}
          />
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
      </View>
    );
  };

  const renderSection = (section: Seccion, index: number) => {
    const titleKey = `t-${section.id}`;
    const todayIndex = todaySections.findIndex((item) => item.id === section.id);
    const draggingSection = board.drag?.kind === 'section' && board.drag.sectionId === section.id;
    const holdsDraggedDish = board.drag?.kind === 'dish' && board.drag.sectionId === section.id;
    // «Sección» va después de la última tarjeta de hoy y de la última de la carta.
    const lastToday = !section.carta && index === todaySections.length - 1;
    const lastOverall = index === data.secciones.length - 1;
    return (
      // El envoltorio mide la sección dentro de la lista (para ordenar y para
      // la barra de secciones) y la pone encima de las demás mientras se mueve.
      <View
        key={section.id}
        style={[holdsDraggedDish && s.raised, draggingSection && s.lifted]}
        onLayout={(event) => {
          sectionY.current[section.id] = event.nativeEvent.layout.y;
          board.onSectionLayout(section.id)(event);
        }}>
        <ReAnimated.View style={[s.card, draggingSection && [s.cardDragging, board.dragStyle]]}>
          {ordering ? (
            <View style={[s.head, s.orderRow]} onLayout={board.onHeaderLayout(section.id)}>
              {removeButton(`Borrar la sección ${section.nombre || index + 1}`, () => { smoothly(); removeSection(section.id); })}
              <GestureDetector gesture={board.rowFor({ kind: 'section', sectionId: section.id })}>
                <View style={s.orderGrab} collapsable={false}>
                  <View style={s.body}>
                    <Text style={[s.title, !section.nombre && { color: c.textMute }]}>{section.nombre || (todayIndex === 0 ? firstSectionHint : 'SECCIÓN')}</Text>
                  </View>
                  {!!section.precio && <Text style={[s.currency, s.currencyOn]}>{`$${section.precio}`}</Text>}
                </View>
              </GestureDetector>
              {moveHandle({ kind: 'section', sectionId: section.id }, section.nombre || 'la sección',
                () => { if (index > 0) { smoothly(); moveSectionTo(section.id, index - 1); } },
                () => { if (index < data.secciones.length - 1) { smoothly(); moveSectionTo(section.id, index + 1); } })}
            </View>
          ) : (
            <View style={s.head} onLayout={board.onHeaderLayout(section.id)}>
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
            </View>
          )}
          {section.platillos.map((dish, dishIndex) => renderDish(section, dish, dishIndex))}
          {!ordering && (
            <TouchableOpacity
              style={[s.addDish, !!section.platillos.length && s.addDishDivider]}
              onPress={() => addDishTo(section)}
              activeOpacity={0.6}
              accessibilityRole="button"
              accessibilityLabel={`Agregar platillo a ${section.nombre || 'la sección'}`}>
              <Ionicons name="add" size={18} color={c.accent} />
              <Text style={s.addText}>Platillo</Text>
            </TouchableOpacity>
          )}
        </ReAnimated.View>
        {!ordering && (lastToday || (lastOverall && !!section.carta)) && (
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
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="height" enabled={Platform.OS === 'android'}>
        {/* Arriba: «Ordenar» a la izquierda, el nombre del menú y «Listo» a la
            derecha (guarda y cierra; en Ordenar, termina de ordenar). */}
        <View style={[s.nav, { paddingTop: insets.top + 6 }]}>
          {ordering ? <View style={s.navSide} /> : (
            <TouchableOpacity style={s.navSide} onPress={startOrdering} hitSlop={{ top: 8, bottom: 8 }} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Ordenar el menú">
              <Text style={s.navText}>Ordenar</Text>
            </TouchableOpacity>
          )}
          <TextInput
            ref={nombreInputRef}
            style={[s.navTitle, { color: nombre.trim() ? c.text : c.textSecondary }]}
            value={nombre}
            onChangeText={setNombre}
            onFocus={focusNombre}
            onBlur={confirmNombre}
            onSubmitEditing={() => nombreInputRef.current?.blur()}
            editable={!ordering}
            placeholder="Nombre del menú"
            placeholderTextColor={c.textMute}
            maxLength={TEXT_LIMITS.menuName}
            returnKeyType="done"
            accessibilityLabel="Nombre del menú"
          />
          <TouchableOpacity style={[s.navSide, s.navSideEnd]} onPress={done} hitSlop={{ top: 8, bottom: 8 }} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel={ordering ? 'Terminar de ordenar' : 'Listo: guardar y cerrar'}>
            <Text style={s.navDone}>Listo</Text>
          </TouchableOpacity>
        </View>

        {data.secciones.length >= 4 && !keyboardOpen && (
          <SectionBar
            names={data.secciones.map((section) => section.nombre)}
            active={activeSection}
            onSelect={jumpToSection}
            colors={{ text: c.text, textSecondary: c.textSecondary, bg: c.bg, border: c.border, glass: theme.glass, isDark: theme.isDark }}
          />
        )}
        {/* El ScrollView de gesture-handler: cada arrastre de Ordenar lo bloquea
            mientras puede empezar (components/board-drag.tsx). */}
        <GestureScrollView
          ref={scrollRef}
          onLayout={board.onViewportLayout}
          onScroll={(event) => {
            board.onScroll(event);
            scrollY.current = event.nativeEvent.contentOffset.y;
            if (data.secciones.length >= 4) followSections(event.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
          scrollEnabled={!board.drag}
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: insets.bottom + 32 + (lastRemoved ? 64 : 0) }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Menú leído de una foto: si salió mal, otra foto. */}
          {source === 'foto' && onRetake && !ordering && (
            <TouchableOpacity style={s.retake} onPress={onRetake} activeOpacity={0.6} accessibilityRole="button" accessibilityLabel="Tomar otra foto">
              <Ionicons name="camera-outline" size={16} color={c.textSecondary} />
              <Text style={s.retakeText}>Tomar otra foto</Text>
            </TouchableOpacity>
          )}
          {board.lineY != null && <View pointerEvents="none" style={[s.dropLine, { top: board.lineY - 1 }]} />}
          {data.secciones.map((section, index) => renderSection(section, index))}

          {/* La única acción prominente: publicar (cápsula naranja). «Listo»,
              arriba, guarda sin publicar. */}
          {!ordering && (
            <View style={s.actionsBlock}>
              <TouchableOpacity
                style={[s.publishButton, menuEmpty && s.publishIdle]}
                onPress={publish}
                disabled={publishing || menuEmpty}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel={publishing ? 'Publicando menú' : menuEmpty ? 'Falta un platillo' : 'Publicar menú'}
                accessibilityState={{ disabled: publishing || menuEmpty, busy: publishing }}>
                {publishing && <ActivityIndicator size="small" color="#fff" />}
                <Text style={[s.publishText, menuEmpty && { color: c.textSecondary }]}>{noWidow(publishing ? 'Publicando…' : menuEmpty ? 'Falta un platillo' : 'Publicar menú')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </GestureScrollView>
        {/* Android: la barra va arriba del teclado, dentro de la pantalla. */}
        {Platform.OS === 'android' && keyboardOpen && <View style={s.bar}>{renderBar()}</View>}
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && (
        <>
          <InputAccessoryView nativeID={BAR_TEXT}>
            <View style={s.bar}>
              {barButton('Borrar', () => barActions.current.remove(), { a11y: 'Borrar el platillo' })}
              <View style={s.barSpacer} />
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

      {/* Deshacer lo último que se borró: se queda hasta que lo regresas, lo
          cierras o borras otra cosa (sin temporizador). Con el teclado abierto,
          va arriba de él. */}
      {!!lastRemoved && !board.drag && (
        <View style={[s.undoBar, { bottom: keyboardHeight ? keyboardHeight + 8 : insets.bottom + 12 }]} accessibilityLiveRegion="polite">
          <Text style={s.undoText} numberOfLines={1}>
            {`Se borró «${lastRemoved.kind === 'section' ? lastRemoved.section.nombre || 'la sección' : lastRemoved.dish.nombre || 'el platillo'}»`}
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
        visible={!!photoMenu}
        anchorRef={{ current: photoMenu ? photoRefs.current.get(photoMenu.dishId) ?? null : null }}
        title="Foto del platillo"
        onDismiss={closePhotoMenu}
        options={photoOptions}
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
const TEXT_INSET = 16 + 44 + 12;

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    nav: { minHeight: NAV_HEIGHT, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    // Lados del nav del mismo ancho: el nombre del menú queda centrado.
    navSide: { minWidth: 72, minHeight: 44, justifyContent: 'center' },
    navSideEnd: { alignItems: 'flex-end' },
    navText: { fontSize: 16, fontWeight: '400', color: c.text },
    navDone: { fontSize: 16, fontWeight: '700', color: c.accent },
    navTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: c.textSecondary },
    retake: { minHeight: 36, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
    retakeText: { fontSize: 14, fontWeight: '400', color: c.textSecondary },
    // Tarjeta de sección: sin recortar, para que lo que se arrastra salga de ella.
    card: { marginBottom: 14, borderRadius: 18, borderCurve: 'continuous', backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    head: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingTop: 13, paddingBottom: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    title: { ...flat, margin: 0, fontSize: 14, fontWeight: '700', letterSpacing: 0.6, color: c.text },
    body: { flex: 1, minWidth: 0 },
    dish: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 16, paddingVertical: 10 },
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
    addDish: { minHeight: 46, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 4 },
    addDishDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    addSection: { minHeight: 44, marginTop: -4, marginBottom: 14, paddingHorizontal: 4, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    addText: { fontSize: 15, fontWeight: '700', color: c.accent },
    // Lo que se arrastra se levanta un poco, sobre lo demás.
    dragging: {
      zIndex: 20, backgroundColor: c.surface, borderRadius: 14, borderCurve: 'continuous',
      shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    cardDragging: { shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
    raised: { zIndex: 10 },
    lifted: { zIndex: 20 },
    // Dónde caerá: línea de acento dentro de la tarjeta.
    dropLine: { position: 'absolute', left: 32, right: 32, height: 2, borderRadius: 1, backgroundColor: c.accent, zIndex: 30 },
    // Modo Ordenar: botón rojo para borrar a la izquierda, manija a la derecha.
    orderRow: { alignItems: 'center' },
    orderDivider: { position: 'absolute', top: 0, left: 16 + 22 + 12, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    minus: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
    minusCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: c.danger, alignItems: 'center', justifyContent: 'center' },
    minusBar: { width: 10, height: 2, borderRadius: 1, backgroundColor: '#fff' },
    orderGrab: { flex: 1, minWidth: 0, minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 10 },
    handle: { width: 44, height: 44, marginRight: -10, alignItems: 'center', justifyContent: 'center' },
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
    actionsBlock: { marginTop: 18, alignItems: 'center', gap: 8 },
    publishButton: { alignSelf: 'stretch', minHeight: 54, borderRadius: 27, borderCurve: 'continuous', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.accent },
    // Falta algo (gris, dice qué), listo (naranja), publicando (naranja con indicador).
    publishIdle: { backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    publishText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
}
