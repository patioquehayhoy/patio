import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  InputAccessoryView,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  LayoutAnimation,
  Linking,
} from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import ReAnimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cleanMenu, emptyMenu, useFonderoMenuDraftController } from '@/lib/controllers/useFonderoMenuDraftController';
import { splitCarta } from '@/lib/menu-carta';
import { fonderoPalette, type FonderoColors } from '@/lib/fondero-palette';
import { getTipoNegocio, seccionSugerencias, type MenuData, type Platillo, type Seccion } from '@/lib/menu-store';
import { useTheme } from '@/lib/theme';
import { ActionSheet } from '@/components/action-sheet';
import { SectionBar } from '@/components/section-bar';
import { useBoardDrag } from '@/components/board-drag';
import { mergeDescription, suggestDishSplit } from '@/lib/dish-split';
import { GlassIconButton } from '@/components/glass-button';
import { noWidow } from '@/lib/typography';
import { TEXT_LIMITS } from '@/lib/text-limits';
import { DishPhotoPermissionError, pickDishPhoto, uploadDishPhoto } from '@/lib/dish-photo';
import { getFonditaId } from '@/lib/user-store';

const PRICE_ACCESSORY = 'dish-price-keyboard';
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
    addDish,
    addSection,
    data,
    details,
    dismissUndo,
    fillKnownPhotos,
    declineLink,
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
    revealDetails,
    saveDraft,
    saveNombre,
    savedFlash,
    sectionSuggestions,
    setDishPhoto,
    setNombre,
    undoRemove,
  } = useFonderoMenuDraftController(initialData, source);

  // Foto del platillo (2026-11-15): opcional. La gente la ve en la ficha al
  // mantener presionado el platillo. Se sube al elegirla; no espera a publicar.
  const photoRefs = useRef<Map<string, View | null>>(new Map());
  const [photoMenu, setPhotoMenu] = useState<{ sectionId: string; dishId: string } | null>(null);
  const [photoBusy, setPhotoBusy] = useState<Record<string, boolean>>({});
  const photoTarget = photoMenu
    ? data.secciones.find((section) => section.id === photoMenu.sectionId)?.platillos.find((dish) => dish.id === photoMenu.dishId) ?? null
    : null;
  const choosePhoto = async (sectionId: string, dish: Platillo, source: 'camera' | 'library') => {
    setPhotoMenu(null);
    if (!getFonditaId()) {
      Alert.alert(noWidow('Primero entra a tu negocio'), noWidow('Inicia sesión para poner fotos de tus platillos.'));
      return;
    }
    try {
      const asset = await pickDishPhoto(source);
      if (!asset) return;
      setPhotoBusy((current) => ({ ...current, [dish.id]: true }));
      const uploaded = await uploadDishPhoto(asset, dish.nombre);
      setDishPhoto(sectionId, dish.id, { foto: uploaded.url, ...(uploaded.hash ? { fotoHash: uploaded.hash } : {}) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      if (error instanceof DishPhotoPermissionError) {
        Alert.alert(
          noWidow(source === 'camera' ? 'Patio no tiene acceso a la cámara' : 'Patio no tiene acceso a tus fotos'),
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
    ...(photoTarget.foto ? [{ label: 'Quitar foto', icon: 'trash-outline' as const, destructive: true, onPress: () => { setDishPhoto(photoMenu.sectionId, photoTarget.id, null); setPhotoMenu(null); } }] : []),
  ] : [];
  // El botón dice qué falta en vez de fallar al tocarlo.
  const menuEmpty = !splitCarta(cleanMenu(data)).hoy.secciones.some((section) => section.platillos.length);

  // Palomita al salir del campo de nombre — mismo ícono que el check de
  // "Guardado" del botón Guardar (abajo), pero sin su auto-ocultado por
  // temporizador: si la persona no volvía a mirar el nav en esos ~2
  // segundos, la confirmación desaparecía sola sin que nadie la viera
  // (ruido reportado 2026-09-06). Como es un GlassIconButton real (se ve
  // tocable), tenía que responder al toque de verdad — Apple: un control
  // interactivo sin reacción al tocarlo es un control roto, no uno
  // discreto. Se resuelve por evento real, nunca por timer:
  // - Toca la palomita → confirma que la vio y desaparece (con háptico).
  // - Vuelve a entrar al campo a editar → desaparece también (ya no aplica).
  // Dos casos más, como en Notas de Apple:
  // - Si BORRASTE el nombre, se guarda igual (para que el placeholder
  //   "Nuevo menú" se quede así al reabrir, no reaparezca el nombre viejo)
  //   pero SIN palomita — no hay nada positivo que confirmar al vaciar algo.
  // - Si no cambió nada desde que entraste al campo (solo tocaste y saliste),
  //   no se guarda ni se anima — Apple no da feedback cuando no pasó nada.
  const nombreInputRef = useRef<TextInput | null>(null);
  const nombreOnFocus = useRef('');
  const [nombreSaved, setNombreSaved] = useState(false);
  const focusNombre = () => {
    nombreOnFocus.current = nombre;
    setNombreSaved(false);
  };
  const confirmNombre = async () => {
    if (nombre === nombreOnFocus.current) return;
    const saved = await saveNombre();
    if (saved && nombre.trim()) setNombreSaved(true);
  };

  // Índice lateral de secciones (como las letras de Contactos) para menús
  // largos: salta a cada sección. Se esconde con el teclado abierto.
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  // Mantener presionado y mover (components/board-drag.tsx): platillos a
  // cualquier lugar y secciones completas, sin «···» ni flechas.
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
  // El título de una sección se muestra como texto (se sostiene para moverla)
  // y se vuelve campo al tocarlo, igual que el nombre de un platillo.
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', () => { smoothly(); setKeyboardOpen(true); });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => { smoothly(); setKeyboardOpen(false); });
    return () => { show.remove(); hide.remove(); };
  }, []);
  // Barra de secciones: marca la sección en pantalla y lleva a la que toques.
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);
  const followSections = (scrollY: number) => {
    let current = 0;
    data.secciones.forEach((section, index) => {
      const y = sectionY.current[section.id];
      if (y != null && y <= scrollY + 16) current = index;
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

  // Revelación progresiva: las sugerencias de sección son secundarias una vez
  // que ya hay secciones armadas — no compiten por espacio con el contenido
  // (Apple HIG: "essential info gets sufficient space, don't crowd it").
  const [showSectionSuggestions, setShowSectionSuggestions] = useState(false);

  // Cadena de foco: "siguiente" recorre platillo → descripción → siguiente
  // platillo. El precio se toca aparte (cambia de vez en cuando, no es parte
  // del ritmo de captura). Claves: `n-{dishId}` nombre · `d-{dishId}` detalle.
  const inputRefs = useRef<Record<string, TextInput | null>>({});
  const pendingFocus = useRef<string | null>(null);
  const registerInput = (key: string) => (ref: TextInput | null) => {
    inputRefs.current[key] = ref;
    if (ref && pendingFocus.current === key) {
      pendingFocus.current = null;
      requestAnimationFrame(() => ref.focus());
    }
  };
  // Un nombre que no se está editando se muestra en una línea; para enfocarlo
  // primero vuelve a ser campo y el foco cae al montarse.
  const focusKey = (key: string) => {
    const ref = inputRefs.current[key];
    if (ref) { ref.focus(); return; }
    pendingFocus.current = key;
    if (key.startsWith('n-')) { smoothly(); setEditingName(key.slice(2)); }
    if (key.startsWith('t-')) { smoothly(); setEditingSection(key.slice(2)); }
  };
  // Menú nuevo y vacío, hecho a mano: el cursor espera en el primer platillo.
  // La pantalla dice por dónde empezar sin pasos ni instrucciones (se pensó
  // en un recorrido por pasos y se descartó: el menú se publica a diario y
  // cada paso extra se pagaría todos los días).
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
  // Nombre largo: completo mientras se escribe, en una línea con «…» al salir,
  // como el campo de un chat. El precio propio aparece solo si se pide o si ya
  // tiene valor, igual que la descripción («Agregar precio», «Agregar descripción»).
  const [editingName, setEditingName] = useState<string | null>(null);
  const [priceOpen, setPriceOpen] = useState<Record<string, boolean>>({});
  const smoothly = () => LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
  const openPrice = (dishId: string) => {
    const ref = inputRefs.current[`p-${dishId}`];
    if (ref) { ref.focus(); return; }
    smoothly();
    pendingFocus.current = `p-${dishId}`;
    setPriceOpen((current) => ({ ...current, [dishId]: true }));
  };
  // Precios en fila: sobre el teclado, «Siguiente» pasa al precio del platillo
  // de abajo (sirve para llenar varios o saltarse uno) y «Listo» cierra (para
  // cambiar solo uno). En Android, la tecla de acción del teclado hace «Siguiente».
  const [priceFocus, setPriceFocus] = useState<string | null>(null);
  // Precio de la sección: su «$» siempre está junto al título, como el de cada
  // platillo; al tocarlo se escribe.
  const [sectionPriceOpen, setSectionPriceOpen] = useState<Record<string, boolean>>({});
  const openSectionPrice = (sectionId: string) => {
    smoothly();
    pendingFocus.current = `sp-${sectionId}`;
    setSectionPriceOpen((current) => ({ ...current, [sectionId]: true }));
  };
  const priceOrder = () => data.secciones.flatMap((section) => section.platillos.map((dish) => dish.id));
  const nextPriceDish = (dishId: string | null) => {
    if (!dishId) return undefined;
    const order = priceOrder();
    return order[order.indexOf(dishId) + 1];
  };
  const goToNextPrice = (dishId: string | null) => {
    const next = nextPriceDish(dishId);
    if (next) openPrice(next); else Keyboard.dismiss();
  };

  const addDishFocused = (section: Seccion) => {
    pendingFocus.current = `n-${addDish(section)}`;
  };

  const submitDishName = (dish: Platillo) => {
    // Siempre pasa a la descripción del mismo platillo; si aún no existe el
    // campo, se revela y el foco cae ahí al montarse.
    const showDetails = details[dish.id] || !!dish.descripcion;
    if (showDetails) {
      focusKey(`d-${dish.id}`);
    } else {
      pendingFocus.current = `d-${dish.id}`;
      revealDetails(dish.id);
    }
  };

  const submitDishDetail = (section: Seccion, dishIndex: number) => {
    const next = section.platillos[dishIndex + 1];
    if (next) focusKey(`n-${next.id}`);
    else addDishFocused(section);
  };

  // Lo de hoy arriba y la carta (lo de siempre) abajo, como en el pizarrón:
  // «MENÚ $100» y «CARTA $110». Mismo renglón de sección para los dos.
  const dailySections = data.secciones.filter((section) => !section.carta);
  const cartaSections = data.secciones.filter((section) => section.carta);
  // El editor es un pizarrón (2026-11-16, Parco): solo secciones, cada una con
  // su título y su precio («MENÚ DEL DÍA $100», «GUISADOS», «CARTA $110»).
  // Sin bloques ni etiquetas aparte: lo que queda abajo de «CARTA» es la carta
  // y se queda para los días que siguen (lib/menu-carta.ts, cartaByHeading).
  const cartaHeadingId = cartaSections[0]?.id ?? null;
  // La primera sección sugiere su título: «MENÚ DEL DÍA» en la comida corrida
  // y, en los demás giros, el de sus sugerencias («TACOS»…).
  const firstSectionHint = MENU_PRICE_TYPES.has(getTipoNegocio() ?? '')
    ? 'MENÚ DEL DÍA'
    : seccionSugerencias(getTipoNegocio())[0] ?? 'MENÚ DEL DÍA';
  const addCartaSection = () => {
    smoothly();
    const first = !cartaSections.length;
    const id = addSection(first ? 'CARTA' : '', true);
    // «CARTA» nace con su precio listo para escribirse («CARTA $110»); los
    // platillos de la carta solo llevan el suyo si cambia.
    if (first) openSectionPrice(id);
  };
  const renderSection = (section: Seccion, sectionIndex: number) => {
            const draggingSection = board.drag?.kind === 'section' && board.drag.sectionId === section.id;
            const holdsDraggedDish = board.drag?.kind === 'dish' && board.drag.sectionId === section.id;
            const allIndex = data.secciones.findIndex((item) => item.id === section.id);
            return (
              <ReAnimated.View
                key={section.id}
                style={[s.section, holdsDraggedDish && s.raised, draggingSection && [s.dragging, board.dragStyle]]}
                onLayout={(event) => {
                  sectionY.current[section.id] = event.nativeEvent.layout.y;
                  board.onSectionLayout(section.id)(event);
                }}>
                <View style={s.sectionHeader} onLayout={board.onHeaderLayout(section.id)}>
                  {editingSection === section.id || !section.nombre ? (
                    <TextInput
                      ref={registerInput(`t-${section.id}`)}
                      style={s.sectionName}
                      value={section.nombre}
                      onChangeText={nombre => patchSection(section.id, { nombre: nombre.toUpperCase().slice(0, TEXT_LIMITS.sectionName) })}
                      onFocus={() => setEditingSection(section.id)}
                      onBlur={() => setEditingSection((current) => (current === section.id ? null : current))}
                      placeholder={sectionIndex === 0 && !section.carta ? firstSectionHint : 'SECCIÓN'}
                      placeholderTextColor={c.textMute}
                      returnKeyType="done"
                      accessibilityLabel={`Título de la sección ${sectionIndex + 1}`}
                    />
                  ) : (
                    // Tocar: escribir el título. Mantener presionado: mover la sección completa.
                    <GestureDetector gesture={board.gestureFor({ kind: 'section', sectionId: section.id }, () => focusKey(`t-${section.id}`))}>
                      <View
                        style={s.sectionNameButton}
                        collapsable={false}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={`${section.nombre}. Editar título`}
                        accessibilityHint="Mantén presionado para moverla."
                        accessibilityActions={[{ name: 'activate' }, { name: 'up', label: 'Subir' }, { name: 'down', label: 'Bajar' }]}
                        onAccessibilityAction={(event) => {
                          if (event.nativeEvent.actionName === 'activate') focusKey(`t-${section.id}`);
                          if (event.nativeEvent.actionName === 'up' && allIndex > 0) { smoothly(); moveSectionTo(section.id, allIndex - 1); }
                          if (event.nativeEvent.actionName === 'down' && allIndex < data.secciones.length - 1) { smoothly(); moveSectionTo(section.id, allIndex + 1); }
                        }}>
                        <Text style={s.sectionName}>{section.nombre}</Text>
                      </View>
                    </GestureDetector>
                  )}
                  {/* Precio de la sección, con el mismo «$» que cada platillo:
                      «MENÚ DEL DÍA $100», «GUISADOS $85», «CARTA $110». */}
                  {section.precio || sectionPriceOpen[section.id] ? (
                    <View style={s.priceChip}>
                      <Text style={s.currency}>$</Text>
                      <TextInput
                        ref={registerInput(`sp-${section.id}`)}
                        style={s.dishPrice}
                        value={section.precio}
                        onChangeText={(precio) => patchSection(section.id, { precio: precio.replace(/[^0-9.]/g, '').slice(0, TEXT_LIMITS.dishPrice) })}
                        onBlur={() => {
                          if (!Number(section.precio)) {
                            if (section.precio) patchSection(section.id, { precio: '' });
                            smoothly(); setSectionPriceOpen((current) => ({ ...current, [section.id]: false }));
                          }
                        }}
                        keyboardType="decimal-pad"
                        returnKeyType="done"
                        inputAccessoryViewID={Platform.OS === 'ios' ? PRICE_ACCESSORY : undefined}
                        selectTextOnFocus
                        accessibilityLabel={`Precio de ${section.nombre || 'la sección'}`}
                        accessibilityHint="Opcional. El precio del menú completo o el de cada platillo de la sección."
                      />
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[s.priceChip, s.priceChipEmpty]}
                      hitSlop={{ top: 8, bottom: 8, left: 6, right: 4 }}
                      onPress={() => openSectionPrice(section.id)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar precio a ${section.nombre || 'la sección'}`}>
                      <Text style={s.currency}>$</Text>
                    </TouchableOpacity>
                  )}
                  {/* Quitar la sección: la misma «×» que cada platillo (se puede deshacer). */}
                  <TouchableOpacity
                    style={s.removeDish}
                    hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                    onPress={() => removeSection(section.id)}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar la sección ${section.nombre || sectionIndex + 1}`}>
                    <Ionicons name="close" size={15} color={c.textMute} />
                  </TouchableOpacity>
                </View>
                {/* Solo el encabezado de la carta dice qué hace: lo de abajo se
                    queda para los días que siguen. */}
                {section.id === cartaHeadingId && (
                  <Text style={s.cartaHint}>{noWidow('Desde aquí, todo se queda para los días que siguen.')}</Text>
                )}

                {/* Todas las secciones abiertas, como la ficha: para moverse
                    en menús largos está la barra de secciones de arriba. */}
                <>
                    {section.platillos.map((dish, dishIndex) => {
                      const showDetails = details[dish.id] || !!dish.descripcion;
                      return (
                        <ReAnimated.View
                          key={dish.id}
                          style={[s.dish, dishIndex > 0 && s.dishDivider, board.drag?.kind === 'dish' && board.drag.dishId === dish.id && [s.dragging, board.dragStyle]]}
                          onLayout={board.onDishLayout(dish.id)}>
                          {!!dish.revision && !/precio|\$|importe/i.test(dish.revision) && (
                            <View style={s.reviewNote}>
                              <Ionicons name="alert-circle-outline" size={13} color={c.accent} />
                              <Text style={s.reviewNoteText}>{dish.revision}</Text>
                            </View>
                          )}
                          <View style={s.dishMainRow}>
                            {editingName === dish.id || !dish.nombre ? (
                              <TextInput
                                ref={registerInput(`n-${dish.id}`)}
                                style={s.dishName}
                                value={dish.nombre}
                                onChangeText={nombre => patchDish(section.id, dish.id, { nombre: nombre.slice(0, TEXT_LIMITS.dishName) })}
                                onFocus={() => setEditingName(dish.id)}
                                onBlur={() => { smoothly(); setEditingName((current) => current === dish.id ? null : current); fillKnownPhotos(); }}
                                placeholder="Platillo"
                                placeholderTextColor={c.textMute}
                                multiline
                                scrollEnabled={false}
                                returnKeyType="next"
                                submitBehavior="submit"
                                onSubmitEditing={() => submitDishName(dish)}
                              />
                            ) : (
                              // Tocar: escribir el nombre. Mantener presionado: mover el
                              // platillo a otro lugar, también a otra sección o a la carta.
                              <GestureDetector gesture={board.gestureFor({ kind: 'dish', dishId: dish.id, sectionId: section.id }, () => focusKey(`n-${dish.id}`))}>
                                <View
                                  style={s.dishNameButton}
                                  collapsable={false}
                                  accessible
                                  accessibilityRole="button"
                                  accessibilityLabel={`${dish.nombre}. Editar platillo`}
                                  accessibilityHint="Mantén presionado para moverlo."
                                  accessibilityActions={[{ name: 'activate' }, { name: 'up', label: 'Subir' }, { name: 'down', label: 'Bajar' }]}
                                  onAccessibilityAction={(event) => {
                                    if (event.nativeEvent.actionName === 'activate') focusKey(`n-${dish.id}`);
                                    if (event.nativeEvent.actionName === 'up') nudgeDish(section.id, dish.id, -1);
                                    if (event.nativeEvent.actionName === 'down') nudgeDish(section.id, dish.id, 1);
                                  }}>
                                  <Text style={s.dishName}>{dish.nombre}</Text>
                                </View>
                              </GestureDetector>
                            )}
                            {dish.precio || priceOpen[dish.id] ? (
                              <View style={s.priceChip}>
                                <Text style={s.currency}>$</Text>
                                <TextInput
                                  ref={registerInput(`p-${dish.id}`)}
                                  style={s.dishPrice}
                                  value={dish.precio}
                                  onChangeText={precio => patchDish(section.id, dish.id, { precio: precio.replace(/[^0-9.]/g, '').slice(0, TEXT_LIMITS.dishPrice) })}
                                  onFocus={() => setPriceFocus(dish.id)}
                                  onBlur={() => {
                                    setPriceFocus((current) => current === dish.id ? null : current);
                                    // Arrepentirse deja el platillo sin precio: vacío o «0» no se guarda.
                                    if (!Number(dish.precio)) {
                                      if (dish.precio) patchDish(section.id, dish.id, { precio: '' });
                                      smoothly(); setPriceOpen((current) => ({ ...current, [dish.id]: false }));
                                    }
                                  }}
                                  keyboardType="decimal-pad"
                                  returnKeyType="next"
                                  onSubmitEditing={() => goToNextPrice(dish.id)}
                                  inputAccessoryViewID={Platform.OS === 'ios' ? PRICE_ACCESSORY : undefined}
                                  selectTextOnFocus
                                  accessibilityLabel={`Precio de ${dish.nombre || 'platillo'}`}
                                />
                              </View>
                            ) : (
                              // Mismo hueco que el precio lleno (alto, ancho y radio):
                              // al escribir, el campo nace exactamente ahí.
                              <TouchableOpacity
                                style={[s.priceChip, s.priceChipEmpty]}
                                hitSlop={{ top: 8, bottom: 8, left: 6, right: 4 }}
                                onPress={() => openPrice(dish.id)}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Agregar precio a ${dish.nombre || 'platillo'}`}>
                                <Text style={s.currency}>$</Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={s.removeDish}
                              hitSlop={{ top: 7, bottom: 7, left: 7, right: 7 }}
                              onPress={() => removeDish(section.id, dish.id)}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel={`Eliminar ${dish.nombre || 'platillo'}`}>
                              <Ionicons name="close" size={15} color={c.textMute} />
                            </TouchableOpacity>
                          </View>
                          {/* Guía de captura: si el nombre trae la descripción pegada,
                              ofrece separarla con un toque (el nombre es lo que se pide). */}
                          {editingName !== dish.id && (() => {
                            const split = suggestDishSplit(dish.nombre);
                            if (!split) return null;
                            return (
                              <TouchableOpacity
                                style={s.splitHint}
                                onPress={() => {
                                  smoothly();
                                  patchDish(section.id, dish.id, { nombre: split.name, descripcion: mergeDescription(split.description, dish.descripcion ?? '').slice(0, TEXT_LIMITS.dishDescription) });
                                  revealDetails(dish.id);
                                  Haptics.selectionAsync().catch(() => {});
                                }}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Mover «${split.description}» a la descripción`}>
                                <Ionicons name="arrow-down" size={13} color={c.accent} />
                                <Text style={s.splitHintText}>{noWidow(`Mover «${split.description.charAt(0).toLocaleLowerCase('es-MX') + split.description.slice(1)}» a la descripción`)}</Text>
                              </TouchableOpacity>
                            );
                          })()}
                          {/* Identidad del platillo (lib/dish-identity.ts): si el nombre se
                              parece a otro que ya tiene fotos («Pozole rojo» y «Pozole»),
                              se pregunta una vez. Sí: se juntan su foto y las de clientes.
                              No: no vuelve a salir para ese par. */}
                          {editingName !== dish.id && (() => {
                            const link = linkSuggestion(dish);
                            if (!link) return null;
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
                                    onPress={() => {
                                      smoothly();
                                      linkDish(section.id, dish.id, link);
                                      Haptics.selectionAsync().catch(() => {});
                                    }}
                                    activeOpacity={0.7}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Sí, ${dish.nombre} es el mismo platillo que ${link.name}`}>
                                    <Text style={s.linkYes}>Sí, es el mismo</Text>
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
                          {showDetails ? (
                            <View style={s.detailRow}>
                              <TextInput
                                ref={registerInput(`d-${dish.id}`)}
                                style={s.description}
                                value={dish.descripcion}
                                onChangeText={descripcion => patchDish(section.id, dish.id, { descripcion: descripcion.slice(0, TEXT_LIMITS.dishDescription) })}
                                placeholder="Descripción opcional"
                                placeholderTextColor={c.textMute}
                                returnKeyType="next"
                                blurOnSubmit={false}
                                onSubmitEditing={() => submitDishDetail(section, dishIndex)}
                              />
                            </View>
                          ) : null}
                          <View style={s.addRow}>
                            {!showDetails && (
                              <TouchableOpacity
                                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                                onPress={() => {
                                  smoothly();
                                  revealDetails(dish.id);
                                  pendingFocus.current = `d-${dish.id}`;
                                }}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Agregar descripción a ${dish.nombre || 'platillo'}`}>
                                <Text style={s.addDetail}>Agregar descripción</Text>
                              </TouchableOpacity>
                            )}
                            {!dish.foto && !photoBusy[dish.id] && (
                              <TouchableOpacity
                                ref={(el) => { photoRefs.current.set(dish.id, el); }}
                                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                                onPress={() => { Keyboard.dismiss(); setPhotoMenu({ sectionId: section.id, dishId: dish.id }); }}
                                activeOpacity={0.7}
                                accessibilityRole="button"
                                accessibilityLabel={`Agregar foto a ${dish.nombre || 'platillo'}`}>
                                <Text style={s.addDetail}>Agregar foto</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          {/* Con foto: miniatura y para qué sirve. Tocarla la
                              cambia o la quita. */}
                          {(!!dish.foto || photoBusy[dish.id]) && (
                            <TouchableOpacity
                              ref={(el) => { photoRefs.current.set(dish.id, el); }}
                              style={s.photoRow}
                              disabled={photoBusy[dish.id]}
                              onPress={() => { Keyboard.dismiss(); setPhotoMenu({ sectionId: section.id, dishId: dish.id }); }}
                              activeOpacity={0.7}
                              accessibilityRole="button"
                              accessibilityLabel={photoBusy[dish.id] ? 'Subiendo foto' : `Foto de ${dish.nombre || 'platillo'}. Cambiar o quitar`}
                              accessibilityState={{ busy: !!photoBusy[dish.id] }}>
                              <View style={s.photoThumb}>
                                {photoBusy[dish.id]
                                  ? <ActivityIndicator size="small" color={c.textSecondary} />
                                  : <Image source={{ uri: dish.foto }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />}
                              </View>
                              <Text style={s.photoHint}>{noWidow(photoBusy[dish.id] ? 'Subiendo foto…' : 'La gente la ve al tocar el platillo')}</Text>
                            </TouchableOpacity>
                          )}
                        </ReAnimated.View>
                      );
                    })}

                    <TouchableOpacity
                      style={s.addDish}
                      hitSlop={{ top: 2, bottom: 2 }}
                      onPress={() => addDishFocused(section)}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Agregar platillo">
                      <Ionicons name="add" size={18} color={c.accent} />
                      <Text style={s.addText}>{noWidow('Agregar platillo')}</Text>
                    </TouchableOpacity>
                </>
              </ReAnimated.View>
            );
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[s.nav, { paddingTop: insets.top + 6 }]}>
          <GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={onBack} />
          {/* Título del menú de hoy, como el de una nota: en blanco muestra el
              placeholder de siempre, y en cuanto el fondero le pone nombre
              (aquí mismo, sin salir a Menús) ese nombre se queda — ley
              dictada 2026-09-06. Alineado a la izquierda, ocupando el ancho
              disponible (un TextInput sin ancho fijo no se encoge a su
              contenido de forma confiable en RN — intentarlo dejaba el check
              flotando a medio camino, ni pegado al texto ni al borde;
              corregido el mismo día). La confirmación vive en el slot fijo
              de la derecha, como botón real (mismo GlassIconButton que sus
              vecinos), no como ícono suelto. */}
          {<TextInput
            ref={nombreInputRef}
            style={[s.navTitle, { color: nombre.trim() ? c.text : c.textSecondary }]}
            value={nombre}
            onChangeText={setNombre}
            onFocus={focusNombre}
            onBlur={confirmNombre}
            onSubmitEditing={() => nombreInputRef.current?.blur()}
            // Sin nombre, el título se ve suave (como «Título» en Notas) y dice
            // qué va ahí; al guardar sin nombre, Menús lo titula con sus platillos.
            placeholder="Nombre del menú"
            placeholderTextColor={c.textMute}
            maxLength={TEXT_LIMITS.menuName}
            returnKeyType="done"
            accessibilityLabel="Nombre del menú"
          />}
          {nombreSaved ? (
            <GlassIconButton
              icon="checkmark"
              accessibilityLabel="Nombre guardado, toca para continuar"
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setNombreSaved(false);
              }}
            />
          ) : source === 'foto' && onRetake ? (
            <GlassIconButton icon="camera-outline" accessibilityLabel="Tomar otra foto" onPress={onRetake} />
          ) : <View style={s.navButton} />}
        </View>

        {data.secciones.length >= 4 && !keyboardOpen && (
          <SectionBar
            names={data.secciones.map((section) => section.nombre)}
            active={activeSection}
            onSelect={jumpToSection}
            colors={{ text: c.text, textSecondary: c.textSecondary, bg: c.bg, border: c.border, glass: theme.glass, isDark: theme.isDark }}
          />
        )}
        <ScrollView
          ref={scrollRef}
          onScroll={(event) => {
            board.onScroll(event);
            if (data.secciones.length >= 4) followSections(event.nativeEvent.contentOffset.y);
          }}
          scrollEventThrottle={16}
          scrollEnabled={!board.drag}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: insets.bottom + 32 + (lastRemoved ? 64 : 0) }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {board.lineY != null && <View pointerEvents="none" style={[s.dropLine, { top: board.lineY - 1 }]} />}
          {dailySections.map((section, index) => renderSection(section, index))}

          {/* Secciones sugeridas según el giro. Con el menú vacío se muestran
              directas (es la acción esencial); en cuanto ya hay al menos una
              sección quedan detrás de un "+" que se puede abrir Y cerrar —
              revelación progresiva de verdad, no solo de un sentido
              (Apple HIG: chevron.right cerrado / chevron.down abierto). */}
          <View style={s.addSectionBlock}>
            {data.secciones.length > 0 && !showSectionSuggestions ? (
              <TouchableOpacity
                style={s.addSectionToggle}
                hitSlop={{ top: 2, bottom: 2 }}
                onPress={() => setShowSectionSuggestions(true)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Agregar sección">
                <Ionicons name="add" size={18} color={c.accent} />
                <Text style={s.addText}>{noWidow('Agregar sección')}</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={s.addSectionHeader}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  activeOpacity={data.secciones.length > 0 ? 0.7 : 1}
                  disabled={data.secciones.length === 0}
                  onPress={() => setShowSectionSuggestions(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar sugerencias de sección"
                  accessibilityState={{ disabled: data.secciones.length === 0 }}>
                  <Text style={s.addSectionLabel}>{noWidow('AGREGAR SECCIÓN')}</Text>
                  {data.secciones.length > 0 && (
                    <Ionicons name="chevron-up" size={14} color={c.textMute} />
                  )}
                </TouchableOpacity>
                <View style={s.chipsRow}>
                  {sectionSuggestions.map((nombre) => (
                    <TouchableOpacity
                      key={nombre}
                      style={s.chip}
                      hitSlop={{ top: 4, bottom: 4 }}
                      onPress={() => {
                        addSection(nombre);
                        setShowSectionSuggestions(false);
                      }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar sección ${nombre}`}>
                      <Ionicons name="add" size={13} color={c.accent} />
                      <Text style={s.chipText}>{nombre}</Text>
                    </TouchableOpacity>
                  ))}
                  {/* La carta empieza con su encabezado: abajo de «CARTA» todo
                      se queda para los días que siguen. */}
                  {!cartaSections.length && (
                    <TouchableOpacity
                      style={s.chip}
                      hitSlop={{ top: 4, bottom: 4 }}
                      onPress={() => { addCartaSection(); setShowSectionSuggestions(false); }}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel="Agregar la carta, lo de siempre">
                      <Ionicons name="add" size={13} color={c.accent} />
                      <Text style={s.chipText}>CARTA</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={s.chip}
                    hitSlop={{ top: 4, bottom: 4 }}
                    onPress={() => {
                      addSection();
                      setShowSectionSuggestions(false);
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel="Agregar sección nueva">
                    <Ionicons name="add" size={13} color={c.textSecondary} />
                    <Text style={[s.chipText, { color: c.textSecondary }]}>{noWidow('SECCIÓN NUEVA')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

          {/* La carta: mismas secciones, abajo de su encabezado «CARTA». */}
          {cartaSections.map((section, index) => renderSection(section, index))}
          {!!cartaSections.length && (
            <View style={s.addSectionBlock}>
              <TouchableOpacity
                style={s.addSectionToggle}
                hitSlop={{ top: 2, bottom: 2 }}
                onPress={addCartaSection}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Agregar sección a la carta">
                <Ionicons name="add" size={18} color={c.accent} />
                <Text style={s.addText}>{noWidow('Agregar sección')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Cierre del flujo: una primaria y una secundaria, como el alta y
              el póster. «Publicar menú» es la cápsula naranja de 54 (única
              acción prominente); «Guardar sin publicar» es texto debajo. */}
          {(
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
            <TouchableOpacity
              style={[s.saveButton, publishing && { opacity: 0.4 }]}
              disabled={publishing}
              accessibilityState={{ disabled: publishing }}
              onPress={saveDraft}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={savedFlash ? 'Guardado' : 'Guardar sin publicar'}>
              {savedFlash && <Ionicons name="checkmark" size={16} color={c.textSecondary} />}
              <Text style={s.saveText}>{noWidow(savedFlash ? 'Guardado' : 'Guardar sin publicar')}</Text>
            </TouchableOpacity>
          </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID={PRICE_ACCESSORY}>
          <View style={s.priceBar}>
            {nextPriceDish(priceFocus) ? (
              <TouchableOpacity style={s.priceBarButton} onPress={() => goToNextPrice(priceFocus)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Siguiente precio">
                <Text style={s.priceBarNext}>Siguiente</Text>
                <Ionicons name="chevron-down" size={15} color={c.text} />
              </TouchableOpacity>
            ) : <View />}
            <TouchableOpacity style={s.priceBarButton} onPress={() => Keyboard.dismiss()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Listo">
              <Text style={s.priceBarDone}>Listo</Text>
            </TouchableOpacity>
          </View>
        </InputAccessoryView>
      )}

      {/* Deshacer lo último que se borró: se queda hasta que lo regresas, lo
          cierras o borras otra cosa (sin temporizador). */}
      {!!lastRemoved && (
        <View style={[s.undoBar, { bottom: insets.bottom + 12 }]} accessibilityLiveRegion="polite">
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
        onDismiss={() => setPhotoMenu(null)}
        options={photoOptions}
      />
    </View>
  );
}

function makeStyles(c: FonderoColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    nav: { minHeight: 54, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    navButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    navTitle: { flex: 1, textAlign: 'left', paddingHorizontal: 8, fontSize: 17, fontWeight: '700', color: c.textSecondary },
    // Etiqueta de bloque (MENÚ DEL DÍA / LA CARTA): la misma que «PRECIO DEL MENÚ».
    undoBar: { position: 'absolute', left: 16, right: 16, minHeight: 48, paddingHorizontal: 16, borderRadius: 24, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: c.surface2, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 },
    undoText: { flex: 1, fontSize: 15, fontWeight: '400', color: c.text },
    undoAction: { fontSize: 15, fontWeight: '700', color: c.accent },
    // Debajo del título «CARTA», pegado a él: qué pasa con lo de abajo.
    cartaHint: { marginTop: -6, marginBottom: 6, fontSize: 12, lineHeight: 16, fontWeight: '300', color: c.textSecondary },
    section: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingVertical: 12 },
    sectionHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center' },
    sectionName: { flex: 1, paddingVertical: 6, fontSize: 14, lineHeight: 20, fontWeight: '700', letterSpacing: 0.6, color: c.text },
    // Título de sección como texto (se toca para escribir, se sostiene para moverla).
    sectionNameButton: { flex: 1, minWidth: 0, minHeight: 44, justifyContent: 'center' },
    // Lo que se arrastra se levanta un poco, sobre lo demás.
    dragging: {
      zIndex: 20, backgroundColor: c.bg, borderRadius: 12, borderCurve: 'continuous',
      shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6,
    },
    // La sección que contiene al platillo que se arrastra va encima de las demás.
    raised: { zIndex: 10 },
    // Dónde caerá: línea de acento a todo lo ancho del contenido.
    dropLine: { position: 'absolute', left: 20, right: 20, height: 2, borderRadius: 1, backgroundColor: c.accent },
    currency: { fontSize: 13, fontWeight: '300', color: c.textMute },
    dish: { paddingVertical: 7 },
    dishDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    splitHint: { minHeight: 32, marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    splitHintText: { flexShrink: 1, fontSize: 13, lineHeight: 17, fontWeight: '700', color: c.accent },
    // Pregunta de identidad: texto secundario y dos respuestas, en la retícula del platillo.
    linkHint: { marginTop: 4, marginBottom: 2, gap: 4 },
    linkHintText: { fontSize: 13, lineHeight: 18, fontWeight: '400', color: c.textSecondary },
    linkActions: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 20 },
    linkYes: { fontSize: 13, lineHeight: 17, fontWeight: '700', color: c.accent },
    linkNo: { fontSize: 13, lineHeight: 17, fontWeight: '400', color: c.textSecondary },
    reviewNote: { marginBottom: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
    reviewNoteText: { flex: 1, fontSize: 11, lineHeight: 15, fontWeight: '300', color: c.accent },
    dishMainRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    dishNameButton: { flex: 1, minWidth: 0 },
    addRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    dishName: { flex: 1, paddingVertical: 3, fontSize: 16, lineHeight: 21, fontWeight: '700', color: c.text },
    removeDish: { width: 30, height: 30, marginTop: -1, alignItems: 'flex-end', justifyContent: 'center' },
    addDetail: { paddingTop: 3, fontSize: 12, fontWeight: '300', color: c.textSecondary },
    photoRow: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
    photoThumb: { width: 40, height: 40, borderRadius: 8, borderCurve: 'continuous', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: c.border },
    photoHint: { fontSize: 12, fontWeight: '300', color: c.textSecondary },
    detailRow: { marginTop: 2, flexDirection: 'row', alignItems: 'center' },
    description: { flex: 1, paddingVertical: 3, fontSize: 13, fontWeight: '300', color: c.textSecondary },
    // Alto de la línea del nombre (21) + 3: el chip se centra en esa línea y
    // su número comparte la línea base del nombre, sin sobresalir.
    priceChip: { height: 24, marginTop: 1.5, paddingHorizontal: 9, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: c.iconBg },
    priceChipEmpty: { minWidth: 40, justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 1, borderColor: c.border },
    priceBar: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface2, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    priceBarButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
    priceBarNext: { fontSize: 16, fontWeight: '400', color: c.text },
    priceBarDone: { fontSize: 16, fontWeight: '700', color: c.accent },
    dishPrice: { minWidth: 10, paddingVertical: 0, fontSize: 15, fontWeight: '700', color: c.text },
    addDish: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 },
    // Toda acción «agregar» del editor: mismo ícono, tamaño y color.
    addText: { fontSize: 15, fontWeight: '700', color: c.accent },
    addSectionBlock: { borderTopWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingTop: 14 },
    addSectionToggle: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
    addSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 28, marginBottom: 10 },
    addSectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, color: c.textMute },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 10, paddingRight: 14, minHeight: 36, borderRadius: 100, backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, color: c.text },
    actionsBlock: { marginTop: 32, alignItems: 'center', gap: 8 },
    saveButton: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    saveText: { fontSize: 16, fontWeight: '400', color: c.textSecondary },
    publishButton: { alignSelf: 'stretch', minHeight: 54, borderRadius: 27, borderCurve: 'continuous', paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.accent },
    // Mismos estados que Guardar en Editar mi negocio: falta algo (gris, dice
    // qué), listo (naranja), publicando (naranja con indicador).
    publishIdle: { backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border },
    publishText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
}
