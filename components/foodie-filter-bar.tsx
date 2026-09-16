import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ACTION_SHEET_MENU_WIDTH, ActionSheet, type ActionSheetOption } from '@/components/action-sheet';
import { createCollection, deleteCollection, movePatiosToCollection, normalizeCollectionTitle, publishCollection, renameCollection, setCollectionsPinned, type PatioCollection } from '@/lib/collections';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { useSheetKeyboard } from '@/lib/use-sheet-keyboard';
import { RecentPatiosButton } from '@/components/recent-patios-sheet';
import { SelectionActions } from '@/components/selection-actions';

// "Filtros" combina ATRIBUTOS del lugar (categoría, pagos) — se suman entre
// sí, como Google Maps. "Listas" cambia a qué colecciones te asomas — varias
// a la vez se UNEN (ver esto + ver aquello), no se restringen entre sí; es
// otro tipo de combinación (unión de conjuntos, no intersección de
// atributos). Una sola entrada reúne estos criterios; su estado se resume
// junto al botón, sin añadir una barra de acciones paralela a la búsqueda.
export type FoodieFilters = {
  today: boolean;
  open: boolean;
  categories: string[];
  payments: string[];
  collectionIds: string[];
};

export const EMPTY_FOODIE_FILTERS: FoodieFilters = { today: false, open: false, categories: [], payments: [], collectionIds: [] };

// Attribute count; the toolbar adds availability, lists and legacy criteria
// so its badge represents every active constraint in the shared panel.
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
type FilterDetail = 'categories' | 'payments' | null;

