import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaceIcon } from '@/components/place-icon';
import { LibraryListRow } from '@/components/library-list-row';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Keyboard, Modal, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';

import { ACTION_SHEET_MENU_WIDTH, ActionSheet, type ActionSheetOption } from '@/components/action-sheet';
import { createCollection, deleteCollection, movePatiosToCollection, normalizeCollectionTitle, publishCollection, renameCollection, setCollectionsPinned, type PatioCollection } from '@/lib/collections';
import { ahoraCDMX, DIA_CORTO, DIAS_ORDEN_LUNES, estaAbiertoAhora, formatHHMM12Fixed, hhmmToDate, minutosAHHMM, type HorarioSemanal } from '@/lib/horario';
import { LibrarySheet } from '@/components/library-sheet';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { SelectionActions } from '@/components/selection-actions';
import { floatingSurfaceShadow } from '@/lib/surface-styles';

// "Filtros" combina ATRIBUTOS del lugar (categoría, pagos) — se suman entre
// sí, como Google Maps. "Listas" cambia a qué colecciones te asomas — varias
// a la vez se UNEN (ver esto + ver aquello), no se restringen entre sí; es
// otro tipo de combinación (unión de conjuntos, no intersección de
// atributos). Una sola entrada reúne estos criterios; su estado se resume
// junto al botón, sin añadir una barra de acciones paralela a la búsqueda.
//
// openAt generaliza "abierto ahora" a cualquier momento: null = sin filtro de
// horario, {dia,minutos} = abierto en ese momento concreto (hoy más tarde o
// mañana) — casos reales (2026-09-16): "es la 1am, quiero taquerías que
// sigan abiertas a las 2" (hoy, con la ruleta arrancando en la hora actual) y
// "a qué hora abre la barbacoa mañana" (mañana). Sin variante especial para
// estaAbiertoAhora, que ya acepta cualquier {dia,minutos} como "ahora".
//
// { ahora: true } es el toque simple del chip (2026-09-19): "abierto ahora"
// sin momento fijo — se resuelve contra el reloj cada vez que se evalúa, así
// que dejarlo puesto horas no filtra por la hora en que se activó. Elegir un
// momento concreto (mantener presionado) sí guarda {dia,minutos}.
export type OpenAt = { dia: number; minutos: number } | { ahora: true } | null;

export type FoodieFilters = {
  openAt: OpenAt;
  categories: string[];
  payments: string[];
  collectionIds: string[];
};

export const EMPTY_FOODIE_FILTERS: FoodieFilters = { openAt: null, categories: [], payments: [], collectionIds: [] };

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
  weeklyHours: HorarioSemanal | null;
  categories: string[];
  payments: string[];
  collections: PatioCollection[];
}): boolean {
  if (filters.openAt && !estaAbiertoAhora(input.weeklyHours, 'ahora' in filters.openAt ? undefined : filters.openAt)) return false;
  if (filters.categories.length && !input.categories.some((category) => filters.categories.includes(category))) return false;
  if (filters.payments.length && !input.payments.some((method) => filters.payments.includes(method))) return false;
  if (filters.collectionIds.length) {
    const active = input.collections.filter((collection) => filters.collectionIds.includes(collection.id));
    if (!active.some((collection) => collection.patioIds.includes(input.patioId))) return false;
  }
  return true;
}

