import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Keyboard, Modal, PanResponder, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createCollection, getCollections, movePatiosToCollection, setPatiosInCollection, type PatioCollection } from '@/lib/collections';
import { isVerticalSheetDrag, SHEET_DISMISS_MS, SHEET_SPRING, shouldDismissSheet } from '@/lib/sheet-motion';
import { useSheetKeyboard } from '@/lib/use-sheet-keyboard';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type SaveToListSheetProps = {
  visible: boolean; patioIds: string[]; patioName: string; onDismiss: () => void;
  mode?: 'add' | 'move'; sourceCollectionIds?: string[]; onChanged?: () => void;
};

export function SaveToListSheet({ visible, patioIds, patioName, onDismiss, mode = 'add', sourceCollectionIds = [], onChanged }: SaveToListSheetProps) {
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
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [listContentHeight, setListContentHeight] = useState(0);
  const [sheetHeight, setSheetHeight] = useState(0);
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
    setListContentHeight(0);
    opening.current = true;
    closing.current = false;
    translateY.stopAnimation();
    translateY.setValue(screenHeight);
  }, [screenHeight, translateY, visible]);
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
    if (!destinationId) return;
    void run(async () => {
      await movePatiosToCollection(patioIds, sourceCollectionIds, destinationId);
      onChanged?.();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }).then((moved) => { if (moved) dismissRef.current(); });
  };
  const choices = mode === 'move' ? collections.filter((item) => !sourceCollectionIds.includes(item.id)) : collections;
  const bottomPadding = keyboardVisible ? 8 : Math.max(insets.bottom, 16);
  const maxListHeight = Math.max(44, Math.min(310, viewportHeight - insets.top - 12 - 20 - 44 - (creating ? 64 : 0) - (mode === 'move' ? 96 : 0) - bottomPadding - 8));
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
        style={[s.sheet, { maxHeight: Math.max(120, viewportHeight - insets.top - 12), paddingBottom: bottomPadding, transform: [{ translateY }] }]}>
        <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
        <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, s.sheetTint]} />
        <View {...pan.panHandlers}>
          <View style={s.handleArea}><View style={s.handle} /></View>
          <View style={s.header}>
            <TouchableOpacity accessibilityLabel={creating ? 'Cancelar nueva lista' : 'Nueva lista'} accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={() => { setCreating(!creating); if (creating) Keyboard.dismiss(); }} style={s.headerIcon}>
              <Ionicons name={creating ? 'chevron-back' : 'add'} size={20} color={theme.text} />
            </TouchableOpacity>
            <Text accessibilityRole="header" style={s.context} numberOfLines={1}>{noWidow(mode === 'move' ? `Mover ${patioIds.length} ${patioIds.length === 1 ? 'lugar' : 'lugares'}` : patioIds.length > 1 ? `${patioIds.length} lugares` : patioName)}</Text>
            <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} onPress={dismiss} disabled={busy} style={s.closeButton}><Text style={s.closeText}>{mode === 'move' ? 'Cancelar' : 'Listo'}</Text></TouchableOpacity>
          </View>
        </View>
        {creating && <View style={[s.row, { backgroundColor: theme.surface, borderRadius: 14, marginTop: 8 }]}>
          <TextInput autoFocus value={newTitle} editable={!busy} onChangeText={setNewTitle} maxLength={60} accessibilityLabel="Nombre de la lista" onSubmitEditing={handleCreate} placeholder="Nombre de la lista" placeholderTextColor={theme.textMute} returnKeyType="done" autoCapitalize="words" style={s.input} />
          <TouchableOpacity disabled={!newTitle.trim() || busy} onPress={handleCreate} style={[s.createButton, (!newTitle.trim() || busy) && s.disabled]} accessibilityRole="button" accessibilityLabel="Crear lista"><Text style={s.createText}>{busy ? 'Creando…' : 'Crear'}</Text></TouchableOpacity>
        </View>}
        {mode === 'move' && sourceCollectionIds.length > 0 && (
          <Text style={s.moveHint}>
            {noWidow(`Se quitarán de ${sourceCollectionIds.length} ${sourceCollectionIds.length === 1 ? 'lista de origen' : 'listas de origen'} y se agregarán a la que elijas.`)}
          </Text>
        )}
        <ScrollView style={[s.list, { height: Math.min(listContentHeight || Math.max(1, choices.length) * 52, maxListHeight), maxHeight: maxListHeight }]}
          onContentSizeChange={(_width, height) => setListContentHeight(height)} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {choices.map((collection, index) => {
            const selected = mode === 'move' ? collection.id === destinationId : patioIds.length > 0 && patioIds.every((id) => collection.patioIds.includes(id));
            const partial = mode === 'add' && !selected && patioIds.some((id) => collection.patioIds.includes(id));
            return <TouchableOpacity key={collection.id} disabled={busy} accessibilityRole={mode === 'move' ? 'radio' : 'checkbox'} accessibilityState={{ checked: partial ? 'mixed' : selected, disabled: busy }}
              accessibilityLabel={`${collection.title}, ${collection.patioIds.length} ${collection.patioIds.length === 1 ? 'lugar' : 'lugares'}`} onPress={() => choose(collection)} style={[s.row, index > 0 && s.divider]}>
              <Ionicons name={selected ? 'checkmark-circle' : partial ? 'remove-circle-outline' : 'ellipse-outline'} size={22} color={selected || partial ? theme.accent : theme.textMute} />
              <View style={s.rowCopy}><Text style={s.rowTitle} numberOfLines={2}>{noWidow(collection.title)}</Text></View><Text style={s.rowMeta} numberOfLines={1}>{collection.patioIds.length} {collection.patioIds.length === 1 ? 'lugar' : 'lugares'}</Text>
            </TouchableOpacity>;
          })}
          {!choices.length && <View style={s.empty}><Text style={s.rowMeta}>{noWidow(mode === 'move' ? 'Crea una lista de destino con +' : 'Sin listas')}</Text></View>}
        </ScrollView>
        {mode === 'move' && <TouchableOpacity disabled={!destinationId || busy} onPress={move} accessibilityRole="button" accessibilityState={{ disabled: !destinationId || busy, busy }} style={[s.createButton, { marginTop: 8 }, (!destinationId || busy) && s.disabled]}><Text style={[s.createText, (!destinationId || busy) && { color: theme.textMute }]}>{busy ? 'Moviendo…' : 'Mover'}</Text></TouchableOpacity>}
      </Animated.View>
    </View>
  </Modal>;
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { backgroundColor: 'rgba(0,0,0,0.26)' },
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
    rowMeta: { minWidth: 64, fontSize: 13, lineHeight: 18, color: t.textSecondary, textAlign: 'right', fontVariant: ['tabular-nums'] },
    input: { flex: 1, minWidth: 0, height: 44, paddingVertical: 0, fontSize: 15, fontWeight: '500', color: t.text },
    createButton: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    createText: { fontSize: 15, fontWeight: '500', color: t.accent },
    disabled: { opacity: 0.35 },
    moveHint: { paddingHorizontal: 8, paddingTop: 6, fontSize: 12.5, lineHeight: 17, fontWeight: '400', color: t.textSecondary },
    empty: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  });
}