function styles(t: Theme) {
  const border = t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    root: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16 },
    scopeControl: { justifyContent: 'center' },
    scopeGroup: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingVertical: 6 },
    organizer: { minHeight: 32, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.glass, overflow: 'hidden' },
    organizerCompact: { width: 32, paddingHorizontal: 0, justifyContent: 'center' },
    organizerText: { fontSize: 14, fontWeight: '600', color: t.text },
    controlIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    activeCount: { fontSize: 12, fontWeight: '600', color: t.textSecondary, fontVariant: ['tabular-nums'] },
    choiceRow: { minHeight: 48 },
    disclosureLabel: { fontSize: 15, fontWeight: '500', color: t.text, flexShrink: 1 },
    disclosureValue: { flex: 1, minWidth: 0, fontSize: 14, color: t.textSecondary, textAlign: 'right' },
    availabilityRow: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkSlot: { width: 22, alignItems: 'center' },
    backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -12 },
    // Recorta el BlurView a la cápsula sin recortar también el badge — el
    // badge vive fuera de los bordes del pill (top/right negativos) y con
    // `overflow: hidden` en el propio TouchableOpacity se cercenaba a una
    // astilla en vez de mostrarse como círculo completo.
    pillBlurClip: { ...StyleSheet.absoluteFillObject, borderRadius: 16, overflow: 'hidden' },
    // Sheet real (no popover) — en iPhone Apple usa sheets para esto, los
    // popovers son de iPad/Mac. Edge-to-edge (sin margen lateral ni inferior,
    // solo esquinas superiores redondeadas) — el tratamiento flotante con
    // margen en las 4 puntas se sentía como una tarjeta encimada, no como el
    // sheet nativo que cubre el ancho completo (decisión 2026-08-20).
    kav: { flex: 1 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.16)' },
    // Vidrio real (ley de CLAUDE.md "Glass y superficies flotantes": todo
    // panel flotante usa BlurView, nunca fondo sólido) — antes era
    // `backgroundColor: t.surface` opaco, violación real detectada en
    // auditoría 2026-08-23. intensity 20/16 y tinte según la tabla.
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderTopWidth: StyleSheet.hairlineWidth, borderColor: border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: t.isDark ? 0.30 : 0.14, shadowRadius: 24, elevation: 12 },
    sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(20,21,24,0.72)' : 'rgba(255,255,255,0.70)' },
    grabberTouch: { alignItems: 'center', flexShrink: 0 },
    grabber: { width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 12, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' },
    headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    panelHeader: { width: '100%', minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    panelTitle: { flexShrink: 1, fontSize: 17, fontWeight: '700', color: t.text },
    panelClear: { fontSize: 14, fontWeight: '600', color: t.text },
    section: { paddingTop: 12 },
    group: { marginHorizontal: 16, borderRadius: 14, backgroundColor: t.surface, overflow: 'hidden' },
    rowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    rowCopy: { flex: 1, minWidth: 0 },
    rowDetail: { fontSize: 13, lineHeight: 18, color: t.textSecondary, marginTop: 2 },
    emptyLists: { paddingHorizontal: 24, paddingVertical: 24, gap: 8, alignItems: 'center' },
    emptyTitle: { fontSize: 17, fontWeight: '700', color: t.text },
    emptyDetail: { fontSize: 14, lineHeight: 20, color: t.textSecondary, textAlign: 'center' },
    sectionLabel: { paddingHorizontal: 20, paddingBottom: 8, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: t.textMute },
    option: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    optionText: { flex: 1, fontSize: 15, fontWeight: '500', color: t.text },
    // Fila de una lista real (a diferencia de "Nueva lista"): el toggle
    // ocupa la mayoría de la fila, "···" vive aparte para no competir con
    // el gesto principal (unir/quitar del mapa).
    listRowMain: { flex: 1, minWidth: 0, minHeight: 52, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 12 },
    listCount: { fontSize: 13, lineHeight: 18, color: t.textSecondary, fontVariant: ['tabular-nums'] },
    // Homologado con navButton de coleccion/[id].tsx: ícono suelto, sin
    // caja de fondo — corregido 2026-08-24, había ido en la dirección
    // contraria (le había puesto caja en vez de quitársela a los otros).
    listRowMore: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    createInput: { flex: 1, fontSize: 15, fontWeight: '500', color: t.text, padding: 0 },
    createBtn: { minWidth: 44, minHeight: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
    createBtnDisabled: { opacity: 0.35 },
    createBtnText: { fontSize: 15, fontWeight: '500', color: t.accent },
    // Menú de acciones por lista — anclado junto al botón "···" (mismo
    // componente visual que components/action-sheet.tsx), dentro del MISMO
    // Modal del panel (ver comentario en FilterSheet), no un Modal propio.
    inlineMenu: { position: 'absolute', borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: t.isDark ? 0.32 : 0.16, shadowRadius: 20, elevation: 10 },
    inlineMenuTint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(28,29,32,0.78)' : 'rgba(255,255,255,0.78)' },
    inlineTitleRow: { minHeight: 34, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
    inlineTitleText: { fontSize: 12, fontWeight: '700', color: t.textSecondary, textAlign: 'center' },
    inlineRow: { minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    inlineRowText: { flex: 1, fontSize: 15, fontWeight: '500', paddingVertical: 8 },
    // Diálogo de renombrar en Android (Alert.prompt no existe ahí) — mismo
    // lenguaje visual de tarjeta flotante glass que el resto del archivo,
    // pero centrado y de tamaño fijo (patrón alert de Archivos/Recordatorios/
    // Fotos de Apple): un diálogo así nunca puede quedar tapado por el
    // teclado sin importar cuántas listas existan, porque no vive dentro de
    // un ScrollView — ver nota en startRename.
    renameBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    renameCard: { width: '100%', maxWidth: 320, borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: border },
    renameCardTint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(28,29,32,0.86)' : 'rgba(255,255,255,0.86)' },
    renameTitle: { fontSize: 15, fontWeight: '700', color: t.text, textAlign: 'center', paddingTop: 18, paddingHorizontal: 16 },
    renameInput: { marginTop: 14, marginHorizontal: 16, height: 40, borderRadius: 10, paddingHorizontal: 12, fontSize: 15, color: t.text, backgroundColor: t.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
    renameActions: { flexDirection: 'row', marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    renameActionBtn: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
    renameActionDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: t.border },
    renameActionText: { fontSize: 15.5, fontWeight: '600', color: t.text },
    renameActionTextPrimary: { fontWeight: '700', color: t.accent },
  });
}

// Compact toolbar capsules keep a 44 pt effective touch target.
// Content options have full-height rows and need no expanded hit regions.
const CONTROL_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };
const SCOPE_HIT_SLOP = { top: 6, bottom: 6, left: 0, right: 0 };
const CREATE_BTN_HIT_SLOP = { top: 5, bottom: 5, left: 0, right: 0 };
// "Limpiar" (texto ~14pt) y "Cerrar" (ícono 20×20) son los más chicos del
// header — sin vecino a la derecha, "Cerrar" puede crecer más ahí.
const CLEAR_HIT_SLOP = { top: 13, bottom: 13, left: 8, right: 4 };

// Sheet real, no popover: en iPhone la HIG es explícita — "popovers are used
// on iPad/Mac for transient controls, but not on iPhone; sheets should be
// used instead." Usa Modal para no depender del recorte/overflow del padre
// donde viva <FoodieFilterBar> (a veces dentro de un ScrollView), con el
// mismo spring/drag-to-dismiss que ya vive en el sheet de resultados de
// Explorar — un solo lenguaje de movimiento para los tres sheets de la
// pantalla. El resumen cabe sin scroll y cada grupo ocupa una subvista
// de la misma hoja. La altura se adapta al contenido y al tamaño de texto.
function FilterSheet({ visible, onClose, title, onClear, onBack, hideTitle, onCreate, headerActions, footer, selectionMode, editing, editor, preferredHeight, children, overlay, s, theme }: {
  visible: boolean; onClose: () => void; title: string; onClear?: () => void; onBack?: () => void;
  preferredHeight: number; hideTitle?: boolean; onCreate?: () => void; headerActions?: React.ReactNode; footer?: React.ReactNode; selectionMode?: boolean; editing?: boolean; editor?: React.ReactNode;
  children: React.ReactNode; overlay?: React.ReactNode; s: ReturnType<typeof styles>; theme: ReturnType<typeof useTheme>['theme'];
}) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight, fontScale } = useWindowDimensions();
  const { keyboardInset, keyboardVisible, viewportHeight } = useSheetKeyboard();
  const [editorHeight, setEditorHeight] = useState(88);
  const [contentSize, setContentSize] = useState({ title: '', height: 0 });
  const [headerHeight, setHeaderHeight] = useState(24);
  const [footerHeight, setFooterHeight] = useState(44);
  const bottomPadding = keyboardVisible ? 8 : insets.bottom || 8;
  const naturalHeight = contentSize.title === title && contentSize.height > 0
    ? headerHeight + (editor ? editorHeight : 0) + contentSize.height + (footer ? footerHeight : 0) + bottomPadding
    : preferredHeight + bottomPadding;
  const measuredHeight = Math.min(screenHeight - insets.top - 16, preferredHeight + bottomPadding + Math.max(0, fontScale - 1) * 180, naturalHeight);
  const browsingHeight = useRef(measuredHeight);
  if (!editing) browsingHeight.current = measuredHeight;
  const sheetHeight = editing ? browsingHeight.current : measuredHeight;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [rendered, setRendered] = useState(visible);
  const visibleSheetHeight = Math.max(120, Math.min(sheetHeight, viewportHeight - insets.top - 16));

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
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8 && Math.abs(gesture.dx) < 20,
      onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > 54 || gesture.vy > 0.8) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          onCloseRef.current();
          Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
        } else {
          Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start(),
    })
  ).current;

  if (!rendered) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onBack ?? onClose} statusBarTranslucent>
      {/* The absolute sheet follows the keyboard frame; adding padding to a
          KeyboardAvoidingView cannot reposition an absolute bottom child. */}
      <View style={s.kav}>
        <TouchableOpacity activeOpacity={1} style={s.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={onClose} style={[s.sheet, { height: visibleSheetHeight, bottom: keyboardInset, paddingBottom: bottomPadding, transform: [{ translateY }] }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={s.sheetTint} />
          {/* Zona de arrastre ampliada (antes 22pt, muy angosta para agarrar
              con precisión — reportado como "no funciona el swipe" 2026-08-24):
              ahora cubre el grabber Y el header completo. */}
          <View {...pan.panHandlers} style={s.grabberTouch} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
            <View style={s.grabber} />
            {(onBack || !hideTitle || onCreate || headerActions || onClear) && <View style={s.panelHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {onBack && <TouchableOpacity onPress={onBack} style={s.backButton} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="chevron-back" size={20} color={theme.text} /></TouchableOpacity>}
                {!hideTitle && <Text style={s.panelTitle}>{noWidow(title)}</Text>}
                {onCreate && <TouchableOpacity style={s.headerIcon} onPress={onCreate} accessibilityRole="button" accessibilityLabel="Nueva lista"><Ionicons name="add" size={22} color={theme.text} /></TouchableOpacity>}
                {selectionMode && headerActions}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {!!onClear && <TouchableOpacity hitSlop={CLEAR_HIT_SLOP} accessibilityRole="button" accessibilityLabel={`Limpiar ${title.toLowerCase()}`} onPress={onClear}><Text style={s.panelClear}>Limpiar</Text></TouchableOpacity>}
                {!selectionMode && headerActions}
              </View>
            </View>}
          </View>
          {editor && <View style={{ flexShrink: 0 }} onLayout={(event) => setEditorHeight(event.nativeEvent.layout.height)}>{editor}</View>}
          <ScrollView key={title} style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
            onContentSizeChange={(_width, height) => setContentSize((current) => current.title === title && current.height === height ? current : { title, height })}
            contentContainerStyle={{ paddingBottom: 16 }}>{children}</ScrollView>
          {footer && <View style={{ flexShrink: 0 }} onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}>{footer}</View>}
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
      </View>
    </Modal>
  );
}

export function FoodieFilterBar({ filters, onChange, collections, categories, onCollectionCreated, onCollectionUpdated, onCollectionRemoved, organizationOptions, libraryActions, viewMode, onViewModeChange, additionalFilter }: {
  filters: FoodieFilters; onChange: (next: FoodieFilters) => void; collections: PatioCollection[]; categories: string[];
  onCollectionCreated?: (collection: PatioCollection) => void;
  onCollectionUpdated?: (collection: PatioCollection) => void;
  onCollectionRemoved?: (collectionId: string) => void;
  additionalFilter?: { label: string; onClear: () => void };
  organizationOptions?: ActionSheetOption[];
  libraryActions?: ActionSheetOption[];
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  const { width, fontScale } = useWindowDimensions();
  const [movingLists, setMovingLists] = useState(false);
  const [listActionBusy, setListActionBusy] = useState(false);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [filterDetail, setFilterDetail] = useState<FilterDetail>(null);
  const [organizerVisible, setOrganizerVisible] = useState(false);
  const organizerRef = useRef<View>(null);
  const listsMenuRef = useRef<View>(null);
  const [listsMenuVisible, setListsMenuVisible] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [selectingLists, setSelectingLists] = useState(false);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [deletingLists, setDeletingLists] = useState(false);
  const deleteListsPending = useRef(false);
  const latestFilters = useRef(filters);
  latestFilters.current = filters;
  const [newListTitle, setNewListTitle] = useState('');
  // Acciones por lista detrás de "···" — ley de CLAUDE.md 13-jul: todo
  // accionable vive tras ···, un solo gesto para descubrir acciones en toda
  // la app. "Listas" es el destino real donde se navegan/administran las
  // listas — por eso viven aquí y no en el sheet de "guardar en lista".
  // Menú nativo (Alert), no fila expandible: Fotos gestiona un álbum con un
  // menú que flota encima, nunca reacomodando el layout de la lista (auditado
  // 2026-08-23 tras confusión real de que la fila empujaba el contenido).
  const [actionsTarget, setActionsTarget] = useState<PatioCollection | null>(null);
  const [actionsLayout, setActionsLayout] = useState<{ top?: number; bottom?: number; left: number } | null>(null);
  const moreRefs = useRef<Map<string, View | null>>(new Map());
  // Renombrar usa el patrón nativo de Apple (Archivos, Recordatorios, Fotos):
  // un alert con campo de texto, flotante y centrado por el sistema — no
  // depende de la posición de scroll ni del número de listas. Reemplaza el
  // editor inline dentro del sheet (4 intentos fallidos documentados en
  // TASKS.md 2026-08-24: el cálculo de scroll usaba measureLayout contra el
  // ScrollView, que da la posición YA relativa al viewport visible en vez de
  // absoluta al contenido — sumarle otra vez el offset de scroll subestimaba
  // cuánto faltaba avanzar en listas largas, dejando la fila casi tapada por
  // el teclado; confirmado en grabación de pantalla 2026-08-24).
  // Alert.prompt es solo iOS; Android usa el diálogo propio de abajo.
  const [renameTarget, setRenameTarget] = useState<PatioCollection | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const attributeCount = foodieFilterCount(filters);
  const filterCount = attributeCount + Number(filters.today) + Number(filters.open) + Number(!!additionalFilter);
  const listCount = filters.collectionIds.length;
  const isLibrary = !!onViewModeChange;
  const categoryOptions = [...new Set([...categories, ...filters.categories])].sort((a, b) => a.localeCompare(b, 'es'));
  const [creatingPending, setCreatingPending] = useState(false);

  const togglePanel = (panel: OpenPanel) => {
    Haptics.selectionAsync().catch(() => {});
    setActionsTarget(null);
    setListsMenuVisible(false);
    setMovingLists(false);
    setFilterDetail(null);
    setSelectingLists(false);
    setSelectedListIds([]);
    setOpenPanel(panel);
  };

  const handleCreateList = async () => {
    const title = newListTitle.trim();
    if (!title || creatingPending) return;
    setCreatingPending(true);
    try {
      const collection = await createCollection(title);
      onCollectionCreated?.(collection);
      // An empty new list must not silently hide every place on the map.
      setNewListTitle('');
      setCreatingList(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert(noWidow('No pudimos crear la lista'), noWidow('Inténtalo de nuevo.'));
    } finally {
      setCreatingPending(false);
    }
  };

  const commitRename = async (collectionId: string, rawTitle: string) => {
    const title = normalizeCollectionTitle(rawTitle.trim());
    if (!title) return;
    const renamed = await renameCollection(collectionId, title);
    if (renamed) onCollectionUpdated?.(renamed);
  };

  const startRename = (collection: PatioCollection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (Platform.OS === 'ios') {
      Alert.prompt(
        'Renombrar lista',
        undefined,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Guardar', onPress: (value?: string) => commitRename(collection.id, value ?? '') },
        ],
        'plain-text',
        collection.title,
      );
    } else {
      setRenameValue(collection.title);
      setRenameTarget(collection);
    }
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

  const removeSelectedLists = () => {
    const ids = selectedListIds.filter((id) => collections.some((item) => item.id === id));
    if (!ids.length || deleteListsPending.current) return;
    Alert.alert(
      noWidow(ids.length === 1 ? 'Eliminar lista' : `Eliminar ${ids.length} listas`),
      noWidow('Los lugares seguirán en Guardados. Las listas se eliminarán definitivamente.'),
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
          if (deleteListsPending.current) return;
          deleteListsPending.current = true;
          setDeletingLists(true);
          const removed: string[] = [];
          const failed: string[] = [];
          try {
            for (const id of ids) {
              try {
                await deleteCollection(id);
                removed.push(id);
              } catch {
                failed.push(id);
              }
            }
            removed.forEach((id) => onCollectionRemoved?.(id));
            const current = latestFilters.current;
            if (current.collectionIds.some((id) => removed.includes(id))) {
              onChange({ ...current, collectionIds: current.collectionIds.filter((id) => !removed.includes(id)) });
            }
            setSelectedListIds(failed);
            if (!failed.length) {
              setSelectingLists(false);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } else {
              Alert.alert(noWidow('Quedaron listas sin eliminar'), noWidow('Siguen seleccionadas para que puedas volver a intentarlo.'));
            }
          } finally {
            deleteListsPending.current = false;
            setDeletingLists(false);
          }
        } },
      ],
    );
  };

  const openListActions = (collection?: PatioCollection) => {
    Haptics.selectionAsync().catch(() => {});
    const anchor = collection ? moreRefs.current.get(collection.id) : listsMenuRef.current;
    if (!anchor) return;
    anchor.measureInWindow((x, y, width, height) => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
      const spaceBelow = screenHeight - (y + height);
      const left = Math.min(Math.max(8, x + width - ACTION_SHEET_MENU_WIDTH), screenWidth - ACTION_SHEET_MENU_WIDTH - 8);
      setActionsLayout(spaceBelow > 220 ? { top: y + height + 8, left } : { bottom: screenHeight - y + 8, left });
      setActionsTarget(collection ?? null);
      setListsMenuVisible(!collection);
    });
  };

  const beginListSelection = (id?: string) => {
    setSelectingLists(true);
    setSelectedListIds(id ? [id] : []);
    setActionsTarget(null);
    setListsMenuVisible(false);
  };
  const closeListMenu = () => { setActionsTarget(null); setListsMenuVisible(false); };
  const listMenuOptions: ActionSheetOption[] = actionsTarget ? [
    { label: 'Compartir', icon: 'share-outline', onPress: () => { void runListAction(() => shareCollection(actionsTarget)); } },
    { label: 'Renombrar', icon: 'text-outline', onPress: () => startRename(actionsTarget) },
    { label: 'Eliminar', icon: 'trash-outline', destructive: true, onPress: () => removeCollection(actionsTarget) },
  ] : [
    { label: 'Seleccionar listas', icon: 'checkmark-circle-outline', onPress: () => beginListSelection() },
  ];

  const selectedLists = collections.filter((item) => selectedListIds.includes(item.id));
  const selectedPatioIds = [...new Set(selectedLists.flatMap((item) => item.patioIds))];
  const allPinned = selectedLists.length > 0 && selectedLists.every((item) => item.pinned);
  const visibleCollections = [...collections].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned));
  const runListAction = async (operation: () => Promise<void>) => {
    if (deleteListsPending.current) return;
    deleteListsPending.current = true; setListActionBusy(true);
    try { await operation(); }
    catch (error) { Alert.alert(noWidow('No pudimos completar el cambio'), noWidow(error instanceof Error ? error.message : 'Inténtalo de nuevo.')); }
    finally { deleteListsPending.current = false; setListActionBusy(false); }
  };
  const pinSelectedLists = () => void runListAction(async () => {
    const updated = await setCollectionsPinned(selectedListIds, !allPinned);
    updated.forEach((item) => onCollectionUpdated?.(item));
    Haptics.selectionAsync().catch(() => {});
  });
  const shareSelectedLists = () => void runListAction(async () => {
    const messages: string[] = [];
    for (const item of selectedLists) {
      const published = await publishCollection(item.visibility === 'private' ? { ...item, visibility: 'unlisted' } : item);
      onCollectionUpdated?.(published);
      messages.push(`${published.title}\npatio://coleccion-publica/${published.remoteId}`);
    }
    await Share.share({ message: messages.join('\n\n') });
  });
  const moveSelectedTo = (destination: PatioCollection) => Alert.alert(
    noWidow('Mover lugares'),
    noWidow(`Se moverán ${selectedPatioIds.length} lugares de las listas seleccionadas a “${destination.title}”. Seguirán en Guardados.`),
    [{ text: 'Cancelar', style: 'cancel' }, { text: 'Mover', onPress: () => void runListAction(async () => {
      const updated = await movePatiosToCollection(selectedPatioIds, selectedListIds, destination.id);
      updated.forEach((item) => onCollectionUpdated?.(item));
      setMovingLists(false); setSelectingLists(false); setSelectedListIds([]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }) }],
  );

  // The two scope controls are identical and permanent in Map and Saved.
  // Saved adds a separate compact control for presentation (view/order).
  return <View style={s.root} pointerEvents="box-none">
    <View style={s.scopeGroup}>
      <TouchableOpacity
        hitSlop={SCOPE_HIT_SLOP}
        onPress={() => { Keyboard.dismiss(); togglePanel('filters'); }}
        style={[s.organizer, s.scopeControl]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Filtros${filterCount ? `, ${filterCount} activos` : ''}`}
        accessibilityState={{ expanded: openPanel === 'filters' }}>
        <View style={s.pillBlurClip}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </View>
        <View style={s.controlIcon}>
          <Ionicons name="options-outline" size={20} color={theme.text} />
        </View>
        <Text style={s.organizerText}>Filtros</Text>
        {filterCount > 0 && <Text style={s.activeCount}>{filterCount}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        hitSlop={SCOPE_HIT_SLOP}
        onPress={() => { Keyboard.dismiss(); togglePanel('lists'); }}
        style={[s.organizer, s.scopeControl]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Tus listas${listCount ? `, ${listCount} activas` : ''}`}
        accessibilityState={{ expanded: openPanel === 'lists' }}>
        <View style={s.pillBlurClip}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </View>
        <View style={s.controlIcon}>
          <Ionicons name="folder-outline" size={20} color={theme.text} />
        </View>
        <Text style={s.organizerText}>Listas</Text>
        {listCount > 0 && <Text style={s.activeCount}>{listCount}</Text>}
      </TouchableOpacity>
      <RecentPatiosButton compact={width < (isLibrary ? 410 : 360) || fontScale > 1.15} />
    </View>

    {isLibrary && <>
      <TouchableOpacity
        hitSlop={CONTROL_HIT_SLOP}
        ref={organizerRef}
        onPress={() => { Keyboard.dismiss(); Haptics.selectionAsync().catch(() => {}); setOrganizerVisible(true); }}
        style={[s.organizer, s.organizerCompact]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Organizar Guardados"
        accessibilityState={{ expanded: organizerVisible }}
        accessibilityHint="Seleccionar lugares, cambiar vista y orden">
        <View style={s.pillBlurClip}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
      </TouchableOpacity>
      <ActionSheet
        visible={organizerVisible}
        anchorRef={organizerRef}
        onDismiss={() => setOrganizerVisible(false)}
        options={[
          ...(libraryActions ?? []),
          ...(onViewModeChange ? [
            { label: 'Cuadrícula', sectionLabel: 'Vista', icon: 'grid-outline' as const, selected: viewMode === 'grid', onPress: () => { Haptics.selectionAsync().catch(() => {}); onViewModeChange('grid'); } },
            { label: 'Lista', icon: 'list-outline' as const, selected: viewMode === 'list', onPress: () => { Haptics.selectionAsync().catch(() => {}); onViewModeChange('list'); } },
          ] : []),
          ...(organizationOptions ?? []),
        ]}
      />
    </>}

    <FilterSheet
      visible={openPanel !== null}
      onClose={() => { if (!deleteListsPending.current) setOpenPanel(null); }}
      title={openPanel === 'filters' ? filterDetail === 'categories' ? 'Tipo de lugar' : filterDetail === 'payments' ? 'Pago' : 'Filtros' : movingLists ? 'Mover lugares' : 'Tus listas'}
      hideTitle={openPanel === 'lists' ? !movingLists : !filterDetail}
      onCreate={openPanel === 'lists' && !creatingList && (!selectingLists || movingLists) ? () => setCreatingList(true) : undefined}
      editing={selectingLists && !movingLists}
      selectionMode={openPanel === 'lists' && (selectingLists || creatingList)}
      headerActions={movingLists && !creatingList ? undefined : openPanel === 'lists' && creatingList ? <TouchableOpacity disabled={creatingPending} style={[s.headerIcon, { width: 'auto', paddingHorizontal: 8 }]} accessibilityRole="button" accessibilityLabel="Cancelar nueva lista" onPress={() => { setCreatingList(false); setNewListTitle(''); }}><Text style={s.organizerText}>Cancelar</Text></TouchableOpacity> : openPanel === 'lists' && collections.length > 0 ? (
        selectingLists ? <TouchableOpacity disabled={deletingLists || listActionBusy} style={[s.headerIcon, { width: 'auto', paddingHorizontal: 8 }]} accessibilityRole="button" accessibilityLabel="Cancelar selección"
          onPress={() => { setSelectingLists(false); setSelectedListIds([]); }}>
          <Text style={s.organizerText}>Cancelar</Text>
        </TouchableOpacity> : <TouchableOpacity ref={listsMenuRef} style={s.headerIcon} accessibilityRole="button" accessibilityLabel="Acciones de listas"
          onPress={() => openListActions()}>
          <Ionicons name="ellipsis-horizontal" size={22} color={theme.text} />
        </TouchableOpacity>
      ) : undefined}
      editor={creatingList ? <View style={s.section}><View style={s.group}>
          <View style={[s.option, { paddingVertical: 12 }]}>
            <View style={s.rowCopy}>
              <Text style={s.rowDetail}>{noWidow('Nombre de la lista')}</Text>
              <TextInput autoFocus value={newListTitle} onChangeText={setNewListTitle} maxLength={60} onSubmitEditing={handleCreateList} placeholder="Ej. Tacos del barrio" accessibilityLabel="Nombre de la lista" placeholderTextColor={theme.textMute} returnKeyType="done" autoCapitalize="sentences" style={[s.createInput, { minHeight: 44 }]} />
            </View>
            <TouchableOpacity disabled={!newListTitle.trim() || creatingPending} hitSlop={CREATE_BTN_HIT_SLOP} onPress={handleCreateList} accessibilityRole="button" accessibilityLabel="Crear lista" style={[s.createBtn, (!newListTitle.trim() || creatingPending) && s.createBtnDisabled]}><Text style={s.createBtnText}>{creatingPending ? 'Creando…' : 'Crear'}</Text></TouchableOpacity>
          </View>
        </View></View> : undefined}
      footer={openPanel === 'lists' && selectingLists && !movingLists ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <SelectionActions busy={deletingLists || listActionBusy} actions={[
          { label: allPinned ? 'Desfijar' : 'Fijar', icon: 'pin-outline', disabled: !selectedLists.length, onPress: pinSelectedLists },
          { label: 'Compartir', icon: 'share-outline', disabled: !selectedLists.length, onPress: shareSelectedLists },
          { label: 'Renombrar', icon: 'pencil-outline', disabled: selectedLists.length !== 1, onPress: () => startRename(selectedLists[0]) },
          { label: 'Mover', icon: 'folder-open-outline', disabled: !selectedPatioIds.length, onPress: () => setMovingLists(true) },
          { label: 'Eliminar', icon: 'trash-outline', disabled: !selectedLists.length, onPress: removeSelectedLists },
        ]} />
      </View> : undefined}
      preferredHeight={openPanel === 'filters'
        ? filterDetail === 'categories' ? Math.min(560, 96 + categoryOptions.length * 48)
          : filterDetail === 'payments' ? 244 : 324 + (additionalFilter ? 56 : 0)
        : Math.min(514, 152 + Math.max(1, collections.length) * 56 + (creatingList ? 96 : 0) + (selectingLists ? 44 : 0))}
      onBack={movingLists ? () => { if (!listActionBusy) setMovingLists(false); } : openPanel === 'filters' && filterDetail ? () => { Haptics.selectionAsync().catch(() => {}); setFilterDetail(null); } : undefined}
      onClear={openPanel === 'filters'
        ? filterDetail
          ? (filters[filterDetail].length ? () => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, [filterDetail]: [] }); } : undefined)
          : (filterCount ? () => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, today: false, open: false, categories: [], payments: [] }); additionalFilter?.onClear(); } : undefined)
        : undefined}
      overlay={openPanel === 'lists' && (actionsTarget || listsMenuVisible) && actionsLayout && (
        <>
          {/* Menú anclado junto al botón "···" que tocaste — mismo
              componente visual que ActionSheet (vidrio, sin fila de
              Cancelar, se cierra tocando fuera), homologado 2026-08-24 tras
              auditoría: antes esta versión era un bottom-sheet distinto al
              de Menús/coleccion. Vive aquí (no en el <Modal> de ActionSheet)
              por el mismo motivo que el resto del overlay: evitar dos
              Modal de RN anidados. */}
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={closeListMenu} accessibilityLabel="Cerrar acciones" />
          <View style={[s.inlineMenu, { width: ACTION_SHEET_MENU_WIDTH, left: actionsLayout.left, top: actionsLayout.top, bottom: actionsLayout.bottom }]}>
            <BlurView intensity={theme.isDark ? 26 : 30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
            <View pointerEvents="none" style={s.inlineMenuTint} />
            {actionsTarget && <View style={s.inlineTitleRow}><Text style={s.inlineTitleText} numberOfLines={1}>{noWidow(actionsTarget.title)}</Text></View>}
            {listMenuOptions.map((option, index) => (
              <TouchableOpacity
                key={option.label}
                onPress={() => { closeListMenu(); option.onPress(); }}
                style={[s.inlineRow, (index > 0 || !!actionsTarget?.title) && s.divider]}
                accessibilityRole="button"
                accessibilityLabel={option.label}>
                <Ionicons name={option.icon} size={20} color={option.destructive ? theme.accent : theme.text} />
                <Text style={[s.inlineRowText, { color: theme.text }]}>{noWidow(option.label)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
      s={s} theme={theme}>
      {openPanel === 'filters' ? <>
        {filterDetail ? (
          <View style={s.section}><View style={s.group}>
            {(filterDetail === 'categories' ? categoryOptions : PAYMENT_METHODS).map((value, index) => {
              const active = filters[filterDetail].includes(value);
              return <TouchableOpacity key={value}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, [filterDetail]: toggleValue(filters[filterDetail], value) }); }}
                style={[s.availabilityRow, s.choiceRow, index > 0 && s.rowDivider]}
                accessibilityRole="checkbox" accessibilityLabel={value} accessibilityState={{ checked: active }}>
                <Text style={s.optionText}>{noWidow(value)}</Text>
                <View style={s.checkSlot}>{active && <Ionicons name="checkmark" size={20} color={theme.accent} />}</View>
              </TouchableOpacity>;
            })}
          </View></View>
        ) : <>
          <View style={s.section}><View style={s.group}>
            {([{ key: 'today', label: 'Con menú de hoy' }, { key: 'open', label: 'Abiertos ahora' }] as const).map(({ key, label }, index) => (
              <TouchableOpacity key={key} style={[s.availabilityRow, s.choiceRow, index > 0 && s.rowDivider]} accessibilityRole="checkbox" accessibilityState={{ checked: filters[key] }} accessibilityLabel={label}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, [key]: !filters[key] }); }}>
                <Text style={[s.optionText, { fontWeight: '400', color: filters[key] ? theme.text : theme.textSecondary }]}>{noWidow(label)}</Text>
                <View style={s.checkSlot}><Ionicons name={filters[key] ? 'checkmark' : 'add'} size={18} color={filters[key] ? theme.accent : theme.textMute} /></View>
              </TouchableOpacity>
            ))}
          </View></View>
          <View style={s.section}><View style={s.group}>
            {([{ title: 'Tipo de lugar', field: 'categories', icon: 'restaurant-outline' }, { title: 'Pago', field: 'payments', icon: 'card-outline' }] as const).map((group, index) => {
              const selected = filters[group.field];
              const summary = selected.length ? selected.join(' · ') : group.field === 'categories' ? 'Todos' : 'Cualquiera';
              const disabled = group.field === 'categories' && !categoryOptions.length;
              return <TouchableOpacity key={group.field} style={[s.availabilityRow, index > 0 && s.rowDivider]} disabled={disabled}
                accessibilityRole="button" accessibilityLabel={group.title} accessibilityValue={{ text: summary }} accessibilityState={{ disabled }}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); setFilterDetail(group.field); }}>
                <View style={s.checkSlot}><Ionicons name={group.icon} size={20} color={theme.textSecondary} /></View>
                <Text style={s.disclosureLabel}>{noWidow(group.title)}</Text>
                <Text style={s.disclosureValue} numberOfLines={1}>{noWidow(summary)}</Text>
                <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
              </TouchableOpacity>;
            })}
          </View></View>
          {additionalFilter && <TouchableOpacity style={s.option} onPress={additionalFilter.onClear} accessibilityRole="button" accessibilityLabel={`Quitar filtro ${additionalFilter.label}`}><Text style={s.optionText}>{noWidow(additionalFilter.label)}</Text><Ionicons name="close-circle" size={20} color={theme.textSecondary} /></TouchableOpacity>}
        </>}
      </> : movingLists ? <View style={s.section}><View style={s.group}>
        {visibleCollections.filter((item) => !selectedListIds.includes(item.id)).map((item, index) => <TouchableOpacity key={item.id} disabled={listActionBusy} style={[s.option, index > 0 && s.rowDivider]} accessibilityRole="button" accessibilityLabel={`Mover lugares a ${item.title}`} onPress={() => moveSelectedTo(item)}>
          <Ionicons name="folder-outline" size={20} color={theme.textSecondary} /><Text style={s.optionText}>{noWidow(item.title)}</Text><Text style={s.listCount}>{item.patioIds.length}</Text>
        </TouchableOpacity>)}
        {!visibleCollections.some((item) => !selectedListIds.includes(item.id)) && <View style={s.emptyLists}><Text style={s.emptyDetail}>{noWidow('Crea una lista de destino con +')}</Text></View>}
      </View></View> : <>
        <View style={s.section}><View style={s.group}>
          {selectingLists ? <TouchableOpacity disabled={deletingLists || listActionBusy} style={s.option} accessibilityRole="checkbox" accessibilityLabel="Seleccionar todas las listas" accessibilityState={{ checked: selectedListIds.length === collections.length, disabled: deletingLists || listActionBusy }}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedListIds(selectedListIds.length === collections.length ? [] : collections.map((item) => item.id)); }}>
            <View style={s.checkSlot}><Ionicons name={selectedListIds.length === collections.length ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selectedListIds.length === collections.length ? theme.accent : theme.textMute} /></View>
            <Text style={s.optionText}>{noWidow(selectedListIds.length ? `${selectedListIds.length} seleccionadas` : 'Seleccionar todas')}</Text>
          </TouchableOpacity> : <TouchableOpacity onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, collectionIds: [] }); }} style={s.option} accessibilityRole="checkbox" accessibilityState={{ checked: !listCount }} accessibilityLabel="Todos los lugares">
            <View style={s.checkSlot}><Ionicons name="bookmark-outline" size={20} color={theme.textSecondary} /></View>
            <Text style={s.optionText}>{noWidow('Todos los lugares')}</Text>
            <View style={s.checkSlot}>{!listCount && <Ionicons name="checkmark" size={20} color={theme.accent} />}</View>
          </TouchableOpacity>}
          {visibleCollections.map((collection) => {
            const active = selectingLists ? selectedListIds.includes(collection.id) : filters.collectionIds.includes(collection.id);
            return <View key={collection.id} style={[s.option, s.rowDivider, { paddingRight: 4 }]}>
              <TouchableOpacity disabled={deletingLists || listActionBusy} onPress={() => { Haptics.selectionAsync().catch(() => {}); if (selectingLists) setSelectedListIds((current) => toggleValue(current, collection.id)); else onChange({ ...filters, collectionIds: toggleValue(filters.collectionIds, collection.id) }); }} accessibilityRole="checkbox" accessibilityState={{ checked: active, disabled: deletingLists || listActionBusy }} accessibilityLabel={`${collection.title}, ${collection.patioIds.length} ${collection.patioIds.length === 1 ? 'lugar' : 'lugares'}`} onLongPress={() => { if (!selectingLists) { Haptics.selectionAsync().catch(() => {}); beginListSelection(collection.id); } }} style={s.listRowMain}>
                <View style={s.checkSlot}><Ionicons name={selectingLists ? active ? 'checkmark-circle' : 'ellipse-outline' : 'folder-outline'} size={selectingLists ? 22 : 20} color={selectingLists && active ? theme.accent : theme.textSecondary} /></View>
                <Text style={s.optionText} numberOfLines={2}>{noWidow(collection.title)}</Text>
                {collection.pinned && <Ionicons name="pin" size={13} color={theme.textSecondary} />}
                <Text style={s.listCount}>{collection.patioIds.length}</Text>
                <View style={s.checkSlot}>{!selectingLists && active && <Ionicons name="checkmark" size={20} color={theme.accent} />}</View>
              </TouchableOpacity>
              {selectingLists ? <View style={s.listRowMore} /> : <TouchableOpacity ref={(el) => { moreRefs.current.set(collection.id, el); }} accessibilityRole="button" accessibilityLabel={`Acciones de ${collection.title}`} style={s.listRowMore} onPress={() => openListActions(collection)}><Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} /></TouchableOpacity>}
            </View>;
          })}
        </View></View>
        {!collections.length && <View style={s.emptyLists}><Ionicons name="list-outline" size={28} color={theme.textSecondary} /><Text style={s.emptyTitle}>{noWidow('Sin listas')}</Text></View>}

      </>}

    </FilterSheet>

    {/* Respaldo Android — Alert.prompt no existe en esa plataforma. Modal
        propio, centrado y de tamaño fijo (no vive dentro de un ScrollView),
        mismo lenguaje visual glass que el resto del archivo. Nido de dos
        <Modal> es seguro aquí porque el bug de Modales anidados documentado
        arriba es específico de iOS (ver comentario en FilterSheet) y esta
        rama nunca corre en iOS. */}
    {Platform.OS !== 'ios' && (
      <Modal transparent visible={!!renameTarget} animationType="fade" onRequestClose={() => setRenameTarget(null)}>
        <KeyboardAvoidingView style={s.kav} behavior="padding">
          <TouchableOpacity activeOpacity={1} style={s.renameBackdrop} onPress={() => setRenameTarget(null)}>
            <TouchableOpacity activeOpacity={1} style={s.renameCard} onPress={() => {}}>
              <BlurView intensity={theme.isDark ? 30 : 40} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
              <View pointerEvents="none" style={s.renameCardTint} />
              <Text style={s.renameTitle}>{noWidow('Renombrar lista')}</Text>
              <TextInput
                autoFocus
                value={renameValue}
                accessibilityLabel="Nombre de la lista"
                onChangeText={setRenameValue}
                maxLength={60}
                onSubmitEditing={() => { if (renameTarget) commitRename(renameTarget.id, renameValue); setRenameTarget(null); }}
                placeholder="Ej. Tacos del barrio"
                placeholderTextColor={theme.textMute}
                returnKeyType="done"
                autoCapitalize="words"
                style={s.renameInput}
              />
              <View style={s.renameActions}>
                <TouchableOpacity style={s.renameActionBtn} onPress={() => setRenameTarget(null)}>
                  <Text style={s.renameActionText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.renameActionBtn, s.renameActionDivider]} onPress={() => { if (renameTarget) commitRename(renameTarget.id, renameValue); setRenameTarget(null); }}>
                  <Text style={[s.renameActionText, s.renameActionTextPrimary]}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    )}
  </View>;
}
