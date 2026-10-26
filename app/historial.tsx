import { BottomContentFade } from '@/components/bottom-content-fade';
import { resolveLibraryMoveSelection } from '@/lib/library-selection';
import { RenameDialog } from '@/components/rename-dialog';
import { useScrollEdges } from '@/lib/use-scroll-edges';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/action-sheet';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { bottomActionClearance, bottomTabClearance } from '@/lib/layout-metrics';
import { SelectionActions } from '@/components/selection-actions';
import { FoodieLoading } from '@/components/foodie-loading';
import { MenuListsSheet } from '@/components/menu-lists-sheet';
import { GlassIconButton } from '@/components/glass-button';
import { NewMenuSheet } from '@/components/new-menu-sheet';
import { FONDERO_TOUR_SEEN_KEY, FonderoWelcomeTour } from '@/components/fondero-welcome-tour';
import { cleanMenu, publishMenuNow } from '@/lib/controllers/useFonderoMenuDraftController';
import { dateLabel, defaultHistoryTitle, useMenuHistoryController, type PublishedMenu } from '@/lib/controllers/useMenuHistoryController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { localMenuDate } from '@/lib/menu-date';
import { getMenuCollections, type MenuCollection } from '@/lib/menu-collections';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Radius, useTheme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Menús es, a propósito, la misma pantalla que Guardados (app/favoritos.tsx)
// — decisión de Alejandro 2026-08-24: "organizar tus cosas" (lugares
// guardados o menús propios) es el MISMO problema, así que comparten
// tarjeta, header (crear + Listas), selección y estados vacíos, en vez de
// reinventarse por separado como pasaba antes (causa real de 3 bugs en la
// sesión anterior: checkmark, estilos de action bar, normalización de
// texto). Ver CLAUDE.md — la prohibición de mezclar Fondero/Foodie se
// derogó para permitir justo esto; lo que sigue distinto es el CONTENIDO
// (un Fondero no ve lugares, un Foodie no ve menús), no la forma.
export default function HistorialScreen() {
  const edges = useScrollEdges();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { onScroll } = useTabBarScroll();
  const { closeRename, deleteMenu, deleteMenus, draftName, editing, loading, menus, openRename, reuse, saveName, setDraftName, streak } = useMenuHistoryController();
  const [actionsFor, setActionsFor] = useState<PublishedMenu | null>(null);
  const [newMenuSheetVisible, setNewMenuSheetVisible] = useState(false);
  // Recién terminada el alta: recorrido de bienvenida una sola vez.
  const { bienvenida } = useLocalSearchParams<{ bienvenida?: string }>();
  const [tourVisible, setTourVisible] = useState(false);
  useEffect(() => {
    if (bienvenida !== '1') return;
    let alive = true;
    // En desarrollo se repite cada vez para poder revisarlo.
    AsyncStorage.getItem(FONDERO_TOUR_SEEN_KEY).then((seen) => { if (alive && (!seen || __DEV__)) setTourVisible(true); }).catch(() => {});
    return () => { alive = false; };
  }, [bienvenida]);
  const moreRefs = useRef<Map<string, View | null>>(new Map());
  const [selecting, setSelecting] = useState(false);
  const [selectionBarHeight, setSelectionBarHeight] = useState(60);
  const [selectedFechas, setSelectedFechas] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<MenuCollection[]>([]);
  const [activeListIds, setActiveListIds] = useState<string[]>([]);
  const [sheetMode, setSheetMode] = useState<'filter' | 'assign' | 'move' | null>(null);
  const [assignFechas, setAssignFechas] = useState<string[]>([]);
  const todayFecha = localMenuDate();
  const pendingToday = !menus.some((menu) => menu.published && menu.fecha === todayFecha);

  useFocusEffect(useCallback(() => {
    getMenuCollections().then(setCollections).catch(() => Alert.alert(noWidow('No pudimos cargar las listas'), noWidow('Inténtalo de nuevo.')));
  }, []));

  const visibleMenus = activeListIds.length === 0 ? menus : menus.filter((menu) => (
    activeListIds.some((id) => collections.find((collection) => collection.id === id)?.fechas.includes(menu.id))
  ));

  const moveSelection = resolveLibraryMoveSelection({ collections: collections.map((item) => ({ ...item, patioIds: item.fechas })), activeCollectionIds: activeListIds, selectedPatioIds: [...selectedFechas] });

  const exitSelecting = () => {
    setSelecting(false);
    setSelectedFechas(new Set());
  };

  const toggleSelect = (fecha: string) => {
    Haptics.selectionAsync().catch(() => {});
    setSelectedFechas((current) => {
      const next = new Set(current);
      if (next.has(fecha)) next.delete(fecha); else next.add(fecha);
      return next;
    });
  };

  // "Publicar igual": mismo menú guardado, sin pasar por el editor completo
  // — para cuando de verdad es igual a antes. "Editar y usar" sigue
  // existiendo para cuando algo cambió (precio, agotado, etc.) — pedido de
  // Alejandro 2026-08-30, tras notar que republicar siempre forzaba el
  // editor incluso sin nada que cambiar.
  const [publishingReused, setPublishingReused] = useState(false);
  const publishReused = async (menu: PublishedMenu) => {
    if (publishingReused) return;
    const clean = cleanMenu(menu.secciones);
    if (!clean.secciones.length) {
      Alert.alert(noWidow('Nada que publicar'), noWidow('Este menú no tiene platillos.'));
      return;
    }
    setPublishingReused(true);
    try {
      await publishMenuNow(clean, { nombre: menu.nombre, draftId: menu.published ? undefined : menu.id });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      router.replace('/menu-publicado');
    } catch {
      Alert.alert(noWidow('No se pudo publicar'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      setPublishingReused(false);
    }
  };

  // Agrupado por periodo cuando hay suficiente historial para que ayude a
  // ubicarse — con poco historial (todo cae en un solo periodo) se queda
  // como una sola pila de tarjetas plana, sin etiquetas de sección.
  const groups = (() => {
    if (visibleMenus.length === 0) return [];
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const buckets = [
      { key: 'week', label: 'Esta semana', menus: [] as typeof menus },
      { key: 'month', label: 'Este mes', menus: [] as typeof menus },
      { key: 'older', label: 'Anteriores', menus: [] as typeof menus },
    ];
    for (const menu of visibleMenus) {
      const days = Math.floor((startOfToday.getTime() - new Date(`${menu.fecha}T12:00:00`).getTime()) / 86400000);
      const bucket = days < 7 ? buckets[0] : days < 31 ? buckets[1] : buckets[2];
      bucket.menus.push(menu);
    }
    return buckets.filter((bucket) => bucket.menus.length > 0);
  })();
  const showGroupLabels = groups.length > 1;

  // Filas continuas como Guardados; toda la fila abre el menú.
  const renderMenuRow = (menu: (typeof menus)[number]) => {
    const key = menu.id;
    const isSelected = selectedFechas.has(key);
    return (
      <TouchableOpacity
        key={key}
        style={[s.card, { borderColor: c.border }]}
        onPress={() => (selecting ? toggleSelect(key) : reuse(menu))}
        onLongPress={() => { if (!selecting) { Haptics.selectionAsync().catch(() => {}); setSelecting(true); toggleSelect(key); } }}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={selecting ? `${isSelected ? 'Quitar de la selección' : 'Seleccionar'} menú de ${dateLabel(menu.fecha)}` : `Usar menú de ${dateLabel(menu.fecha)}`}>
        {selecting && (
          <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? c.accent : c.textMute} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.summary, { color: c.text }]} numberOfLines={2}>{menu.nombre || defaultHistoryTitle(menu)}</Text>
          <Text style={[s.date, { color: c.textMute }]}>{noWidow(`${menu.published ? 'Publicado' : 'Guardado'} · ${dateLabel(menu.fecha)}`)}</Text>
        </View>
        {!selecting && (
          <TouchableOpacity
            ref={(el) => { moreRefs.current.set(key, el); }}
            accessibilityRole="button"
            accessibilityLabel="Acciones del menú"
            style={s.iconBtn}
            onPress={() => setActionsFor(menu)}
            activeOpacity={0.72}>
            <Ionicons name="ellipsis-horizontal" size={17} color={c.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header oculto cuando no hay NINGÚN menú — igual que favoritos.tsx
          oculta su filterWrap/selectRow cuando patios.length===0: el CTA
          del estado vacío ya cubre "crear el primero", un header aparte
          sería redundante. */}
      {menus.length > 0 && (
        selecting ? (
          <View style={s.selectRow}>
            <Text style={{ flex: 1, color: c.textSecondary }}>{noWidow(selectedFechas.size ? `${selectedFechas.size} ${selectedFechas.size === 1 ? 'menú seleccionado' : 'menús seleccionados'}` : 'Seleccionar menús')}</Text>
            <TouchableOpacity style={s.selectToggle} accessibilityRole="checkbox" accessibilityLabel="Seleccionar todos los menús" accessibilityState={{ checked: visibleMenus.length > 0 && visibleMenus.every((menu) => selectedFechas.has(menu.id)) }} onPress={() => setSelectedFechas((current) => { const next = new Set(current); const all = visibleMenus.every((menu) => current.has(menu.id)); visibleMenus.forEach((menu) => all ? next.delete(menu.id) : next.add(menu.id)); return next; })}><Text style={{ color: c.textSecondary }}>{visibleMenus.length > 0 && visibleMenus.every((menu) => selectedFechas.has(menu.id)) ? 'Ninguno' : 'Todos'}</Text></TouchableOpacity>
            <TouchableOpacity onPress={exitSelecting} accessibilityRole="button" accessibilityLabel="Cancelar selección" hitSlop={8} style={s.selectToggle}>
              <Text style={[s.selectToggleText, { color: c.accent }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.headerRow}>
            <View>
              <GlassIconButton icon="add" iconSize={22} onPress={() => setNewMenuSheetVisible(true)} accessibilityLabel={pendingToday ? 'Nuevo menú, pendiente publicar hoy' : 'Nuevo menú'} />
              {pendingToday && <View pointerEvents="none" style={[s.createBadge, { backgroundColor: c.accent, borderColor: c.bg }]} />}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {streak > 0 && (
                <TouchableOpacity
                  style={[s.streakPill, { borderColor: c.border, backgroundColor: c.surface }]}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`Racha de ${streak} ${streak === 1 ? 'día' : 'días'} seguidos publicando menú. Toca para más información`}
                  onPress={() => Alert.alert(
                    `Racha de ${streak} ${streak === 1 ? 'día' : 'días'}`,
                    `Llevas ${streak} ${streak === 1 ? 'día seguido publicando' : 'días seguidos publicando'} tu menú. Se rompe si dejas pasar un día completo sin publicar.`,
                  )}>
                  <Ionicons name="flame" size={14} color={c.text} />
                  <Text style={[s.streakText, { color: c.text }]}>{streak}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[s.listsBtn, { borderColor: c.border, backgroundColor: c.surface }]}
                hitSlop={2}
                onPress={() => setSheetMode('filter')}
                accessibilityRole="button"
                accessibilityLabel={activeListIds.length ? `Listas, ${activeListIds.length} activas` : 'Listas'}
                activeOpacity={0.75}>
                <Ionicons name="bookmarks-outline" size={20} color={c.text} />
                {activeListIds.length > 0 && (
                  <View style={[s.listsBadge, { backgroundColor: c.accent }]}>
                    <Text style={s.listsBadgeText}>{activeListIds.length}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )
      )}
      <View style={{ flex: 1 }}>
      <ScrollView onLayout={edges.onLayout} onContentSizeChange={edges.onContentSizeChange} onScroll={(event) => { edges.onScroll?.(event); onScroll?.(event); }} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: selecting ? bottomActionClearance(insets.bottom, selectionBarHeight) : bottomTabClearance(insets.bottom) }} showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'}>
        {loading ? <View style={{ minHeight: 240 }}><FoodieLoading label="Cargando menús" /></View> : menus.length === 0 ? (
          <View style={s.empty}>
            <View style={[s.emptyIcon, { borderColor: c.border, backgroundColor: c.surface }]}>
              <Ionicons name="book-outline" size={32} color={c.textSecondary} />
            </View>
            <Text style={[s.emptyTitle, { color: c.text }]}>{noWidow('Publica tu primer menú')}</Text>
            <Text style={[s.emptyBody, { color: c.textSecondary }]}>{noWidow('Cuando publiques uno aparecerá aquí para volver a usarlo.')}</Text>
            <TouchableOpacity style={[s.cta, { backgroundColor: c.accent }]} onPress={() => setNewMenuSheetVisible(true)} activeOpacity={0.82} accessibilityRole="button" accessibilityLabel="Nuevo menú">
              <Text style={s.ctaText}>{noWidow('Nuevo menú')}</Text>
            </TouchableOpacity>
          </View>
        ) : visibleMenus.length === 0 ? (
          <View style={[s.filterEmptyCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Ionicons name="filter-outline" size={20} color={c.textSecondary} />
            <Text style={[s.filterEmptyText, { color: c.textSecondary }]}>{noWidow('Ningún menú entra en esta lista todavía.')}</Text>
          </View>
        ) : showGroupLabels ? (
          groups.map((group, groupIndex) => (
            <View key={group.key}>
              <Text style={[s.groupLabel, { color: c.textSecondary, marginTop: groupIndex === 0 ? 20 : 24 }]}>{noWidow(group.label)}</Text>
              <View style={[s.list, { marginTop: 10 }]}>
                {group.menus.map((menu) => renderMenuRow(menu))}
              </View>
            </View>
          ))
        ) : (
          <View style={[s.list, { marginTop: 16 }]}>
            {visibleMenus.map((menu) => renderMenuRow(menu))}
          </View>
        )}
      </ScrollView>
      </View>
      <RenameDialog visible={!!editing} title="Renombrar menú" value={draftName} onChangeText={setDraftName} maxLength={48} onClose={closeRename} onSave={saveName} />
      {selecting ? (
        sheetMode === null && <View onLayout={(event) => setSelectionBarHeight(event.nativeEvent.layout.height)} style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 8 }}>
          <BottomContentFade height={Math.max(52, selectionBarHeight) + insets.bottom + 8 + 16} bottom={-(insets.bottom + 8)} inset={16} />
          <SelectionActions actions={[
            { label: 'Añadir', icon: 'folder-outline', disabled: !selectedFechas.size, onPress: () => { setAssignFechas(Array.from(selectedFechas)); setSheetMode('assign'); } },
            { label: 'Mover', icon: 'folder-open-outline', disabled: !moveSelection.canMove, onPress: () => { setAssignFechas([...selectedFechas]); setSheetMode('move'); } },
            { label: 'Eliminar', icon: 'trash-outline', disabled: !selectedFechas.size, onPress: () => deleteMenus(Array.from(selectedFechas), exitSelecting) },
          ]} />
        </View>
      ) : (
        <BottomTabBar variant="fondero" />
      )}
      <ActionSheet
        visible={!!actionsFor}
        anchorRef={{ current: actionsFor ? moreRefs.current.get(actionsFor.id) ?? null : null }}
        title={actionsFor ? (actionsFor.nombre || defaultHistoryTitle(actionsFor)) : undefined}
        onDismiss={() => setActionsFor(null)}
        options={actionsFor ? [
          { label: 'Publicar igual', icon: 'checkmark-done-outline', onPress: () => publishReused(actionsFor) },
          { label: 'Editar y usar', icon: 'create-outline', onPress: () => reuse(actionsFor) },
          { label: 'Renombrar', icon: 'pencil', onPress: () => openRename(actionsFor) },
          { label: 'Añadir a lista', icon: 'folder-outline', onPress: () => { setAssignFechas([actionsFor.id]); setSheetMode('assign'); } },
          { label: 'Eliminar', icon: 'trash-outline', destructive: true, onPress: () => deleteMenu(actionsFor) },
        ] : []}
      />
      <MenuListsSheet
        visible={sheetMode !== null}
        mode={sheetMode ?? 'filter'}
        onClose={() => setSheetMode(null)}
        collections={collections}
        onCollectionCreated={(collection) => setCollections((prev) => [collection, ...prev])}
        onCollectionUpdated={(collection) => setCollections((prev) => prev.map((item) => (item.id === collection.id ? collection : item)))}
        onCollectionRemoved={(id) => { setCollections((prev) => prev.filter((item) => item.id !== id)); setActiveListIds((prev) => prev.filter((activeId) => activeId !== id)); }}
        selectedIds={activeListIds}
        onToggleFilter={(id) => setActiveListIds((prev) => (prev.includes(id) ? prev.filter((activeId) => activeId !== id) : [...prev, id]))}
        onClearFilter={() => setActiveListIds([])}
        targetFechas={assignFechas}
        sourceCollectionIds={moveSelection.sourceCollectionIds}
        onMoved={exitSelecting}
      />
      <NewMenuSheet visible={newMenuSheetVisible} onClose={() => setNewMenuSheetVisible(false)} />
      <FonderoWelcomeTour visible={tourVisible} onDone={() => setTourVisible(false)} onPublish={() => setTimeout(() => setNewMenuSheetVisible(true), 350)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  createBadge: { position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5 },
  streakPill: { minHeight: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12 },
  streakText: { fontSize: 13, fontWeight: '700' },
  listsBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'visible' },
  listsBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  listsBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  // Empty state — copiado 1:1 de favoritos.tsx (icono en caja + título +
  // cuerpo + CTA), no la versión sin CTA que se había inventado antes.
  empty: { minHeight: 460, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { ...Type.section, textAlign: 'center' },
  emptyBody: { marginTop: 10, fontSize: 15, lineHeight: 21, fontWeight: '400', textAlign: 'center' },
  cta: { marginTop: 26, height: 54, paddingHorizontal: 24, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  filterEmptyCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, marginTop: 16 },
  filterEmptyText: { marginTop: 10, fontSize: 14, lineHeight: 20, fontWeight: '400', textAlign: 'center' },
  // Filas separadas por una línea fina, con espacio entre grupos.
  list: { gap: 0 },
  card: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 12 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  // Nombre = identidad del menú, lidera la fila (antes iba abajo, más chico
  // y menos peso que la fecha — jerarquía invertida). Fecha = contexto,
  // va después, muda y sin el acento de marca (el naranja es para acciones,
  // no para decorar metadata — regla homologada de paleta). Mismo criterio
  // tipográfico que "Labels de sección" (mayúsculas+bold) quedaba mal
  // prestado a la fecha de cada fila, compitiendo visualmente con el label
  // real de sección ("Esta semana") unos px arriba (pedido Alejandro
  // 2026-08-30, fundamentos HIG de grouping/jerarquía).
  summary: { fontSize: 16, lineHeight: 21, fontWeight: '700' },
  date: { marginTop: 2, fontSize: 12.5, fontWeight: '400' },
  // Homologado con navButton de coleccion/[id].tsx: ícono suelto, sin caja
  // de fondo, círculo completo — mismo botón "···" en toda la app.
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  selectRow: { paddingHorizontal: 20, paddingTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  selectToggle: { minHeight: 32, justifyContent: 'center' },
  selectToggleText: { fontSize: 14, fontWeight: '700' },
  // Barra de acciones en lote — copiada 1:1 de favoritos.tsx (Guardados).
  actionBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 14, overflow: 'hidden',
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowRadius: 32,
  },
  actionCount: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 10 },
  actionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  actionBtnDisabled: { opacity: 0.35 },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  modalBackdrop: { flex: 1, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.42)' },
  modalCard: { width: '100%', maxWidth: 360, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, padding: 18 },
  modalTitle: { ...Type.section },
  nameInput: { marginTop: 16, minHeight: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 16, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  modalBtn: { minHeight: 44, minWidth: 104, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  modalPrimary: { borderWidth: 0 },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  modalPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
