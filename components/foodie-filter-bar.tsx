import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { PatioCollection } from '@/lib/collections';
import { useTheme, type Theme } from '@/lib/theme';

const ROW = 34;
const SENSITIVITY = 2;
const STORAGE_KEY = 'patio:map-filter-order-v2';
const MAX = 10;
const BUILTINS = [{ key: 'today', label: 'Menú hoy' }, { key: 'open', label: 'Abiertos' }];
type Item = { key: string; label: string };

function EditableSlot({ item, active, editing, theme, s, onPress, onEdit, onRemove, onMove }: {
  item: Item; active: boolean; editing: boolean; theme: Theme; s: ReturnType<typeof styles>;
  onPress: () => void; onEdit: () => void; onRemove: () => void; onMove: (direction: -1 | 1) => void;
}) {
  const x = useRef(new Animated.Value(0)).current;
  const editingRef = useRef(editing); editingRef.current = editing;
  const moveRef = useRef(onMove); moveRef.current = onMove;
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_event, gesture) => editingRef.current && Math.abs(gesture.dx) > 5 && Math.abs(gesture.dx) > Math.abs(gesture.dy),
    onPanResponderMove: (_event, gesture) => x.setValue(gesture.dx * 0.62),
    onPanResponderRelease: (_event, gesture) => {
      if (Math.abs(gesture.dx) > 34) { moveRef.current(gesture.dx < 0 ? 1 : -1); Haptics.selectionAsync(); }
      Animated.spring(x, { toValue: 0, stiffness: 320, damping: 26, useNativeDriver: true }).start();
    },
    onPanResponderTerminate: () => Animated.spring(x, { toValue: 0, useNativeDriver: true }).start(),
  })).current;
  return <Animated.View {...pan.panHandlers} style={[s.hit, { transform: [{ translateX: x }] }]}>
    <TouchableOpacity delayLongPress={420} onLongPress={onEdit} onPress={() => { if (!editing) onPress(); }} style={[s.pill, { backgroundColor: active ? theme.text : theme.glass, borderColor: active ? theme.text : theme.border }]}>
      {!active && <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />}
      <Text style={[s.pillText, { color: active ? theme.bg : theme.text }]}>{item.label}</Text>
    </TouchableOpacity>
    {editing && <TouchableOpacity accessibilityLabel={`Quitar ${item.label}`} onPress={onRemove} style={s.remove}><Ionicons name="remove-circle" size={20} color={theme.text} /></TouchableOpacity>}
  </Animated.View>;
}

function defaults(collections: PatioCollection[]) {
  return [...BUILTINS, ...collections.map((item) => ({ key: `collection:${item.id}`, label: item.title }))].slice(0, MAX);
}

function styles(t: Theme) {
  const border = t.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  const shadow = t.isDark ? 0.24 : 0.10;
  return StyleSheet.create({
    root: { height: 44, position: 'relative' },
    scroll: { flex: 1 }, content: { gap: 7, paddingLeft: 16, paddingRight: 84 }, hit: { minHeight: 44, justifyContent: 'center' },
    pill: { height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
    pillText: { fontSize: 12.5, fontWeight: '600' },
    dock: { position: 'absolute', right: 0, top: 0, zIndex: 5, width: 60, height: 44, paddingRight: 16, alignItems: 'flex-end', justifyContent: 'center' },
    listButton: { width: 34, paddingHorizontal: 0, alignItems: 'center' }, doneDock: { width: 74 }, done: { minWidth: 58, alignItems: 'center' },
    wheel: { position: 'absolute', left: 16, right: 84, top: 5, height: ROW, borderRadius: 17, overflow: 'hidden', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: shadow, shadowRadius: 22, elevation: 4 },
    wheelRow: { height: ROW, position: 'absolute', left: 0, right: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 }, wheelText: { fontSize: 15, fontWeight: '600', color: t.text },
    remove: { position: 'absolute', right: -7, top: -4, width: 24, height: 24, zIndex: 6, alignItems: 'center', justifyContent: 'center' },
    add: { flexDirection: 'row', alignItems: 'center', gap: 5, borderStyle: 'dashed' },
    panel: { position: 'absolute', left: 16, right: 16, top: 48, maxHeight: 320, zIndex: 10, borderRadius: 18, overflow: 'hidden', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: border, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: shadow, shadowRadius: 22, elevation: 8 },
    panelHeader: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.border },
    panelTitle: { fontSize: 14, fontWeight: '700', color: t.text }, option: { minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }, optionText: { flex: 1, fontSize: 14.5, fontWeight: '500', color: t.text },
  });
}

