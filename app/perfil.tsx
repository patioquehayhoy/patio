import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { supabase } from '@/lib/supabase';
import { FONDITA_ID_KEY } from '@/lib/db';
import { getFonditaId, setFonditaId } from '@/lib/user-store';
import {
  getFonditaName, setFonditaName,
  getFonditaDescription, setFonditaDescription,
  getFonditaDireccion, setFonditaDireccion,
  getFonditaDireccionVisible, setFonditaDireccionVisible,
  getFonditaHorario, setFonditaHorario,
  getPagosEfectivo, setPagosEfectivo,
  getPagosTrans, setPagosTrans,
  getPagosTarjeta, setPagosTarjeta,
  getTipoNegocio, setTipoNegocio,
} from '@/lib/menu-store';
import { useTheme, type Theme } from '@/lib/theme';

const TIPOS_NEGOCIO: { key: string; label: string }[] = [
  { key: 'fondita',    label: 'Fondita' },
  { key: 'taqueria',   label: 'Taquería' },
  { key: 'reposteria', label: 'Repostería' },
  { key: 'mariscos',   label: 'Mariscos' },
  { key: 'otro',       label: 'Otro' },
];

// ─── Constants ────────────────────────────────────────────────────────────────
const MAX_NOMBRE      = 30;
const MAX_DESCRIPCION = 80;
const MAX_UBICACION   = 80;
const CATEGORY_ITEM_HEIGHT = 48;
const CATEGORY_WHEEL_HEIGHT = 144;

function defaultApertura(): Date {
  const d = new Date(); d.setHours(8, 0, 0, 0); return d;
}
function defaultCierre(): Date {
  const d = new Date(); d.setHours(16, 0, 0, 0); return d;
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
}

function parseTime(str: string): Date {
  const d = new Date();
  const ispm = str.endsWith('pm');
  const clean = str.replace(/[ap]m$/, '');
  const parts = clean.split(':');
  let h = parseInt(parts[0]);
  const m = parts[1] ? parseInt(parts[1]) : 0;
  if (ispm && h !== 12) h += 12;
  if (!ispm && h === 12) h = 0;
  d.setHours(h, m, 0, 0);
  return d;
}

function parseHorario(horario: string): { apertura: Date; cierre: Date } {
  // New format: "8am – 4pm"
  let dashIdx = horario.indexOf(' – ');
  if (dashIdx === -1) {
    // Old format with dias: "Lun–Vie · 8am – 4pm"
    const dotIdx = horario.indexOf(' · ');
    if (dotIdx !== -1) {
      const times = horario.slice(dotIdx + 3);
      dashIdx = times.indexOf(' – ');
      if (dashIdx !== -1) {
        return { apertura: parseTime(times.slice(0, dashIdx)), cierre: parseTime(times.slice(dashIdx + 3)) };
      }
    }
    return { apertura: defaultApertura(), cierre: defaultCierre() };
  }
  return { apertura: parseTime(horario.slice(0, dashIdx)), cierre: parseTime(horario.slice(dashIdx + 3)) };
}

