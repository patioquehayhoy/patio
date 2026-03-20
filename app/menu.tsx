import { Stack, useFocusEffect } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  UIManager,
  View,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { BottomTabBar } from '@/components/bottom-tab-bar';
import {
  type MenuData,
  setMenuData as saveMenuData,
  getMenuData,
  setCartaData as saveCartaData,
  getCartaData,
  getFonditaName,
  setFonditaName,
  getFonditaDescription,
  setFonditaDescription,
  getFonditaDireccion,
  setFonditaDireccion,
  getFonditaDireccionVisible,
  setFonditaDireccionVisible,
} from '@/lib/menu-store';
import { loadMenuHoy, saveMenuHoy, deleteMenuHoy, loadCarta, saveCarta, deleteCarta, upsertFondita } from '@/lib/db';
import { getFonditaId, setFonditaId } from '@/lib/user-store';
import { supabase } from '@/lib/supabase';
import { useTheme, type Theme } from '@/lib/theme';

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_PRIMER_TIEMPO = 7;
const MAX_SEGUNDO_TIEMPO = 7;
const MAX_TERCER_TIEMPO = 7;
const MAX_POSTRE = 7;
const MAX_AGUAS = 7;
const ANIM_DURATION = 200;
const ORD_PARTS: [string, string][] = [['1', 'er'], ['2', 'do'], ['3', 'er']];


const EMPTY_MENU: MenuData = {
  primerTiempo: { enabled: true, items: [''] },
  segundoTiempo: { enabled: true, items: [''] },
  tercerTiempoGuisado: { enabled: true, items: [''] },
  postre: { enabled: false, items: [''] },
  aguas: { enabled: true, items: [''] },
  precio: { enabled: true, value: '' },
};

// ─── makeStyles ───────────────────────────────────────────────────────────────
function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:            { flex: 1, backgroundColor: t.bg },
    keyboardView:         { flex: 1 },
    formHalf:             { flex: 1 },
    formScroll:           { flex: 1 },
    formContent:          { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 8 },
    // Header
    headerTitleContainer: { flex: 1 },
    headerName:           { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: -0.5, lineHeight: 32, marginBottom: 2 },
    headerDesc:           { fontSize: 14, fontWeight: '300', color: t.gray, lineHeight: 20, marginBottom: 2 },
    headerDireccion:      { fontSize: 12, fontWeight: '300', color: t.gray, lineHeight: 17, opacity: 0.5, marginBottom: 6 },
    tabRow:               { alignItems: 'center', paddingTop: 12, paddingBottom: 4, backgroundColor: t.bg },
    // Section
    section:              { marginBottom: 24 },
    sectionHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    sectionDivider:       { height: 0.5, backgroundColor: 'rgba(255,94,0,0.3)', marginBottom: 12 },
    secLabel:             { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: t.orange, textTransform: 'uppercase' },
    // Items
    itemRow:              { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    input:                { flex: 1, fontSize: 16, color: t.text, fontWeight: '800', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep, paddingVertical: 6, paddingHorizontal: 0, backgroundColor: 'transparent' },
    removeBtn:            { width: 28, alignItems: 'center', paddingLeft: 4 },
    removeBtnText:        { fontSize: 13, color: t.gray },
    addBtn:               { paddingVertical: 4 },
    addBtnText:           { fontSize: 14, color: t.orange, fontWeight: '500' },
    slashSep:             { fontSize: 15, color: t.gray, paddingHorizontal: 4 },
    descInput:            { fontSize: 15, fontWeight: '300', color: t.gray, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep, paddingVertical: 6, paddingHorizontal: 0, backgroundColor: 'transparent', alignSelf: 'center' },
    chipsScroll:          { marginBottom: 8 },
    chipsContent:         { flexDirection: 'row', gap: 6, paddingRight: 4 },
    chip:                 { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: t.orange, backgroundColor: 'transparent' },
    chipText:             { fontSize: 11, color: t.orange, fontWeight: '500' },
    // Precio
    precioPrefix:         { fontSize: 26, color: t.orange, marginRight: 4, fontWeight: '900' },
    // Preview separator
    previewDividerRow:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10 },
    previewDividerLine:   { flex: 1, height: 0.5, backgroundColor: t.orange, opacity: 0.5 },
    previewDividerLabel:  { fontSize: 9, fontWeight: '900', letterSpacing: 2, color: t.orange, textTransform: 'uppercase', opacity: 0.5, marginHorizontal: 10 },
    // Preview
    previewContainer:     { flex: 1, minHeight: 180, backgroundColor: t.bg, paddingHorizontal: 16, paddingBottom: 14 },
    previewHeader:        { fontSize: 10, fontWeight: '900', letterSpacing: 2, color: t.gray, textTransform: 'uppercase', marginBottom: 10 },
    previewScroll:        { flex: 1 },
    previewScrollContent: { paddingBottom: 8 },
    previewEmpty:         { fontSize: 14, color: t.gray, fontStyle: 'italic' },
    previewContent:       { gap: 2 },
    previewTitleRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    previewTitle:         { fontSize: 11, fontWeight: '700', letterSpacing: 1.4, color: t.orange, textTransform: 'uppercase' },
    previewTitleDelete:   { fontSize: 10, fontWeight: '300', color: t.orange, opacity: 0.4 },
    previewSec:           { marginBottom: 0 },
    previewLabel:         { fontSize: 11, fontWeight: '700', letterSpacing: 1.0, color: t.text, textTransform: 'uppercase', marginTop: 16, marginBottom: 6, opacity: 0.5 },
    previewItem:          { fontSize: 16, fontWeight: '800', color: t.text, marginLeft: 4, marginBottom: 8 },
    previewItemDesc:      { fontSize: 15, fontWeight: '300', color: t.gray, lineHeight: 21 },
    previewPrice:         { fontSize: 26, fontWeight: '900', color: t.orange, marginTop: 12, marginBottom: 4 },
  });
}

