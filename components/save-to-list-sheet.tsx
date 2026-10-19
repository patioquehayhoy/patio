import { BottomContentFade } from '@/components/bottom-content-fade';
import { useScrollEdges } from '@/lib/use-scroll-edges';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Keyboard, Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createCollection, getCollections, movePatiosToCollection, setPatiosInCollection, type PatioCollection } from '@/lib/collections';
import { resolveLibraryMoveSelection } from '@/lib/library-selection';
import { isVerticalSheetDrag, SHEET_DISMISS_MS, SHEET_SPRING, shouldDismissSheet } from '@/lib/sheet-motion';
import { useSheetKeyboard } from '@/lib/use-sheet-keyboard';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { libraryFooterMaxHeight } from '@/lib/layout-metrics';
import { sheetSurfaceTint } from '@/lib/surface-styles';

type SaveToListSheetProps = {
  visible: boolean; patioIds: string[]; patioName: string; onDismiss: () => void;
  mode?: 'add' | 'move'; sourceCollectionIds?: string[]; onChanged?: () => void; onMoved?: () => void;
};

export function SaveToListSheet({ visible, patioIds, patioName, onDismiss, mode = 'add', sourceCollectionIds = [], onChanged, onMoved }: SaveToListSheetProps) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const window = useWindowDimensions();
  // `screen` no se encoge con el teclado en Android; `window` fuerza un
  // rerender en rotación para que la lectura deje de ser un global stale.
  const screenHeight = Dimensions.get('screen').height || window.height;
  const { viewportHeight, keyboardInset, keyboardVisible } = useSheetKeyboard();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const moved = useRef(false);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [chosenSourceIds, setChosenSourceIds] = useState<string[]>([]);
  const [choosingSource, setChoosingSource] = useState(false);
  const edges = useScrollEdges(`${visible}:${mode}:${choosingSource ? 'source' : 'destination'}`);
  const sourceKey = sourceCollectionIds.join('\u0000');
  const [listContentHeight, setListContentHeight] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(60);
  const [footerHeight, setFooterHeight] = useState(58);
  const createdDraft = useRef<PatioCollection | null>(null);
  const opening = useRef(false);
  const closing = useRef(false);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const sheetOffsetRef = useRef(screenHeight);
  const load = useCallback(() => getCollections(), []);
  useLayoutEffect(() => {
    if (!visible) return;
    setNewTitle(''); setCreating(false); setDestinationId(null); createdDraft.current = null;
    moved.current = false;
    setChosenSourceIds(sourceKey ? sourceKey.split('\u0000') : []);
    setChoosingSource(mode === 'move' && !sourceKey);
    setListContentHeight(0);
    opening.current = true;
    closing.current = false;
    translateY.stopAnimation();
    translateY.setValue(screenHeight);
  }, [mode, screenHeight, sourceKey, translateY, visible]);
  useEffect(() => {
    if (!visible) return;
    let active = true;
    load()
      .then((items) => { if (active) setCollections(items); })
      .catch(() => { if (active) Alert.alert(noWidow('No pudimos cargar las listas')); });
    return () => { active = false; };
  }, [load, visible]);
  const handleSheetLayout = (height: number) => {
    if (height <= 0) return;
    sheetOffsetRef.current = height;
    setSheetHeight((current) => current === height ? current : height);
    if (opening.current) {
      opening.current = false;
      translateY.setValue(height);
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    }
  };
  const dismiss = () => {
    if (pending.current || closing.current) return;
    closing.current = true;
    opening.current = false;
    Animated.timing(translateY, { toValue: Math.max(120, sheetOffsetRef.current), duration: SHEET_DISMISS_MS, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) {
        closing.current = false;
        if (visibleRef.current && !opening.current) Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
        return;
      }
      Keyboard.dismiss();
      onDismiss();
      if (moved.current) onMoved?.();
    });
  };
  const dismissRef = useRef(dismiss); dismissRef.current = dismiss;
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => !pending.current && !closing.current && isVerticalSheetDrag(gesture.dx, gesture.dy),
    onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_event, gesture) => {
      if (!pending.current && shouldDismissSheet(gesture.dy, gesture.vy)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        dismissRef.current();
      }
      else Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    },
    onPanResponderTerminate: () => Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start(),
  })).current;
  const run = async (operation: () => Promise<void>): Promise<boolean> => {
    if (pending.current || !patioIds.length) return false;
    pending.current = true; setBusy(true);
    try { await operation(); return true; }
    catch (error) { Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow(error instanceof Error ? error.message : 'Inténtalo de nuevo.')); return false; }
    finally { pending.current = false; setBusy(false); }
  };
  const choose = (collection: PatioCollection) => {
    if (choosingSource) {
      setChosenSourceIds((current) => current.includes(collection.id) ? current.filter((id) => id !== collection.id) : [...current, collection.id]);
      setDestinationId(null);
      Haptics.selectionAsync().catch(() => {});
      return;
    }
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
      setCollections(await load()); onChanged?.();
      setNewTitle(''); setCreating(false); createdDraft.current = null; Keyboard.dismiss();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    });
  };
  const move = () => {
    if (!destinationId || !chosenSourceIds.length || !moveSelection.canMove) return;
    void run(async () => {
      await movePatiosToCollection(patioIds, chosenSourceIds, destinationId);
      moved.current = true;
      onChanged?.();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }).then((succeeded) => { if (succeeded) dismissRef.current(); });
  };
  const moveSelection = resolveLibraryMoveSelection({ collections, activeCollectionIds: chosenSourceIds, selectedPatioIds: patioIds });
  const sourceNames = collections.filter((item) => chosenSourceIds.includes(item.id)).map((item) => item.title).join(', ');
  const choices = mode !== 'move' ? collections : choosingSource
    ? collections.filter((item) => moveSelection.candidateSourceCollectionIds.includes(item.id))
    : collections.filter((item) => !chosenSourceIds.includes(item.id));
  const canContinue = chosenSourceIds.length > 0 && moveSelection.canMove && !moveSelection.requiresSourceChoice;
  const canConfirm = canContinue && !!destinationId;
  const canReturnToSource = mode === 'move' && !sourceCollectionIds.length && !choosingSource;
  const bottomPadding = keyboardVisible ? 8 : Math.max(insets.bottom, 16);
  const availableHeight = Math.max(0, viewportHeight - insets.top - 12);
  const footerMaxHeight = libraryFooterMaxHeight(Math.max(0, availableHeight - 4), headerHeight, bottomPadding, window.fontScale);
  const visibleFooterHeight = mode === 'move' ? Math.min(footerHeight, footerMaxHeight) : 0;
  const maxListHeight = Math.max(0, Math.min(310 * window.fontScale,
    availableHeight - headerHeight - visibleFooterHeight - bottomPadding - 12));
  const backdropOpacity = translateY.interpolate({ inputRange: [0, Math.max(1, sheetHeight)], outputRange: [1, 0], extrapolate: 'clamp' });
  return <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
    <View style={[s.overlay, { paddingBottom: keyboardInset }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, s.backdrop, { opacity: backdropOpacity }]}>
        <TouchableWithoutFeedback onPress={dismiss} accessibilityRole="button" accessibilityLabel="Cerrar"><View style={StyleSheet.absoluteFillObject} /></TouchableWithoutFeedback>
      </Animated.View>
      <Animated.View
        accessibilityViewIsModal
        onAccessibilityEscape={dismiss}
        onLayout={(event) => handleSheetLayout(event.nativeEvent.layout.height)}
        style={[s.sheet, { maxHeight: availableHeight, paddingBottom: bottomPadding, transform: [{ translateY }] }]}>
        <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, s.sheetTint]} />
        <View {...pan.panHandlers} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
          <View style={s.handleArea}><View style={s.handle} /></View>
          <View style={s.header}>
            {choosingSource ? <View style={s.headerIcon} /> : <TouchableOpacity accessibilityLabel={creating ? 'Cancelar nueva lista' : canReturnToSource ? 'Volver a origen' : 'Nueva lista'} accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => {
              if (creating) { setCreating(false); Keyboard.dismiss(); }
              else if (canReturnToSource) { setChoosingSource(true); setDestinationId(null); }
              else setCreating(true);
            }} style={s.headerIcon}>
              <Ionicons name={creating || canReturnToSource ? 'chevron-back' : 'add'} size={20} color={theme.text} />
            </TouchableOpacity>}
            <Text accessibilityRole="header" style={s.context} numberOfLines={1}>{noWidow(creating ? 'Nueva lista' : mode === 'move' ? choosingSource ? 'Origen' : 'Destino' : patioIds.length > 1 ? `${patioIds.length} lugares` : patioName || 'Guardar en lista')}</Text>
            {canReturnToSource && !creating && <TouchableOpacity disabled={busy} accessibilityRole="button" accessibilityLabel="Nueva lista" onPress={() => setCreating(true)} style={s.headerIcon}><Ionicons name="add" size={20} color={theme.text} /></TouchableOpacity>}
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} onPress={dismiss} disabled={busy} style={s.closeButton}><Text style={s.closeText}>{mode === 'move' ? 'Cancelar' : 'Listo'}</Text></TouchableOpacity>
          </View>
        </View>
        <View style={{ flexShrink: 1, minHeight: 0 }}>
        <ScrollView key={`${visible}:${mode}:${choosingSource ? 'source' : 'destination'}`} onLayout={edges.onLayout} onScroll={edges.onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: mode === 'move' ? 32 : 0 }} style={[s.list, { height: Math.min(listContentHeight || Math.max(1, choices.length) * 52, maxListHeight), maxHeight: maxListHeight }]}
          onContentSizeChange={(width, height) => { edges.onContentSizeChange(width, height); setListContentHeight(height); }} showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'} keyboardShouldPersistTaps="handled">
        {creating && <View style={[s.row, { backgroundColor: theme.surface, borderRadius: 14, marginTop: 8 }]}>
          <TextInput autoFocus keyboardAppearance={theme.isDark ? 'dark' : 'light'} value={newTitle} editable={!busy} onChangeText={setNewTitle} maxLength={60} accessibilityLabel="Nombre de la lista" onSubmitEditing={handleCreate} placeholder="Nombre de la lista" placeholderTextColor={theme.textMute} returnKeyType="done" autoCapitalize="words" style={s.input} />
          <TouchableOpacity disabled={!newTitle.trim() || busy} onPress={handleCreate} style={[s.createButton, (!newTitle.trim() || busy) && s.disabled]} accessibilityRole="button" accessibilityLabel="Crear lista"><Text style={s.createText}>{busy ? 'Creando…' : 'Crear'}</Text></TouchableOpacity>
        </View>}
        {mode === 'move' && (
          <Text style={s.moveHint} numberOfLines={2}>
            {noWidow(choosingSource ? `${patioIds.length} ${patioIds.length === 1 ? 'lugar seleccionado' : 'lugares seleccionados'}` : `Origen: ${sourceNames}`)}
          </Text>
        )}
          {choices.map((collection, index) => {
            const selected = choosingSource ? chosenSourceIds.includes(collection.id) : mode === 'move' ? collection.id === destinationId : patioIds.length > 0 && patioIds.every((id) => collection.patioIds.includes(id));
            const partial = mode === 'add' && !selected && patioIds.some((id) => collection.patioIds.includes(id));
            return <TouchableOpacity key={collection.id} disabled={busy} accessibilityRole={mode === 'move' && !choosingSource ? 'radio' : 'checkbox'} accessibilityState={{ checked: partial ? 'mixed' : selected, disabled: busy }}
              accessibilityLabel={`${collection.title}, ${collection.patioIds.length} ${collection.patioIds.length === 1 ? 'lugar' : 'lugares'}`} onPress={() => choose(collection)} style={[s.row, index > 0 && s.divider]}>
              <Ionicons name={selected ? 'checkmark-circle' : partial ? 'remove-circle-outline' : 'ellipse-outline'} size={22} color={selected || partial ? theme.accent : theme.textMute} />
              <View style={s.rowCopy}><Text style={s.rowTitle} numberOfLines={2}>{noWidow(collection.title)}</Text></View><Text style={s.rowMeta} numberOfLines={1}>{collection.patioIds.length} {collection.patioIds.length === 1 ? 'lugar' : 'lugares'}</Text>
            </TouchableOpacity>;
          })}
          {!choices.length && <View style={s.empty}><Text style={s.rowMeta}>{noWidow(mode === 'move' && !choosingSource ? 'Sin listas de destino' : 'Sin listas')}</Text></View>}
        </ScrollView>
        {mode === 'move' && <BottomContentFade height={24} />}
        </View>
        {mode === 'move' && <ScrollView style={{ flexGrow: 0, flexShrink: 0, height: visibleFooterHeight, maxHeight: footerMaxHeight }}
          onContentSizeChange={(_width, height) => setFooterHeight(height)} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'}>
          <TouchableOpacity disabled={busy || !(choosingSource ? canContinue : canConfirm)} onPress={choosingSource ? () => setChoosingSource(false) : move} accessibilityRole="button" accessibilityLabel={choosingSource ? 'Continuar al destino' : 'Mover lugares'} accessibilityState={{ disabled: busy || !(choosingSource ? canContinue : canConfirm), busy }} style={[s.confirmButton, (busy || !(choosingSource ? canContinue : canConfirm)) && s.disabled]}><Text style={s.confirmText}>{noWidow(choosingSource ? 'Continuar' : busy ? 'Moviendo…' : `Mover ${patioIds.length} ${patioIds.length === 1 ? 'lugar' : 'lugares'}`)}</Text></TouchableOpacity>
        </ScrollView>}
      </Animated.View>
    </View>
  </Modal>;
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { backgroundColor: 'rgba(0,0,0,0.26)' },
    sheet: { maxHeight: '68%', paddingHorizontal: 16, paddingTop: 4, overflow: 'hidden', backgroundColor: 'transparent', borderTopLeftRadius: 28, borderTopRightRadius: 28, borderTopWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)' },
    sheetTint: { backgroundColor: sheetSurfaceTint(t.isDark) },
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
    rowMeta: { minWidth: 64, fontSize: 13, lineHeight: 18, color: t.textSecondary, textAlign: 'right', fontVariant: ['tabular-nums'] },
    input: { flex: 1, minWidth: 0, height: 44, paddingVertical: 0, fontSize: 16, fontWeight: '400', color: t.text },
    createButton: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    createText: { fontSize: 15, fontWeight: '500', color: t.accent },
    confirmButton: { minHeight: 50, borderRadius: 25, marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accent },
    confirmText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
    disabled: { opacity: 0.35 },
    moveHint: { paddingHorizontal: 8, paddingTop: 6, fontSize: 12.5, lineHeight: 17, fontWeight: '400', color: t.textSecondary },
    empty: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  });
}
