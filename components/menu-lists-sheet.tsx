import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createMenuCollection, deleteMenuCollection, normalizeMenuListTitle, renameMenuCollection, setMenusInCollection, type MenuCollection } from '@/lib/menu-collections';
import { fonderoPalette } from '@/lib/fondero-palette';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Listas para organizar menús publicados — mismo patrón de interacción que
// "Tus listas" de Guardados (foodie-filter-bar.tsx), pero en su propio
// componente: los dos usos difieren lo suficiente (aquí no hay mapa que
// filtrar, y existe un segundo modo "asignar" para meter un menú puntual a
// una lista) para justificar no forzar una abstracción compartida todavía.
// Renombrar usa el mismo patrón nativo de Apple (Alert.prompt / diálogo
// propio en Android) validado hoy en foodie-filter-bar.tsx — no repetir el
// editor inline dentro de un ScrollView, que ahí costó 4 intentos fallidos.
type Mode = 'filter' | 'assign';

export function MenuListsSheet({
  visible, onClose, mode, collections, onCollectionCreated, onCollectionUpdated, onCollectionRemoved,
  selectedIds = [], onToggleFilter, onClearFilter, targetFechas = [],
}: {
  visible: boolean;
  onClose: () => void;
  mode: Mode;
  collections: MenuCollection[];
  onCollectionCreated: (collection: MenuCollection) => void;
  onCollectionUpdated: (collection: MenuCollection) => void;
  onCollectionRemoved: (id: string) => void;
  selectedIds?: string[];
  onToggleFilter?: (id: string) => void;
  onClearFilter?: () => void;
  targetFechas?: string[];
}) {
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const insets = useSafeAreaInsets();
  const s = makeStyles(theme.isDark);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [renameTarget, setRenameTarget] = useState<MenuCollection | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const isChecked = (collection: MenuCollection) => mode === 'filter'
    ? selectedIds.includes(collection.id)
    : targetFechas.length > 0 && targetFechas.every((fecha) => collection.fechas.includes(fecha));

  const toggle = async (collection: MenuCollection) => {
    Haptics.selectionAsync().catch(() => {});
    if (mode === 'filter') {
      onToggleFilter?.(collection.id);
      return;
    }
    const next = await setMenusInCollection(collection.id, targetFechas, !isChecked(collection));
    if (next) onCollectionUpdated(next);
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const collection = await createMenuCollection(title);
    onCollectionCreated(collection);
    if (mode === 'assign' && targetFechas.length > 0) {
      const next = await setMenusInCollection(collection.id, targetFechas, true);
      if (next) onCollectionUpdated(next);
    } else if (mode === 'filter') {
      onToggleFilter?.(collection.id);
    }
    setNewTitle('');
    setCreating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const commitRename = async (id: string, rawTitle: string) => {
    const title = normalizeMenuListTitle(rawTitle.trim());
    if (!title) return;
    const renamed = await renameMenuCollection(id, title);
    if (renamed) onCollectionUpdated(renamed);
  };

  const startRename = (collection: MenuCollection) => {
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

  const removeCollection = (collection: MenuCollection) => {
    Alert.alert(
      noWidow('Eliminar lista'),
      noWidow(`Se borrará "${collection.title}". Los menús no se borran, solo dejan de estar en esta lista.`),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteMenuCollection(collection.id);
            onCollectionRemoved(collection.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ],
    );
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity activeOpacity={1} style={s.backdrop} onPress={onClose} accessibilityLabel="Cerrar" />
        <View style={[s.sheet, { paddingBottom: insets.bottom || 8 }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={s.sheetTint} />
          <View style={s.grabber} />
          <View style={s.header}>
            <Text style={s.headerTitle}>{noWidow(mode === 'assign' ? 'Añadir a lista' : 'Tus listas')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {mode === 'filter' && selectedIds.length > 0 && (
                <TouchableOpacity hitSlop={10} onPress={onClearFilter}><Text style={s.headerClear}>Limpiar</Text></TouchableOpacity>
              )}
              <TouchableOpacity hitSlop={10} onPress={onClose} accessibilityLabel="Cerrar"><Ionicons name="close" size={20} color={c.textSecondary} /></TouchableOpacity>
            </View>
          </View>
          <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled">
            {creating ? (
              <View style={s.row}>
                <Ionicons name="add" size={16} color={c.textMute} />
                <TextInput
                  autoFocus
                  value={newTitle}
                  onChangeText={(value) => setNewTitle(normalizeMenuListTitle(value))}
                  onSubmitEditing={handleCreate}
                  placeholder="Ej. Comida especial"
                  placeholderTextColor={c.textMute}
                  returnKeyType="done"
                  autoCapitalize="words"
                  style={s.createInput}
                />
                <TouchableOpacity disabled={!newTitle.trim()} hitSlop={8} onPress={handleCreate} style={[s.createBtn, !newTitle.trim() && s.createBtnDisabled]}>
                  <Text style={s.createBtnText}>Crear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setCreating(true)} style={s.row}>
                <Ionicons name="add" size={16} color={c.textMute} />
                <Text style={s.rowText}>{noWidow('Nueva lista')}</Text>
              </TouchableOpacity>
            )}
            {collections.length === 0 && !creating && (
              <Text style={s.emptyHint}>{noWidow('Todavía no tienes listas. Crea una para organizar tus menús.')}</Text>
            )}
            {collections.map((collection) => {
              const checked = isChecked(collection);
              return (
                <View key={collection.id} style={s.row}>
                  <TouchableOpacity onPress={() => toggle(collection)} style={s.rowMain}>
                    <Ionicons name="bookmark" size={16} color={c.textSecondary} />
                    <Text style={s.rowText} numberOfLines={1}>{collection.title}</Text>
                    {checked && <Ionicons name="checkmark" size={18} color={c.text} />}
                  </TouchableOpacity>
                  <TouchableOpacity
                    hitSlop={8}
                    style={s.rowMore}
                    accessibilityRole="button"
                    accessibilityLabel="Acciones de la lista"
                    onPress={() => Alert.alert(
                      collection.title,
                      undefined,
                      [
                        { text: 'Renombrar', onPress: () => startRename(collection) },
                        { text: 'Eliminar', style: 'destructive', onPress: () => removeCollection(collection) },
                        { text: 'Cancelar', style: 'cancel' },
                      ],
                    )}>
                    <Ionicons name="ellipsis-horizontal" size={17} color={c.textSecondary} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Respaldo Android para renombrar — Alert.prompt no existe ahí. */}
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
                    onChangeText={(value) => setRenameValue(normalizeMenuListTitle(value))}
                    onSubmitEditing={() => { if (renameTarget) commitRename(renameTarget.id, renameValue); setRenameTarget(null); }}
                    placeholder="Ej. Comida especial"
                    placeholderTextColor={c.textMute}
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
      </KeyboardAvoidingView>
    </Modal>
  );
}

function makeStyles(isDark: boolean) {
  const c = fonderoPalette(isDark);
  const border = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    kav: { flex: 1 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
    sheet: { maxHeight: '72%', borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderTopWidth: StyleSheet.hairlineWidth, borderColor: border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: isDark ? 0.30 : 0.14, shadowRadius: 24, elevation: 12 },
    sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(20,21,24,0.72)' : 'rgba(255,255,255,0.70)' },
    grabber: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 4, backgroundColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' },
    header: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
    headerTitle: { fontSize: 17, fontWeight: '700', color: c.text },
    headerClear: { fontSize: 14, fontWeight: '600', color: c.accent },
    scroll: { paddingTop: 6 },
    row: { minHeight: 48, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    rowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
    rowMore: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
    rowText: { flex: 1, fontSize: 15, fontWeight: '500', color: c.text },
    createInput: { flex: 1, fontSize: 15, fontWeight: '500', color: c.text, padding: 0 },
    createBtn: { minHeight: 34, paddingHorizontal: 14, borderRadius: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: c.text },
    createBtnDisabled: { opacity: 0.35 },
    createBtnText: { fontSize: 13, fontWeight: '700', color: c.bg },
    emptyHint: { paddingHorizontal: 16, paddingVertical: 16, fontSize: 13, lineHeight: 18, color: c.textSecondary },
    renameBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
    renameCard: { width: '100%', maxWidth: 320, borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: border },
    renameCardTint: { ...StyleSheet.absoluteFillObject, backgroundColor: isDark ? 'rgba(28,29,32,0.86)' : 'rgba(255,255,255,0.86)' },
    renameTitle: { fontSize: 15, fontWeight: '700', color: c.text, textAlign: 'center', paddingTop: 18, paddingHorizontal: 16 },
    renameInput: { marginTop: 14, marginHorizontal: 16, height: 40, borderRadius: 10, paddingHorizontal: 12, fontSize: 15, color: c.text, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
    renameActions: { flexDirection: 'row', marginTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
    renameActionBtn: { flex: 1, height: 46, alignItems: 'center', justifyContent: 'center' },
    renameActionDivider: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.border },
    renameActionText: { fontSize: 15.5, fontWeight: '600', color: c.text },
    renameActionTextPrimary: { fontWeight: '700', color: c.accent },
  });
}