// ─── SegmentedControl ─────────────────────────────────────────────────────────
function SegmentedControl({ value, onChange }: { value: 'menu' | 'carta'; onChange: (v: 'menu' | 'carta') => void }) {
  const { theme } = useTheme();
  return (
    <View style={[seg.container, { backgroundColor: theme.surface2 }]}>
      <TouchableOpacity
        style={[seg.btn, value === 'menu' && { backgroundColor: theme.orange }]}
        onPress={() => onChange('menu')}>
        <Text style={[seg.label, { color: value === 'menu' ? '#FFF7E0' : theme.gray }]}>Menú</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[seg.btn, value === 'carta' && { backgroundColor: theme.orange }]}
        onPress={() => onChange('carta')}>
        <Text style={[seg.label, { color: value === 'carta' ? '#FFF7E0' : theme.gray }]}>Carta</Text>
      </TouchableOpacity>
    </View>
  );
}

const seg = StyleSheet.create({
  container: { flexDirection: 'row', height: 30, borderRadius: 100, padding: 2, gap: 2 },
  btn:       { alignItems: 'center', justifyContent: 'center', borderRadius: 100, paddingHorizontal: 14 },
  label:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
  }, [value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,94,0,0.2)', '#FF5E00'] });
  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.85}>
      <Animated.View style={[tog.track, { backgroundColor: trackColor }]}>
        <Animated.View style={[tog.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const tog = StyleSheet.create({
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFF7E0' },
});

// ─── OrdTitle ─────────────────────────────────────────────────────────────────
function OrdTitle({ idx, rest }: { idx: 0 | 1 | 2; rest: string }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [n, sf] = ORD_PARTS[idx];
  return <Text style={s.secLabel}>{n}{sf.toUpperCase()} {rest.toUpperCase()}</Text>;
}

// ─── DescInput ────────────────────────────────────────────────────────────────
function DescInput({
  value, onChange, selectionColor, inputRef, onSubmitEditing, returnKeyType = 'next',
}: {
  value: string;
  onChange: (v: string) => void;
  selectionColor: string;
  inputRef?: (ref: TextInput | null) => void;
  onSubmitEditing?: () => void;
  returnKeyType?: 'next' | 'done';
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  return (
    <TextInput
      ref={inputRef}
      style={[s.descInput, { flex: 1.2 }]}
      placeholder="Descripción"
      placeholderTextColor="rgba(255,94,0,0.2)"
      value={value}
      autoCapitalize="none"
      onChangeText={onChange}
      selectionColor={selectionColor}
      maxLength={80}
      returnKeyType={returnKeyType}
      onSubmitEditing={onSubmitEditing}
    />
  );
}

// ─── DynamicSection ───────────────────────────────────────────────────────────
function DynamicSection({
  title, enabled, onToggle, items, maxItems, onAdd, onRemove, onChange, placeholder,
  showToggle = true, dimOnly = false, suggestions, suggestionDescs,
}: {
  title: React.ReactNode;
  enabled: boolean;
  onToggle: (value: boolean) => void;
  items: string[];
  maxItems: number;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
  placeholder: string;
  showToggle?: boolean;
  dimOnly?: boolean;
  suggestions?: string[];
  suggestionDescs?: Record<string, string>;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const opacity = useRef(new Animated.Value(dimOnly ? 1 : (enabled ? 1 : 0))).current;
  const [showContent, setShowContent] = useState(dimOnly || enabled);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nameRefs = useRef<Array<TextInput | null>>([]);
  const descRefs = useRef<Array<TextInput | null>>([]);

  useEffect(() => {
    if (dimOnly) {
      Animated.timing(opacity, { toValue: enabled ? 1 : 0.5, duration: ANIM_DURATION, useNativeDriver: true }).start();
      return;
    }
    if (enabled) {
      setShowContent(true);
      Animated.timing(opacity, { toValue: 1, duration: ANIM_DURATION, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: ANIM_DURATION, useNativeDriver: true }).start(() => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowContent(false);
      });
    }
  }, [enabled]);

  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        {title}
        {showToggle && <ToggleSwitch value={enabled} onValueChange={onToggle} />}
      </View>
      <View style={s.sectionDivider} />
      {showContent && (
        <Animated.View style={{ opacity }}>
          {items.map((item, index) => {
            const slashIdx = item.indexOf(' / ');
            const namePart = slashIdx !== -1 ? item.slice(0, slashIdx) : item;
            const descPart = slashIdx !== -1 ? item.slice(slashIdx + 3) : '';

            const otherNames = items
              .filter((_, i) => i !== index)
              .map(it => { const si = it.indexOf(' / '); return (si !== -1 ? it.slice(0, si) : it).toLowerCase(); });
            const filtered = suggestions
              ? (namePart ? suggestions.filter(sg => sg.toLowerCase().includes(namePart.toLowerCase())) : suggestions)
                  .filter(sg => !otherNames.includes(sg.toLowerCase()))
              : [];
            const showChips = suggestions && focusedIndex === index && filtered.length > 0;

            return (
              <View key={index}>
                <View style={s.itemRow}>
                  <TextInput
                    ref={(el) => { nameRefs.current[index] = el; }}
                    style={s.input}
                    placeholder={placeholder}
                    placeholderTextColor="rgba(255,94,0,0.2)"
                    value={namePart}
                    autoCapitalize="none"
                    onChangeText={(v) => {
                      onChange(index, v + (descPart ? ' / ' + descPart : ''));
                      if (blurTimer.current) clearTimeout(blurTimer.current);
                      setFocusedIndex(index);
                    }}
                    onFocus={() => {
                      if (blurTimer.current) clearTimeout(blurTimer.current);
                      setFocusedIndex(index);
                    }}
                    onBlur={() => {
                      blurTimer.current = setTimeout(() => setFocusedIndex(null), 200);
                    }}
                    autoCapitalize="none"
                    selectionColor={theme.orange}
                    maxLength={40}
                    returnKeyType="next"
                    onSubmitEditing={() => descRefs.current[index]?.focus()}
                  />
                  <Text style={s.slashSep}>/</Text>
                  <DescInput
                    value={descPart}
                    onChange={(v) => onChange(index, namePart + (v ? ' / ' + v : ''))}
                    selectionColor={theme.orange}
                    inputRef={(el) => { descRefs.current[index] = el; }}
                    returnKeyType={index === items.length - 1 ? 'done' : 'next'}
                    onSubmitEditing={index === items.length - 1 ? undefined : () => nameRefs.current[index + 1]?.focus()}
                  />
                  {items.length > 1 && (
                    <TouchableOpacity style={s.removeBtn} onPress={() => onRemove(index)}>
                      <Text style={s.removeBtnText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {showChips && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                    style={s.chipsScroll}
                    contentContainerStyle={s.chipsContent}
                  >
                    {filtered.map(chip => (
                      <TouchableOpacity
                        key={chip}
                        style={s.chip}
                        onPress={() => {
                          if (blurTimer.current) clearTimeout(blurTimer.current);
                          const chipDesc = suggestionDescs?.[chip] ?? '';
                          onChange(index, chipDesc ? chip + ' / ' + chipDesc : chip);
                          setFocusedIndex(null);
                        }}
                      >
                        <Text style={s.chipText}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })}
          {items.length < maxItems && (
            <TouchableOpacity style={s.addBtn} onPress={onAdd}>
              <Text style={s.addBtnText}>+</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// ─── PrecioSection ────────────────────────────────────────────────────────────
function PrecioSection({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const [focused, setFocused] = useState(false);
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.secLabel}>PRECIO</Text>
      </View>
      <View style={s.sectionDivider} />
      <View style={s.itemRow}>
        <Text style={[s.precioPrefix, { color: theme.orange }]}>$</Text>
        <TextInput
          style={[s.input, { flex: 1, fontSize: 26, fontWeight: '900', color: theme.orange }]}
          placeholder="47"
          placeholderTextColor="rgba(255,94,0,0.2)"
          value={value}
          onChangeText={onChange}
          keyboardType="number-pad"
          autoCapitalize="none"
          selectionColor={theme.orange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
    </View>
  );
}

// ─── MenuPreview ──────────────────────────────────────────────────────────────
function MenuPreview({ data, title, onDelete }: { data: MenuData; title: string; onDelete?: () => void }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const hasContent =
    (data.primerTiempo.enabled && data.primerTiempo.items.some(Boolean)) ||
    (data.segundoTiempo.enabled && data.segundoTiempo.items.some(Boolean)) ||
    (data.tercerTiempoGuisado.enabled && data.tercerTiempoGuisado.items.some(Boolean)) ||
    (data.postre.enabled && data.postre.items.some(Boolean)) ||
    (data.aguas.enabled && data.aguas.items.some(Boolean)) ||
    (data.precio.enabled && data.precio.value.trim());

  if (!hasContent) return <Text style={s.previewEmpty}>El menú se mostrará aquí mientras escribes…</Text>;

  const p = data.primerTiempo.enabled ? 1 : 0;
  const sv = data.segundoTiempo.enabled ? 1 : 0;
  const primerLabel  = `${ORD_PARTS[0][0]}${ORD_PARTS[0][1]} Tiempo`;
  const segundoLabel = `${ORD_PARTS[p][0]}${ORD_PARTS[p][1]} Tiempo`;
  const tercerLabel  = `${ORD_PARTS[p + sv][0]}${ORD_PARTS[p + sv][1]} Tiempo`;

  const ri = (item: string, i: number) => {
    const si = item.indexOf(' / ');
    if (si === -1) return <Text key={i} style={s.previewItem}>• {item}</Text>;
    return (
      <Text key={i} style={s.previewItem}>
        {'• ' + item.slice(0, si)}<Text style={s.previewItemDesc}>{' / ' + item.slice(si + 3)}</Text>
      </Text>
    );
  };

  return (
    <View style={s.previewContent}>
      <View style={s.previewTitleRow}>
        <Text style={s.previewTitle}>{title}</Text>
        {onDelete && (
          <TouchableOpacity onPress={onDelete}>
            <Text style={s.previewTitleDelete}>Borrar</Text>
          </TouchableOpacity>
        )}
      </View>
      {data.primerTiempo.enabled && data.primerTiempo.items.some(Boolean) && (
        <View style={s.previewSec}>
          <Text style={s.previewLabel}>{primerLabel}</Text>
          {data.primerTiempo.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.segundoTiempo.enabled && data.segundoTiempo.items.some(Boolean) && (
        <View style={s.previewSec}>
          <Text style={s.previewLabel}>{segundoLabel}</Text>
          {data.segundoTiempo.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.tercerTiempoGuisado.enabled && data.tercerTiempoGuisado.items.some(Boolean) && (
        <View style={s.previewSec}>
          <Text style={s.previewLabel}>{tercerLabel}</Text>
          {data.tercerTiempoGuisado.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.aguas.enabled && data.aguas.items.some(Boolean) && (
        <View style={s.previewSec}>
          <Text style={s.previewLabel}>Bebidas</Text>
          {data.aguas.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.postre.enabled && data.postre.items.some(Boolean) && (
        <View style={s.previewSec}>
          <Text style={s.previewLabel}>Postre</Text>
          {data.postre.items.filter(Boolean).map(ri)}
        </View>
      )}
      {data.precio.enabled && data.precio.value.trim() && (
        <Text style={s.previewPrice}>${data.precio.value}</Text>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
type SectionKey = 'primerTiempo' | 'segundoTiempo' | 'tercerTiempoGuisado' | 'postre' | 'aguas';


export default function MenuScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [activeTab, setActiveTab] = useState<'carta' | 'menu'>('menu');
  const [menuData, setMenuData] = useState<MenuData>(() => getMenuData() ?? { ...EMPTY_MENU });
  const [cartaData, setCartaData] = useState<MenuData>(() => getCartaData() ?? { ...EMPTY_MENU });
  const menuSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartaSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fonditaName, setFonditaNameState] = useState(getFonditaName());
  const [fonditaDesc, setFonditaDescState] = useState(getFonditaDescription());
  const [fonditaDireccion, setFonditaDireccionState] = useState(getFonditaDireccion());
  const [fonditaDireccionVisible, setFonditaDireccionVisibleState] = useState(getFonditaDireccionVisible());

  useFocusEffect(useCallback(() => {
    setFonditaNameState(getFonditaName());
    setFonditaDescState(getFonditaDescription());
    setFonditaDireccionState(getFonditaDireccion());
    setFonditaDireccionVisibleState(getFonditaDireccionVisible());
  }, []));

  useEffect(() => {
    const init = async () => {
      let fonditaId = getFonditaId();
      if (!fonditaId) {
        const { data: { session } } = await supabase.auth.getSession();
        const email = session?.user?.email;
        if (!email) return;
        const id = await upsertFondita(email);
        if (!id) return;
        setFonditaId(id);
        fonditaId = id;
      }
      const [menuFromDb, cartaFromDb] = await Promise.all([loadMenuHoy(fonditaId), loadCarta(fonditaId)]);
      if (menuFromDb) { setMenuData(menuFromDb); saveMenuData(menuFromDb); }
      if (cartaFromDb) { setCartaData(cartaFromDb); saveCartaData(cartaFromDb); }
      const { data: fondita } = await supabase.from('fonditas').select('nombre, descripcion, direccion, direccion_visible').eq('id', fonditaId).maybeSingle();
      if (fondita?.nombre) { setFonditaName(fondita.nombre); setFonditaNameState(fondita.nombre); }
      if (fondita?.descripcion != null) { setFonditaDescription(fondita.descripcion); setFonditaDescState(fondita.descripcion); }
      if (fondita?.direccion != null) { setFonditaDireccion(fondita.direccion); setFonditaDireccionState(fondita.direccion); }
      if (fondita?.direccion_visible != null) { setFonditaDireccionVisible(fondita.direccion_visible); setFonditaDireccionVisibleState(fondita.direccion_visible); }
    };
    init();
  }, []);

  useEffect(() => {
    saveMenuData(menuData);
    const fonditaId = getFonditaId();
    if (!fonditaId) return;
    if (menuSaveTimer.current) clearTimeout(menuSaveTimer.current);
    menuSaveTimer.current = setTimeout(() => saveMenuHoy(fonditaId, menuData), 1500);
    return () => { if (menuSaveTimer.current) clearTimeout(menuSaveTimer.current); };
  }, [menuData]);

  useEffect(() => {
    saveCartaData(cartaData);
    const fonditaId = getFonditaId();
    if (!fonditaId) return;
    if (cartaSaveTimer.current) clearTimeout(cartaSaveTimer.current);
    cartaSaveTimer.current = setTimeout(() => saveCarta(fonditaId, cartaData), 1500);
    return () => { if (cartaSaveTimer.current) clearTimeout(cartaSaveTimer.current); };
  }, [cartaData]);

  const activeData = activeTab === 'carta' ? cartaData : menuData;
  const setActiveData = activeTab === 'carta' ? setCartaData : setMenuData;
  const previewTitle = activeTab === 'carta' ? 'Carta' : 'Menú del día';

  const updateSection = (section: SectionKey, index: number, value: string) => {
    setActiveData((prev) => {
      const newItems = [...prev[section].items];
      newItems[index] = value;
      return { ...prev, [section]: { ...prev[section], items: newItems } };
    });
  };

  const addItem = (section: SectionKey) => {
    setActiveData((prev) => ({ ...prev, [section]: { ...prev[section], items: [...prev[section].items, ''] } }));
  };

  const removeItem = (section: SectionKey, index: number) => {
    setActiveData((prev) => ({ ...prev, [section]: { ...prev[section], items: prev[section].items.filter((_, i) => i !== index) } }));
  };

  const extractName = (it: string) => { const si = it.indexOf(' / '); return si !== -1 ? it.slice(0, si) : it; };
  const extractDesc = (it: string) => { const si = it.indexOf(' / '); return si !== -1 ? it.slice(si + 3) : ''; };
  const buildDescMap = (items: string[]) => Object.fromEntries(
    items.filter(Boolean).map(it => [extractName(it), extractDesc(it)]).filter(([n]) => n)
  );
  const menuSuggs = activeTab === 'carta' ? {
    primerTiempo:        menuData.primerTiempo.items.filter(Boolean).map(extractName).filter(Boolean),
    segundoTiempo:       menuData.segundoTiempo.items.filter(Boolean).map(extractName).filter(Boolean),
    tercerTiempoGuisado: menuData.tercerTiempoGuisado.items.filter(Boolean).map(extractName).filter(Boolean),
    postre:              menuData.postre.items.filter(Boolean).map(extractName).filter(Boolean),
    aguas:               menuData.aguas.items.filter(Boolean).map(extractName).filter(Boolean),
  } : null;
  const menuDescMaps = activeTab === 'carta' ? {
    primerTiempo:        buildDescMap(menuData.primerTiempo.items),
    segundoTiempo:       buildDescMap(menuData.segundoTiempo.items),
    tercerTiempoGuisado: buildDescMap(menuData.tercerTiempoGuisado.items),
    postre:              buildDescMap(menuData.postre.items),
    aguas:               buildDescMap(menuData.aguas.items),
  } : null;

  const handleBorrarMenu = () => {
    Alert.alert('¿Borrar menú de hoy?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
        const empty: MenuData = JSON.parse(JSON.stringify(EMPTY_MENU));
        setMenuData(empty);
        saveMenuData(empty);
        const fonditaId = getFonditaId();
        if (fonditaId) await deleteMenuHoy(fonditaId);
      }},
    ]);
  };

  const handleBorrarCarta = () => {
    Alert.alert('¿Borrar la carta de hoy?', undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: async () => {
        const empty: MenuData = JSON.parse(JSON.stringify(EMPTY_MENU));
        setCartaData(empty);
        saveCartaData(empty);
        const fonditaId = getFonditaId();
        if (fonditaId) await deleteCarta(fonditaId);
      }},
    ]);
  };

  const toggleSection = (section: keyof MenuData, value: boolean) => {
    setActiveData((prev) => {
      if (section === 'precio') return { ...prev, precio: { ...prev.precio, enabled: value } };
      return { ...prev, [section]: { ...prev[section], enabled: value } };
    });
  };

  return (
    <View style={s.container}>
      <Stack.Screen
        options={({
          headerStyle: { backgroundColor: theme.bg },
          headerShadowVisible: false,
          headerTintColor: theme.text,
          headerBackVisible: false,
          headerTitleAlign: 'left',
          headerTitleContainerStyle: { left: 0, right: 0 },
          headerTitle: () => (
            <View style={s.headerTitleContainer}>
              <Text style={s.headerName} numberOfLines={1}>{fonditaName}</Text>
              {!!fonditaDesc && <Text style={s.headerDesc} numberOfLines={1}>{fonditaDesc}</Text>}
              {!!fonditaDireccion && <Text style={s.headerDireccion} numberOfLines={1}>{fonditaDireccion}</Text>}
            </View>
          ),
          headerLeft: () => null,
          headerRight: () => null,
        }) as any}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.keyboardView}>
        <View style={s.tabRow}>
          <SegmentedControl value={activeTab} onChange={setActiveTab} />
        </View>
        <View style={s.formHalf}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={s.formScroll} contentContainerStyle={s.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <DynamicSection title={<OrdTitle idx={0} rest="Tiempo" />} enabled={activeData.primerTiempo.enabled} onToggle={(v) => toggleSection('primerTiempo', v)} items={activeData.primerTiempo.items} maxItems={MAX_PRIMER_TIEMPO} onAdd={() => addItem('primerTiempo')} onRemove={(i) => removeItem('primerTiempo', i)} onChange={(i, v) => updateSection('primerTiempo', i, v)} placeholder="Agregar" suggestions={menuSuggs?.primerTiempo} suggestionDescs={menuDescMaps?.primerTiempo} />
            <DynamicSection title={<OrdTitle idx={1} rest="Tiempo" />} enabled={activeData.segundoTiempo.enabled} onToggle={(v) => toggleSection('segundoTiempo', v)} items={activeData.segundoTiempo.items} maxItems={MAX_SEGUNDO_TIEMPO} onAdd={() => addItem('segundoTiempo')} onRemove={(i) => removeItem('segundoTiempo', i)} onChange={(i, v) => updateSection('segundoTiempo', i, v)} placeholder="Agregar" suggestions={menuSuggs?.segundoTiempo} suggestionDescs={menuDescMaps?.segundoTiempo} />
            <DynamicSection title={<OrdTitle idx={2} rest="Tiempo" />} enabled={activeData.tercerTiempoGuisado.enabled} onToggle={(v) => toggleSection('tercerTiempoGuisado', v)} items={activeData.tercerTiempoGuisado.items} maxItems={MAX_TERCER_TIEMPO} onAdd={() => addItem('tercerTiempoGuisado')} onRemove={(i) => removeItem('tercerTiempoGuisado', i)} onChange={(i, v) => updateSection('tercerTiempoGuisado', i, v)} placeholder="Agregar" suggestions={menuSuggs?.tercerTiempoGuisado} suggestionDescs={menuDescMaps?.tercerTiempoGuisado} />
            <DynamicSection title={<Text style={s.secLabel}>BEBIDAS</Text>} enabled={activeData.aguas.enabled} onToggle={(v) => toggleSection('aguas', v)} items={activeData.aguas.items} maxItems={MAX_AGUAS} onAdd={() => addItem('aguas')} onRemove={(i) => removeItem('aguas', i)} onChange={(i, v) => updateSection('aguas', i, v)} placeholder="Agregar" suggestions={menuSuggs?.aguas} suggestionDescs={menuDescMaps?.aguas} />
            <DynamicSection title={<Text style={s.secLabel}>POSTRE</Text>} enabled={activeData.postre.enabled} onToggle={(v) => toggleSection('postre', v)} items={activeData.postre.items} maxItems={MAX_POSTRE} onAdd={() => addItem('postre')} onRemove={(i) => removeItem('postre', i)} onChange={(i, v) => updateSection('postre', i, v)} placeholder="Agregar" suggestions={menuSuggs?.postre} suggestionDescs={menuDescMaps?.postre} />
            <PrecioSection value={activeData.precio.value} onChange={(v) => { const soloNumeros = v.replace(/[^0-9]/g, ''); setActiveData((prev) => ({ ...prev, precio: { ...prev.precio, value: soloNumeros } })); }} />
          </ScrollView>
          </TouchableWithoutFeedback>
        </View>

        <View style={s.previewDividerRow}>
          <View style={s.previewDividerLine} />
          <Text style={s.previewDividerLabel}>Vista previa</Text>
          <View style={s.previewDividerLine} />
        </View>
        <View style={s.previewContainer}>
          <ScrollView style={s.previewScroll} contentContainerStyle={s.previewScrollContent} showsVerticalScrollIndicator={false}>
            <MenuPreview data={activeData} title={previewTitle} onDelete={activeTab === 'menu' ? handleBorrarMenu : handleBorrarCarta} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <BottomTabBar />
    </View>
  );
}
