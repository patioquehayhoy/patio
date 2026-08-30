import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/action-sheet';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { MenuListsSheet } from '@/components/menu-lists-sheet';
import { NewMenuSheet } from '@/components/new-menu-sheet';
import { dateLabel, defaultHistoryTitle, useMenuHistoryController, type PublishedMenu } from '@/lib/controllers/useMenuHistoryController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { getMenuCollections, type MenuCollection } from '@/lib/menu-collections';
import { getMenuData } from '@/lib/menu-store';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Fonts, Radius, useTheme } from '@/lib/theme';
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
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const { onScroll } = useTabBarScroll();
  const { closeRename, deleteMenu, deleteMenus, draftName, editing, loading, menus, openRename, reuse, saveName, setDraftName, streak } = useMenuHistoryController();
  const [actionsFor, setActionsFor] = useState<PublishedMenu | null>(null);
  const [newMenuSheetVisible, setNewMenuSheetVisible] = useState(false);
  const moreRefs = useRef<Map<string, View | null>>(new Map());
  const [selecting, setSelecting] = useState(false);
  const [selectedFechas, setSelectedFechas] = useState<Set<string>>(new Set());
  const [collections, setCollections] = useState<MenuCollection[]>([]);
  const [activeListIds, setActiveListIds] = useState<string[]>([]);
  const [sheetMode, setSheetMode] = useState<'filter' | 'assign' | null>(null);
  const [assignFechas, setAssignFechas] = useState<string[]>([]);
  const pendingToday = !getMenuData()?.secciones.some((section) => section.platillos.some((dish) => dish.nombre.trim()));

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

  // Tarjeta individual — mismo tratamiento que renderPatio en favoritos.tsx
  // (t.surface, Radius.card, borde, gap entre tarjetas en vez de una lista
  // continua con separadores). Todo el renglón (círculo + texto) es UN solo
  // touchable, igual que ahí — antes el círculo vivía fuera del
  // TouchableOpacity y no registraba el toque (bug 2026-08-24).
  const renderMenuRow = (menu: (typeof menus)[number]) => {
    const key = menu.fecha;
    const isSelected = selectedFechas.has(key);
    return (
      <TouchableOpacity
        key={key}
        style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}
        onPress={() => (selecting ? toggleSelect(key) : reuse(menu.secciones))}
        onLongPress={() => { if (!selecting) { Haptics.selectionAsync().catch(() => {}); setSelecting(true); toggleSelect(key); } }}
        activeOpacity={0.82}
        accessibilityRole="button"
        accessibilityLabel={selecting ? `${isSelected ? 'Quitar de la selección' : 'Seleccionar'} menú de ${dateLabel(menu.fecha)}` : `Usar menú de ${dateLabel(menu.fecha)}`}>
        {selecting && (
          <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? c.accent : c.textMute} />
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.summary, { color: c.text }]} numberOfLines={2}>{menu.nombre || defaultHistoryTitle(menu)}</Text>
          <Text style={[s.date, { color: c.textMute }]}>{dateLabel(menu.fecha)}</Text>
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
            <TouchableOpacity onPress={exitSelecting} accessibilityRole="button" accessibilityLabel="Cancelar selección" hitSlop={8} style={s.selectToggle}>
              <Text style={[s.selectToggleText, { color: c.accent }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // "+" arriba a la izquierda, plano, sin fondo — mismo lugar que la
          // cámara/crear de Instagram, no un botón de color en la navegación
          // (corregido 2026-08-24 tras pedirlo Alejandro dos veces: la
          // acción vive en el header de la pantalla, no en el tab bar).
          <View style={s.headerRow}>
            <TouchableOpacity
              style={s.createBtn}
              onPress={() => setNewMenuSheetVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={pendingToday ? 'Nuevo menú, pendiente publicar hoy' : 'Nuevo menú'}
              activeOpacity={0.7}
              hitSlop={8}>
              <Ionicons name="add" size={26} color={c.text} />
              {pendingToday && <View style={[s.createBadge, { backgroundColor: c.accent, borderColor: c.bg }]} />}
            </TouchableOpacity>
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
                onPress={() => setSheetMode('filter')}
                accessibilityRole="button"
                accessibilityLabel={activeListIds.length ? `Listas, ${activeListIds.length} activas` : 'Listas'}
                activeOpacity={0.75}>
                <View style={s.listsBlurClip}>
                  <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
                </View>
                <Ionicons name="bookmark-outline" size={16} color={c.text} />
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
      <ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + (selecting ? 100 : 120) }} showsVerticalScrollIndicator={false}>
        {!loading && menus.length === 0 ? (
          <View style={s.empty}>
            <View style={[s.emptyIcon, { borderColor: c.border, backgroundColor: c.surface }]}>
              <Ionicons name="receipt-outline" size={32} color={c.textSecondary} />
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
      <Modal visible={!!editing} transparent animationType="fade" onRequestClose={closeRename}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={s.modalBackdrop}>
            <View style={[s.modalCard, { backgroundColor: c.surface2, borderColor: c.border }]}>
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
        </KeyboardAvoidingView>
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
      <NewMenuSheet visible={newMenuSheetVisible} onClose={() => setNewMenuSheetVisible(false)} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  createBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  createBadge: { position: 'absolute', top: 2, right: 2, width: 9, height: 9, borderRadius: 4.5, borderWidth: 1.5 },
  // Racha de publicación — mismo alto/radio que listsBtn para leerse como
  // pareja en el header, pero cápsula (ancho variable) por llevar número.
  streakPill: { height: 34, borderRadius: 17, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10 },
  streakText: { fontSize: 13, fontWeight: '700' },
  // Pill idéntico al botón "Listas" de foodie-filter-bar.tsx (34×34,
  // borderRadius 17, glass) — copiado, no reinventado (ley de Alejandro
  // 2026-08-24: Menús comparte lenguaje visual con Guardados).
  listsBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'visible' },
  listsBlurClip: { ...StyleSheet.absoluteFillObject, borderRadius: 17, overflow: 'hidden' },
  listsBadge: { position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
  listsBadgeText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  // Empty state — copiado 1:1 de favoritos.tsx (icono en caja + título +
  // cuerpo + CTA), no la versión sin CTA que se había inventado antes.
  empty: { minHeight: 460, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
  emptyIcon: { width: 68, height: 68, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  emptyTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, textAlign: 'center', fontFamily: Fonts.brand },
  emptyBody: { marginTop: 10, fontSize: 15, lineHeight: 21, fontWeight: '400', textAlign: 'center' },
  cta: { marginTop: 26, height: 54, paddingHorizontal: 24, borderRadius: Radius.card, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  filterEmptyCard: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 20, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, marginTop: 16 },
  filterEmptyText: { marginTop: 10, fontSize: 14, lineHeight: 20, fontWeight: '400', textAlign: 'center' },
  // Pila de tarjetas — mismo lenguaje que `list`/`card` de favoritos.tsx.
  list: { gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: Radius.card, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 7 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
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
  modalTitle: { fontSize: 22, fontWeight: '900', fontFamily: Fonts.brand },
  nameInput: { marginTop: 16, minHeight: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 16, fontWeight: '500' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
  modalBtn: { minHeight: 44, minWidth: 104, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  modalPrimary: { borderWidth: 0 },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  modalPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
