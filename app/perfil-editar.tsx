import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';

import { HintSheet } from '@/components/hint-sheet';
import { markHintSeen, shouldShowHint } from '@/lib/hints';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
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

import { supabase } from '@/lib/supabase';
import { FONDITA_ID_KEY } from '@/lib/db';
import { getFonditaId, setFonditaId } from '@/lib/user-store';
import {
  getFonditaName, setFonditaName,
  getFonditaDescription, setFonditaDescription,
  getFonditaDireccion, setFonditaDireccion,
  getFonditaHorario, setFonditaHorario,
  getPagosEfectivo, setPagosEfectivo,
  getPagosTrans, setPagosTrans,
  getPagosTarjeta, setPagosTarjeta,
  getTipoNegocio, setTipoNegocio,
} from '@/lib/menu-store';
import { Fonts, useTheme, type Theme } from '@/lib/theme';

// Paleta oscura fija estilo Figma FonderoFonda (flujo Fondero siempre oscuro).
const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.08)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  border: 'rgba(255,255,255,0.10)',
  sep: 'rgba(255,255,255,0.06)',
  accent: '#FF6A3D',
  accentLight: 'rgba(255,106,61,0.15)',
};

const TIPOS_NEGOCIO: { key: string; label: string }[] = [
  { key: 'fondita',    label: 'Fondita' },
  { key: 'taqueria',   label: 'Taquería' },
  { key: 'reposteria', label: 'Repostería' },
  { key: 'mariscos',   label: 'Mariscos' },
  { key: 'otro',       label: 'Otro' },
];

