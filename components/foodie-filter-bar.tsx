import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, findNodeHandle, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ACTION_SHEET_MENU_WIDTH } from '@/components/action-sheet';
import { createCollection, deleteCollection, normalizeCollectionTitle, publishCollection, renameCollection, type PatioCollection } from '@/lib/collections';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// "Filtros" combina ATRIBUTOS del lugar (categoría, pagos) — se suman entre
// sí, como Google Maps. "Listas" cambia a qué colecciones te asomas — varias
// a la vez se UNEN (ver esto + ver aquello), no se restringen entre sí; es
// otro tipo de combinación (unión de conjuntos, no intersección de
// atributos), por eso vive en su propio botón. Menú hoy/Abiertos quedan como
// accesos fijos siempre visibles — son los dos filtros de mayor frecuencia
// (ver docs/DISCOVERY_SEARCH_ARCHITECTURE.md), igual que Google/Apple Maps
// muestran un par de chips fijos junto al botón de filtros avanzados.
export type FoodieFilters = {
  today: boolean;
  open: boolean;
  categories: string[];
  payments: string[];
  collectionIds: string[];
};

export const EMPTY_FOODIE_FILTERS: FoodieFilters = { today: false, open: false, categories: [], payments: [], collectionIds: [] };

// Cuenta SOLO lo que vive dentro del panel "Filtros" (categoría, pagos) —
// Menú hoy/Abiertos tienen su propia pill visible y su propio feedback de
// selección; contarlos aquí también hacía aparecer el badge naranja sobre el
// botón de Filtros al tocar esas dos, sin que ese botón tuviera nada que ver.
export function foodieFilterCount(f: FoodieFilters) {
  return f.categories.length + f.payments.length;
}

// Único origen de verdad para "¿este lugar cumple los filtros?" — antes esta
// misma cadena de ifs vivía repetida en explorar.tsx (pines del mapa) y en
// favoritos.tsx, y cuando se buscaba una palabra (fuera del mapa idle) no se
// llamaba desde ningún lado: los resultados de búsqueda no respetaban
// Filtros/Listas en absoluto, a diferencia de Apple Maps, donde los filtros
// también aplican una vez que ya estás viendo resultados de una búsqueda.
export function matchesFoodieFilters(filters: FoodieFilters, input: {
  patioId: string;
  hasTodayMenu: boolean;
  isOpenNow: boolean;
  categories: string[];
  payments: string[];
  collections: PatioCollection[];
}): boolean {
  if (filters.today && !input.hasTodayMenu) return false;
  if (filters.open && !input.isOpenNow) return false;
  if (filters.categories.length && !input.categories.some((category) => filters.categories.includes(category))) return false;
  if (filters.payments.length && !input.payments.some((method) => filters.payments.includes(method))) return false;
  if (filters.collectionIds.length) {
    const active = input.collections.filter((collection) => filters.collectionIds.includes(collection.id));
    if (!active.some((collection) => collection.patioIds.includes(input.patioId))) return false;
  }
  return true;
}

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia'];
// Spring/timing calcados del sheet de resultados de esta misma pantalla
// (app/explorar.tsx) — un solo lenguaje de movimiento para los tres sheets
// de Explorar (resultados, Filtros, Listas), no tres inventados por separado.
const SHEET_DISMISS_MS = 190;
const SHEET_SPRING = { stiffness: 320, damping: 30, mass: 0.75, useNativeDriver: true } as const;

function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

type OpenPanel = 'filters' | 'lists' | null;