const PAYMENT_METHODS = ['Efectivo', 'Tarjeta', 'Transferencia'];
function toggleValue(list: string[], value: string) {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

type OpenPanel = 'filters' | 'lists' | null;
type FilterDetail = 'categories' | 'payments' | null;

function styles(t: Theme) {
  const border = t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    root: { minHeight: 44, paddingVertical: 6, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, paddingHorizontal: 16 },
    scopeControl: { flex: 1, minWidth: 0, justifyContent: 'center' },
    // Fixed slots: labels and selection badges never change toolbar geometry.
    openChip: {},
    scopeScroll: { flex: 1, minWidth: 0 },
    scopeGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    organizer: { minHeight: 40, paddingHorizontal: 6, paddingVertical: 4, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.glass },
    organizerCompact: { flexShrink: 0, width: 40, paddingHorizontal: 0, justifyContent: 'center' },
    headerTextAction: { minWidth: 44, minHeight: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    headerActionText: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: t.text },
    organizerText: { flexShrink: 1, minWidth: 0, fontSize: 13, fontWeight: '600', color: t.text },
    controlIcon: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
    activeCount: { position: 'absolute', top: -5, right: -3, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, overflow: 'hidden', backgroundColor: t.text, color: t.bg, textAlign: 'center', fontSize: 10, lineHeight: 18, fontWeight: '700', fontVariant: ['tabular-nums'] },
    choiceRow: { minHeight: 48 },
    disclosureLabel: { flex: 1, minWidth: 0, fontSize: 15, fontWeight: '500', color: t.text },
    disclosureValue: { flexShrink: 1, minWidth: 0, maxWidth: '45%', fontSize: 14, color: t.textSecondary, textAlign: 'right' },
    availabilityRow: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 12 },
    checkSlot: { width: 22, flexShrink: 0, alignItems: 'center' },
    disclosureChevron: { width: 16, height: 24, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
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
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderTopWidth: StyleSheet.hairlineWidth, borderColor: border },
    sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(20,21,24,0.72)' : 'rgba(255,255,255,0.70)' },
    grabberTouch: { alignItems: 'center', flexShrink: 0 },
    grabber: { width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 12, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' },
    headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    panelHeader: { width: '100%', minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    panelHeading: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
    panelActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
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
    sectionLabel: { paddingHorizontal: 20, paddingBottom: 8, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: t.textMute },
    option: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    optionText: { flex: 1, fontSize: 15, fontWeight: '500', color: t.text },
    // Fila de una lista real (a diferencia de "Nueva lista"): el toggle
    // ocupa la mayoría de la fila, "···" vive aparte para no competir con
    // el gesto principal (unir/quitar del mapa).
    listRowMain: { flex: 1, minWidth: 0, minHeight: 52, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 12 },
    listTrailing: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0 },
    listCount: { minWidth: 64, fontSize: 13, lineHeight: 18, color: t.textSecondary, textAlign: 'right', fontVariant: ['tabular-nums'] },
    // Homologado con navButton de coleccion/[id].tsx: ícono suelto, sin
    // caja de fondo — corregido 2026-08-24, había ido en la dirección
    // contraria (le había puesto caja en vez de quitársela a los otros).
    listRowMore: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center' },
    createInput: { flex: 1, fontSize: 16, fontWeight: '400', color: t.text, padding: 0 },
    createBtn: { minWidth: 44, minHeight: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
    createBtnDisabled: { opacity: 0.35 },
    createBtnText: { fontSize: 15, fontWeight: '600', color: t.accent },
    confirmMoveButton: { minHeight: 50, borderRadius: 25, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 },
    confirmMoveText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
    // Menú de acciones por lista — anclado junto al botón "···" (mismo
    // componente visual que components/action-sheet.tsx), dentro del MISMO
    // Modal del panel (ver comentario en LibrarySheet), no un Modal propio.
    inlineMenu: { position: 'absolute', borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, ...floatingSurfaceShadow(t.isDark) },
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

    // Ruleta de hora del filtro "Abierto" — misma receta visual que el
    // picker compacto de components/business-schedule-editor.tsx.
    pickerOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    // Recortado 2026-09-16 (pedido: ganar espacio a lo alto) — de 300 a
    // ~230: la ruleta nativa baja de 180 a 150pt (sigue mostrando sus 5
    // filas, solo más compacta) y los márgenes de aire se ajustan parejo.
    // 190 (antes 300→230): el odómetro de una línea mide una fracción de lo
    // que medía la ruleta nativa de varias filas — recortado 2026-09-16.
    pickerSurface: { width: 320, minHeight: 252, paddingTop: 24, paddingBottom: 16, borderRadius: 32, borderWidth: StyleSheet.hairlineWidth, borderColor: border, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-start', ...floatingSurfaceShadow(t.isDark) },
    // Antes vivía "position: absolute" mientras el resto del contenido se
    // centraba con justifyContent:'center' — dos sistemas de coordenadas
    // distintos que casi nunca coinciden, así que subir el `top` a mano no
    // separaba nada de verdad (bug real reportado 2026-09-16, se veía
    // pegado a los chips de día sin importar cuánto se subiera). Ahora es
    // un hijo normal del flujo, con su propio marginBottom real.
    pickerTitle: { fontSize: 10.5, lineHeight: 13, fontWeight: '700', letterSpacing: 0.8, textAlign: 'center', color: t.textSecondary, marginBottom: 16 },
    // Fila de 7 días, orden fijo Lun–Dom (mismo que el editor de horario del
    // Fondero) — las 7 abreviaturas miden casi lo mismo entre sí, así que
    // caben parejas en una sola línea sin recortarse ni descuadrarse.
    pickerDayRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 12, justifyContent: 'center' },
    // 36×36 queda bajo el mínimo táctil de 44pt — se compensa con hitSlop
    // en el JSX (mismo truco que ya usan las demás cápsulas de 32pt de este
    // archivo), no agrandando el chip de nuevo.
    pickerDayChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', gap: 3, borderWidth: StyleSheet.hairlineWidth, borderColor: border },
    pickerDayChipText: { fontSize: 11, fontWeight: '700' },
    pickerDayDot: { width: 4, height: 4, borderRadius: 2 },
    // Odómetro de una línea: fondo sólido (nunca BlurView) — memoria real:
    // el blur produjo artefactos (puntos negros) en dispositivo sobre
    // paneles que muestran listas de opciones flotando sobre el mapa.
    // "compact" (una fila) exige un popover aparte — Alejandro prefirió
    // quedarse embebido en el mismo panel, así que es "spinner" (nativo,
    // inline), lo más bajo posible sin que la ruleta se recorte mal.
    pickerScrubber: { width: 260, height: 140, marginTop: 6, alignSelf: 'center' },
  });
}

// Compact toolbar capsules keep a 44 pt effective touch target.
// Content options have full-height rows and need no expanded hit regions.
const CONTROL_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };
const SCOPE_HIT_SLOP = { top: 6, bottom: 6, left: 0, right: 0 };
const CREATE_BTN_HIT_SLOP = { top: 5, bottom: 5, left: 0, right: 0 };
// "Limpiar" (texto ~14pt) y "Cerrar" (ícono 20×20) son los más chicos del
// header — sin vecino a la derecha, "Cerrar" puede crecer más ahí.

// Sheet real, no popover: en iPhone la HIG es explícita — "popovers are used
// on iPad/Mac for transient controls, but not on iPhone; sheets should be
// used instead." Usa Modal para no depender del recorte/overflow del padre
// donde viva <FoodieFilterBar> (a veces dentro de un ScrollView), con el
// mismo spring/drag-to-dismiss que ya vive en el sheet de resultados de
// Explorar — un solo lenguaje de movimiento para los tres sheets de la
// pantalla. El resumen cabe sin scroll y cada grupo ocupa una subvista
// de la misma hoja. La altura se adapta al contenido y al tamaño de texto.