export function FoodieFilterBar({ value, onChange, collections, categories }: { value: string; onChange: (value: string) => void; collections: PatioCollection[]; categories: string[] }) {
  const { theme } = useTheme();
  const s = useMemo(() => styles(theme), [theme]);
  const [slots, setSlots] = useState<Item[]>([]);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    loaded.current = false;
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      const available = defaults(collections);
      try {
        const parsed = raw ? JSON.parse(raw) as Item[] : [];
        const valid = parsed.filter((item) => available.some((option) => option.key === item.key));
        const used = new Set(valid.map((item) => item.key));
        setSlots([...valid, ...available.filter((item) => !used.has(item.key))].slice(0, MAX));
      } catch { setSlots(available); }
      loaded.current = true;
    }).catch(() => { setSlots(defaults(collections)); loaded.current = true; });
  }, [collections]);
  useEffect(() => { if (loaded.current) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(slots)).catch(() => {}); }, [slots]);

  const categoryItems = useMemo(() => [{ key: 'all', label: 'Todos' }, ...categories.map((label) => ({ key: label, label }))], [categories]);
  const listItems = useMemo(() => collections.map((item) => ({ key: `collection:${item.id}`, label: item.title })), [collections]);
  const categoryRef = useRef(categoryItems); categoryRef.current = categoryItems;
  const listRef = useRef(listItems); listRef.current = listItems;
  const valueRef = useRef(value); valueRef.current = value;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const itemsRef = useRef<Item[]>([]);
  const [wheelItems, setWheelItems] = useState<Item[]>([]);
  const [wheelMode, setWheelMode] = useState<'categories' | 'lists'>('categories');
  const [wheelOpen, setWheelOpen] = useState(false);
  const openAnim = useRef(new Animated.Value(0)).current;
  const offset = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const opened = useRef(false); const origin = useRef(0); const current = useRef(0);
  useEffect(() => Animated.timing(openAnim, { toValue: wheelOpen ? 1 : 0, duration: 180, useNativeDriver: true }).start(), [openAnim, wheelOpen]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const begin = (mode: 'categories' | 'lists') => {
    const items = mode === 'categories' ? categoryRef.current : listRef.current;
    if (!items.length) return;
    itemsRef.current = items; setWheelItems(items); setWheelMode(mode);
    const index = Math.max(0, items.findIndex((item) => item.key === valueRef.current));
    origin.current = index; current.current = index; offset.setValue(index * ROW); opened.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setWheelOpen(true);
  };
  const makePan = (mode: 'categories' | 'lists') => PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: () => { opened.current = false; if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => begin(mode), 320); },
    onPanResponderMove: (_event, gesture) => {
      if (!opened.current) { if (Math.abs(gesture.dy) > 8 || Math.abs(gesture.dx) > 8) { if (timer.current) clearTimeout(timer.current); } return; }
      const y = origin.current * ROW + gesture.dy * SENSITIVITY; offset.setValue(y);
      const next = ((Math.round(y / ROW) % itemsRef.current.length) + itemsRef.current.length) % itemsRef.current.length;
      if (next !== current.current) { current.current = next; Haptics.selectionAsync(); }
    },
    onPanResponderRelease: () => {
      if (timer.current) clearTimeout(timer.current);
      if (opened.current) { const item = itemsRef.current[current.current]; if (item) onChangeRef.current(item.key); Haptics.selectionAsync(); }
      else if (mode === 'categories') onChangeRef.current('all');
      opened.current = false; setWheelOpen(false);
    },
    onPanResponderTerminate: () => { if (opened.current) { const item = itemsRef.current[current.current]; if (item) onChangeRef.current(item.key); } opened.current = false; setWheelOpen(false); },
  });
  const categoryPan = useRef(makePan('categories')).current;
  const listPan = useRef(makePan('lists')).current;
  const available = [...BUILTINS, ...collections.map((item) => ({ key: `collection:${item.id}`, label: item.title }))].filter((option) => !slots.some((slot) => slot.key === option.key));

  return <View style={s.root}>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.scroll} contentContainerStyle={s.content} pointerEvents={wheelOpen && wheelMode === 'lists' ? 'none' : 'auto'}>
      <View {...categoryPan.panHandlers} style={s.hit} accessibilityLabel="Categorías de lugares" accessibilityHint="Toca para ver todos; mantén presionado y desliza para elegir una categoría">
        <View style={[s.pill, { backgroundColor: wheelOpen && wheelMode === 'categories' || value === 'all' ? theme.text : theme.glass, borderColor: wheelOpen && wheelMode === 'categories' || value === 'all' ? theme.text : theme.border }]}>
          {value !== 'all' && !(wheelOpen && wheelMode === 'categories') && <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />}
          <Text style={[s.pillText, { color: wheelOpen && wheelMode === 'categories' || value === 'all' ? theme.bg : theme.text }]}>Todos</Text>
        </View>
      </View>
      {slots.map((slot, index) => <EditableSlot key={slot.key} item={slot} active={value === slot.key} editing={editing} theme={theme} s={s}
        onPress={() => { Haptics.selectionAsync(); onChange(slot.key); }}
        onEdit={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setEditing(true); setAdding(false); }}
        onRemove={() => { Haptics.selectionAsync(); setSlots((items) => items.filter((item) => item.key !== slot.key)); if (value === slot.key) onChange('all'); }}
        onMove={(direction) => setSlots((items) => { const from = items.findIndex((item) => item.key === slot.key); const to = Math.max(0, Math.min(items.length - 1, from + direction)); if (from === to) return items; const next = [...items]; const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next; })}
      />)}
      {editing && slots.length < MAX && <View style={s.hit}><TouchableOpacity onPress={() => setAdding(true)} style={[s.pill, s.add, { backgroundColor: theme.glass, borderColor: theme.border }]}><Ionicons name="add" size={15} color={theme.text} /><Text style={[s.pillText, { color: theme.text }]}>Añadir</Text></TouchableOpacity></View>}
    </ScrollView>
    {editing ? <TouchableOpacity onPress={() => { setEditing(false); setAdding(false); Haptics.selectionAsync(); }} style={[s.dock, s.doneDock]} accessibilityLabel="Terminar de editar"><View style={[s.pill, s.done, { backgroundColor: theme.text, borderColor: theme.text }]}><Text style={[s.pillText, { color: theme.bg }]}>Listo</Text></View></TouchableOpacity> :
      <View {...listPan.panHandlers} style={s.dock} accessibilityLabel="Listas guardadas"><View style={[s.pill, s.listButton, { backgroundColor: value.startsWith('collection:') ? theme.text : theme.glass, borderColor: value.startsWith('collection:') ? theme.text : theme.border }]}>{!value.startsWith('collection:') && <BlurView intensity={30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />}<Ionicons name="list-outline" size={16} color={value.startsWith('collection:') ? theme.bg : theme.text} /></View></View>}
    {wheelOpen && <Animated.View pointerEvents="none" style={[s.wheel, { opacity: openAnim, transform: [{ translateY: openAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] }]}>{wheelItems.flatMap((item, index) => [-1, 0, 1].map((cycle) => {
      const virtual = index + cycle * wheelItems.length;
      const range = [(virtual - 2) * ROW, (virtual - 1) * ROW, virtual * ROW, (virtual + 1) * ROW, (virtual + 2) * ROW];
      return <Animated.View key={`${item.key}-${cycle}`} style={[s.wheelRow, { transform: [{ translateY: Animated.subtract(virtual * ROW, offset) }] }]}><Animated.Text numberOfLines={1} style={[s.wheelText, { opacity: offset.interpolate({ inputRange: range, outputRange: [0.25, 0.55, 1, 0.55, 0.25], extrapolate: 'clamp' }), transform: [{ scale: offset.interpolate({ inputRange: range, outputRange: [0.84, 0.92, 1, 0.92, 0.84], extrapolate: 'clamp' }) }] }]}>{item.label}</Animated.Text></Animated.View>;
    }))}</Animated.View>}
    {adding && <View style={s.panel}><View style={s.panelHeader}><Text style={s.panelTitle}>Añadir acceso</Text><TouchableOpacity onPress={() => setAdding(false)}><Ionicons name="close" size={20} color={theme.textSecondary} /></TouchableOpacity></View><ScrollView>{available.map((option, index) => <TouchableOpacity key={option.key} onPress={() => { Haptics.selectionAsync(); setSlots((items) => [...items, option].slice(0, MAX)); setAdding(false); }} style={[s.option, index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}><Ionicons name={option.key.startsWith('collection:') ? 'bookmark' : 'pricetag-outline'} size={16} color={theme.textSecondary} /><Text style={s.optionText}>{option.label}</Text><Ionicons name="add-circle-outline" size={19} color={theme.text} /></TouchableOpacity>)}</ScrollView></View>}
  </View>;
}