function buildHorario(apertura: Date, cierre: Date): string {
  return `${formatTime(apertura)} – ${formatTime(cierre)}`;
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: t.bg },
    scroll:         { flex: 1 },
    scrollContent:  { paddingHorizontal: 24, paddingBottom: 64 },
    heroBlock:      { paddingTop: 20, paddingBottom: 8 },
    heroHeader:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    block:          { paddingTop: 32 },
    blockLabel:     { fontSize: 12, fontWeight: '900', color: t.text, letterSpacing: 1.6, marginBottom: 12 },
    saveInlineBtn:  { fontSize: 16, fontWeight: '900', color: t.accent, paddingTop: 2 },
    nombreInput:    { fontSize: 38, fontWeight: '900', color: t.text, letterSpacing: 0, lineHeight: 44, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent', marginBottom: 8 },
    fieldInput:     { fontWeight: '400', color: t.textSecondary, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    heroMeta:       { fontSize: 13, lineHeight: 18, color: t.textSecondary, opacity: 0.66 },
    heroCard:       { marginTop: 22, backgroundColor: t.surface, borderRadius: 28, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 20, paddingVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 14 }, shadowOpacity: t.isDark ? 0.16 : 0.06, shadowRadius: 24, elevation: 4 },
    row:            { flexDirection: 'row', alignItems: 'center', minHeight: 58 },
    rowLabel:       { flex: 1, fontSize: 17, fontWeight: '400', color: t.text },
    rowHint:        { fontSize: 13, lineHeight: 18, color: t.textSecondary, marginTop: 3 },
    emailText:      { flex: 1, fontSize: 16, fontWeight: '400', color: t.textSecondary },
    divider:        { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    pickerWrapper:  { backgroundColor: t.surface, borderRadius: 12, overflow: 'hidden' },
    categoryHeader: { marginBottom: 8 },
    categoryHint:   { fontSize: 13, lineHeight: 19, color: t.textSecondary, maxWidth: 250 },
    categoryWheelWrap: { marginTop: 12, alignItems: 'center' },
    categoryWheelSelection: { position: 'absolute', top: (CATEGORY_WHEEL_HEIGHT - CATEGORY_ITEM_HEIGHT) / 2, width: 216, height: CATEGORY_ITEM_HEIGHT, borderRadius: 16, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: t.isDark ? 0.16 : 0.05, shadowRadius: 18, elevation: 3 },
    categoryWheel:  { width: 240, height: CATEGORY_WHEEL_HEIGHT },
    categoryWheelContent: { alignItems: 'center', paddingVertical: (CATEGORY_WHEEL_HEIGHT - CATEGORY_ITEM_HEIGHT) / 2 },
    categoryWheelFrame: { height: CATEGORY_ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center' },
    categoryWheelText: { fontSize: 18, fontWeight: '900', color: t.textSecondary, opacity: 0.5 },
    categoryWheelTextActive: { color: t.text, fontSize: 21, opacity: 1 },
    categoryWheelMarker: { width: 28, height: 3, borderRadius: 2, backgroundColor: t.accent, marginTop: 4 },
    operationGroup: { marginTop: 2, backgroundColor: t.surface, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    operationRow:   { minHeight: 62, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
    operationText:  { flex: 1, paddingRight: 12 },
    operationTitle: { fontSize: 17, fontWeight: '400', color: t.text },
    operationHint:  { fontSize: 12, lineHeight: 17, color: t.textSecondary, marginTop: 2 },
    operationValue: { fontSize: 17, fontWeight: '900', color: t.text },
    paymentRow:     { paddingHorizontal: 14, paddingVertical: 14 },
    paymentLabel:   { fontSize: 12, lineHeight: 17, color: t.textSecondary, marginBottom: 10 },
    paymentChips:   { flexDirection: 'row', gap: 8 },
    paymentChip:    { flex: 1, minHeight: 36, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg },
    paymentChipActive: { backgroundColor: t.text, borderColor: t.text },
    paymentChipText: { fontSize: 12, fontWeight: '900', color: t.text },
    paymentChipTextActive: { color: t.surface },
    settingGroup:   { marginTop: 2, backgroundColor: t.surface, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    settingRow:     { flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingHorizontal: 2 },
    settingTextWrap:{ flex: 1 },
    settingIcon:    { marginRight: 12, opacity: 0.42 },
  });
}

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
  }, [anim, value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackOff  = theme.isDark ? 'rgba(245,245,240,0.22)' : '#E2E2DC';
  const trackOn   = theme.isDark ? theme.accent : theme.accent;
  const thumbOff  = '#FFFFFF';
  const thumbOn   = '#FFFFFF';
  const trackBg    = anim.interpolate({ inputRange: [0, 1], outputRange: [trackOff, trackOn] });
  const thumbColor = anim.interpolate({ inputRange: [0, 1], outputRange: [thumbOff, thumbOn] });
  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.85}>
      <Animated.View style={[tog.track, { backgroundColor: trackBg }]}>
        <Animated.View style={[tog.thumb, { backgroundColor: thumbColor, transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const tog = StyleSheet.create({
  track: { width: 46, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 1 },
  thumb: { width: 24, height: 24, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PerfilScreen() {
  const { theme, toggleTheme } = useTheme();
  const s = makeStyles(theme);

  const insets = useSafeAreaInsets();

  const existingHorario = getFonditaHorario();
  const parsed = existingHorario ? parseHorario(existingHorario) : null;

  const [nombre,        setNombre]        = useState(getFonditaName());
  const [descripcion,   setDescripcion]   = useState(getFonditaDescription());
  const [ubicacion,     setUbicacion]     = useState(getFonditaDireccion());
  const [ubicacionVisible, setUbicacionVisible] = useState(getFonditaDireccionVisible());
  const [apertura,      setApertura]      = useState<Date | null>(parsed?.apertura ?? null);
  const [cierre,        setCierre]        = useState<Date | null>(parsed?.cierre ?? null);
  const [showApertura,  setShowApertura]  = useState(false);
  const [showCierre,    setShowCierre]    = useState(false);
  const [pagosEfectivo, setPagosEfectivoState] = useState(getPagosEfectivo());
  const [pagosTrans,    setPagosTransState]    = useState(getPagosTrans());
  const [pagosTarjeta,  setPagosTarjetaState]  = useState(getPagosTarjeta());
  const [tipoNegocio,   setTipoNegocioState]   = useState<string | null>(getTipoNegocio());
  const [email,         setEmail]         = useState('');
  const [ready,         setReady]         = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);

  const horario = apertura && cierre ? buildHorario(apertura, cierre) : '';

  const [savedValues, setSavedValues] = useState({
    nombre:        getFonditaName(),
    descripcion:   getFonditaDescription(),
    ubicacion:     getFonditaDireccion(),
    ubicacionVisible: getFonditaDireccionVisible(),
    horario:       getFonditaHorario() || '',
    pagosEfectivo: getPagosEfectivo(),
    pagosTrans:    getPagosTrans(),
    pagosTarjeta:  getPagosTarjeta(),
    tipoNegocio:   getTipoNegocio() as string | null,
  });

  const isDirty =
    nombre        !== savedValues.nombre        ||
    descripcion   !== savedValues.descripcion   ||
    ubicacion     !== savedValues.ubicacion     ||
    ubicacionVisible !== savedValues.ubicacionVisible ||
    horario       !== savedValues.horario       ||
    pagosEfectivo !== savedValues.pagosEfectivo ||
    pagosTrans    !== savedValues.pagosTrans    ||
    pagosTarjeta  !== savedValues.pagosTarjeta  ||
    tipoNegocio   !== savedValues.tipoNegocio;

  const fonditaIdRef        = useRef<string | null>(getFonditaId());
  const nombreUpdatedAtRef  = useRef<string | null>(null);
  const aperturaTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cierreTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const categoryScrollRef   = useRef<ScrollView>(null);

  const scrollToCategory = useCallback((index: number, animated = true) => {
    categoryScrollRef.current?.scrollTo({
      x: 0,
      y: index * CATEGORY_ITEM_HEIGHT,
      animated,
    });
  }, []);

  const selectCategory = useCallback((key: string, index: number, animated = true) => {
    setTipoNegocioState(key);
    setTipoNegocio(key);
    scrollToCategory(index, animated);
  }, [scrollToCategory]);

  const handleCategoryMomentumEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.max(
      0,
      Math.min(TIPOS_NEGOCIO.length - 1, Math.round(event.nativeEvent.contentOffset.y / CATEGORY_ITEM_HEIGHT))
    );
    const next = TIPOS_NEGOCIO[nextIndex];
    if (next && next.key !== tipoNegocio) {
      setTipoNegocioState(next.key);
      setTipoNegocio(next.key);
    }
  }, [tipoNegocio]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user?.email) {
          let fallbackId: string | null = getFonditaId();
          if (!fallbackId) fallbackId = await AsyncStorage.getItem(FONDITA_ID_KEY);
          if (fallbackId) fonditaIdRef.current = fallbackId;
          return;
        }

        setEmail(user.email);

        const selectResult = await supabase
          .from('fonditas')
          .select('id, nombre, nombre_updated_at, descripcion, direccion, direccion_visible, horario, pagos_efectivo, pagos_transferencia, pagos_tarjeta, tipo_negocio')
          .eq('telefono', user.email)
          .maybeSingle();

        let fondita = selectResult.data;

        if (!fondita) {
          const insertResult = await supabase
            .from('fonditas')
            .insert({ telefono: user.email, nombre: 'Mi Fondita' })
            .select('id, nombre, nombre_updated_at, descripcion, direccion, direccion_visible, horario, pagos_efectivo, pagos_transferencia, pagos_tarjeta, tipo_negocio')
            .single();
          fondita = insertResult.data;
        }

        if (!fondita) return;

        fonditaIdRef.current = fondita.id;
        setFonditaId(fondita.id);

        const n    = fondita.nombre      ?? getFonditaName();
        const desc = fondita.descripcion ?? getFonditaDescription();
        const ub   = fondita.direccion   ?? getFonditaDireccion();
        const ubv  = fondita.direccion_visible ?? getFonditaDireccionVisible();
        const hor  = fondita.horario     ?? '';
        const pe   = fondita.pagos_efectivo      ?? false;
        const pt   = fondita.pagos_transferencia ?? false;
        const ptar = fondita.pagos_tarjeta       ?? false;

        setNombre(n);       setFonditaName(n);
        setDescripcion(desc); setFonditaDescription(desc);
        setUbicacion(ub);   setFonditaDireccion(ub);
        setUbicacionVisible(ubv); setFonditaDireccionVisible(ubv);
        setFonditaHorario(hor);

        if (hor) {
          const p = parseHorario(hor);
          setApertura(p.apertura);
          setCierre(p.cierre);
        }

        const tn = (fondita as any).tipo_negocio ?? null;
        setPagosEfectivoState(pe);  setPagosEfectivo(pe);
        setPagosTransState(pt);     setPagosTrans(pt);
        setPagosTarjetaState(ptar); setPagosTarjeta(ptar);
        setTipoNegocioState(tn);    setTipoNegocio(tn);
        setSavedValues({ nombre: n, descripcion: desc, ubicacion: ub, ubicacionVisible: ubv, horario: hor || '', pagosEfectivo: pe, pagosTrans: pt, pagosTarjeta: ptar, tipoNegocio: tn });

        if (fondita.nombre_updated_at) nombreUpdatedAtRef.current = fondita.nombre_updated_at;
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const index = TIPOS_NEGOCIO.findIndex((item) => item.key === tipoNegocio);
    if (index >= 0) {
      requestAnimationFrame(() => scrollToCategory(index, false));
    }
  }, [scrollToCategory, tipoNegocio]);

  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const fonditaId = fonditaIdRef.current;
      const newSaved  = { ...savedValues };
      const payload: Record<string, string | boolean> = {};

      if (nombre !== savedValues.nombre) {
        const lastUpdated = nombreUpdatedAtRef.current;
        const blocked = lastUpdated && (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24) < 15;
        if (blocked) {
          const fechaDisponible = new Date(new Date(lastUpdated!).getTime() + 15 * 24 * 60 * 60 * 1000);
          Alert.alert('Nombre en pausa', `Tu nombre está bloqueado hasta el ${fechaDisponible.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}. Los demás cambios sí se guardaron.`);
        } else {
          payload['nombre'] = nombre.trim();
          payload['nombre_updated_at'] = new Date().toISOString();
          newSaved.nombre = nombre.trim();
        }
      }

      if (descripcion !== savedValues.descripcion) { payload['descripcion'] = descripcion.trim(); newSaved.descripcion = descripcion.trim(); }
      if (ubicacion !== savedValues.ubicacion) { payload['direccion'] = ubicacion.trim(); newSaved.ubicacion = ubicacion.trim(); }
      if (ubicacionVisible !== savedValues.ubicacionVisible) { payload['direccion_visible'] = ubicacionVisible; newSaved.ubicacionVisible = ubicacionVisible; }
      if (horario   !== savedValues.horario)   { payload['horario']   = horario;           newSaved.horario   = horario; }
      if (pagosEfectivo !== savedValues.pagosEfectivo) { payload['pagos_efectivo']      = pagosEfectivo; newSaved.pagosEfectivo = pagosEfectivo; }
      if (pagosTrans    !== savedValues.pagosTrans)    { payload['pagos_transferencia'] = pagosTrans;    newSaved.pagosTrans    = pagosTrans; }
      if (pagosTarjeta  !== savedValues.pagosTarjeta)  { payload['pagos_tarjeta']       = pagosTarjeta;  newSaved.pagosTarjeta  = pagosTarjeta; }
      if (tipoNegocio   !== savedValues.tipoNegocio)   { payload['tipo_negocio']         = tipoNegocio ?? ''; newSaved.tipoNegocio = tipoNegocio; }

      if (Object.keys(payload).length > 0) {
        if (fonditaId) await supabase.from('fonditas').update(payload).eq('id', fonditaId);
        if ('nombre' in payload)              { setFonditaName(nombre.trim()); nombreUpdatedAtRef.current = new Date().toISOString(); }
        if ('descripcion' in payload)         setFonditaDescription(descripcion.trim());
        if ('direccion' in payload)           setFonditaDireccion(ubicacion.trim());
        if ('direccion_visible' in payload)   setFonditaDireccionVisible(ubicacionVisible);
        if ('horario' in payload)             setFonditaHorario(horario);
        if ('pagos_efectivo' in payload)      setPagosEfectivo(pagosEfectivo);
        if ('pagos_transferencia' in payload) setPagosTrans(pagosTrans);
        if ('pagos_tarjeta' in payload)       setPagosTarjeta(pagosTarjeta);
        if ('tipo_negocio' in payload)        setTipoNegocio(tipoNegocio);
      }

      setSavedValues(newSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const categoryLabel = TIPOS_NEGOCIO.find((item) => item.key === tipoNegocio)?.label ?? 'Sin definir';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── TU NEGOCIO ── */}
        <View style={s.heroBlock}>
          <View style={s.heroHeader}>
            <Text style={s.blockLabel} allowFontScaling={true}>TU NEGOCIO</Text>
            {isDirty && (
              <TouchableOpacity onPress={handleSaveAll} disabled={isSaving} activeOpacity={0.5}>
                <Text style={[s.saveInlineBtn, isSaving && { opacity: 0.4 }]} allowFontScaling={true}>{isSaving ? 'Guardando…' : 'Guardar'}</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={s.nombreInput}
            value={nombre}
            onChangeText={(v) => setNombre(v.slice(0, MAX_NOMBRE))}
            placeholder="Nombre"
            placeholderTextColor={theme.border}
            selectionColor={theme.accent}
            autoCapitalize="none"
            editable={ready}
            returnKeyType="next"
          />
          <TextInput
            style={[s.fieldInput, { fontSize: 14, lineHeight: 20, marginBottom: 2 }]}
            value={descripcion}
            onChangeText={(v) => setDescripcion(v.slice(0, MAX_DESCRIPCION))}
            placeholder="Comida casera con sazón de abuela"
            placeholderTextColor={theme.textSecondary}
            selectionColor={theme.accent}
            autoCapitalize="none"
            editable={ready}
            returnKeyType="next"
          />
          <TextInput
            style={[s.fieldInput, { fontSize: 12, lineHeight: 17, opacity: 0.5, marginBottom: 6 }]}
            value={ubicacion}
            onChangeText={(v) => setUbicacion(v.slice(0, MAX_UBICACION))}
            placeholder="Av. Principal 123, Col. Centro"
            placeholderTextColor={theme.textSecondary}
            selectionColor={theme.accent}
            autoCapitalize="none"
            editable={ready}
            returnKeyType="done"
          />
          <View style={s.heroCard}>
            <View style={s.row}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={s.rowLabel} allowFontScaling={true}>Mostrar ubicación</Text>
                <Text style={s.rowHint} allowFontScaling={true}>Ayuda a que te encuentren en el mapa.</Text>
              </View>
              <ToggleSwitch value={ubicacionVisible} onValueChange={setUbicacionVisible} />
            </View>
          </View>
        </View>

        {/* ── CATEGORÍA ── */}
        <View style={s.block}>
          <View style={s.categoryHeader}>
            <Text style={s.blockLabel} allowFontScaling={true}>CATEGORÍA</Text>
            <Text style={s.categoryHint} allowFontScaling={true}>Se usa para organizar resultados en el mapa.</Text>
          </View>
          <View style={s.categoryWheelWrap}>
            <View pointerEvents="none" style={s.categoryWheelSelection} />
            <ScrollView
              ref={categoryScrollRef}
              showsVerticalScrollIndicator={false}
              snapToInterval={CATEGORY_ITEM_HEIGHT}
              snapToAlignment="start"
              decelerationRate="fast"
              bounces={false}
              nestedScrollEnabled
              onMomentumScrollEnd={handleCategoryMomentumEnd}
              onScrollEndDrag={handleCategoryMomentumEnd}
              contentContainerStyle={s.categoryWheelContent}
              style={s.categoryWheel}
            >
              {TIPOS_NEGOCIO.map(({ key, label }, index) => (
                <TouchableOpacity
                  key={key}
                  style={s.categoryWheelFrame}
                  onPress={() => selectCategory(key, index)}
                  activeOpacity={0.75}>
                  <Text style={[s.categoryWheelText, tipoNegocio === key && s.categoryWheelTextActive]} allowFontScaling={true}>{label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <View style={s.categoryWheelMarker} />
          </View>
          <Text style={[s.heroMeta, { opacity: 0.9, marginTop: 8, textAlign: 'center' }]} allowFontScaling={true}>{categoryLabel}</Text>
        </View>

        {/* ── OPERACIÓN ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>OPERACIÓN</Text>
          <View style={s.operationGroup}>
            <TouchableOpacity style={s.operationRow} onPress={() => { setShowCierre(false); setShowApertura(v => !v); }} activeOpacity={0.72}>
              <View style={s.operationText}>
                <Text style={s.operationTitle} allowFontScaling={true}>Apertura</Text>
                <Text style={s.operationHint} allowFontScaling={true}>Hora en que empiezas a vender.</Text>
              </View>
              <Text style={[s.operationValue, !apertura && { color: theme.textSecondary }]} allowFontScaling={true}>{apertura ? formatTime(apertura) : 'Definir'}</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.operationRow} onPress={() => { setShowApertura(false); setShowCierre(v => !v); }} activeOpacity={0.72}>
              <View style={s.operationText}>
                <Text style={s.operationTitle} allowFontScaling={true}>Cierre</Text>
                <Text style={s.operationHint} allowFontScaling={true}>Se muestra junto a tu menú.</Text>
              </View>
              <Text style={[s.operationValue, !cierre && { color: theme.textSecondary }]} allowFontScaling={true}>{cierre ? formatTime(cierre) : 'Definir'}</Text>
            </TouchableOpacity>
            {(showApertura || showCierre) && <View style={s.divider} />}
            {showApertura && (
              <View style={s.pickerWrapper}>
                <DateTimePicker
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  value={apertura ?? defaultApertura()}
                  onChange={(_, d) => {
                    if (d) setApertura(d);
                    if (aperturaTimerRef.current) clearTimeout(aperturaTimerRef.current);
                    aperturaTimerRef.current = setTimeout(() => setShowApertura(false), 600);
                  }}
                  minuteInterval={15}
                  textColor={theme.text}
                  accentColor={theme.accent}
                />
              </View>
            )}
            {showCierre && (
              <View style={s.pickerWrapper}>
                <DateTimePicker
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  value={cierre ?? defaultCierre()}
                  onChange={(_, d) => {
                    if (d) setCierre(d);
                    if (cierreTimerRef.current) clearTimeout(cierreTimerRef.current);
                    cierreTimerRef.current = setTimeout(() => setShowCierre(false), 600);
                  }}
                  minuteInterval={15}
                  textColor={theme.text}
                  accentColor={theme.accent}
                />
              </View>
            )}
            <View style={s.divider} />
            <View style={s.paymentRow}>
              <Text style={s.paymentLabel} allowFontScaling={true}>Métodos de pago</Text>
              <View style={s.paymentChips}>
                {([['Efectivo', pagosEfectivo, setPagosEfectivoState], ['Transferencia', pagosTrans, setPagosTransState], ['Tarjeta', pagosTarjeta, setPagosTarjetaState]] as const).map(([label, active, toggle]) => (
                  <TouchableOpacity
                    key={label}
                    style={[s.paymentChip, active && s.paymentChipActive]}
                    onPress={() => toggle(!active)}
                    activeOpacity={0.75}>
                    <Text style={[s.paymentChipText, active && s.paymentChipTextActive]} allowFontScaling={true}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── CUENTA ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>CUENTA</Text>
          <View style={s.settingGroup}>
            <View style={s.settingRow}>
              <Ionicons name="mail-outline" size={22} color={theme.text} style={s.settingIcon} />
              <Text style={s.emailText} allowFontScaling={true}>{email || 'Sin correo'}</Text>
            </View>
          </View>
        </View>

        {/* ── PREFERENCIAS ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>PREFERENCIAS</Text>
          <View style={s.settingGroup}>
            <View style={s.settingRow}>
              <Ionicons name="moon-outline" size={22} color={theme.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Modo oscuro</Text>
              <ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} />
            </View>
          </View>
        </View>

        {/* ── SOPORTE ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>SOPORTE</Text>
          <View style={s.settingGroup}>
            <TouchableOpacity style={s.settingRow} onPress={() => router.push('/manifiesto')} activeOpacity={0.7}>
              <Ionicons name="sparkles-outline" size={22} color={theme.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Manifiesto</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.settingRow} onPress={() => Linking.openURL('mailto:contacto.parco@gmail.com?subject=Problema%20en%20La%20Fondita')} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={22} color={theme.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Contactar con soporte</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.settingRow} onPress={() => Linking.openURL('https://apple.com')} activeOpacity={0.7}>
              <Ionicons name="star-outline" size={22} color={theme.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Calificar la app</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SESIÓN ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>SESIÓN</Text>
          <View style={s.settingGroup}>
            <TouchableOpacity style={s.settingRow} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={22} color={theme.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <BottomTabBar />
    </View>
  );
}
