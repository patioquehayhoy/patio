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

import { createCollection, getCollections, normalizeCollectionTitle, renameCollection, togglePatioInCollection, type PatioCollection } from '@/lib/collections';
import { Fonts, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

type SaveToListSheetProps = {
  visible: boolean;
  patioId: string;
  patioName: string;
  onDismiss: () => void;
};

export function SaveToListSheet({ visible, patioId, patioName, onDismiss }: SaveToListSheetProps) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [collections, setCollections] = useState<PatioCollection[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

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
    const next = await togglePatioInCollection(collection.id, patioId);
    if (!next) return;
    setCollections((current) => current.map((item) => item.id === next.id ? next : item));
    Haptics.selectionAsync().catch(() => {});
  };

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) return;
    const collection = await createCollection(title);
    const selected = await togglePatioInCollection(collection.id, patioId);
    if (selected) setCollections((current) => [selected, ...current]);
    setNewTitle('');
    setCreating(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const startRename = (collection: PatioCollection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setEditingId(collection.id);
    setEditTitle(collection.title);
  };

  const saveRename = async () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (title) {
      const renamed = await renameCollection(editingId, title);
      if (renamed) setCollections((current) => current.map((item) => item.id === renamed.id ? renamed : item));
    }
    setEditingId(null);
  };

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={dismiss}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
        <Animated.View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 12, transform: [{ translateY }] }]}>
          <BlurView intensity={theme.isDark ? 34 : 54} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, s.sheetTint]} />
          <View {...pan.panHandlers} style={s.handleArea}>
            <View style={s.handle} />
          </View>

          <View style={s.header}>
            <View style={s.savedIcon}>
              <Ionicons name="checkmark" size={16} color={theme.accent} />
            </View>
            <View style={s.headerCopy}>
              <Text style={s.title}>Guardado</Text>
              <Text style={s.subtitle} numberOfLines={2}>{noWidow(`${patioName} ya está en Guardados. Elige una lista para organizarlo.`)}</Text>
            </View>
            <TouchableOpacity accessibilityLabel="Terminar" accessibilityRole="button" hitSlop={8} onPress={dismiss} style={s.closeButton}>
              <Text style={s.closeText}>Listo</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.sectionLabel}>{noWidow('TUS LISTAS')}</Text>
          <ScrollView style={s.list} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {collections.map((collection, index) => {
              const selected = collection.patioIds.includes(patioId);
              if (editingId === collection.id) {
                return (
                  <View key={collection.id} style={[s.row, index > 0 && s.divider]}>
                    <View style={s.listIcon}><Ionicons name="pencil" size={16} color={theme.textSecondary} /></View>
                    <TextInput
                      autoFocus
                      value={editTitle}
                      onChangeText={(value) => setEditTitle(normalizeCollectionTitle(value))}
                      onSubmitEditing={saveRename}
                      onBlur={saveRename}
                      placeholder="Una palabra, ej. Tacos"
                      placeholderTextColor={theme.textMute}
                      returnKeyType="done"
                      autoCapitalize="words"
                      style={s.input}
                    />
                    <TouchableOpacity onPress={saveRename} style={s.createButton} accessibilityRole="button" accessibilityLabel="Guardar nombre de la lista">
                      <Text style={s.createText}>Listo</Text>
                    </TouchableOpacity>
                  </View>
                );
              }
              return (
                <TouchableOpacity
                  key={collection.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  onPress={() => toggleCollection(collection)}
                  onLongPress={() => startRename(collection)}
                  style={[s.row, index > 0 && s.divider]}>
                  <View style={[s.listIcon, selected && s.listIconSelected]}>
                    <Ionicons name="bookmark-outline" size={17} color={selected ? theme.accent : theme.textSecondary} />
                  </View>
                  <View style={s.rowCopy}>
                    <Text style={s.rowTitle} numberOfLines={1}>{collection.title}</Text>
                    <Text style={s.rowMeta}>{collection.patioIds.length} {collection.patioIds.length === 1 ? 'lugar' : 'lugares'}</Text>
                  </View>
                  <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={23} color={selected ? theme.accent : theme.textMute} />
                </TouchableOpacity>
              );
            })}

            {creating ? (
              <View style={[s.row, collections.length > 0 && s.divider]}>
                <View style={s.listIcon}><Ionicons name="add" size={19} color={theme.textSecondary} /></View>
                <TextInput
                  autoFocus
                  value={newTitle}
                  onChangeText={(value) => setNewTitle(normalizeCollectionTitle(value))}
                  onSubmitEditing={handleCreate}
                  placeholder="Una palabra, ej. Tacos"
                  placeholderTextColor={theme.textMute}
                  returnKeyType="done"
                  autoCapitalize="words"
                  style={s.input}
                />
                <TouchableOpacity disabled={!newTitle.trim()} onPress={handleCreate} style={s.createButton} accessibilityRole="button" accessibilityLabel="Crear lista">
                  <Text style={[s.createText, !newTitle.trim() && s.createTextDisabled]}>Crear</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setCreating(true)} style={[s.row, collections.length > 0 && s.divider]} accessibilityRole="button" accessibilityLabel="Nueva lista">
                <View style={s.listIcon}><Ionicons name="add" size={19} color={theme.textSecondary} /></View>
                <View style={s.rowCopy}><Text style={s.rowTitle}>{noWidow('Nueva lista')}</Text></View>
              </TouchableOpacity>
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
    sheet: { maxHeight: '68%', paddingHorizontal: 20, paddingTop: 4, overflow: 'hidden', backgroundColor: 'transparent', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0, borderColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)', shadowColor: '#000', shadowOffset: { width: 0, height: -8 }, shadowOpacity: t.isDark ? 0.24 : 0.10, shadowRadius: 24, elevation: 12 },
    sheetTint: { backgroundColor: t.isDark ? 'rgba(24,25,27,0.72)' : 'rgba(255,255,255,0.66)' },
    handleArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
    handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: t.border },
    header: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 14 },
    savedIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: t.accentSoft },
    headerCopy: { flex: 1, minWidth: 0 },
    title: { fontSize: 19, lineHeight: 23, fontWeight: '900', fontFamily: Fonts.brand, color: t.text },
    subtitle: { marginTop: 2, fontSize: 12.5, lineHeight: 17, color: t.textSecondary },
    closeButton: { minWidth: 44, height: 44, paddingLeft: 8, alignItems: 'flex-end', justifyContent: 'center' },
    closeText: { fontSize: 14, fontWeight: '700', color: t.accent },
    sectionLabel: { marginBottom: 8, paddingLeft: 4, fontSize: 10.5, fontWeight: '700', letterSpacing: 1.4, color: t.textMute },
    list: { maxHeight: 310, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface },
    row: { minHeight: 60, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    listIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface },
    listIconSelected: { backgroundColor: t.accentSoft },
    rowCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
    rowTitle: { fontSize: 14.5, lineHeight: 18, fontWeight: '700', color: t.text },
    rowMeta: { marginTop: 2, fontSize: 11.5, lineHeight: 15, color: t.textSecondary },
    input: { flex: 1, height: 48, paddingVertical: 0, fontSize: 14.5, color: t.text },
    createButton: { minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    createText: { fontSize: 13.5, fontWeight: '700', color: t.accent },
    createTextDisabled: { opacity: 0.35 },
  });
}