function styles(t: Theme) {
  const border = t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    root: { height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
    pill: { height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    iconPill: { width: 34, paddingHorizontal: 0, alignItems: 'center' },
    // Recorta el BlurView a la cápsula sin recortar también el badge — el
    // badge vive fuera de los bordes del pill (top/right negativos) y con
    // `overflow: hidden` en el propio TouchableOpacity se cercenaba a una
    // astilla en vez de mostrarse como círculo completo.
    pillBlurClip: { ...StyleSheet.absoluteFillObject, borderRadius: 17, overflow: 'hidden' },
    pillText: { fontSize: 12.5, fontWeight: '600' },
    // El badge (el número) es la ÚNICA señal de "hay filtros activos" — el
    // botón que abre el sheet se queda siempre en tono neutro. Llenarlo de
    // color se leía como "este botón está prendido", cuando en realidad es
    // un disparador, no una selección en sí mismo.
    badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 10, fontWeight: '700' },
    // Sheet real (no popover) — en iPhone Apple usa sheets para esto, los
    // popovers son de iPad/Mac. Edge-to-edge (sin margen lateral ni inferior,
    // solo esquinas superiores redondeadas) — el tratamiento flotante con
    // margen en las 4 puntas se sentía como una tarjeta encimada, no como el
    // sheet nativo que cubre el ancho completo (decisión 2026-08-20).
    kav: { flex: 1 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
    // Vidrio real (ley de CLAUDE.md "Glass y superficies flotantes": todo
    // panel flotante usa BlurView, nunca fondo sólido) — antes era
    // `backgroundColor: t.surface` opaco, violación real detectada en
    // auditoría 2026-08-23. intensity 20/16 y tinte según la tabla.
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderTopWidth: StyleSheet.hairlineWidth, borderColor: border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: t.isDark ? 0.30 : 0.14, shadowRadius: 24, elevation: 12 },
    sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(20,21,24,0.72)' : 'rgba(255,255,255,0.70)' },
    grabberTouch: { alignItems: 'center' },
    grabber: { width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 4, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' },
    panelHeader: { width: '100%', minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    panelTitle: { fontSize: 17, fontWeight: '700', color: t.text },
    panelClear: { fontSize: 14, fontWeight: '600', color: t.accent },
    section: { paddingTop: 14 },
    sectionLabel: { paddingHorizontal: 16, paddingBottom: 8, fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: t.textSecondary },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 14 },
    chip: { height: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.bg },
    chipActive: { backgroundColor: t.text, borderColor: t.text },
    chipText: { fontSize: 13.5, fontWeight: '600', color: t.text },
    chipTextActive: { color: t.bg },
    option: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    optionText: { flex: 1, fontSize: 15, fontWeight: '500', color: t.text },
    // Fila de una lista real (a diferencia de "Nueva lista"): el toggle
    // ocupa la mayoría de la fila, "···" vive aparte para no competir con
    // el gesto principal (unir/quitar del mapa).
    listRowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
    // Homologado con navButton de coleccion/[id].tsx: ícono suelto, sin
    // caja de fondo — corregido 2026-08-24, había ido en la dirección
    // contraria (le había puesto caja en vez de quitársela a los otros).
    listRowMore: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    createInput: { flex: 1, fontSize: 15, fontWeight: '500', color: t.text, padding: 0 },
    createBtn: { minHeight: 34, paddingHorizontal: 14, borderRadius: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: t.text },
    createBtnDisabled: { opacity: 0.35 },
    createBtnText: { fontSize: 13, fontWeight: '700', color: t.bg },
    // Menú de acciones por lista — anclado junto al botón "···" (mismo
    // componente visual que components/action-sheet.tsx), dentro del MISMO
    // Modal del panel (ver comentario en FilterSheet), no un Modal propio.
    inlineMenu: { position: 'absolute', borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: t.isDark ? 0.32 : 0.16, shadowRadius: 20, elevation: 10 },
    inlineMenuTint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(28,29,32,0.78)' : 'rgba(255,255,255,0.78)' },
    inlineTitleRow: { minHeight: 34, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
    inlineTitleText: { fontSize: 12, fontWeight: '700', color: t.textSecondary, textAlign: 'center' },
    inlineRow: { minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    inlineRowText: { fontSize: 15.5, fontWeight: '500' },
  });
}

// Apple HIG: 44×44pt es el tap target mínimo — los pills de 34pt de alto lo
// alcanzan con este hitSlop (34+5+5=44); los de ícono (34×34) llegan a 44×44
// completo con left/right también en 5.
const HIT_SLOP = { top: 5, bottom: 5, left: 5, right: 5 };
// Los chips de categoría/pago (36pt de alto) y el botón "Crear" de lista
// (34pt) solo necesitan reforzar el eje vertical — llevarlos a 44 en
// horizontal invadiría el gap de 8pt entre chips vecinos en la misma fila.
const CHIP_HIT_SLOP = { top: 4, bottom: 4, left: 0, right: 0 };
const CREATE_BTN_HIT_SLOP = { top: 5, bottom: 5, left: 0, right: 0 };
// "Limpiar" (texto ~14pt) y "Cerrar" (ícono 20×20) son los más chicos del
// header — sin vecino a la derecha, "Cerrar" puede crecer más ahí.
const CLEAR_HIT_SLOP = { top: 13, bottom: 13, left: 8, right: 4 };
const CLOSE_HIT_SLOP = { top: 12, bottom: 12, left: 10, right: 16 };

function QuickToggle({ label, active, onPress, s, theme }: { label: string; active: boolean; onPress: () => void; s: ReturnType<typeof styles>; theme: ReturnType<typeof useTheme>['theme'] }) {
  return (
    <TouchableOpacity hitSlop={HIT_SLOP} onPress={onPress} style={[s.pill, { backgroundColor: active ? theme.text : theme.glass, borderColor: active ? theme.text : theme.border }]} accessibilityRole="button" accessibilityState={{ selected: active }}>
      {!active && <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />}
      <Text style={[s.pillText, { color: active ? theme.bg : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Sheet real, no popover: en iPhone la HIG es explícita — "popovers are used
// on iPad/Mac for transient controls, but not on iPhone; sheets should be
// used instead." Usa Modal para no depender del recorte/overflow del padre
// donde viva <FoodieFilterBar> (a veces dentro de un ScrollView), con el
// mismo spring/drag-to-dismiss que ya vive en el sheet de resultados de
// Explorar — un solo lenguaje de movimiento para los tres sheets de la
// pantalla, no tres inventados por separado. Detent único (no medium/large
// arrastrable): el contenido cabe cómodo en una sola altura generosa con
// scroll propio — replicar el resize de dos alturas de UIKit es la única
// pieza de la HIG que no se copió 1:1 aquí, a propósito, por costo/beneficio.
function FilterSheet({ visible, onClose, title, onClear, children, overlay, scrollRef, s, theme }: {
  visible: boolean; onClose: () => void; title: string; onClear?: () => void;
  children: React.ReactNode; overlay?: React.ReactNode; scrollRef?: React.RefObject<ScrollView | null>; s: ReturnType<typeof styles>; theme: ReturnType<typeof useTheme>['theme'];
}) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = Math.min(screenHeight * 0.62, 560);
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const [rendered, setRendered] = useState(visible);
  // Alto REAL del sheet cuando el teclado está arriba — sin esto, un alto
  // fijo empujado hacia arriba por el teclado se sale de la pantalla por
  // ARRIBA (el header queda fuera de vista). Bug real diagnosticado
  // 2026-08-24 a mano (no se pudo probar en device): con sheetHeight≈523pt
  // y teclado≈336pt, el sheet ya no cabía en los ≈508pt libres.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardHeight(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);
  const visibleSheetHeight = keyboardHeight > 0
    ? Math.min(sheetHeight, screenHeight - keyboardHeight - insets.top - 16)
    : sheetHeight;

  useEffect(() => {
    if (visible) {
      translateY.setValue(sheetHeight);
      setRendered(true);
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    } else if (rendered) {
      Animated.timing(translateY, { toValue: sheetHeight, duration: SHEET_DISMISS_MS, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, sheetHeight]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8 && Math.abs(gesture.dx) < 20,
      onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > 54 || gesture.vy > 0.8) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onClose();
        } else {
          Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start(),
    })
  ).current;

  if (!rendered) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* KeyboardAvoidingView real — antes el input de renombrar (dentro de
          "children") quedaba tapado por completo por el teclado, sin forma
          de verlo ni confirmarlo (bug real reportado 2026-08-24, capturas).
          save-to-list-sheet.tsx ya lo tenía bien; a este sheet le faltaba. */}
      <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity activeOpacity={1} style={s.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
        <Animated.View style={[s.sheet, { height: visibleSheetHeight, paddingBottom: insets.bottom || 8, transform: [{ translateY }] }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={s.sheetTint} />
          {/* Zona de arrastre ampliada (antes 22pt, muy angosta para agarrar
              con precisión — reportado como "no funciona el swipe" 2026-08-24):
              ahora cubre el grabber Y el header completo. */}
          <View {...pan.panHandlers} style={s.grabberTouch}>
            <View style={s.grabber} />
            <View style={s.panelHeader}>
              <Text style={s.panelTitle}>{title}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!!onClear && <TouchableOpacity hitSlop={CLEAR_HIT_SLOP} onPress={onClear}><Text style={s.panelClear}>Limpiar</Text></TouchableOpacity>}
                <TouchableOpacity hitSlop={CLOSE_HIT_SLOP} onPress={onClose} accessibilityLabel="Cerrar"><Ionicons name="close" size={20} color={theme.textSecondary} /></TouchableOpacity>
              </View>
            </View>
          </View>
          <ScrollView ref={scrollRef} keyboardShouldPersistTaps="handled">{children}</ScrollView>
        </Animated.View>
        {/* El menú de acciones por lista vive AQUÍ — dentro del mismo Modal
            (evita el bug real de dos <Modal> de RN anidados en iOS, ver
            auditoría 2026-08-24), pero FUERA del Animated.View del sheet: ese
            contenedor tiene alto fijo + overflow:hidden + esquinas
            redondeadas propias, así que un overlay puesto DENTRO se recortaba
            contra esos bordes en vez de cubrir la pantalla completa (bug real
            reportado por Alejandro — esquinas cortadas, card apretada contra
            el panel de abajo). Como hermano del sheet, cubre toda la pantalla
            igual que el ActionSheet real. */}
        {overlay}
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function FoodieFilterBar({ filters, onChange, collections, categories, onCollectionCreated, onCollectionUpdated, onCollectionRemoved }: {
  filters: FoodieFilters; onChange: (next: FoodieFilters) => void; collections: PatioCollection[]; categories: string[];
  onCollectionCreated?: (collection: PatioCollection) => void;
  onCollectionUpdated?: (collection: PatioCollection) => void;
  onCollectionRemoved?: (collectionId: string) => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  // Acciones por lista detrás de "···" — ley de CLAUDE.md 13-jul: todo
  // accionable vive tras ···, un solo gesto para descubrir acciones en toda
  // la app. "Listas" es el destino real donde se navegan/administran las
  // listas — por eso viven aquí y no en el sheet de "guardar en lista".
  // Menú nativo (Alert), no fila expandible: Fotos gestiona un álbum con un
  // menú que flota encima, nunca reacomodando el layout de la lista (auditado
  // 2026-08-23 tras confusión real de que la fila empujaba el contenido).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [actionsTarget, setActionsTarget] = useState<PatioCollection | null>(null);
  const [actionsLayout, setActionsLayout] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const moreRefs = useRef<Map<string, View | null>>(new Map());
  // Para hacer scroll automático a la fila cuando entras a renombrar — sin
  // esto, en una lista larga la fila puede quedar fuera de vista incluso
  // después de que el sheet sube por el teclado (reportado 2026-08-24).
  // Segunda vuelta: en vez de guardar la posición ANTES de editar (con un
  // setTimeout arbitrario que podía correr antes de que el teclado/sheet
  // terminaran de moverse), se mide la posición REAL del input hasta que
  // toma foco de verdad — ver onFocus abajo.
  const listsScrollRef = useRef<ScrollView | null>(null);
  const renameInputRef = useRef<TextInput | null>(null);
  const attributeCount = foodieFilterCount(filters);
  const activeCollections = collections.filter((item) => filters.collectionIds.includes(item.id));
  const listsLabel = activeCollections.length === 0 ? 'Listas' : activeCollections.length === 1 ? activeCollections[0].title : `${activeCollections.length} listas`;

  const togglePanel = (panel: OpenPanel) => {
    Haptics.selectionAsync();
    setOpenPanel(panel);
  };

  const handleCreateList = async () => {
    const title = newListTitle.trim();
    if (!title) return;
    const collection = await createCollection(title);
    onCollectionCreated?.(collection);
    onChange({ ...filters, collectionIds: [...filters.collectionIds, collection.id] });
    setNewListTitle('');
    setCreatingList(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const startRename = (collection: PatioCollection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setEditingId(collection.id);
    setEditTitle(collection.title);
  };

  // Dispara con el foco real del input (autoFocus ya está puesto), no con
  // un tiempo adivinado — measureLayout da la posición actual DEL INPUT
  // relativa al contenido del scroll, en el momento real en que el teclado
  // empieza a aparecer, sin importar si el sheet ya terminó de encogerse.
  const scrollRenameIntoView = () => {
    const input = renameInputRef.current;
    const scroll = listsScrollRef.current;
    const scrollHandle = scroll ? findNodeHandle(scroll) : null;
    if (!input || !scroll || !scrollHandle) return;
    input.measureLayout(
      scrollHandle,
      (_x, y, _width, _height) => scroll.scrollTo({ y: Math.max(0, y - 12), animated: true }),
      () => {},
    );
  };

  const saveRename = async () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (title) {
      const renamed = await renameCollection(editingId, title);
      if (renamed) onCollectionUpdated?.(renamed);
    }
    setEditingId(null);
  };

  const shareCollection = async (collection: PatioCollection) => {
    Haptics.selectionAsync().catch(() => {});
    const target = collection.visibility === 'private' ? { ...collection, visibility: 'unlisted' as const } : collection;
    const published = await publishCollection(target);
    if (published.remoteId !== collection.remoteId || published.visibility !== collection.visibility) {
      onCollectionUpdated?.(published);
    }
    const link = published.remoteId ? `\n\npatio://coleccion-publica/${published.remoteId}` : '';
    const desc = published.description ? `\n${published.description}` : '';
    await Share.share({ message: `${published.title} — mis lugares en Patio${desc}${link}` }).catch(() => {});
  };

  const removeCollection = (collection: PatioCollection) => {
    Alert.alert(
      noWidow('Eliminar lista'),
      noWidow(`Se borrará "${collection.title}". No se puede deshacer.`),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteCollection(collection.id);
            onCollectionRemoved?.(collection.id);
            if (filters.collectionIds.includes(collection.id)) {
              onChange({ ...filters, collectionIds: filters.collectionIds.filter((id) => id !== collection.id) });
            }
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ],
    );
  };

  const openListActions = (collection: PatioCollection) => {
    Haptics.selectionAsync().catch(() => {});
    const anchor = moreRefs.current.get(collection.id);
    if (!anchor) return;
    anchor.measureInWindow((x, y, width, height) => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
      const spaceBelow = screenHeight - (y + height);
      const left = Math.min(Math.max(8, x + width - ACTION_SHEET_MENU_WIDTH), screenWidth - ACTION_SHEET_MENU_WIDTH - 8);
      setActionsLayout(spaceBelow > 220 ? { top: y + height + 8, left } : { bottom: screenHeight - y + 8, left });
      setActionsTarget(collection);
    });
  };

  // Copiado de Apple Maps real (verificado, no de memoria): en su fila de
  // categorías no existe un botón "Todo"/"Limpiar todo" permanente — cada
  // toggle se apaga tocándolo de nuevo, y cada sheet (Filtros/Listas) ya
  // trae su propio "Limpiar" acotado a lo suyo. Un botón aparte para
  // "borrar todo de un jalón" no es un patrón que Apple use aquí. Fila
  // centrada (no pegada a la izquierda): son 4 elementos fijos siempre, el
  // ancho total no cambia con el estado, así que centrar no salta.
  return <View style={s.root}>
    <QuickToggle label="Menú hoy" active={filters.today} onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, today: !filters.today }); }} s={s} theme={theme} />
    <QuickToggle label="Abiertos" active={filters.open} onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, open: !filters.open }); }} s={s} theme={theme} />

    <TouchableOpacity
      hitSlop={HIT_SLOP}
      onPress={() => togglePanel('filters')}
      style={[s.pill, s.iconPill, { backgroundColor: theme.glass, borderColor: theme.border, overflow: 'visible' }]}
      accessibilityRole="button"
      accessibilityLabel="Filtros"
      accessibilityHint="Combina categoría y pagos para filtrar el mapa">
      <View style={s.pillBlurClip}>
        <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      </View>
      <Ionicons name="options-outline" size={16} color={theme.text} />
      {attributeCount > 0 && <View style={[s.badge, { backgroundColor: theme.accent }]}><Text style={[s.badgeText, { color: theme.bg }]}>{attributeCount}</Text></View>}
    </TouchableOpacity>

    <TouchableOpacity
      hitSlop={HIT_SLOP}
      onPress={() => togglePanel('lists')}
      style={[s.pill, s.iconPill, { backgroundColor: theme.glass, borderColor: theme.border, overflow: 'visible' }]}
      accessibilityRole="button"
      accessibilityLabel={activeCollections.length ? `Listas: ${listsLabel}` : 'Listas'}
      accessibilityHint="Une una o varias de tus listas guardadas sobre el mapa">
      <View style={s.pillBlurClip}>
        <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      </View>
      <Ionicons name="bookmark-outline" size={16} color={theme.text} />
      {activeCollections.length > 0 && <View style={[s.badge, { backgroundColor: theme.accent }]}><Text style={[s.badgeText, { color: theme.bg }]}>{activeCollections.length}</Text></View>}
    </TouchableOpacity>

    <FilterSheet
      visible={openPanel === 'filters'}
      onClose={() => setOpenPanel(null)}
      title="Filtros"
      onClear={(filters.categories.length > 0 || filters.payments.length > 0) ? () => { Haptics.selectionAsync(); onChange({ ...filters, categories: [], payments: [] }); } : undefined}
      s={s} theme={theme}>
      {categories.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Categoría</Text>
          <View style={s.chipsWrap}>
            {categories.map((category) => {
              const active = filters.categories.includes(category);
              return (
                <TouchableOpacity key={category} hitSlop={CHIP_HIT_SLOP} onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, categories: toggleValue(filters.categories, category) }); }} style={[s.chip, active && s.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                  <Text style={[s.chipText, active && s.chipTextActive]}>{category}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={s.section}>
        <Text style={s.sectionLabel}>Pagos</Text>
        <View style={s.chipsWrap}>
          {PAYMENT_METHODS.map((method) => {
            const active = filters.payments.includes(method);
            return (
              <TouchableOpacity key={method} hitSlop={CHIP_HIT_SLOP} onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, payments: toggleValue(filters.payments, method) }); }} style={[s.chip, active && s.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
                <Text style={[s.chipText, active && s.chipTextActive]}>{method}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </FilterSheet>

    <FilterSheet
      visible={openPanel === 'lists'}
      onClose={() => setOpenPanel(null)}
      title="Tus listas"
      onClear={activeCollections.length > 0 ? () => { Haptics.selectionAsync(); onChange({ ...filters, collectionIds: [] }); } : undefined}
      scrollRef={listsScrollRef}
      overlay={actionsTarget && actionsLayout && (
        <>
          {/* Menú anclado junto al botón "···" que tocaste — mismo
              componente visual que ActionSheet (vidrio, sin fila de
              Cancelar, se cierra tocando fuera), homologado 2026-08-24 tras
              auditoría: antes esta versión era un bottom-sheet distinto al
              de Menús/coleccion. Vive aquí (no en el <Modal> de ActionSheet)
              por el mismo motivo que el resto del overlay: evitar dos
              Modal de RN anidados. */}
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => setActionsTarget(null)} accessibilityLabel="Cerrar acciones" />
          <View style={[s.inlineMenu, { width: ACTION_SHEET_MENU_WIDTH, left: actionsLayout.left, top: actionsLayout.top, bottom: actionsLayout.bottom }]}>
            <BlurView intensity={theme.isDark ? 26 : 30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
            <View pointerEvents="none" style={s.inlineMenuTint} />
            <View style={s.inlineTitleRow}><Text style={s.inlineTitleText} numberOfLines={1}>{noWidow(actionsTarget.title)}</Text></View>
            {[
              { label: 'Compartir', icon: 'share-outline' as const, onPress: () => shareCollection(actionsTarget) },
              { label: 'Renombrar', icon: 'text-outline' as const, onPress: () => startRename(actionsTarget) },
              { label: 'Eliminar', icon: 'trash-outline' as const, onPress: () => removeCollection(actionsTarget) },
            ].map((option, index) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => { setActionsTarget(null); option.onPress(); }}
                style={[s.inlineRow, (index > 0 || !!actionsTarget.title) && s.divider]}
                accessibilityRole="button"
                accessibilityLabel={option.label}>
                <Text style={[s.inlineRowText, { color: theme.text }]}>{option.label}</Text>
                <Ionicons name={option.icon} size={17} color={theme.text} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      s={s} theme={theme}>
      {creatingList ? (
        <View style={s.option}>
          <Ionicons name="add" size={16} color={theme.textSecondary} />
          <TextInput
            autoFocus
            value={newListTitle}
            onChangeText={(value) => setNewListTitle(normalizeCollectionTitle(value))}
            onSubmitEditing={handleCreateList}
            placeholder="Una palabra, ej. Tacos"
            placeholderTextColor={theme.textMute}
            returnKeyType="done"
            autoCapitalize="words"
            style={s.createInput}
          />
          <TouchableOpacity disabled={!newListTitle.trim()} hitSlop={CREATE_BTN_HIT_SLOP} onPress={handleCreateList} style={[s.createBtn, !newListTitle.trim() && s.createBtnDisabled]}>
            <Text style={s.createBtnText}>Crear</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setCreatingList(true)} style={s.option}>
          <Ionicons name="add" size={16} color={theme.textSecondary} />
          <Text style={s.optionText}>{noWidow('Nueva lista')}</Text>
        </TouchableOpacity>
      )}
      {collections.map((collection) => {
        const active = filters.collectionIds.includes(collection.id);
        if (editingId === collection.id) {
          return (
            <View key={collection.id} style={s.option}>
              <TextInput
                ref={renameInputRef}
                autoFocus
                onFocus={scrollRenameIntoView}
                value={editTitle}
                onChangeText={(value) => setEditTitle(normalizeCollectionTitle(value))}
                onSubmitEditing={saveRename}
                onBlur={saveRename}
                placeholder="Una palabra, ej. Tacos"
                placeholderTextColor={theme.textMute}
                returnKeyType="done"
                autoCapitalize="words"
                style={s.createInput}
              />
              <TouchableOpacity hitSlop={CREATE_BTN_HIT_SLOP} onPress={saveRename} style={s.createBtn}>
                <Text style={s.createBtnText}>Listo</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <View key={collection.id} style={s.option}>
            <TouchableOpacity
              onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, collectionIds: toggleValue(filters.collectionIds, collection.id) }); }}
              style={s.listRowMain}>
              <Ionicons name="bookmark" size={16} color={theme.textSecondary} />
              <Text style={s.optionText}>{collection.title}</Text>
              {active && <Ionicons name="checkmark" size={18} color={theme.text} />}
            </TouchableOpacity>
            <TouchableOpacity
              ref={(el) => { moreRefs.current.set(collection.id, el); }}
              accessibilityRole="button"
              accessibilityLabel="Acciones de la lista"
              hitSlop={8}
              style={s.listRowMore}
              onPress={() => openListActions(collection)}>
              <Ionicons name="ellipsis-horizontal" size={17} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        );
      })}
    </FilterSheet>
  </View>;
}
