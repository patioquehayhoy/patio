import * as Location from 'expo-location';
import { BlurView } from 'expo-blur';
import { router, useFocusEffect } from 'expo-router';

import { HintSheet } from '@/components/hint-sheet';
import { markHintSeen, shouldShowHint } from '@/lib/hints';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
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
  getFonditaHorarioSemanal, setFonditaHorarioSemanal,
  getPagosEfectivo, setPagosEfectivo,
  getPagosTrans, setPagosTrans,
  getPagosTarjeta, setPagosTarjeta,
} from '@/lib/menu-store';
import {
  type HorarioSemanal,
  deserialize, migrarStringLegacy, serialize,
  horarioDefault, resumenHorario,
  dateToHHMM, hhmmToDate,
  DIAS_ORDEN_LUNES,
} from '@/lib/horario';
import { Fonts, useTheme, type Theme } from '@/lib/theme';
import { GlassIconButton } from '@/components/glass-button';

// Paleta oscura fija estilo Figma FonderoFonda (flujo Fondero siempre oscuro).
const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.08)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  textMute: 'rgba(248,248,245,0.4)',
  border: 'rgba(255,255,255,0.10)',
  sep: 'rgba(255,255,255,0.06)',
  accent: '#FF6A3D',
  accentLight: 'rgba(255,106,61,0.15)',
};

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

