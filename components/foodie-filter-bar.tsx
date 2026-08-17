import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCollection, normalizeCollectionTitle, type PatioCollection } from '@/lib/collections';
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
  saved: boolean;
  categories: string[];
  payments: string[];
  collectionIds: string[];
};

export const EMPTY_FOODIE_FILTERS: FoodieFilters = { today: false, open: false, saved: false, categories: [], payments: [], collectionIds: [] };

// Cuenta SOLO lo que vive dentro del panel "Filtros" (categoría, pagos,
// guardados) — Menú hoy/Abiertos tienen su propia pill visible y su propio
// feedback de selección; contarlos aquí también hacía aparecer el badge
// naranja sobre el botón de Filtros al tocar esas dos, sin que ese botón
// tuviera nada que ver.
export function foodieFilterCount(f: FoodieFilters) {
  return (f.saved ? 1 : 0) + f.categories.length + f.payments.length;
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
  isSaved: boolean;
  categories: string[];
  payments: string[];
  collections: PatioCollection[];
}): boolean {
  if (filters.today && !input.hasTodayMenu) return false;
  if (filters.open && !input.isOpenNow) return false;
  if (filters.saved && !input.isSaved) return false;
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
    pillText: { fontSize: 12.5, fontWeight: '600' },
    // El badge (el número) es la ÚNICA señal de "hay filtros activos" — el
    // botón que abre el sheet se queda siempre en tono neutro. Llenarlo de
    // color se leía como "este botón está prendido", cuando en realidad es
    // un disparador, no una selección en sí mismo.
    badge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
    badgeText: { fontSize: 10, fontWeight: '700' },
    // Sheet real (no popover) — en iPhone Apple usa sheets para esto, los
    // popovers son de iPad/Mac. Mismo tratamiento flotante con margen que ya
    // usa el sheet de resultados de esta pantalla (no edge-to-edge).
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
    sheet: { position: 'absolute', left: 14, right: 14, bottom: 14, borderRadius: 28, overflow: 'hidden', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: border, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: t.isDark ? 0.30 : 0.14, shadowRadius: 32, elevation: 12 },
    grabberTouch: { height: 22, alignItems: 'center', justifyContent: 'flex-start' },
    grabber: { width: 36, height: 4, borderRadius: 2, marginTop: 8, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' },
    panelHeader: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
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
    createInput: { flex: 1, fontSize: 15, fontWeight: '500', color: t.text, padding: 0 },
    createBtn: { minHeight: 34, paddingHorizontal: 14, borderRadius: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: t.text },
    createBtnDisabled: { opacity: 0.35 },
    createBtnText: { fontSize: 13, fontWeight: '700', color: t.bg },
  });
}

const HIT_SLOP = { top: 5, bottom: 5, left: 4, right: 4 };

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
function FilterSheet({ visible, onClose, title, onClear, children, s, theme }: {
  visible: boolean; onClose: () => void; title: string; onClear?: () => void;
  children: React.ReactNode; s: ReturnType<typeof styles>; theme: ReturnType<typeof useTheme>['theme'];
}) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const sheetHeight = Math.min(screenHeight * 0.62, 560);
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const [rendered, setRendered] = useState(visible);

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
      <TouchableOpacity activeOpacity={1} style={s.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
      <Animated.View style={[s.sheet, { height: sheetHeight, paddingBottom: insets.bottom || 8, transform: [{ translateY }] }]}>
        <View {...pan.panHandlers} style={s.grabberTouch}>
          <View style={s.grabber} />
        </View>
        <View style={s.panelHeader}>
          <Text style={s.panelTitle}>{title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {!!onClear && <TouchableOpacity hitSlop={HIT_SLOP} onPress={onClear}><Text style={s.panelClear}>Limpiar</Text></TouchableOpacity>}
            <TouchableOpacity hitSlop={HIT_SLOP} onPress={onClose} accessibilityLabel="Cerrar"><Ionicons name="close" size={20} color={theme.textSecondary} /></TouchableOpacity>
          </View>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled">{children}</ScrollView>
      </Animated.View>
    </Modal>
  );
}

