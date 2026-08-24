import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/action-sheet';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { MenuListsSheet } from '@/components/menu-lists-sheet';
import { dateLabel, defaultHistoryTitle, useMenuHistoryController, type PublishedMenu } from '@/lib/controllers/useMenuHistoryController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { getMenuCollections, type MenuCollection } from '@/lib/menu-collections';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export default function HistorialScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { onScroll } = useTabBarScroll();
  const { closeRename, deleteMenu, deleteMenus, draftName, editing, loading, menus, openRename, reuse, saveName, setDraftName } = useMenuHistoryController();
  // Acciones por menú detrás de "···" — menú flotante (ActionSheet), no fila
  // que empuja el layout (auditado 2026-08-23, mismo arreglo que Listas).
  const [actionsFor, setActionsFor] = useState<PublishedMenu | null>(null);
  const moreRefs = useRef<Map<string, View | null>>(new Map());
  // Selección en lote tipo Notas: long-press entra al modo, checkmark
  // guía cada fila, "Cancelar" solo existe mientras el modo está activo.
  const [selecting, setSelecting] = useState(false);
  const [selectedFechas, setSelectedFechas] = useState<Set<string>>(new Set());
  // Listas para organizar menús (mismo patrón que "Tus listas" de Guardados,
  // decisión 2026-08-24 tras reportar el problema del botón de cámara). Un
  // solo sheet cubre dos modos: filtrar la vista por lista, o asignar un
  // menú puntual/una selección en lote a una o varias listas.
  const [collections, setCollections] = useState<MenuCollection[]>([]);
  const [activeListIds, setActiveListIds] = useState<string[]>([]);
  const [sheetMode, setSheetMode] = useState<'filter' | 'assign' | null>(null);
  const [assignFechas, setAssignFechas] = useState<string[]>([]);

  useFocusEffect(useCallback(() => {
    getMenuCollections().then(setCollections);
  }, []));

  const visibleMenus = activeListIds.length === 0 ? menus : menus.filter((menu) => (
    activeListIds.some((id) => collections.find((collection) => collection.id === id)?.fechas.includes(menu.fecha))
  ));

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

  // Agrupado por periodo cuando hay suficiente historial para que ayude a
  // ubicarse — con poco historial (todo cae en un solo periodo) se queda
  // como una sola tarjeta plana, sin etiquetas de sección sin propósito.
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

  const renderMenuRow = (menu: (typeof menus)[number], showTopBorder: boolean) => {
    const key = menu.fecha;
    const isSelected = selectedFechas.has(key);
    return (
      <View key={key} style={showTopBorder && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }}>
        <View style={s.row}>
          {/* Todo el renglón (círculo + texto) es UN solo touchable — mismo
              patrón que renderPatio en favoritos.tsx. Antes el círculo vivía
              fuera del TouchableOpacity como hermano sin su propio onPress:
              tocarlo directamente no hacía nada, solo registraba si el toque
              caía sobre el bloque de texto de al lado (bug reportado
              2026-08-24, "no agarra a menos que sea la fila completa"). */}
          <TouchableOpacity
            style={s.rowMain}
            onPress={() => (selecting ? toggleSelect(key) : reuse(menu.secciones))}
            onLongPress={() => { if (!selecting) { Haptics.selectionAsync().catch(() => {}); setSelecting(true); toggleSelect(key); } }}
            activeOpacity={0.74}
            accessibilityRole="button"
            accessibilityLabel={selecting ? `${isSelected ? 'Quitar de la selección' : 'Seleccionar'} menú de ${dateLabel(menu.fecha)}` : `Usar menú de ${dateLabel(menu.fecha)}`}>
            {selecting && (
              <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? c.accent : c.textMute} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[s.date, { color: c.accent }]}>
                {dateLabel(menu.fecha)}
              </Text>
              <Text style={[s.summary, { color: c.text }]} numberOfLines={2}>{menu.nombre || defaultHistoryTitle(menu)}</Text>
            </View>
          </TouchableOpacity>
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
        </View>
      </View>
    );
  };

  return (
    <View style={[s.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* La acción del día ("Nuevo menú") vive en la barra de navegación
          (bottom-tab-bar.tsx: "+" homologado a Instagram/apps de Apple — un
          ícono plano, no un botón grande de color, corregido 2026-08-24
          tras corrección de Alejandro sobre la primera pasada que lo había
          movido aquí). Esta pantalla es solo la lista/historial + el botón
          de Listas. Selección en lote tipo Notas: long-press entra al modo,
          sin texto "Seleccionar" permanente — mismo patrón que Guardados. */}
      {selecting && (
        <View style={s.selectRow}>
          <TouchableOpacity onPress={exitSelecting} accessibilityRole="button" accessibilityLabel="Cancelar selección" hitSlop={8} style={s.selectToggle}>
            <Text style={[s.selectToggleText, { color: c.accent }]}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}
      {!selecting && (
        <View style={s.listsRow}>
          <TouchableOpacity
            style={[s.listsBtn, { borderColor: c.border }]}
            onPress={() => setSheetMode('filter')}
            accessibilityRole="button"
            accessibilityLabel={activeListIds.length ? `Listas, ${activeListIds.length} activas` : 'Listas'}
            activeOpacity={0.75}>
            <Ionicons name="bookmark-outline" size={18} color={c.text} />
            <Text style={[s.listsBtnText, { color: c.text }]}>Listas</Text>
            {activeListIds.length > 0 && (
              <View style={[s.listsBadge, { backgroundColor: c.accent }]}>
                <Text style={s.listsBadgeText}>{activeListIds.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: selecting ? 4 : 16, paddingBottom: insets.bottom + (selecting ? 100 : 120) }} showsVerticalScrollIndicator={false}>
        {!loading && visibleMenus.length === 0 ? (
          <View style={[s.empty, { borderColor: c.border }]}>
            <Ionicons name="receipt-outline" size={28} color={c.textMute} />
            <Text style={[s.emptyTitle, { color: c.text }]}>{noWidow(activeListIds.length > 0 ? 'Ningún menú en esta lista' : 'Todavía no hay menús')}</Text>
            <Text style={[s.emptyBody, { color: c.textSecondary }]}>{noWidow(activeListIds.length > 0 ? 'Agrega menús a esta lista desde sus acciones (···).' : 'Cuando publiques uno aparecerá aquí para volver a usarlo.')}</Text>
          </View>
        ) : showGroupLabels ? (
          groups.map((group, groupIndex) => (
            <View key={group.key}>
              <Text style={[s.groupLabel, { color: c.textSecondary, marginTop: groupIndex === 0 ? 28 : 24 }]}>{noWidow(group.label)}</Text>
              <View style={[s.list, { borderColor: c.border, marginTop: 8 }]}>
                {group.menus.map((menu, index) => renderMenuRow(menu, index > 0))}
              </View>
            </View>
          ))
        ) : (
          <View style={[s.list, { borderColor: c.border }]}>
            {visibleMenus.map((menu, index) => renderMenuRow(menu, index > 0))}
          </View>
        )}
      </ScrollView>
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={closeRename}>
        <View style={s.modalBackdrop}>
          <View style={[s.modalCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[s.modalTitle, { color: c.text }]}>{noWidow('Renombrar menú')}</Text>
            <TextInput
              value={draftName}
              onChangeText={(value) => setDraftName(value.slice(0, 48))}
              style={[s.nameInput, { color: c.text, borderColor: c.border }]}
              placeholder="Ej. Viernes de pozole"
              placeholderTextColor={c.textMute}
              selectionColor={c.accent}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={saveName}
            />
            <View style={s.modalActions}>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cancelar" style={[s.modalBtn, { borderColor: c.border }]} onPress={closeRename} activeOpacity={0.75}>
                <Text style={[s.modalBtnText, { color: c.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Guardar nombre" style={[s.modalBtn, s.modalPrimary, { backgroundColor: c.accent }]} onPress={saveName} activeOpacity={0.82}>
                <Text style={s.modalPrimaryText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {selecting ? (
        <View style={[s.actionBar, {
          paddingBottom: insets.bottom + 10,
          borderTopColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)',
          backgroundColor: theme.isDark ? 'rgba(17,18,20,0.4)' : 'rgba(248,248,245,0.4)',
          shadowOpacity: theme.isDark ? 0.20 : 0.08,
        }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <Text style={[s.actionCount, { color: c.textSecondary }]}>
            {selectedFechas.size} {selectedFechas.size === 1 ? 'seleccionado' : 'seleccionados'}
          </Text>
          <View style={s.actionButtons}>
            <TouchableOpacity
              disabled={selectedFechas.size === 0}
              onPress={() => { setAssignFechas(Array.from(selectedFechas)); setSheetMode('assign'); }}
              accessibilityRole="button"
              accessibilityLabel="Añadir seleccionados a una lista"
              style={[s.actionBtn, selectedFechas.size === 0 && s.actionBtnDisabled]}>
              <Ionicons name="bookmark-outline" size={18} color={c.text} />
              <Text style={[s.actionBtnText, { color: c.text }]}>Lista</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={selectedFechas.size === 0}
              onPress={() => { const fechas = Array.from(selectedFechas); deleteMenus(fechas); exitSelecting(); }}
              accessibilityRole="button"
              accessibilityLabel="Eliminar menús seleccionados"
              style={[s.actionBtn, selectedFechas.size === 0 && s.actionBtnDisabled]}>
              <Ionicons name="trash-outline" size={18} color={c.text} />
              <Text style={[s.actionBtnText, { color: c.text }]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <BottomTabBar variant="fondero" />
      )}
      <ActionSheet
        visible={!!actionsFor}
        anchorRef={{ current: actionsFor ? moreRefs.current.get(actionsFor.fecha) ?? null : null }}
        title={actionsFor ? (actionsFor.nombre || defaultHistoryTitle(actionsFor)) : undefined}
        onDismiss={() => setActionsFor(null)}
        options={actionsFor ? [
          { label: 'Editar y usar', icon: 'create-outline', onPress: () => reuse(actionsFor.secciones) },
          { label: 'Renombrar', icon: 'text-outline', onPress: () => openRename(actionsFor) },
          { label: 'Añadir a lista', icon: 'bookmark-outline', onPress: () => { setAssignFechas([actionsFor.fecha]); setSheetMode('assign'); } },
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
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  empty: { marginTop: 24, padding: 24, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  emptyTitle: { marginTop: 14, fontSize: 20, fontWeight: '800' },
  emptyBody: { maxWidth: 270, marginTop: 7, textAlign: 'center', fontSize: 14, lineHeight: 20 },
  list: { marginTop: 28, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  row: { minHeight: 84, paddingHorizontal: 17, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  date: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  summary: { marginTop: 5, fontSize: 15, lineHeight: 20, fontWeight: '500' },
  // Homologado con navButton de coleccion/[id].tsx: ícono suelto, sin caja
  // de fondo, círculo completo — mismo botón "···" en toda la app.
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  selectRow: { paddingHorizontal: 20, paddingTop: 12, flexDirection: 'row', justifyContent: 'flex-end' },
  selectToggle: { minHeight: 32, justifyContent: 'center' },
  selectToggleText: { fontSize: 14, fontWeight: '700' },
  listsRow: { paddingHorizontal: 20, paddingTop: 16, flexDirection: 'row', justifyContent: 'flex-end' },
  listsBtn: { minHeight: 40, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  listsBtnText: { fontSize: 14, fontWeight: '600' },
  listsBadge: { minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  listsBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  // Barra de acciones en lote — copiada 1:1 de favoritos.tsx (Guardados),
  // no reinventada: mismo fondo translúcido + sombra sobre el vidrio, mismo
  // gap y tamaño de texto (corregido 2026-08-24 tras pedirlo Alejandro).
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
  modalTitle: { fontSize: 22, fontWeight: '900', fontFamily: Fonts.brand },
  nameInput: { marginTop: 16, minHeight: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 16, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  modalBtn: { minHeight: 44, minWidth: 104, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  modalPrimary: { borderWidth: 0 },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  modalPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