function makeStyles(theme: Theme) {
  const t: Theme = { ...theme, ...DARK, isDark: true };
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.bg },
    scroll:             { flex: 1 },
    scrollContent:      { paddingHorizontal: 20, paddingBottom: 120 },
    // Hero
    heroBlock:          { paddingTop: 8, paddingBottom: 6 },
    titleRow:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    eyebrowOrange:      { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: t.accent, marginBottom: 6 },
    screenTitle:        { fontSize: 34, fontWeight: '900', letterSpacing: -1.2, lineHeight: 36, color: t.text, marginBottom: 6, fontFamily: Fonts.brand },
    screenSub:          { fontSize: 14, fontWeight: '300', lineHeight: 19, color: t.textSecondary, marginBottom: 4 },
    // Barra Guardar fija abajo (glass)
    saveBar:            { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, overflow: 'hidden' },
    saveBarBorder:      { position: 'absolute', top: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    saveBtn:            { height: 52, borderRadius: 16, backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center' },
    saveBtnText:        { fontSize: 16, fontWeight: '700', color: '#fff' },
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
    // Cards planas (horario)
    plainCard:          { backgroundColor: t.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    opSection:          { paddingHorizontal: 16, paddingVertical: 16 },
    divider:            { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    pickerWrapper:      { marginTop: 12, backgroundColor: t.bg, borderRadius: 12, overflow: 'hidden' },
    // Horario — cápsulas de → a
    horarioRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
    timeCapsule:        { flex: 1, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.bg },
    timeCapsuleActive:  { borderColor: t.accent, backgroundColor: t.accentLight },
    timeCapsuleHint:    { fontSize: 10.5, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase', color: t.textMute, marginBottom: 3 },
    timeCapsuleVal:     { fontSize: 18, fontWeight: '900', color: t.text, fontFamily: Fonts.brand },
    // Horario semanal
    // Resumen agrupado (filas día → horas)
    resumenCard:        { marginBottom: 12, gap: 2 },
    resumenFila:        { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingVertical: 4 },
    resumenDias:        { fontSize: 14, fontWeight: '900', color: t.text, fontFamily: Fonts.brand, minWidth: 70 },
    resumenHoras:       { fontSize: 14, fontWeight: '300', color: t.textSecondary, flex: 1, textAlign: 'right' },
    resumenCerrado:     { color: t.textMute },
    cerradoNota:        { fontSize: 12.5, fontWeight: '300', color: t.accent, marginBottom: 10 },
    horarioSep:         { height: StyleSheet.hairlineWidth, backgroundColor: t.border, marginVertical: 16 },
    editingContext:     { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
    editingContextLabel:{ fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: t.textMute },
    editingContextValue:{ fontSize: 15, fontWeight: '900', color: t.accent, fontFamily: Fonts.brand },
    diasHint:           { fontSize: 11.5, fontWeight: '300', color: t.textMute, marginBottom: 10 },
    dayChipsRow:        { flexDirection: 'row', gap: 6 },
    dayChip:            { flex: 1, aspectRatio: 1, maxWidth: 44, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    dayChipDot:         { position: 'absolute', top: 6, right: 6, width: 5, height: 5, borderRadius: 3, backgroundColor: t.accent },
    dayChipException:   { borderColor: t.accent, backgroundColor: t.accentLight },
    dayChipClosed:      { borderColor: t.accent, backgroundColor: t.accentLight, opacity: 0.6 },
    dayChipSelected:    { borderColor: t.accent, backgroundColor: t.accent },
    dayChipText:        { fontSize: 13, fontWeight: '900', color: t.textSecondary, fontFamily: Fonts.brand },
    exceptionBar:       { flexDirection: 'row', gap: 6, marginTop: 16 },
    exceptionAction:    { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, backgroundColor: t.surface, alignItems: 'center', justifyContent: 'center' },
    exceptionDone:      { backgroundColor: t.accent, borderColor: t.accent },
    exceptionActionText:{ fontSize: 12.5, fontWeight: '700', color: t.text },
    dayRow:             { minHeight: 58, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
    dayRowBorder:       { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    dayName:            { flex: 1, fontSize: 16, fontWeight: '600', color: t.text },
    dayHours:           { fontSize: 14, fontWeight: '300', color: t.textSecondary },
    dayEditor:          { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: t.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    closedRow:          { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    closedLabel:        { fontSize: 14, fontWeight: '500', color: t.text },
    timeRow:            { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    timeRowLabel:       { fontSize: 14, color: t.textSecondary },
    timeRowValue:       { fontSize: 17, fontWeight: '700', color: t.text },
    applyAll:           { minHeight: 44, marginTop: 8, alignItems: 'center', justifyContent: 'center' },
    applyAllText:       { fontSize: 13, fontWeight: '600', color: t.accent },
    // Payments
    paymentChips:       { flexDirection: 'row', gap: 8 },
    paymentChip:        { flex: 1, flexDirection: 'row', minHeight: 44, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface },
    paymentChipActive:  { backgroundColor: t.accent, borderColor: t.accent },
    paymentChipText:    { fontSize: 12.5, fontWeight: '700', color: t.text },
    paymentChipTextActive: { color: '#fff' },
    // Settings
    settingGroup:       { marginTop: 2, backgroundColor: t.surface, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, overflow: 'hidden' },
    settingRow:         { flexDirection: 'row', alignItems: 'center', minHeight: 62, paddingHorizontal: 14 },
    rowLabel:           { flex: 1, fontSize: 17, fontWeight: '300', color: t.text },
    emailText:          { flex: 1, fontSize: 16, fontWeight: '300', color: t.textSecondary },
    settingIcon:        { marginRight: 12, opacity: 0.42 },
  });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function PerfilScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();

  const initialSemanal =
    getFonditaHorarioSemanal() ?? migrarStringLegacy(getFonditaHorario()) ?? horarioDefault();

  const [nombre,        setNombre]        = useState(getFonditaName());
  const [descripcion,   setDescripcion]   = useState(getFonditaDescription());
  const [ubicacion,     setUbicacion]     = useState(getFonditaDireccion());
  // Horario semanal. Solo se edita un contexto a la vez: horario general o un
  // día concreto. La selección múltiple anterior hacía ambiguo qué se cambiaba.
  const [semanal,       setSemanal]       = useState<HorarioSemanal>(initialSemanal);
  const [seleccion,     setSeleccion]     = useState<number[]>([]);
  const [showApertura,  setShowApertura]  = useState(false);
  const [showCierre,    setShowCierre]    = useState(false);
  const [pagosEfectivo, setPagosEfectivoState] = useState(getPagosEfectivo());
  const [pagosTrans,    setPagosTransState]    = useState(getPagosTrans());
  const [pagosTarjeta,  setPagosTarjetaState]  = useState(getPagosTarjeta());
  const [email,         setEmail]         = useState('');
  const [ready,         setReady]         = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);
  const [locationSaved,    setLocationSaved]    = useState(false);
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  // Resumen natural del horario y firma JSON para detectar cambios.
  const horarioResumen = resumenHorario(semanal);
  const semanalJSON = JSON.stringify(serialize(semanal));

  // Día "activo" que alimenta las cápsulas/picker: el primero seleccionado, o
  // el base (Lunes) cuando no hay selección. Solo para mostrar las horas.
  const diaActivo = seleccion.length > 0
    ? semanal.find(d => d.dia === seleccion[0])!
    : (semanal.find(d => d.dia === 1) ?? semanal[0]);
  const apertura = diaActivo && !diaActivo.cerrado && diaActivo.abre ? hhmmToDate(diaActivo.abre) : null;
  const cierre   = diaActivo && !diaActivo.cerrado && diaActivo.cierra ? hhmmToDate(diaActivo.cierra) : null;

  const [savedValues, setSavedValues] = useState({
    nombre:        getFonditaName(),
    descripcion:   getFonditaDescription(),
    ubicacion:     getFonditaDireccion(),
    horarioJSON:   JSON.stringify(serialize(initialSemanal)),
    pagosEfectivo: getPagosEfectivo(),
    pagosTrans:    getPagosTrans(),
    pagosTarjeta:  getPagosTarjeta(),
  });

  const isDirty =
    nombre        !== savedValues.nombre        ||
    descripcion   !== savedValues.descripcion   ||
    ubicacion     !== savedValues.ubicacion     ||
    semanalJSON   !== savedValues.horarioJSON   ||
    pagosEfectivo !== savedValues.pagosEfectivo ||
    pagosTrans    !== savedValues.pagosTrans    ||
    pagosTarjeta  !== savedValues.pagosTarjeta;

  const [showPerfilHint, setShowPerfilHint] = useState(false);

  const fonditaIdRef       = useRef<string | null>(getFonditaId());
  const nombreUpdatedAtRef = useRef<string | null>(null);
  const nombreInputRef     = useRef<TextInput>(null);

  const aplicarHora = (campo: 'abre' | 'cierra', value: string) => {
    const target = new Set(seleccion);
    setSemanal(prev => prev.map(d =>
      target.has(d.dia) ? { ...d, cerrado: false, [campo]: value } : d
    ));
  };

  const toggleCerrado = () => {
    const target = new Set(seleccion);
    setSemanal(prev => prev.map(d =>
      target.has(d.dia)
        ? d.cerrado
          ? { ...d, cerrado: false, abre: '08:00', cierra: '16:00' }
          : { ...d, cerrado: true, abre: null, cierra: null }
        : d
    ));
  };

  const aplicarATodos = () => {
    if (!diaActivo) return;
    setSemanal(prev => prev.map(d => ({
      ...d,
      cerrado: diaActivo.cerrado,
      abre: diaActivo.abre,
      cierra: diaActivo.cierra,
    })));
  };

  const toggleDia = (dia: number) => {
    setShowApertura(false); setShowCierre(false);
    setSeleccion(prev => prev[0] === dia ? [] : [dia]);
  };

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
          .select('id, nombre, nombre_updated_at, descripcion, direccion, direccion_visible, horario, horario_semanal, pagos_efectivo, pagos_transferencia, pagos_tarjeta, tipo_negocio, latitude, longitude')
          .eq('telefono', user.email)
          .maybeSingle();

        let fondita = selectResult.data;

        if (!fondita) {
          const insertResult = await supabase
            .from('fonditas')
            .insert({ telefono: user.email, nombre: '' })
            .select('id, nombre, nombre_updated_at, descripcion, direccion, direccion_visible, horario, horario_semanal, pagos_efectivo, pagos_transferencia, pagos_tarjeta, tipo_negocio, latitude, longitude')
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

        // Horario: jsonb nuevo, fallback al string viejo, fallback al default.
        const sem = deserialize((fondita as any).horario_semanal)
          ?? migrarStringLegacy(hor)
          ?? horarioDefault();

        setNombre(n);         setFonditaName(n);
        setDescripcion(desc); setFonditaDescription(desc);
        setUbicacion(ub);     setFonditaDireccion(ub);
        setFonditaHorario(hor);
        setSemanal(sem);
        setFonditaHorarioSemanal(sem);
        setSeleccion([]);

        setPagosEfectivoState(pe);  setPagosEfectivo(pe);
        setPagosTransState(pt);     setPagosTrans(pt);
        setPagosTarjetaState(ptar); setPagosTarjeta(ptar);
        setSavedValues({ nombre: n, descripcion: desc, ubicacion: ub, horarioJSON: JSON.stringify(serialize(sem)), pagosEfectivo: pe, pagosTrans: pt, pagosTarjeta: ptar });

        if (fondita.nombre_updated_at) nombreUpdatedAtRef.current = fondita.nombre_updated_at;
        if ((fondita as any).latitude && (fondita as any).longitude) setLocationSaved(true);
      } finally {
        setReady(true);
      }
    };
    init();
  }, []);

  // Back protegido: si hay cambios sin guardar, confirma antes de salir.
  const handleBack = () => {
    if (!isDirty) { router.back(); return; }
    Alert.alert('¿Descartar cambios?', 'Hiciste cambios que no has guardado. Si sales, se pierden.', [
      { text: 'Seguir editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => router.back() },
    ]);
  };

  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const fonditaId = fonditaIdRef.current;
      const newSaved  = { ...savedValues };
      const payload: Record<string, unknown> = {};

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
      if (semanalJSON !== savedValues.horarioJSON) {
        payload['horario_semanal'] = serialize(semanal);  // fuente de verdad
        payload['horario']         = horarioResumen;       // text legacy / compat
        newSaved.horarioJSON       = semanalJSON;
      }
      if (pagosEfectivo !== savedValues.pagosEfectivo) { payload['pagos_efectivo']      = pagosEfectivo; newSaved.pagosEfectivo = pagosEfectivo; }
      if (pagosTrans    !== savedValues.pagosTrans)    { payload['pagos_transferencia'] = pagosTrans;    newSaved.pagosTrans    = pagosTrans; }
      if (pagosTarjeta  !== savedValues.pagosTarjeta)  { payload['pagos_tarjeta']       = pagosTarjeta;  newSaved.pagosTarjeta  = pagosTarjeta; }

      if (Object.keys(payload).length > 0) {
        if (fonditaId) await supabase.from('fonditas').update(payload).eq('id', fonditaId);
        if ('nombre' in payload)              { setFonditaName(nombre.trim()); nombreUpdatedAtRef.current = new Date().toISOString(); }
        if ('descripcion' in payload)         setFonditaDescription(descripcion.trim());
        if ('direccion' in payload)           setFonditaDireccion(ubicacion.trim());
        if ('horario_semanal' in payload)     { setFonditaHorarioSemanal(semanal); setFonditaHorario(horarioResumen); }
        if ('pagos_efectivo' in payload)      setPagosEfectivo(pagosEfectivo);
        if ('pagos_transferencia' in payload) setPagosTrans(pagosTrans);
        if ('pagos_tarjeta' in payload)       setPagosTarjeta(pagosTarjeta);
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
      <View style={{ marginLeft: 14, marginBottom: 4 }}>
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={handleBack} size={38} iconSize={19} />
      </View>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── HEADER ── */}
        <View style={s.heroBlock}>
          <Text style={s.eyebrowOrange} allowFontScaling={true}>Mi Patio</Text>
          <Text style={s.screenTitle} allowFontScaling={true}>Editar mi lugar</Text>
          <Text style={s.screenSub} allowFontScaling={true}>Así te encuentran quienes andan cerca.</Text>
        </View>

        {/* ── IDENTIDAD ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>IDENTIDAD</Text>
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

        {/* ── HORARIO ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>HORARIO</Text>
          <View style={s.plainCard}>
            {DIAS_ORDEN_LUNES.map((dia, index) => {
              const d = semanal.find(x => x.dia === dia)!;
              const selected = seleccion[0] === dia;
              const label = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dia];
              return (
                <View key={dia}>
                  <TouchableOpacity
                    style={[s.dayRow, index > 0 && s.dayRowBorder]}
                    onPress={() => toggleDia(dia)}
                    activeOpacity={0.72}>
                    <Text style={s.dayName}>{label}</Text>
                    <Text style={[s.dayHours, d.cerrado && { color: DARK.textMute }]}>
                      {d.cerrado
                        ? 'Cerrado'
                        : `${d.abre ? formatTime(hhmmToDate(d.abre)) : '—'} – ${d.cierra ? formatTime(hhmmToDate(d.cierra)) : '—'}`}
                    </Text>
                    <Ionicons name={selected ? 'chevron-up' : 'chevron-down'} size={15} color={DARK.textMute} />
                  </TouchableOpacity>

                  {selected && (
                    <View style={s.dayEditor}>
                      <TouchableOpacity style={s.closedRow} onPress={toggleCerrado} activeOpacity={0.72}>
                        <Text style={s.closedLabel}>Cerrado este día</Text>
                        <Ionicons name={d.cerrado ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={d.cerrado ? DARK.accent : DARK.textMute} />
                      </TouchableOpacity>

                      {!d.cerrado && (
                        <>
                          <TouchableOpacity style={s.timeRow} onPress={() => { setShowCierre(false); setShowApertura(v => !v); }} activeOpacity={0.72}>
                            <Text style={s.timeRowLabel}>Apertura</Text>
                            <Text style={s.timeRowValue}>{apertura ? formatTime(apertura) : 'Definir'}</Text>
                          </TouchableOpacity>
                          {showApertura && (
                            <DateTimePicker
                              mode="time"
                              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                              value={apertura ?? defaultApertura()}
                              onChange={(_, value) => value && aplicarHora('abre', dateToHHMM(value))}
                              minuteInterval={15}
                              textColor={DARK.text}
                              accentColor={DARK.accent}
                            />
                          )}
                          <TouchableOpacity style={s.timeRow} onPress={() => { setShowApertura(false); setShowCierre(v => !v); }} activeOpacity={0.72}>
                            <Text style={s.timeRowLabel}>Cierre</Text>
                            <Text style={s.timeRowValue}>{cierre ? formatTime(cierre) : 'Definir'}</Text>
                          </TouchableOpacity>
                          {showCierre && (
                            <DateTimePicker
                              mode="time"
                              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                              value={cierre ?? defaultCierre()}
                              onChange={(_, value) => value && aplicarHora('cierra', dateToHHMM(value))}
                              minuteInterval={15}
                              textColor={DARK.text}
                              accentColor={DARK.accent}
                            />
                          )}
                        </>
                      )}

                      <TouchableOpacity style={s.applyAll} onPress={aplicarATodos} activeOpacity={0.7}>
                        <Text style={s.applyAllText}>Usar este horario todos los días</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── PAGOS ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>CÓMO COBRAS</Text>
          <View style={s.paymentChips}>
            {([['cash', 'Efectivo', pagosEfectivo, setPagosEfectivoState], ['transfer', 'Transferencia', pagosTrans, setPagosTransState], ['card', 'Tarjeta', pagosTarjeta, setPagosTarjetaState]] as const).map(([key, label, active, toggle]) => (
              <TouchableOpacity
                key={key}
                style={[s.paymentChip, active && s.paymentChipActive]}
                onPress={() => toggle(!active)}
                activeOpacity={0.75}>
                {active && <Ionicons name="checkmark" size={13} color="#fff" style={{ marginRight: 4 }} />}
                <Text style={[s.paymentChipText, active && s.paymentChipTextActive]} allowFontScaling={true}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── CUENTA: correo + cerrar sesión ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>CUENTA</Text>
          <View style={s.settingGroup}>
            <View style={s.settingRow}>
              <Ionicons name="mail-outline" size={20} color={DARK.textSecondary} style={s.settingIcon} />
              <Text style={s.emailText} numberOfLines={1} allowFontScaling={true}>{email || 'Sin correo'}</Text>
            </View>
            <View style={s.divider} />
            <TouchableOpacity style={s.settingRow} onPress={handleSignOut} activeOpacity={0.7}>
              <Ionicons name="log-out-outline" size={20} color={DARK.textSecondary} style={s.settingIcon} />
              <Text style={s.rowLabel} allowFontScaling={true}>Cerrar sesión</Text>
              <Ionicons name="chevron-forward" size={15} color={DARK.textMute} />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Guardar: barra fija abajo, glass, solo con cambios pendientes.
          Visibility + 80/20: la acción principal del Fondero siempre al alcance. */}
      {isDirty && (
        <View style={[s.saveBar, { paddingBottom: insets.bottom || 16 }]}>
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={s.saveBarBorder} />
          <TouchableOpacity
            style={[s.saveBtn, isSaving && { opacity: 0.6 }]}
            onPress={handleSaveAll}
            disabled={isSaving}
            activeOpacity={0.85}>
            <Text style={s.saveBtnText} allowFontScaling={true}>
              {isSaving ? 'Guardando…' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <HintSheet
        visible={showPerfilHint}
        icon="storefront"
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