export function FoodieFilterBar({ filters, onChange, collections, categories, onCollectionCreated, onCollectionUpdated, onCollectionRemoved, organizationOptions, libraryActions, viewMode, onViewModeChange, additionalFilter, onOverlayVisibilityChange, locationAction, floating = true }: {
  filters: FoodieFilters; onChange: (next: FoodieFilters) => void; collections: PatioCollection[]; categories: string[];
  onCollectionCreated?: (collection: PatioCollection) => void;
  onCollectionUpdated?: (collection: PatioCollection) => void;
  onCollectionRemoved?: (collectionId: string) => void;
  additionalFilter?: { label: string; onClear: () => void };
  organizationOptions?: ActionSheetOption[];
  libraryActions?: ActionSheetOption[];
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  onOverlayVisibilityChange?: (visible: boolean) => void;
  locationAction?: { onPress: () => void; busy: boolean };
  // Vidrio solo cuando la barra flota sobre contenido real (el mapa de
  // Explorar) — regla de Materials (CLAUDE.md): "no uses Liquid Glass en la
  // capa de contenido". Guardados vive inline sobre su propia lista, así que
  // pasa floating=false y las mismas cápsulas se pintan planas (t.surface).
  floating?: boolean;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  const viewport = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [openPickerVisible, setOpenPickerVisible] = useState(false);
  // Entrada/salida animada (mismo resorte que ActionSheet: escala+opacidad,
  // no el fade plano por defecto del Modal) y feedback háptico simétrico —
  // abrir ya lo daba el tap del chip, cerrar no tenía nada (pedido
  // 2026-09-16: cuidar el feedback de abrir/cerrar).
  const [openPickerRendered, setOpenPickerRendered] = useState(false);
  const openPickerScale = useRef(new Animated.Value(0.92)).current;
  const openPickerOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (openPickerVisible) {
      setOpenPickerRendered(true);
      openPickerScale.setValue(0.92);
      openPickerOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(openPickerScale, { toValue: 1, stiffness: 420, damping: 28, mass: 0.7, useNativeDriver: true }),
        Animated.timing(openPickerOpacity, { toValue: 1, duration: 130, useNativeDriver: true }),
      ]).start();
    } else if (openPickerRendered) {
      Animated.parallel([
        Animated.timing(openPickerScale, { toValue: 0.94, duration: 140, useNativeDriver: true }),
        Animated.timing(openPickerOpacity, { toValue: 0, duration: 140, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) setOpenPickerRendered(false); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPickerVisible]);
  // Borrador del picker de "Abierto": día y hora se acumulan aquí en cada
  // toque/tick y solo se confirman a filters.openAt al cerrar — ley de
  // CLAUDE.md/memoria: nunca setState costoso en cada tick de un gesto
  // continuo, solo al soltar (reportado 2026-09-16: las pills "bailaban"
  // porque antes cada tick sí escribía en filters). null = todavía no se
  // tocó esa parte; se resuelve con el fallback al momento de mostrar/cerrar.
  const [openPickerDia, setOpenPickerDia] = useState<number | null>(null);
  const [openPickerDraftMin, setOpenPickerDraftMin] = useState<number | null>(null);
  const [movingLists, setMovingLists] = useState(false);
  const [moveDestinationId, setMoveDestinationId] = useState<string | null>(null);
  const [listActionBusy, setListActionBusy] = useState(false);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [filterDetail, setFilterDetail] = useState<FilterDetail>(null);
  const [organizerVisible, setOrganizerVisible] = useState(false);
  const organizerRef = useRef<View>(null);
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
  const [actionsLayout, setActionsLayout] = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null);
  const moreRefs = useRef<Map<string, View | null>>(new Map());
  // Naming stays in the same themed sheet, with its own scroll identity.
  const [renameTarget, setRenameTarget] = useState<PatioCollection | null>(null);
  const [renameValue, setRenameValue] = useState('');
  useEffect(() => {
    onOverlayVisibilityChange?.(openPanel !== null || openPickerRendered || organizerVisible);
  }, [onOverlayVisibilityChange, openPanel, openPickerRendered, organizerVisible]);
  const attributeCount = foodieFilterCount(filters);
  // "Abierto" ya es un chip visible con su propio estado; contarlo aquí
  // duplicaría la señal dentro del badge de "Filtros", que solo resume lo
  // oculto tras el sheet (categorías, pagos y el filtro adicional del mapa).
  const filterCount = attributeCount + Number(!!additionalFilter);
  const listCount = filters.collectionIds.length;
  const isLibrary = !!onViewModeChange;
  const categoryOptions = [...new Set([...categories, ...filters.categories])].sort((a, b) => a.localeCompare(b, 'es'));
  const [creatingPending, setCreatingPending] = useState(false);
  const createPendingRef = useRef(false);
  const pillBg = floating ? theme.glass : theme.surface;

  // Etiqueta del chip "Abierto": solo la hora, nunca el nombre del día —
  // "Hasta las X"/"El viernes X" alargaban el chip lo suficiente para
  // empujar a Filtros/Listas a una segunda línea al elegir (reportado
  // 2026-09-16). El ícono distingue hoy vs. cualquier otro día (reloj vs.
  // calendario), así el texto mide casi lo mismo que "Abierto" siempre y la
  // fila nunca se reacomoda.
  const hoyDia = ahoraCDMX().dia;
  const openMoment = filters.openAt && !('ahora' in filters.openAt) ? filters.openAt : null;
  const otroDiaActivo = openMoment !== null && openMoment.dia !== hoyDia;
  const openLabel = !openMoment ? 'Abierto' : formatHHMM12Fixed(minutosAHHMM(openMoment.minutos));
  // Orden fijo Lun–Dom (el mismo que ya usa el editor de horario del
  // Fondero) — no "hoy, mañana, ..." rotando: ese orden cambiaba de largo
  // cada día ("Mañana" es una palabra larga entre abreviaturas de 3 letras)
  // y descuadraba la fila. Un orden fijo y etiquetas parejas es más legible
  // y predecible (corregido 2026-09-16 tras auditoría). Elegir cualquier día
  // de la semana (ej. "¿a qué hora abre la barbacoa el viernes?") sin fingir
  // precisión de FECHA que el dato no tiene — el horario es semanal, un
  // lugar cerrado los viernes ya sale así sin importar cuál viernes.
  const openPickerDias = DIAS_ORDEN_LUNES;
  // Día/hora efectivos del picker: el borrador si ya se tocó, si no la hora
  // actual — SIEMPRE, sin importar qué día esté marcado. Antes el default
  // cambiaba según el día (hoy = ahora, otro día = 9am), lo que obligaba a
  // remontar la ruleta (key={dia}) para reposicionarla al cambiar de día —
  // ese remount nativo era el "rebote" reportado 2026-09-16. Con un default
  // constante, tocar un chip de día nunca mueve la ruleta: no hace falta
  // remontarla, no hay glitch.
  const effectivePickerDia = openPickerDia ?? hoyDia;
  const effectivePickerMin = openPickerDraftMin ?? ahoraCDMX().minutos;
  const openPickerDate = hhmmToDate(minutosAHHMM(effectivePickerMin));
  // Cerrar el picker (tocar fuera o back de Android) confirma el borrador —
  // si no se tocó ni el día ni la ruleta, no se activa nada solo por haber
  // abierto y cerrado.
  const closeOpenPicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (openPickerDia != null || openPickerDraftMin != null) {
      onChange({ ...filters, openAt: { dia: effectivePickerDia, minutos: effectivePickerMin } });
    }
    setOpenPickerVisible(false);
    setOpenPickerDia(null);
    setOpenPickerDraftMin(null);
  };

  const togglePanel = (panel: OpenPanel) => {
    Haptics.selectionAsync().catch(() => {});
    setActionsTarget(null);
    setMovingLists(false);
    setMoveDestinationId(null);
    setCreatingList(false);
    setRenameTarget(null);
    setNewListTitle('');
    Keyboard.dismiss();
    setFilterDetail(null);
    setSelectingLists(false);
    setSelectedListIds([]);
    setOpenPanel(panel);
  };

  const handleCreateList = async (rawTitle: string = newListTitle) => {
    const title = normalizeCollectionTitle(rawTitle.trim());
    if (!title || createPendingRef.current || deleteListsPending.current) return;
    createPendingRef.current = true; setCreatingPending(true);
    try {
      const collection = await createCollection(title);
      onCollectionCreated?.(collection);
      if (movingLists) setMoveDestinationId(collection.id);
      // An empty new list must not silently hide every place on the map.
      setNewListTitle('');
      setCreatingList(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      Alert.alert(noWidow('No pudimos crear la lista'), noWidow('Inténtalo de nuevo.'));
    } finally {
      createPendingRef.current = false; setCreatingPending(false);
    }
  };

  // Keep creation in the themed sheet on both platforms, without a native alert.
  const startCreate = () => {
    if (createPendingRef.current || deleteListsPending.current) return;
    Haptics.selectionAsync().catch(() => {});
    setCreatingList(true);
  };

  const commitRename = async (collectionId: string, rawTitle: string): Promise<boolean> => {
    const title = normalizeCollectionTitle(rawTitle.trim());
    if (!title || deleteListsPending.current || createPendingRef.current) return false;
    deleteListsPending.current = true; setListActionBusy(true);
    try {
      const renamed = await renameCollection(collectionId, title);
      if (!renamed) throw new Error('Missing list');
      onCollectionUpdated?.(renamed);
      return true;
    } catch { Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Inténtalo de nuevo.')); return false; }
    finally { deleteListsPending.current = false; setListActionBusy(false); }
  };

  const startRename = (collection: PatioCollection) => {
    if (deleteListsPending.current || createPendingRef.current) return;
    Haptics.selectionAsync().catch(() => {});
    setRenameValue(collection.title);
    setRenameTarget(collection);
  };
  const namingList = creatingList || !!renameTarget;
  const namingValue = renameTarget ? renameValue : newListTitle;
  const namingBusy = creatingPending || listActionBusy;
  const saveListName = () => {
    if (renameTarget) void commitRename(renameTarget.id, renameValue).then((success) => { if (success) { setRenameTarget(null); Keyboard.dismiss(); } });
    else void handleCreateList();
  };

  const shareCollection = (collection: PatioCollection) => void runListAction(async () => {
    Haptics.selectionAsync().catch(() => {});
    const target = collection.visibility === 'private' ? { ...collection, visibility: 'unlisted' as const } : collection;
    const published = await publishCollection(target);
    if (published.remoteId !== collection.remoteId || published.visibility !== collection.visibility) {
      onCollectionUpdated?.(published);
    }
    const link = published.remoteId ? `\n\npatio://coleccion-publica/${published.remoteId}` : '';
    const desc = published.description ? `\n${published.description}` : '';
    await Share.share({ message: `${published.title} — mis lugares en Patio${desc}${link}` });
  });

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
            if (deleteListsPending.current) return;
            deleteListsPending.current = true; setDeletingLists(true);
            try {
              await deleteCollection(collection.id);
              onCollectionRemoved?.(collection.id);
              if (filters.collectionIds.includes(collection.id)) onChange({ ...filters, collectionIds: filters.collectionIds.filter((id) => id !== collection.id) });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } catch { Alert.alert(noWidow('No pudimos eliminar la lista'), noWidow('Inténtalo de nuevo.')); }
            finally { deleteListsPending.current = false; setDeletingLists(false); }
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

  const openListActions = (collection: PatioCollection) => {
    Haptics.selectionAsync().catch(() => {});
    const anchor = moreRefs.current.get(collection.id);
    if (!anchor) return;
    anchor.measureInWindow((x, y, width, height) => {
      const topEdge = insets.top + 8;
      const bottomEdge = viewport.height - insets.bottom - 8;
      const menuWidth = Math.min(ACTION_SHEET_MENU_WIDTH, viewport.width - insets.left - insets.right - 16);
      const below = Math.max(topEdge, Math.min(bottomEdge - 44, y + height + 8));
      const above = Math.max(topEdge + 44, Math.min(bottomEdge, y - 8));
      const spaceBelow = bottomEdge - below;
      const spaceAbove = above - topEdge;
      const left = Math.min(Math.max(insets.left + 8, x + width - menuWidth), viewport.width - insets.right - menuWidth - 8);
      const estimatedHeight = 34 * viewport.fontScale + 3 * Math.max(46, 23 * viewport.fontScale + 16);
      setActionsLayout(spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove
        ? { top: below, left, width: menuWidth, maxHeight: spaceBelow }
        : { bottom: viewport.height - above, left, width: menuWidth, maxHeight: spaceAbove });
      setActionsTarget(collection);
    });
  };

  const beginListSelection = (id?: string) => {
    setSelectingLists(true);
    setSelectedListIds(id ? [id] : []);
    setActionsTarget(null);
  };
  const closeListMenu = () => { setActionsTarget(null); };
  const listMenuOptions: ActionSheetOption[] = actionsTarget ? [
    { label: 'Compartir', icon: 'share-outline', onPress: () => shareCollection(actionsTarget) },
    { label: 'Renombrar', icon: 'pencil', onPress: () => startRename(actionsTarget) },
    { label: 'Eliminar', icon: 'trash-outline', destructive: true, onPress: () => removeCollection(actionsTarget) },
  ] : [];


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
  // Elegir un destino no escribe datos. Mover confirma el cambio, igual
  // que SaveToListSheet; la selección de origen permanece al volver.
  const moveSelectedTo = (destination: PatioCollection) => void runListAction(async () => {
    const updated = await movePatiosToCollection(selectedPatioIds, selectedListIds, destination.id);
    updated.forEach((item) => onCollectionUpdated?.(item));
    setMovingLists(false); setMoveDestinationId(null); setSelectingLists(false); setSelectedListIds([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  });


  // "Abierto" despliega su propio menú (Abierto hasta… / Mañana a las…) en
  // vez de ser un simple on-off — pedido real 2026-09-16: son las 10pm y
  // quiero lugares que sigan abiertos a las 11, o planear uno abierto
  // mañana 9am. "Filtros" y "Listas" quedan como los dos únicos overflow, y
  // en Guardados se suma "Ordenar" (antes enterrado en "⋯") — auditoría
  // contra Google Maps/Uber/Airbnb. Ya activo, tocarlo lo apaga directo (sin
  // pasar por el menú) — es la forma más corta de quitar el filtro.
  return <View style={s.root} pointerEvents="box-none">
    <View style={[s.scopeScroll, s.scopeGroup]}>
      <TouchableOpacity
        hitSlop={SCOPE_HIT_SLOP}
        onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, openAt: filters.openAt ? null : { ahora: true } }); }}
        onLongPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); setOpenPickerVisible(true); }}
        delayLongPress={350}
        style={[s.organizer, s.scopeControl, s.openChip, { backgroundColor: filters.openAt ? theme.accent : pillBg, borderColor: filters.openAt ? theme.accent : theme.border }]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Abierto${!openMoment ? (filters.openAt ? ' ahora' : '') : otroDiaActivo ? ` el ${DIA_CORTO[openMoment.dia]}, ${openLabel}` : `, hasta ${openLabel}`}`}
        accessibilityHint={filters.openAt ? 'Toca para quitar el filtro. Mantén presionado para elegir día y hora' : 'Toca para ver lo abierto ahora. Mantén presionado para elegir día y hora'}
        accessibilityState={{ expanded: openPickerVisible }}>
        {!filters.openAt && floating && <View style={s.pillBlurClip}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </View>}
        <Ionicons name={otroDiaActivo ? 'calendar-outline' : 'time-outline'} size={16} color={filters.openAt ? '#FFFFFF' : theme.text} />
        <Text numberOfLines={1} adjustsFontSizeToFit style={[s.organizerText, filters.openAt && { color: '#FFFFFF' }]}>Abierto</Text>
      </TouchableOpacity>

      <TouchableOpacity
        hitSlop={SCOPE_HIT_SLOP}
        onPress={() => { Keyboard.dismiss(); togglePanel('filters'); }}
        style={[s.organizer, s.scopeControl, { backgroundColor: pillBg }]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Filtros${filterCount ? `, ${filterCount} activos` : ''}`}
        accessibilityState={{ expanded: openPanel === 'filters' }}>
        {floating && <View style={s.pillBlurClip}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </View>}
        <View style={s.controlIcon}>
          <Ionicons name="options-outline" size={20} color={theme.text} />
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit style={s.organizerText}>Filtros</Text>
        {filterCount > 0 && <Text accessible={false} style={s.activeCount}>{filterCount > 99 ? '99+' : filterCount}</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        hitSlop={SCOPE_HIT_SLOP}
        onPress={() => { Keyboard.dismiss(); togglePanel('lists'); }}
        style={[s.organizer, s.scopeControl, { backgroundColor: pillBg }]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Tus listas${listCount ? `, ${listCount} activas` : ''}`}
        accessibilityState={{ expanded: openPanel === 'lists' }}>
        {floating && <View style={s.pillBlurClip}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </View>}
        <View style={s.controlIcon}>
          <Ionicons name="list-outline" size={20} color={theme.text} />
        </View>
        <Text numberOfLines={1} adjustsFontSizeToFit style={s.organizerText}>Listas</Text>
        {listCount > 0 && <Text accessible={false} style={s.activeCount}>{listCount > 99 ? '99+' : listCount}</Text>}
      </TouchableOpacity>

    </View>

    {/* Ubicación ocupa la misma casilla que Organizar; las pills no se mueven. */}
    {!isLibrary && (locationAction ? <TouchableOpacity
      hitSlop={CONTROL_HIT_SLOP}
      onPress={locationAction.onPress}
      disabled={locationAction.busy}
      style={[s.organizer, s.organizerCompact, { backgroundColor: pillBg }]}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Centrar en mi ubicación"
      accessibilityState={{ busy: locationAction.busy, disabled: locationAction.busy }}>
      {floating && <View style={s.pillBlurClip}>
        <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      </View>}
      {locationAction.busy ? <ActivityIndicator size="small" color={theme.text} /> : <Ionicons name="navigate-outline" size={20} color={theme.text} />}
    </TouchableOpacity> : <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={s.organizerCompact} />)}
    {isLibrary && <>
      <TouchableOpacity
        hitSlop={CONTROL_HIT_SLOP}
        ref={organizerRef}
        onPress={() => { Keyboard.dismiss(); Haptics.selectionAsync().catch(() => {}); setOrganizerVisible(true); }}
        style={[s.organizer, s.organizerCompact, { backgroundColor: pillBg }]}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Organizar Guardados"
        accessibilityState={{ expanded: organizerVisible }}
        accessibilityHint="Ordenar, cambiar vista y seleccionar lugares">
        {floating && <View style={s.pillBlurClip}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        </View>}
        <Ionicons name="ellipsis-horizontal" size={20} color={theme.text} />
      </TouchableOpacity>
      <ActionSheet
        visible={organizerVisible}
        anchorRef={organizerRef}
        onDismiss={() => setOrganizerVisible(false)}
        options={[
          ...(organizationOptions ?? []),
          ...(onViewModeChange ? [
            { label: 'Cuadrícula', sectionLabel: 'Vista', icon: 'grid-outline' as const, selected: viewMode === 'grid', onPress: () => { Haptics.selectionAsync().catch(() => {}); onViewModeChange('grid'); } },
            { label: 'Lista', icon: 'list-outline' as const, selected: viewMode === 'list', onPress: () => { Haptics.selectionAsync().catch(() => {}); onViewModeChange('list'); } },
          ] : []),
          ...(libraryActions ?? []),
        ]}
      />
    </>}

    <LibrarySheet
      visible={openPanel !== null}
      onClose={() => {
        if (deleteListsPending.current || createPendingRef.current) return false;
        setOpenPanel(null);
        setRenameTarget(null);
        return true;
      }}
      hideTitle={false}
      hideClose={selectingLists && !movingLists && !namingList}
      title={openPanel === 'filters' ? filterDetail === 'categories' ? 'Tipo de lugar' : filterDetail === 'payments' ? 'Pago' : 'Filtros' : renameTarget ? 'Renombrar lista' : creatingList ? 'Nueva lista' : movingLists ? 'Destino' : selectingLists ? selectedListIds.length ? `${selectedListIds.length} ${selectedListIds.length === 1 ? 'lista seleccionada' : 'listas seleccionadas'}` : 'Organizar listas' : 'Listas'}
      viewKey={renameTarget ? `lists-rename:${renameTarget.id}` : creatingList ? 'lists-create' : openPanel === 'filters' ? (filterDetail ?? 'filters') : movingLists ? 'lists-move' : selectingLists ? 'lists-select' : 'lists'}
      onCreate={openPanel === 'lists' && !namingList && (!selectingLists || movingLists) ? startCreate : undefined}
      editing={selectingLists && !movingLists && !namingList}
      preserveBrowsingHeight={namingList}
      stabilizeEditor={namingList}
      dismissDisabled={creatingPending || deletingLists || listActionBusy}
      headerActions={openPanel === 'lists' && !movingLists && !namingList ? selectingLists ? <TouchableOpacity disabled={deletingLists || listActionBusy} style={s.headerTextAction} accessibilityRole="button" accessibilityLabel="Terminar de organizar listas" onPress={() => { setSelectingLists(false); setSelectedListIds([]); }}><Text numberOfLines={1} style={s.headerActionText}>Listo</Text></TouchableOpacity> : collections.length > 0 ? <TouchableOpacity style={s.headerTextAction} accessibilityRole="button" accessibilityLabel="Organizar listas" onPress={() => beginListSelection()}><Text numberOfLines={1} style={s.headerActionText}>Organizar</Text></TouchableOpacity> : undefined : undefined}
      editor={openPanel === 'lists' && namingList ? <View style={s.section}><View style={s.group}>
          <View style={[s.option, { paddingVertical: 12 }]}>
            <View style={s.rowCopy}>
              <TextInput autoFocus keyboardAppearance={theme.isDark ? 'dark' : 'light'} value={namingValue} editable={!namingBusy} onChangeText={renameTarget ? setRenameValue : setNewListTitle} maxLength={60} onSubmitEditing={saveListName} placeholder="Nombre de la lista" accessibilityLabel="Nombre de la lista" placeholderTextColor={theme.textMute} returnKeyType="done" autoCapitalize="sentences" style={[s.createInput, { minHeight: 44 }]} />
            </View>
            <TouchableOpacity disabled={!namingValue.trim() || namingBusy} hitSlop={CREATE_BTN_HIT_SLOP} onPress={saveListName} accessibilityRole="button" accessibilityLabel={renameTarget ? 'Guardar nombre de la lista' : 'Crear lista'} accessibilityState={{ disabled: !namingValue.trim() || namingBusy, busy: namingBusy }} style={[s.createBtn, (!namingValue.trim() || namingBusy) && s.createBtnDisabled]}><Text style={s.createBtnText}>{namingBusy ? renameTarget ? 'Guardando…' : 'Creando…' : renameTarget ? 'Guardar' : 'Crear'}</Text></TouchableOpacity>
          </View>
        </View></View> : undefined}
      footer={!namingList && openPanel === 'lists' && movingLists ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <TouchableOpacity style={[s.confirmMoveButton, (!moveDestinationId || listActionBusy) && s.createBtnDisabled]}
          accessibilityRole="button" accessibilityLabel="Mover lugares" accessibilityState={{ disabled: !moveDestinationId || listActionBusy, busy: listActionBusy }}
          disabled={!moveDestinationId || listActionBusy} onPress={() => { const destination = collections.find((item) => item.id === moveDestinationId); if (destination) moveSelectedTo(destination); }}>
          <Text style={s.confirmMoveText}>{noWidow(listActionBusy ? 'Moviendo…' : `Mover ${selectedPatioIds.length} ${selectedPatioIds.length === 1 ? 'lugar' : 'lugares'}`)}</Text>
        </TouchableOpacity>
      </View> : !namingList && openPanel === 'lists' && selectingLists ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <SelectionActions busy={deletingLists || listActionBusy} actions={[
          { label: allPinned ? 'Desfijar' : 'Fijar', icon: allPinned ? 'pin-off-outline' : 'pin-outline', disabled: !selectedLists.length, onPress: pinSelectedLists },
          { label: 'Compartir', icon: 'share-outline', disabled: !selectedLists.length, onPress: shareSelectedLists },
          { label: 'Mover', icon: 'folder-open-outline', disabled: !selectedPatioIds.length, onPress: () => { if (!selectedPatioIds.length) return; setMoveDestinationId(null); setMovingLists(true); } },
          { label: 'Renombrar', icon: 'pencil', disabled: selectedLists.length !== 1, onPress: () => { if (selectedLists.length === 1) startRename(selectedLists[0]); } },
          { label: 'Eliminar', icon: 'trash-outline', disabled: !selectedLists.length, onPress: removeSelectedLists },
        ]} />
      </View> : undefined}
      preferredHeight={namingList ? 180 : openPanel === 'filters'
        ? filterDetail === 'categories' ? Math.min(560, 96 + categoryOptions.length * 48)
          : filterDetail === 'payments' ? 244 : 216 + (additionalFilter ? 56 : 0)
        : Math.min(514, 152 + Math.max(1, collections.length) * 56 + (creatingList ? 96 : 0) + (selectingLists ? 44 : 0))}
      onBack={renameTarget ? () => { if (!listActionBusy) { setRenameTarget(null); Keyboard.dismiss(); } } : creatingList ? () => { if (!creatingPending) { setCreatingList(false); setNewListTitle(''); Keyboard.dismiss(); } } : movingLists ? () => { if (!listActionBusy) { setMovingLists(false); setMoveDestinationId(null); } } : openPanel === 'filters' && filterDetail ? () => { Haptics.selectionAsync().catch(() => {}); setFilterDetail(null); } : undefined}
      onClear={openPanel === 'filters'
        ? filterDetail
          ? (filters[filterDetail].length ? () => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, [filterDetail]: [] }); } : undefined)
          : (filterCount ? () => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, categories: [], payments: [] }); additionalFilter?.onClear(); } : undefined)
        : undefined}
      onOverlayClose={closeListMenu}
      overlay={openPanel === 'lists' && actionsTarget && actionsLayout && (
        <>
          {/* Menú anclado junto al botón "···" que tocaste — mismo
              componente visual que ActionSheet (vidrio, sin fila de
              Cancelar, se cierra tocando fuera), homologado 2026-08-24 tras
              auditoría: antes esta versión era un bottom-sheet distinto al
              de Menús/coleccion. Vive aquí (no en el <Modal> de ActionSheet)
              por el mismo motivo que el resto del overlay: evitar dos
              Modal de RN anidados. */}
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={closeListMenu} accessibilityLabel="Cerrar acciones" />
          <View accessibilityViewIsModal onAccessibilityEscape={closeListMenu} style={[s.inlineMenu, { width: actionsLayout.width, maxHeight: actionsLayout.maxHeight, left: actionsLayout.left, top: actionsLayout.top, bottom: actionsLayout.bottom }]}>
            <BlurView intensity={theme.isDark ? 26 : 30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
            <View pointerEvents="none" style={s.inlineMenuTint} />
            <ScrollView bounces={false} keyboardShouldPersistTaps="handled" accessibilityViewIsModal>
            {actionsTarget && <View style={s.inlineTitleRow}><Text style={s.inlineTitleText}>{noWidow(actionsTarget.title)}</Text></View>}
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
            </ScrollView>
          </View>
        </>
      )}
      theme={theme}>
      {namingList ? null : openPanel === 'filters' ? <>
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
            {([{ title: 'Tipo de lugar', field: 'categories', icon: 'location-outline' }, { title: 'Pago', field: 'payments', icon: 'card-outline' }] as const).map((group, index) => {
              const selected = filters[group.field];
              const summary = selected.length ? selected.join(' · ') : group.field === 'categories' ? 'Todos' : 'Cualquiera';
              const disabled = group.field === 'categories' && !categoryOptions.length;
              return <TouchableOpacity key={group.field} style={[s.availabilityRow, index > 0 && s.rowDivider]} disabled={disabled}
                accessibilityRole="button" accessibilityLabel={group.title} accessibilityValue={{ text: summary }} accessibilityState={{ disabled }}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); setFilterDetail(group.field); }}>
                <View style={s.checkSlot}><PlaceIcon name={group.icon} size={20} color={theme.textSecondary} /></View>
                <Text style={s.disclosureLabel}>{noWidow(group.title)}</Text>
                <Text numberOfLines={2} style={s.disclosureValue}>{noWidow(summary)}</Text>
                <View style={s.disclosureChevron}><Ionicons name="chevron-forward" size={16} color={theme.textMute} /></View>
              </TouchableOpacity>;
            })}
          </View></View>
          {additionalFilter && <TouchableOpacity style={s.option} onPress={additionalFilter.onClear} accessibilityRole="button" accessibilityLabel={`Quitar filtro ${additionalFilter.label}`}><Text style={s.optionText}>{noWidow(additionalFilter.label)}</Text><Ionicons name="close-circle" size={20} color={theme.textSecondary} /></TouchableOpacity>}
        </>}
      </> : movingLists ? <View style={s.section}><View style={s.group}>
        {visibleCollections.filter((item) => !selectedListIds.includes(item.id)).map((item, index) => <TouchableOpacity key={item.id} disabled={listActionBusy} style={[s.option, index > 0 && s.rowDivider]} accessibilityRole="radio" accessibilityState={{ checked: item.id === moveDestinationId, disabled: listActionBusy }} accessibilityLabel={`Destino ${item.title}`} onPress={() => { setMoveDestinationId(item.id); Haptics.selectionAsync().catch(() => {}); }}>
          <View style={s.checkSlot}><Ionicons name={item.id === moveDestinationId ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={item.id === moveDestinationId ? theme.accent : theme.textMute} /></View><Text style={s.optionText}>{noWidow(item.title)}</Text><Text style={s.listCount}>{item.patioIds.length} {item.patioIds.length === 1 ? 'lugar' : 'lugares'}</Text>
        </TouchableOpacity>)}
        {!visibleCollections.some((item) => !selectedListIds.includes(item.id)) && <View style={s.emptyLists}><Text style={s.emptyDetail}>{noWidow('Sin listas de destino')}</Text></View>}
      </View></View> : <>
        <View style={s.section}><View style={s.group}>
          {selectingLists ? <TouchableOpacity disabled={deletingLists || listActionBusy} style={s.option} accessibilityRole="checkbox" accessibilityLabel="Seleccionar todas las listas" accessibilityState={{ checked: selectedListIds.length === collections.length ? true : selectedListIds.length ? 'mixed' : false, disabled: deletingLists || listActionBusy }}
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setSelectedListIds(selectedListIds.length === collections.length ? [] : collections.map((item) => item.id)); }}>
            <View style={s.checkSlot}><Ionicons name={selectedListIds.length === collections.length ? 'checkmark-circle' : selectedListIds.length ? 'remove-circle' : 'ellipse-outline'} size={22} color={selectedListIds.length ? theme.accent : theme.textMute} /></View>
            <Text style={s.optionText}>{noWidow('Seleccionar todas')}</Text>
          </TouchableOpacity> : <TouchableOpacity onPress={() => { Haptics.selectionAsync().catch(() => {}); onChange({ ...filters, collectionIds: [] }); }} style={s.option} accessibilityRole="checkbox" accessibilityState={{ checked: !listCount }} accessibilityLabel="Todos los lugares">
            <View style={s.checkSlot}><Ionicons name={!listCount ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={!listCount ? theme.accent : theme.textMute} /></View>
            <Text style={s.optionText}>{noWidow('Todos los lugares')}</Text>
          </TouchableOpacity>}
          {visibleCollections.map((collection) => {
            const active = selectingLists ? selectedListIds.includes(collection.id) : filters.collectionIds.includes(collection.id);
            return <LibraryListRow key={collection.id} title={collection.title} count={collection.patioIds.length} unit="lugar" checked={active} pinned={collection.pinned} divider disabled={deletingLists || listActionBusy}
              onPress={() => { Haptics.selectionAsync().catch(() => {}); if (selectingLists) setSelectedListIds((current) => toggleValue(current, collection.id)); else onChange({ ...filters, collectionIds: toggleValue(filters.collectionIds, collection.id) }); }}
              onLongPress={() => { if (!selectingLists) { Haptics.selectionAsync().catch(() => {}); beginListSelection(collection.id); } }}
              moreRef={(el) => { moreRefs.current.set(collection.id, el); }} onMore={selectingLists ? undefined : () => openListActions(collection)} />;
          })}
        </View></View>
        {!collections.length && <View style={s.emptyLists}><Ionicons name="list-outline" size={28} color={theme.textSecondary} /><Text style={s.emptyTitle}>{noWidow('Sin listas')}</Text></View>}

      </>}

    </LibrarySheet>

    {/* Panel de horario: tarjeta centrada, sin envolver la edición en otro
        sheet inferior — ley de CLAUDE.md "Horas en iOS usan picker
        compacto anclado". La hora usa <DateTimePicker display="spinner">:
        el wheel nativo real de Apple, embebido aquí mismo (no un popover
        aparte — se probaron un odómetro propio y el modo "compact", pero
        Alejandro prefirió el nativo inline, 2026-09-16). Cada cambio solo
        mueve el borrador local, nunca filters.openAt directo (eso repintaba
        el chip con cada tick y "bailaba" la fila — bug real 2026-09-16); se
        confirma una sola vez al cerrar. Entrada/salida con el mismo resorte
        de ActionSheet y háptico simétrico al abrir/cerrar. */}
    {openPickerRendered && (
      <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={closeOpenPicker}>
        <View style={s.pickerOverlay}>
          <Pressable accessibilityLabel="Cerrar selector de horario" style={StyleSheet.absoluteFillObject} onPress={closeOpenPicker} />
          <Animated.View style={[s.pickerSurface, { opacity: openPickerOpacity, transform: [{ scale: openPickerScale }] }]}>
            <BlurView intensity={theme.isDark ? 30 : 40} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
            <Text style={s.pickerTitle}>ABIERTO</Text>
            <View style={s.pickerDayRow}>
              {openPickerDias.map((dia) => {
                const active = effectivePickerDia === dia;
                const esHoy = dia === hoyDia;
                return <TouchableOpacity key={dia} hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }} onPress={() => { Haptics.selectionAsync().catch(() => {}); setOpenPickerDia(dia); }}
                  style={[s.pickerDayChip, active && { backgroundColor: theme.accent, borderColor: theme.accent }]}
                  accessibilityRole="button" accessibilityLabel={`${DIA_CORTO[dia]}${esHoy ? ', hoy' : ''}`} accessibilityState={{ selected: active }}>
                  <Text style={[s.pickerDayChipText, { color: active ? '#FFFFFF' : theme.text }]}>{DIA_CORTO[dia]}</Text>
                  {/* Punto bajo "hoy" — referencia fija aunque no sea el día
                      seleccionado, mismo lenguaje que el calendario de Apple. */}
                  <View style={[s.pickerDayDot, { backgroundColor: esHoy ? (active ? '#FFFFFF' : theme.accent) : 'transparent' }]} />
                </TouchableOpacity>;
              })}
            </View>
            <DateTimePicker
              accessibilityLabel="Hora"
              value={openPickerDate}
              mode="time"
              display="spinner"
              minuteInterval={15}
              locale="es-MX"
              themeVariant={theme.isDark ? 'dark' : 'light'}
              accentColor={theme.accent}
              style={s.pickerScrubber}
              onChange={(_, next) => { if (next) setOpenPickerDraftMin(next.getHours() * 60 + next.getMinutes()); }}
            />
          </Animated.View>
        </View>
      </Modal>
    )}


  </View>;
}
