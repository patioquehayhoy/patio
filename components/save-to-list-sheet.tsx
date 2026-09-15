import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { createCollection, getCollections, setPatiosInCollection, togglePatioInCollection, type PatioCollection } from '@/lib/collections';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

type SaveToListSheetProps = {
  visible: boolean;
  patioIds: string[];
  patioName: string;
  onDismiss: () => void;
};

export function SaveToListSheet({ visible, patioIds, patioName, onDismiss }: SaveToListSheetProps) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [listContentHeight, setListContentHeight] = useState(0);

  const load = useCallback(() => {
    getCollections().then(setCollections).catch(() => {});
  }, []);

  useEffect(() => {
    if (!visible) return;
    load();
    setNewTitle('');
    setCreating(false);
    translateY.setValue(SCREEN_HEIGHT);
    Animated.spring(translateY, { toValue: 0, stiffness: 380, damping: 34, mass: 0.9, useNativeDriver: true }).start();
  }, [load, translateY, visible]);

  const dismiss = useCallback(() => {
    Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 220, useNativeDriver: true }).start(() => {
      onDismiss();
    });
  }, [onDismiss, translateY]);

  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_event, gesture) => {
      if (gesture.dy > 70 || gesture.vy > 0.9) {
        dismiss();
        return;
      }
      Animated.spring(translateY, { toValue: 0, stiffness: 380, damping: 34, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateY, { toValue: 0, stiffness: 380, damping: 34, useNativeDriver: true }).start();
    },
  })).current;

  const toggleCollection = async (collection: PatioCollection) => {
    const allIn = patioIds.every((id) => collection.patioIds.includes(id));
    const next = patioIds.length > 1
      ? await setPatiosInCollection(collection.id, patioIds, !allIn)
      : await togglePatioInCollection(collection.id, patioIds[0]);
    if (!next) return;
    setCollections((current) => current.map((item) => item.id === next.id ? next : item));
    Haptics.selectionAsync().catch(() => {});
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const collection = await createCollection(title);
    const selected = patioIds.length > 1
      ? await setPatiosInCollection(collection.id, patioIds, true)
      : await togglePatioInCollection(collection.id, patioIds[0]);
    if (selected) setCollections((current) => [selected, ...current]);
    setNewTitle('');
    setCreating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={dismiss} accessibilityRole="button" accessibilityLabel="Cerrar">
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={dismiss} style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16), transform: [{ translateY }] }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, s.sheetTint]} />
          <View {...pan.panHandlers} style={s.handleArea}>
            <View style={s.handle} />
          </View>

          <View style={s.header}>
            <TouchableOpacity
              accessibilityLabel="Nueva lista"
              accessibilityRole="button"
              accessibilityState={{ disabled: creating }}
              disabled={creating}
              onPress={() => setCreating(true)}
              style={[s.headerIcon, creating && s.disabled]}>
              <Ionicons name="add" size={20} color={theme.text} />
            </TouchableOpacity>
            <Text style={s.context} numberOfLines={1}>
              {noWidow(patioIds.length > 1 ? `${patioIds.length} lugares` : patioName)}
            </Text>
            <TouchableOpacity accessibilityLabel="Terminar" accessibilityRole="button" onPress={dismiss} style={s.closeButton}>
              <Text style={s.closeText}>Listo</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={[s.list, { height: Math.min(listContentHeight || Math.max(1, collections.length + Number(creating)) * 52, 310) }]}
            onContentSizeChange={(_width, height) => setListContentHeight(height)}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {creating && (
              <View style={s.row}>
                <View style={s.iconSlot}><Ionicons name="list-outline" size={20} color={theme.textSecondary} /></View>
                <TextInput
                  autoFocus
                  value={newTitle}
                  onChangeText={setNewTitle}
                  maxLength={60}
                  accessibilityLabel="Nombre de la lista"
                  onSubmitEditing={handleCreate}
                  placeholder="Nombre de la lista"
                  placeholderTextColor={theme.textMute}
                  returnKeyType="done"
                  autoCapitalize="words"
                  style={s.input}
                />
                <TouchableOpacity
                  disabled={!newTitle.trim()}
                  onPress={handleCreate}
                  style={[s.createButton, !newTitle.trim() && s.disabled]}
                  accessibilityRole="button"
                  accessibilityLabel="Crear lista"
                  accessibilityState={{ disabled: !newTitle.trim() }}>
                  <Text style={s.createText}>Crear</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* Esta hoja SOLO decide en qué listas vive el lugar — renombrar,
                compartir y eliminar la lista viven en el panel "Listas" del
                filtro (foodie-filter-bar.tsx), que es donde de verdad se
                navegan/administran las listas como destino propio. */}
            {collections.map((collection, index) => {
              const selected = patioIds.every((id) => collection.patioIds.includes(id));
              const partial = !selected && patioIds.some((id) => collection.patioIds.includes(id));
              return (
                <TouchableOpacity
                  key={collection.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: partial ? 'mixed' : selected }}
                  accessibilityLabel={`${collection.title}, ${collection.patioIds.length} ${collection.patioIds.length === 1 ? 'lugar' : 'lugares'}`}
                  onPress={() => toggleCollection(collection)}
                  style={[s.row, (creating || index > 0) && s.divider]}>
                  <Ionicons name={selected ? 'checkmark-circle' : partial ? 'remove-circle-outline' : 'ellipse-outline'} size={22} color={selected || partial ? theme.accent : theme.textMute} />
                  <View style={s.rowCopy}>
                    <Text style={s.rowTitle} numberOfLines={2}>{noWidow(collection.title)}</Text>
                  </View>
                  <Text style={s.rowMeta}>{collection.patioIds.length}</Text>
                </TouchableOpacity>
              );
            })}
            {!creating && collections.length === 0 && (
              <View style={s.empty}>
                <Text style={s.rowMeta}>{noWidow('Sin listas')}</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
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