export function FoodieFilterBar({ filters, onChange, collections, categories, onCollectionCreated, hideSaved }: {
  filters: FoodieFilters; onChange: (next: FoodieFilters) => void; collections: PatioCollection[]; categories: string[];
  onCollectionCreated?: (collection: PatioCollection) => void;
  // Guardados: en Explorar es un filtro real (mapa completo → solo lo
  // guardado). En la propia pantalla de Guardados todo lo que se ve YA es
  // guardado — el chip no tendría efecto, así que no se ofrece ahí.
  hideSaved?: boolean;
}) {
  const { theme } = useTheme();
  const s = styles(theme);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [creatingList, setCreatingList] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
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
      style={[s.pill, s.iconPill, { backgroundColor: theme.glass, borderColor: theme.border }]}
      accessibilityRole="button"
      accessibilityLabel="Filtros"
      accessibilityHint="Combina categoría y pagos para filtrar el mapa">
      <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <Ionicons name="options-outline" size={16} color={theme.text} />
      {attributeCount > 0 && <View style={[s.badge, { backgroundColor: theme.accent }]}><Text style={[s.badgeText, { color: theme.bg }]}>{attributeCount}</Text></View>}
    </TouchableOpacity>

    <TouchableOpacity
      hitSlop={HIT_SLOP}
      onPress={() => togglePanel('lists')}
      style={[s.pill, s.iconPill, { backgroundColor: theme.glass, borderColor: theme.border }]}
      accessibilityRole="button"
      accessibilityLabel={activeCollections.length ? `Listas: ${listsLabel}` : 'Listas'}
      accessibilityHint="Une una o varias de tus listas guardadas sobre el mapa">
      <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <Ionicons name="bookmark-outline" size={16} color={theme.text} />
      {activeCollections.length > 0 && <View style={[s.badge, { backgroundColor: theme.accent }]}><Text style={[s.badgeText, { color: theme.bg }]}>{activeCollections.length}</Text></View>}
    </TouchableOpacity>

    <FilterSheet
      visible={openPanel === 'filters'}
      onClose={() => setOpenPanel(null)}
      title="Filtros"
      onClear={(filters.categories.length > 0 || filters.payments.length > 0 || filters.saved) ? () => { Haptics.selectionAsync(); onChange({ ...filters, saved: false, categories: [], payments: [] }); } : undefined}
      s={s} theme={theme}>
      {!hideSaved && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Guardados</Text>
          <View style={s.chipsWrap}>
            <TouchableOpacity onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, saved: !filters.saved }); }} style={[s.chip, filters.saved && s.chipActive]} accessibilityRole="button" accessibilityState={{ selected: filters.saved }}>
              <Text style={[s.chipText, filters.saved && s.chipTextActive]}>{noWidow('Solo guardados')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {categories.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Categoría</Text>
          <View style={s.chipsWrap}>
            {categories.map((category) => {
              const active = filters.categories.includes(category);
              return (
                <TouchableOpacity key={category} onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, categories: toggleValue(filters.categories, category) }); }} style={[s.chip, active && s.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
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
              <TouchableOpacity key={method} onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, payments: toggleValue(filters.payments, method) }); }} style={[s.chip, active && s.chipActive]} accessibilityRole="button" accessibilityState={{ selected: active }}>
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
          <TouchableOpacity disabled={!newListTitle.trim()} onPress={handleCreateList} style={[s.createBtn, !newListTitle.trim() && s.createBtnDisabled]}>
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
        return (
          <TouchableOpacity key={collection.id} onPress={() => { Haptics.selectionAsync(); onChange({ ...filters, collectionIds: toggleValue(filters.collectionIds, collection.id) }); }} style={s.option}>
            <Ionicons name="bookmark" size={16} color={theme.textSecondary} />
            <Text style={s.optionText}>{collection.title}</Text>
            {active && <Ionicons name="checkmark" size={18} color={theme.text} />}
          </TouchableOpacity>
        );
      })}
    </FilterSheet>
  </View>;
}
