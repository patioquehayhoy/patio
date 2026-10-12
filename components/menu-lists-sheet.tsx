import { resolveLibraryMoveSelection } from '@/lib/library-selection';
import { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LibrarySheet } from '@/components/library-sheet';
import { LibraryListRow } from '@/components/library-list-row';
import { RenameDialog } from '@/components/rename-dialog';
import { createMenuCollection, deleteMenuCollection, normalizeMenuListTitle, renameMenuCollection, moveMenusToCollection, setMenusInCollection, type MenuCollection } from '@/lib/menu-collections';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Mode = 'filter' | 'assign' | 'move';
export function MenuListsSheet({ visible, onClose, mode, collections, onCollectionCreated, onCollectionUpdated, onCollectionRemoved, selectedIds = [], onToggleFilter, onClearFilter, targetFechas = [], sourceCollectionIds = [], onMoved }: {
  visible: boolean; onClose: () => void; mode: Mode; collections: MenuCollection[];
  onCollectionCreated: (collection: MenuCollection) => void; onCollectionUpdated: (collection: MenuCollection) => void;
  onCollectionRemoved: (id: string) => void; selectedIds?: string[]; onToggleFilter?: (id: string) => void;
  onClearFilter?: () => void; targetFechas?: string[]; sourceCollectionIds?: string[]; onMoved?: () => void;
}) {
  const { theme } = useTheme();
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [renameTarget, setRenameTarget] = useState<MenuCollection | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [choosingSource, setChoosingSource] = useState(false);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const sourceKey = sourceCollectionIds.join('\u0000');
  const pending = useRef(false);
  const createdDraft = useRef<MenuCollection | null>(null);
  useEffect(() => { if (visible) { setCreating(false); setNewTitle(''); setRenameTarget(null); createdDraft.current = null; setSourceIds(sourceKey ? sourceKey.split("\u0000") : []); setChoosingSource(mode === "move" && !sourceKey); setDestinationId(null); } }, [visible, mode, sourceKey]);
  const run = async (operation: () => Promise<void>): Promise<boolean> => {
    if (pending.current) return false;
    pending.current = true; setBusy(true);
    try { await operation(); return true; }
    catch { Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Inténtalo de nuevo.')); return false; }
    finally { pending.current = false; setBusy(false); }
  };
  const close = () => { if (pending.current) return false; Keyboard.dismiss(); onClose(); };
  const membership = (collection: MenuCollection): boolean | 'mixed' => {
    if (mode === 'move') return choosingSource ? sourceIds.includes(collection.id) : collection.id === destinationId;
    if (mode === 'filter') return selectedIds.includes(collection.id);
    if (!targetFechas.length) return false;
    const matches = targetFechas.filter((id) => collection.fechas.includes(id)).length;
    return matches === targetFechas.length ? true : matches > 0 ? 'mixed' : false;
  };
  const toggle = (collection: MenuCollection) => {
    if (pending.current) return;
    if (mode === 'move') {
      if (choosingSource) setSourceIds((current) => current.includes(collection.id) ? current.filter((id) => id !== collection.id) : [...current, collection.id]);
      else setDestinationId(collection.id);
      return;
    }
    if (mode === 'filter') { onToggleFilter?.(collection.id); return; }
    if (!targetFechas.length) return;
    void run(async () => {
      const next = await setMenusInCollection(collection.id, targetFechas, membership(collection) !== true);
      if (!next) throw new Error('Missing list');
      onCollectionUpdated(next); Haptics.selectionAsync().catch(() => {});
    });
  };
  const create = (rawTitle = newTitle) => {
    const title = normalizeMenuListTitle(rawTitle);
    if (!title) return;
    void run(async () => {
      const collection = createdDraft.current ?? await createMenuCollection(title);
      createdDraft.current = collection;
      onCollectionCreated(collection);
      if (mode === 'assign' && targetFechas.length) {
        const next = await setMenusInCollection(collection.id, targetFechas, true);
        if (!next) throw new Error('Missing list');
        onCollectionUpdated(next);
      } else if (mode === 'filter') onToggleFilter?.(collection.id);
      else if (mode === 'move') setDestinationId(collection.id);
      createdDraft.current = null; setNewTitle(''); setCreating(false); Keyboard.dismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    });
  };
  const startCreate = () => {
    if (busy) return;
    if (Platform.OS === 'ios') Alert.prompt(noWidow('Nueva lista'), undefined, [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Crear', onPress: (value?: string) => create(value ?? '') },
    ], 'plain-text', '');
    else setCreating(true);
  };
  const rename = (id: string, rawTitle: string) => {
    const title = normalizeMenuListTitle(rawTitle);
    if (!title) return Promise.resolve(false);
    return run(async () => { const next = await renameMenuCollection(id, title); if (!next) throw new Error('Missing list'); onCollectionUpdated(next); });
  };
  const startRename = (collection: MenuCollection) => {
    if (Platform.OS === 'ios') Alert.prompt(noWidow('Renombrar lista'), undefined, [
      { text: 'Cancelar', style: 'cancel' }, { text: 'Guardar', onPress: (value?: string) => { void rename(collection.id, value ?? ''); } },
    ], 'plain-text', collection.title);
    else { setRenameValue(collection.title); setRenameTarget(collection); }
  };
  const remove = (collection: MenuCollection) => Alert.alert(noWidow('Eliminar lista'), noWidow(`Se borrará "${collection.title}". Tus menús se conservan.`), [
    { text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => { void run(async () => { await deleteMenuCollection(collection.id); onCollectionRemoved(collection.id); }); } },
  ]);
  const moveSelection = resolveLibraryMoveSelection({ collections: collections.map((item) => ({ ...item, patioIds: item.fechas })), activeCollectionIds: sourceIds, selectedPatioIds: targetFechas });
  const choices = mode !== 'move' ? collections : choosingSource ? collections.filter((item) => moveSelection.candidateSourceCollectionIds.includes(item.id)) : collections.filter((item) => !sourceIds.includes(item.id));
  const canContinue = sourceIds.length > 0 && moveSelection.canMove && !moveSelection.requiresSourceChoice;
  const move = () => { if (!destinationId || !canContinue) return; void run(async () => {
    const updated = await moveMenusToCollection(targetFechas, sourceIds, destinationId);
    updated.forEach(onCollectionUpdated);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }).then((success) => { if (success) { onClose(); onMoved?.(); } }); };
  const footer = mode === 'move' ? <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={choosingSource ? 'Continuar al destino' : 'Mover menús'} accessibilityState={{ disabled: busy || !canContinue || (!choosingSource && !destinationId), busy }} disabled={busy || !canContinue || (!choosingSource && !destinationId)} onPress={choosingSource ? () => setChoosingSource(false) : move} style={[s.confirm, { backgroundColor: theme.accent, opacity: busy || !canContinue || (!choosingSource && !destinationId) ? 0.35 : 1 }]}><Text style={s.confirmText}>{busy ? 'Moviendo…' : choosingSource ? 'Continuar' : 'Mover'}</Text></TouchableOpacity>
  </View> : undefined;
  const editor = creating ? <View style={[s.editor, { backgroundColor: theme.surface, borderColor: theme.border }]}>
    <TextInput autoFocus value={newTitle} onChangeText={setNewTitle} maxLength={32} editable={!busy} accessibilityLabel="Nombre de la lista" placeholder="Nombre de la lista" placeholderTextColor={theme.textMute} returnKeyType="done" onSubmitEditing={() => create()} style={[s.input, { color: theme.text }]} />
    <TouchableOpacity disabled={busy || !newTitle.trim()} accessibilityRole="button" accessibilityLabel="Crear lista" accessibilityState={{ disabled: busy || !newTitle.trim(), busy }} onPress={() => create()} style={s.control}><Text style={{ color: theme.accent }}>{busy ? 'Creando…' : 'Crear'}</Text></TouchableOpacity>
  </View> : undefined;
  return <>
    <LibrarySheet visible={visible} onClose={close} title={mode === 'filter' ? 'Tus listas' : mode === 'move' ? choosingSource ? 'Origen' : 'Destino' : 'Añadir a lista'} viewKey={`menus:${mode}:${choosingSource}`} footer={footer} theme={theme} preferredHeight={460} onCreate={creating || choosingSource ? undefined : startCreate} onBack={creating ? () => { if (!busy) { setCreating(false); Keyboard.dismiss(); } } : mode === 'move' && !choosingSource && !sourceKey ? () => { if (!busy) { setChoosingSource(true); setDestinationId(null); } } : undefined} onClear={mode === 'filter' && selectedIds.length ? onClearFilter : undefined} dismissDisabled={busy} editing={creating} editor={editor}>
      <View style={[s.group, { backgroundColor: theme.surface }]}>
        {choices.map((collection, index) => <LibraryListRow key={collection.id} title={collection.title} count={collection.fechas.length} unit="menú" role={mode === 'move' && !choosingSource ? 'radio' : 'checkbox'} checked={membership(collection)} disabled={busy} divider={index > 0} onPress={() => toggle(collection)} onMore={mode === 'move' ? undefined : () => Alert.alert(collection.title, undefined, [
          { text: 'Renombrar', onPress: () => startRename(collection) }, { text: 'Eliminar', style: 'destructive', onPress: () => remove(collection) }, { text: 'Cancelar', style: 'cancel' },
        ])} />)}
        {!choices.length && <Text style={[s.empty, { color: theme.textSecondary }]}>{noWidow('Sin listas')}</Text>}
      </View>
    </LibrarySheet>
    {Platform.OS !== 'ios' && <RenameDialog visible={!!renameTarget} title="Renombrar lista" value={renameValue} onChangeText={setRenameValue} maxLength={32} onClose={() => setRenameTarget(null)} onSave={() => renameTarget ? rename(renameTarget.id, renameValue) : Promise.resolve(false)} />}
  </>;
}
const s = StyleSheet.create({
  confirm: { minHeight: 50, padding: 12, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  group: { marginHorizontal: 16, marginTop: 12, borderRadius: 14, overflow: 'hidden' },
  empty: { padding: 24, fontSize: 14, textAlign: 'center' },
  editor: { marginHorizontal: 16, marginVertical: 8, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, gap: 8 },
  input: { flex: 1, minWidth: 0, minHeight: 48, fontSize: 15 },
  control: { minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
});
