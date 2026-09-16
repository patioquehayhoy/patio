import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Keyboard, Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createCollection, getCollections, movePatiosToCollection, setPatiosInCollection, type PatioCollection } from '@/lib/collections';
import { useSheetKeyboard } from '@/lib/use-sheet-keyboard';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const SCREEN_HEIGHT = Dimensions.get('screen').height;
type SaveToListSheetProps = {
  visible: boolean; patioIds: string[]; patioName: string; onDismiss: () => void;
  mode?: 'add' | 'move'; sourceCollectionIds?: string[]; onChanged?: () => void;
};

export function SaveToListSheet({ visible, patioIds, patioName, onDismiss, mode = 'add', sourceCollectionIds = [], onChanged }: SaveToListSheetProps) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { viewportHeight, keyboardInset, keyboardVisible } = useSheetKeyboard();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [listContentHeight, setListContentHeight] = useState(0);
  const createdDraft = useRef<PatioCollection | null>(null);
  const load = useCallback(() => getCollections().then(setCollections), []);
  useEffect(() => {
    if (!visible) return;
    load().catch(() => Alert.alert(noWidow('No pudimos cargar las listas')));
    setNewTitle(''); setCreating(false); setDestinationId(null); createdDraft.current = null;
    translateY.setValue(SCREEN_HEIGHT);
    Animated.spring(translateY, { toValue: 0, stiffness: 380, damping: 34, mass: 0.9, useNativeDriver: true }).start();
  }, [load, translateY, visible]);
  const dismiss = () => {
    if (pending.current) return;
    Keyboard.dismiss();
    Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }).start(({ finished }) => { if (finished) onDismiss(); });
  };
  const dismissRef = useRef(dismiss); dismissRef.current = dismiss;
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => !pending.current && gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_event, gesture) => {
      if (gesture.dy > 70 || gesture.vy > 0.9) dismissRef.current();
      else Animated.spring(translateY, { toValue: 0, stiffness: 380, damping: 34, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(translateY, { toValue: 0, stiffness: 380, damping: 34, useNativeDriver: true }).start(),
  })).current;
  const run = async (operation: () => Promise<void>) => {
    if (pending.current || !patioIds.length) return;
    pending.current = true; setBusy(true);
    try { await operation(); }
    catch (error) { Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow(error instanceof Error ? error.message : 'Inténtalo de nuevo.')); }
    finally { pending.current = false; setBusy(false); }
  };
  const choose = (collection: PatioCollection) => {
    if (mode === 'move') { setDestinationId(collection.id); return; }
    void run(async () => {
      const next = await setPatiosInCollection(collection.id, patioIds, !patioIds.every((id) => collection.patioIds.includes(id)));
      if (!next) throw new Error('La lista ya no existe.');
      setCollections((current) => current.map((item) => item.id === next.id ? next : item));
      onChanged?.(); Haptics.selectionAsync().catch(() => {});
    });
  };
  const handleCreate = () => {
    if (!newTitle.trim()) return;
    void run(async () => {
      const draft = createdDraft.current ?? await createCollection(newTitle.trim());
      createdDraft.current = draft;
      if (mode === 'add') {
        const next = await setPatiosInCollection(draft.id, patioIds, true);
        if (!next) throw new Error('La lista ya no existe.');
      } else setDestinationId(draft.id);
      await load(); onChanged?.();
      setNewTitle(''); setCreating(false); createdDraft.current = null; Keyboard.dismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    });
  };
  const move = () => {
    if (!destinationId) return;
    void run(async () => {
      await movePatiosToCollection(patioIds, sourceCollectionIds, destinationId);
      onChanged?.(); Keyboard.dismiss(); onDismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    });
  };
  const choices = mode === 'move' ? collections.filter((item) => !sourceCollectionIds.includes(item.id)) : collections;
  const bottomPadding = keyboardVisible ? 8 : Math.max(insets.bottom, 16);
  const maxListHeight = Math.max(44, Math.min(310, viewportHeight - insets.top - 12 - 20 - 44 - (creating ? 64 : 0) - (mode === 'move' ? 56 : 0) - bottomPadding - 8));
  return <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
    <View style={[s.overlay, { paddingBottom: keyboardInset }]}>
      <TouchableWithoutFeedback onPress={dismiss} accessibilityRole="button" accessibilityLabel="Cerrar"><View style={StyleSheet.absoluteFillObject} /></TouchableWithoutFeedback>
      <Animated.View accessibilityViewIsModal onAccessibilityEscape={dismiss} style={[s.sheet, { maxHeight: Math.max(120, viewportHeight - insets.top - 12), paddingBottom: bottomPadding, transform: [{ translateY }] }]}>
        <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, s.sheetTint]} />
        <View {...pan.panHandlers} style={s.handleArea}><View style={s.handle} /></View>
        <View style={s.header}>
          <TouchableOpacity accessibilityLabel={creating ? 'Cancelar nueva lista' : 'Nueva lista'} accessibilityRole="button" disabled={busy} onPress={() => { setCreating(!creating); if (creating) Keyboard.dismiss(); }} style={s.headerIcon}>
            <Ionicons name={creating ? 'chevron-back' : 'add'} size={20} color={theme.text} />
          </TouchableOpacity>
          <Text style={s.context} numberOfLines={1}>{noWidow(mode === 'move' ? `Mover ${patioIds.length} ${patioIds.length === 1 ? 'lugar' : 'lugares'}` : patioIds.length > 1 ? `${patioIds.length} lugares` : patioName)}</Text>
          <TouchableOpacity accessibilityRole="button" onPress={dismiss} disabled={busy} style={s.closeButton}><Text style={s.closeText}>{mode === 'move' ? 'Cancelar' : 'Listo'}</Text></TouchableOpacity>
        </View>
        {creating && <View style={[s.row, { backgroundColor: theme.surface, borderRadius: 14, marginTop: 8 }]}>
          <TextInput autoFocus value={newTitle} editable={!busy} onChangeText={setNewTitle} maxLength={60} accessibilityLabel="Nombre de la lista" onSubmitEditing={handleCreate} placeholder="Nombre de la lista" placeholderTextColor={theme.textMute} returnKeyType="done" autoCapitalize="words" style={s.input} />
          <TouchableOpacity disabled={!newTitle.trim() || busy} onPress={handleCreate} style={[s.createButton, (!newTitle.trim() || busy) && s.disabled]} accessibilityRole="button" accessibilityLabel="Crear lista"><Text style={s.createText}>{busy ? 'Creando…' : 'Crear'}</Text></TouchableOpacity>
        </View>}
        <ScrollView style={[s.list, { height: Math.min(listContentHeight || Math.max(1, choices.length) * 52, maxListHeight), maxHeight: maxListHeight }]}
          onContentSizeChange={(_width, height) => setListContentHeight(height)} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {choices.map((collection, index) => {
            const selected = mode === 'move' ? collection.id === destinationId : patioIds.length > 0 && patioIds.every((id) => collection.patioIds.includes(id));
            const partial = mode === 'add' && !selected && patioIds.some((id) => collection.patioIds.includes(id));
            return <TouchableOpacity key={collection.id} disabled={busy} accessibilityRole={mode === 'move' ? 'radio' : 'checkbox'} accessibilityState={{ checked: partial ? 'mixed' : selected, disabled: busy }}
              accessibilityLabel={`${collection.title}, ${collection.patioIds.length} lugares`} onPress={() => choose(collection)} style={[s.row, index > 0 && s.divider]}>
              <Ionicons name={selected ? 'checkmark-circle' : partial ? 'remove-circle-outline' : 'ellipse-outline'} size={22} color={selected || partial ? theme.accent : theme.textMute} />
              <View style={s.rowCopy}><Text style={s.rowTitle} numberOfLines={2}>{noWidow(collection.title)}</Text></View><Text style={s.rowMeta}>{collection.patioIds.length}</Text>
            </TouchableOpacity>;
          })}
          {!choices.length && <View style={s.empty}><Text style={s.rowMeta}>{noWidow(mode === 'move' ? 'Crea una lista de destino con +' : 'Sin listas')}</Text></View>}
        </ScrollView>
        {mode === 'move' && <TouchableOpacity disabled={!destinationId || busy} onPress={move} accessibilityRole="button" style={[s.createButton, { marginTop: 8 }, (!destinationId || busy) && s.disabled]}><Text style={s.createText}>{busy ? 'Moviendo…' : 'Mover'}</Text></TouchableOpacity>}
      </Animated.View>
    </View>
  </Modal>;
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.26)' },
    sheet: { maxHeight: '68%', paddingHorizontal: 16, paddingTop: 4, overflow: 'hidden', backgroundColor: 'transparent', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)', shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: t.isDark ? 0.24 : 0.10, shadowRadius: 24, elevation: 12 },
    sheetTint: { backgroundColor: t.isDark ? 'rgba(24,25,27,0.72)' : 'rgba(255,255,255,0.66)' },
    handleArea: { height: 16, alignItems: 'center', justifyContent: 'center' },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: t.border },
    header: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    context: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20, fontWeight: '500', color: t.text },
    closeButton: { minWidth: 44, height: 44, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' },
    closeText: { fontSize: 15, fontWeight: '500', color: t.accent },
    list: { flexGrow: 0, flexShrink: 1, maxHeight: 310, marginTop: 8, borderRadius: 14, backgroundColor: t.surface },
    row: { minHeight: 52, paddingVertical: 6, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    iconSlot: { width: 22, alignItems: 'center', justifyContent: 'center' },
    rowCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
    rowTitle: { fontSize: 15, lineHeight: 20, fontWeight: '500', color: t.text },
    rowMeta: { fontSize: 13, lineHeight: 18, color: t.textSecondary, fontVariant: ['tabular-nums'] },
    input: { flex: 1, minWidth: 0, height: 44, paddingVertical: 0, fontSize: 15, fontWeight: '500', color: t.text },
    createButton: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    createText: { fontSize: 15, fontWeight: '500', color: t.accent },
    disabled: { opacity: 0.35 },
    empty: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  });
}