const MAX_NOMBRE      = 30;
const MAX_DESCRIPCION = 80;
const MAX_UBICACION   = 80;

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
  let dashIdx = horario.indexOf(' – ');
  if (dashIdx === -1) {
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

function makeStyles(theme: Theme) {
  const t: Theme = { ...theme, ...DARK, isDark: true };
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.bg },
    scroll:             { flex: 1 },
    scrollContent:      { paddingHorizontal: 20, paddingBottom: 64 },
    // Hero
    heroBlock:          { paddingTop: 8, paddingBottom: 6 },
    titleRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    eyebrowOrange:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    screenTitle:        { fontSize: 34, fontWeight: '900', letterSpacing: -1.2, lineHeight: 38, color: t.text, marginBottom: 18, fontFamily: Fonts.brand },
    saveInlineBtn:      { fontSize: 15, fontWeight: '700', color: t.accent },
    // Card de campos
    fieldCard:          { backgroundColor: t.surface, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 16, paddingVertical: 14 },
    fieldLabel:         { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: t.textMute, marginBottom: 4 },
    fieldValue:         { fontSize: 16, fontWeight: '300', color: t.text, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    fieldDivider:       { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: 12 },
    locationBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, paddingBottom: 2, alignSelf: 'flex-start' },
    locationBtnText:    { fontSize: 13, fontWeight: '300', color: t.textSecondary },
    // Sections
    block:              { paddingTop: 24 },
    blockFirst:         { paddingTop: 32 },
    blockLabel:         { fontSize: 11, fontWeight: '900', color: t.textSecondary, marginBottom: 8, paddingLeft: 2 },
    // Type pills (inside card)
    tipoRow:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 14, paddingVertical: 14 },
    typePill:           { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.bg },
    typePillActive:     { backgroundColor: t.text, borderColor: t.text },
    typePillText:       { fontSize: 14, fontWeight: '300', color: t.text },
    typePillTextActive: { color: t.surface, fontWeight: '900' },
    // Groups
    divider:            { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    pickerWrapper:      { backgroundColor: t.surface, borderRadius: 12, overflow: 'hidden' },
    operationGroup:     { marginTop: 2, backgroundColor: t.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    operationRow:       { minHeight: 54, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center' },
    operationTitle:     { flex: 1, fontSize: 17, fontWeight: '300', color: t.text },
    operationValue:     { fontSize: 17, fontWeight: '900', color: t.text },
    // Payments
    paymentRow:         { paddingHorizontal: 14, paddingVertical: 14 },
    paymentChips:       { flexDirection: 'row', gap: 8 },
    paymentChip:        { flex: 1, minHeight: 36, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg },
    paymentChipActive:  { backgroundColor: t.text, borderColor: t.text },
    paymentChipText:    { fontSize: 12, fontWeight: '900', color: t.text },
    paymentChipTextActive: { color: t.surface },
    // Settings
    settingGroup:       { marginTop: 2, backgroundColor: t.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    settingRow:         { flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingHorizontal: 14 },
    rowLabel:           { flex: 1, fontSize: 17, fontWeight: '300', color: t.text },
    emailText:          { flex: 1, fontSize: 16, fontWeight: '300', color: t.textSecondary },
    settingIcon:        { marginRight: 12, opacity: 0.42 },
  });
}

// ─── ToggleSwitch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ value, onValueChange }: { value: boolean; onValueChange: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
  }, [anim, value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackBg    = anim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(255,255,255,0.18)', DARK.accent] });
  return (
    <TouchableOpacity onPress={() => onValueChange(!value)} activeOpacity={0.85}>
      <Animated.View style={[tog.track, { backgroundColor: trackBg }]}>
        <Animated.View style={[tog.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const tog = StyleSheet.create({
  track: { width: 46, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 1 },
  thumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 2 },
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
  const [locationSaved,    setLocationSaved]    = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const horario = apertura && cierre ? buildHorario(apertura, cierre) : '';

  const [savedValues, setSavedValues] = useState({
    nombre:        getFonditaName(),
    descripcion:   getFonditaDescription(),
    ubicacion:     getFonditaDireccion(),
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
    horario       !== savedValues.horario       ||
    pagosEfectivo !== savedValues.pagosEfectivo ||
    pagosTrans    !== savedValues.pagosTrans    ||
    pagosTarjeta  !== savedValues.pagosTarjeta  ||
    tipoNegocio   !== savedValues.tipoNegocio;

  const [showPerfilHint, setShowPerfilHint] = useState(false);

  const fonditaIdRef       = useRef<string | null>(getFonditaId());
  const nombreUpdatedAtRef = useRef<string | null>(null);
  const nombreInputRef     = useRef<TextInput>(null);
  const aperturaTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cierreTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    shouldShowHint('fondero_perfil').then((show) => {
      if (!show) return;
      const n = getFonditaName();
      if (!n || n === 'Mi Fondita' || n === 'La Fondita') setShowPerfilHint(true);
    });
  }, []));

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
          .select('id, nombre, nombre_updated_at, descripcion, direccion, direccion_visible, horario, pagos_efectivo, pagos_transferencia, pagos_tarjeta, tipo_negocio, latitude, longitude')
          .eq('telefono', user.email)
          .maybeSingle();

        let fondita = selectResult.data;

        if (!fondita) {
          const insertResult = await supabase
            .from('fonditas')
            .insert({ telefono: user.email, nombre: '' })
            .select('id, nombre, nombre_updated_at, descripcion, direccion, direccion_visible, horario, pagos_efectivo, pagos_transferencia, pagos_tarjeta, tipo_negocio, latitude, longitude')
            .single();
          fondita = insertResult.data;
        }

        if (!fondita) return;

        fonditaIdRef.current = fondita.id;
        setFonditaId(fondita.id);

        const n    = fondita.nombre      ?? getFonditaName();
        const desc = fondita.descripcion ?? getFonditaDescription();
        const ub   = fondita.direccion   ?? getFonditaDireccion();
        const hor  = fondita.horario     ?? '';
        const pe   = fondita.pagos_efectivo      ?? false;
        const pt   = fondita.pagos_transferencia ?? false;
        const ptar = fondita.pagos_tarjeta       ?? false;

        setNombre(n);         setFonditaName(n);
        setDescripcion(desc); setFonditaDescription(desc);
        setUbicacion(ub);     setFonditaDireccion(ub);
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
        setSavedValues({ nombre: n, descripcion: desc, ubicacion: ub, horario: hor || '', pagosEfectivo: pe, pagosTrans: pt, pagosTarjeta: ptar, tipoNegocio: tn });

        if (fondita.nombre_updated_at) nombreUpdatedAtRef.current = fondita.nombre_updated_at;
        if ((fondita as any).latitude && (fondita as any).longitude) setLocationSaved(true);
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

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
      if (ubicacion   !== savedValues.ubicacion)   { payload['direccion']   = ubicacion.trim();   newSaved.ubicacion   = ubicacion.trim(); }
      if (horario     !== savedValues.horario)     { payload['horario']     = horario;             newSaved.horario     = horario; }
      if (pagosEfectivo !== savedValues.pagosEfectivo) { payload['pagos_efectivo']      = pagosEfectivo; newSaved.pagosEfectivo = pagosEfectivo; }
      if (pagosTrans    !== savedValues.pagosTrans)    { payload['pagos_transferencia'] = pagosTrans;    newSaved.pagosTrans    = pagosTrans; }
      if (pagosTarjeta  !== savedValues.pagosTarjeta)  { payload['pagos_tarjeta']       = pagosTarjeta;  newSaved.pagosTarjeta  = pagosTarjeta; }
      if (tipoNegocio   !== savedValues.tipoNegocio)   { payload['tipo_negocio']         = tipoNegocio ?? ''; newSaved.tipoNegocio = tipoNegocio; }

      if (Object.keys(payload).length > 0) {
        if (fonditaId) await supabase.from('fonditas').update(payload).eq('id', fonditaId);
        if ('nombre' in payload)              { setFonditaName(nombre.trim()); nombreUpdatedAtRef.current = new Date().toISOString(); }
        if ('descripcion' in payload)         setFonditaDescription(descripcion.trim());
        if ('direccion' in payload)           setFonditaDireccion(ubicacion.trim());
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
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem('@patio_user_role').catch(() => {});
    router.replace('/');
  };

  const handleMarkLocation = async () => {
    const fonditaId = fonditaIdRef.current;
    if (!fonditaId) { Alert.alert('Guarda tu perfil primero'); return; }
    setIsSavingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sin permiso de ubicación', 'Activa la ubicación en Ajustes para aparecer en el mapa.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      const { error } = await supabase.from('fonditas').update({ latitude, longitude }).eq('id', fonditaId);
      if (error) throw error;
      setLocationSaved(true);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la ubicación. Intenta de nuevo.');
    } finally {
      setIsSavingLocation(false);
    }
  };

  return (
    <View style={[s.container, { paddingTop: insets.top + 8 }]}>
      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.7}
        style={{ width: 40, height: 40, borderRadius: 20, marginLeft: 14, marginBottom: 4, backgroundColor: DARK.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: DARK.border, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={20} color={DARK.text} />
      </TouchableOpacity>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── NEGOCIO ── */}
        <View style={s.heroBlock}>
          <View style={s.titleRow}>
            <Text style={s.eyebrowOrange} allowFontScaling={true}>Tu Patio</Text>
            {isDirty && (
              <TouchableOpacity onPress={handleSaveAll} disabled={isSaving} activeOpacity={0.6}>
                <Text style={[s.saveInlineBtn, isSaving && { opacity: 0.4 }]} allowFontScaling={true}>
                  {isSaving ? 'Guardando…' : 'Guardar'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={s.screenTitle} allowFontScaling={true}>Información</Text>

          {/* Card de campos */}
          <View style={s.fieldCard}>
            <Text style={s.fieldLabel} allowFontScaling={true}>Nombre</Text>
            <TextInput
              ref={nombreInputRef}
              style={s.fieldValue}
              value={nombre}
              onChangeText={(v) => setNombre(v.slice(0, MAX_NOMBRE))}
              placeholder="Nombre de tu negocio"
              placeholderTextColor={DARK.textSecondary}
              selectionColor={DARK.accent}
              autoCapitalize="words"
              editable={ready}
              returnKeyType="next"
            />
            <View style={s.fieldDivider} />
            <Text style={s.fieldLabel} allowFontScaling={true}>Descripción</Text>
            <TextInput
              style={s.fieldValue}
              value={descripcion}
              onChangeText={(v) => setDescripcion(v.slice(0, MAX_DESCRIPCION))}
              placeholder="Comida corrida, antojitos…"
              placeholderTextColor={DARK.textSecondary}
              selectionColor={DARK.accent}
              autoCapitalize="sentences"
              editable={ready}
              returnKeyType="next"
            />
            <View style={s.fieldDivider} />
            <Text style={s.fieldLabel} allowFontScaling={true}>Dirección</Text>
            <TextInput
              style={s.fieldValue}
              value={ubicacion}
              onChangeText={(v) => setUbicacion(v.slice(0, MAX_UBICACION))}
              placeholder="Calle y colonia"
              placeholderTextColor={DARK.textSecondary}
              selectionColor={DARK.accent}
              autoCapitalize="sentences"
              editable={ready}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={s.locationBtn}
              onPress={handleMarkLocation}
              disabled={isSavingLocation}
              activeOpacity={0.7}>
              <Ionicons
                name={locationSaved ? 'checkmark-circle' : 'location-outline'}
                size={14}
                color={locationSaved ? DARK.accent : DARK.textSecondary}
              />
              <Text style={[s.locationBtnText, locationSaved && { color: DARK.accent }]}>
                {isSavingLocation ? 'Ubicando…' : locationSaved ? 'En el mapa' : 'Marcar en el mapa'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── TIPO · HORARIO · PAGOS — un solo card ── */}
        <View style={s.blockFirst}>
          <View style={s.operationGroup}>
            <View style={s.tipoRow}>
              {TIPOS_NEGOCIO.map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[s.typePill, tipoNegocio === key && s.typePillActive]}
                  onPress={() => { setTipoNegocioState(key); setTipoNegocio(key); }}
                  activeOpacity={0.75}>
                  <Text style={[s.typePillText, tipoNegocio === key && s.typePillTextActive]} allowFontScaling={true}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.divider} />
            <TouchableOpacity style={s.operationRow} onPress={() => { setShowCierre(false); setShowApertura(v => !v); }} activeOpacity={0.72}>
              <Text style={s.operationTitle} allowFontScaling={true}>Apertura</Text>
              <Text style={[s.operationValue, !apertura && { color: DARK.textSecondary }]} allowFontScaling={true}>
                {apertura ? formatTime(apertura) : 'Definir'}
              </Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.operationRow} onPress={() => { setShowApertura(false); setShowCierre(v => !v); }} activeOpacity={0.72}>
              <Text style={s.operationTitle} allowFontScaling={true}>Cierre</Text>
              <Text style={[s.operationValue, !cierre && { color: DARK.textSecondary }]} allowFontScaling={true}>
                {cierre ? formatTime(cierre) : 'Definir'}
              </Text>
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
                  textColor={DARK.text}
                  accentColor={DARK.accent}
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
                  textColor={DARK.text}
                  accentColor={DARK.accent}
                />
              </View>
            )}
            <View style={s.divider} />
            <View style={s.paymentRow}>
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
              <Ionicons name="mail-outline" size={22} color={DARK.text} style={s.settingIcon} />
              <Text style={s.emailText} allowFontScaling={true}>{email || 'Sin correo'}</Text>
            </View>
          </View>
        </View>

        {/* ── PREFERENCIAS ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>PREFERENCIAS</Text>
          <View style={s.settingGroup}>
            <View style={s.settingRow}>
              <Ionicons name="moon-outline" size={22} color={DARK.text} style={s.settingIcon} />
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
              <Ionicons name="sparkles-outline" size={22} color={DARK.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Manifiesto</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.settingRow} onPress={() => Linking.openURL('mailto:quehayhoy.patio@gmail.com?subject=Soporte%20Patio%20Fondero')} activeOpacity={0.7}>
              <Ionicons name="chatbubble-outline" size={22} color={DARK.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Contactar con soporte</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.settingRow} onPress={() => Linking.openURL('itms-apps://itunes.apple.com/app/id6760884735?action=write-review')} activeOpacity={0.7}>
              <Ionicons name="star-outline" size={22} color={DARK.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Calificar la app</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SESIÓN ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>SESIÓN</Text>
          <View style={s.settingGroup}>
            <TouchableOpacity style={s.settingRow} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={22} color={DARK.text} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <HintSheet
        visible={showPerfilHint}
        icon="🏪"
        title="Ponle nombre a tu negocio"
        body="Nombre, tipo de negocio, horario y cómo cobras. Dos minutos y tu perfil está listo."
        primaryLabel="Empezar"
        onPrimary={() => {
          markHintSeen('fondero_perfil');
          setShowPerfilHint(false);
          setTimeout(() => nombreInputRef.current?.focus(), 300);
        }}
        onDismiss={() => { markHintSeen('fondero_perfil'); setShowPerfilHint(false); }}
      />
    </View>
  );
}
