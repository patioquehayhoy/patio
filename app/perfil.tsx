import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

import { BottomTabBar } from '@/components/bottom-tab-bar';
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
} from '@/lib/menu-store';
import { useTheme, type Theme } from '@/lib/theme';

// ─── Constants ────────────────────────────────────────────────────────────────
const PLACEHOLDER = 'rgba(255,94,0,0.2)';
const MAX_NOMBRE      = 30;
const MAX_DESCRIPCION = 80;
const MAX_UBICACION   = 80;
const ICON_COLOR    = '#9E3F00';

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
    scrollContent:  { paddingHorizontal: 24, paddingBottom: 40 },
    block:          { paddingTop: 24 },
    blockHeader:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    blockLabel:     { fontSize: 12, fontWeight: '900', color: t.orange, letterSpacing: 1.2, marginBottom: 8 },
    saveInlineBtn:  { fontSize: 15, fontWeight: '700', color: '#FF5E00' },
    nombreInput:    { fontSize: 28, fontWeight: '900', color: t.text, letterSpacing: -0.5, lineHeight: 34, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent', marginBottom: 2 },
    fieldInput:     { fontWeight: '300', color: t.gray, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    row:            { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
    rowLabel:       { flex: 1, fontSize: 17, fontWeight: '300', color: t.text },
    emailText:      { flex: 1, fontSize: 15, fontWeight: '300', color: t.gray },
    divider:        { height: StyleSheet.hairlineWidth, backgroundColor: t.sep },
    pickerWrapper:  { backgroundColor: t.surface, borderRadius: 12, overflow: 'hidden' },
    chipsRow:       { flexDirection: 'row', gap: 8, paddingBottom: 16 },
    chip:           { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#EDE8DC' },
    chipDark:       { backgroundColor: t.surface, borderWidth: 0 },
    chipActive:     { backgroundColor: '#FF5E00', borderColor: '#FF5E00' },
    chipText:       { fontSize: 15, fontWeight: '500', color: '#9E3F00' },
    chipTextActive: { fontSize: 15, fontWeight: '500', color: '#FFF7E0' },
    timeRow:        { flexDirection: 'row', gap: 16, marginBottom: 8 },
    timeBtn:        { flex: 1, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.sep },
    timeBtnLabel:   { fontSize: 12, fontWeight: '700', color: ICON_COLOR, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2, opacity: 0.6 },
    timeBtnValue:   { fontSize: 22, fontWeight: '900', color: t.text, letterSpacing: -0.3 },
  });
}

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
  const [email,         setEmail]         = useState('');
  const [ready,         setReady]         = useState(false);
  const [isSaving,      setIsSaving]      = useState(false);

  const horario = apertura && cierre ? buildHorario(apertura, cierre) : '';

  const [savedValues, setSavedValues] = useState({
    nombre:        getFonditaName(),
    descripcion:   getFonditaDescription(),
    ubicacion:     getFonditaDireccion(),
    horario:       getFonditaHorario() || '',
    pagosEfectivo: getPagosEfectivo(),
    pagosTrans:    getPagosTrans(),
    pagosTarjeta:  getPagosTarjeta(),
  });

  const isDirty =
    nombre        !== savedValues.nombre        ||
    descripcion   !== savedValues.descripcion   ||
    ubicacion     !== savedValues.ubicacion     ||
    horario       !== savedValues.horario       ||
    pagosEfectivo !== savedValues.pagosEfectivo ||
    pagosTrans    !== savedValues.pagosTrans    ||
    pagosTarjeta  !== savedValues.pagosTarjeta;

  const fonditaIdRef        = useRef<string | null>(getFonditaId());
  const nombreUpdatedAtRef  = useRef<string | null>(null);
  const aperturaTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cierreTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          .select('id, nombre, nombre_updated_at, descripcion, direccion, horario, pagos_efectivo, pagos_transferencia, pagos_tarjeta')
          .eq('telefono', user.email)
          .maybeSingle();

        let fondita = selectResult.data;

        if (!fondita) {
          const insertResult = await supabase
            .from('fonditas')
            .insert({ telefono: user.email, nombre: 'Mi Fondita' })
            .select('id, nombre, nombre_updated_at, descripcion, direccion, horario, pagos_efectivo, pagos_transferencia, pagos_tarjeta')
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

        setNombre(n);       setFonditaName(n);
        setDescripcion(desc); setFonditaDescription(desc);
        setUbicacion(ub);   setFonditaDireccion(ub);
        setFonditaHorario(hor);

        if (hor) {
          const p = parseHorario(hor);
          setApertura(p.apertura);
          setCierre(p.cierre);
        }

        setPagosEfectivoState(pe);  setPagosEfectivo(pe);
        setPagosTransState(pt);     setPagosTrans(pt);
        setPagosTarjetaState(ptar); setPagosTarjeta(ptar);
        setSavedValues({ nombre: n, descripcion: desc, ubicacion: ub, horario: hor || '', pagosEfectivo: pe, pagosTrans: pt, pagosTarjeta: ptar });

        if (fondita.nombre_updated_at) nombreUpdatedAtRef.current = fondita.nombre_updated_at;
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
      if (ubicacion !== savedValues.ubicacion) { payload['direccion'] = ubicacion.trim(); newSaved.ubicacion = ubicacion.trim(); }
      if (horario   !== savedValues.horario)   { payload['horario']   = horario;           newSaved.horario   = horario; }
      if (pagosEfectivo !== savedValues.pagosEfectivo) { payload['pagos_efectivo']      = pagosEfectivo; newSaved.pagosEfectivo = pagosEfectivo; }
      if (pagosTrans    !== savedValues.pagosTrans)    { payload['pagos_transferencia'] = pagosTrans;    newSaved.pagosTrans    = pagosTrans; }
      if (pagosTarjeta  !== savedValues.pagosTarjeta)  { payload['pagos_tarjeta']       = pagosTarjeta;  newSaved.pagosTarjeta  = pagosTarjeta; }

      if (Object.keys(payload).length > 0) {
        if (fonditaId) await supabase.from('fonditas').update(payload).eq('id', fonditaId);
        if ('nombre' in payload)              { setFonditaName(nombre.trim()); nombreUpdatedAtRef.current = new Date().toISOString(); }
        if ('descripcion' in payload)         setFonditaDescription(descripcion.trim());
        if ('direccion' in payload)           setFonditaDireccion(ubicacion.trim());
        if ('horario' in payload)             setFonditaHorario(horario);
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
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── TU NEGOCIO ── */}
        <View style={s.block}>
          <View style={s.blockHeader}>
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
            placeholderTextColor={PLACEHOLDER}
            selectionColor={theme.orange}
            autoCapitalize="none"
            editable={ready}
            returnKeyType="next"
          />
          <TextInput
            style={[s.fieldInput, { fontSize: 14, lineHeight: 20, marginBottom: 2 }]}
            value={descripcion}
            onChangeText={(v) => setDescripcion(v.slice(0, MAX_DESCRIPCION))}
            placeholder="Comida casera con sazón de abuela"
            placeholderTextColor={PLACEHOLDER}
            selectionColor={theme.orange}
            autoCapitalize="none"
            editable={ready}
            returnKeyType="next"
          />
          <TextInput
            style={[s.fieldInput, { fontSize: 12, lineHeight: 17, opacity: 0.5, marginBottom: 6 }]}
            value={ubicacion}
            onChangeText={(v) => setUbicacion(v.slice(0, MAX_UBICACION))}
            placeholder="Av. Principal 123, Col. Centro"
            placeholderTextColor={PLACEHOLDER}
            selectionColor={theme.orange}
            autoCapitalize="none"
            editable={ready}
            returnKeyType="done"
          />
          <View style={s.divider} />
        </View>

        {/* ── HORARIO ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>HORARIO</Text>
          <View style={s.timeRow}>
            <TouchableOpacity style={s.timeBtn} onPress={() => { setShowCierre(false); setShowApertura(v => !v); }} activeOpacity={0.8}>
              <Text style={s.timeBtnLabel} allowFontScaling={true}>Apertura</Text>
              <Text style={[s.timeBtnValue, !apertura && { color: 'rgba(158,63,0,0.3)' }]} allowFontScaling={true}>{apertura ? formatTime(apertura) : '00:00'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.timeBtn} onPress={() => { setShowApertura(false); setShowCierre(v => !v); }} activeOpacity={0.8}>
              <Text style={s.timeBtnLabel} allowFontScaling={true}>Cierre</Text>
              <Text style={[s.timeBtnValue, !cierre && { color: 'rgba(158,63,0,0.3)' }]} allowFontScaling={true}>{cierre ? formatTime(cierre) : '00:00'}</Text>
            </TouchableOpacity>
          </View>
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
                textColor="#3D1F00"
                accentColor="#FF5E00"
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
                textColor="#3D1F00"
                accentColor="#FF5E00"
              />
            </View>
          )}
          <View style={s.divider} />
        </View>

        {/* ── PAGOS ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>PAGOS</Text>
          <View style={s.chipsRow}>
            {([['Efectivo', pagosEfectivo, setPagosEfectivoState], ['Transferencia', pagosTrans, setPagosTransState], ['Tarjeta', pagosTarjeta, setPagosTarjetaState]] as const).map(([label, active, toggle]) => (
              <TouchableOpacity
                key={label}
                style={[s.chip, !active && theme.isDark && s.chipDark, active && s.chipActive]}
                onPress={() => toggle(!active)}
                activeOpacity={0.75}>
                <Text style={[s.chipText, active && s.chipTextActive]} allowFontScaling={true}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={s.divider} />
        </View>

        {/* ── CUENTA ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>CUENTA</Text>
          <View style={s.row}>
            <Ionicons name="mail-outline" size={22} color={ICON_COLOR} style={{ marginRight: 10, opacity: 0.4 }} />
            <Text style={s.emailText} allowFontScaling={true}>{email || '—'}</Text>
          </View>
          <View style={s.divider} />
        </View>

        {/* ── PREFERENCIAS ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>PREFERENCIAS</Text>
          <View style={s.row}>
            <Ionicons name="moon-outline" size={22} color={ICON_COLOR} style={{ marginRight: 10, opacity: 0.4 }} />
            <Text style={s.rowLabel} allowFontScaling={true}>Modo oscuro</Text>
            <ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} />
          </View>
          <View style={s.divider} />
        </View>

        {/* ── SOPORTE ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>SOPORTE</Text>
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL('mailto:contacto.parco@gmail.com?subject=Problema%20en%20La%20Fondita')} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={22} color={ICON_COLOR} style={{ marginRight: 10, opacity: 0.4 }} />
            <Text style={s.rowLabel} allowFontScaling={true}>Contactar con soporte</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL('https://apple.com')} activeOpacity={0.7}>
            <Ionicons name="star-outline" size={22} color={ICON_COLOR} style={{ marginRight: 10, opacity: 0.4 }} />
            <Text style={s.rowLabel} allowFontScaling={true}>Calificar la app</Text>
          </TouchableOpacity>
          <View style={s.divider} />
        </View>

        {/* ── SESIÓN ── */}
        <View style={s.block}>
          <Text style={s.blockLabel} allowFontScaling={true}>SESIÓN</Text>
          <TouchableOpacity style={s.row} onPress={handleSignOut} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={22} color={ICON_COLOR} style={{ marginRight: 10, opacity: 0.4 }} />
            <Text style={s.rowLabel} allowFontScaling={true}>Cerrar sesión</Text>
          </TouchableOpacity>
          <View style={s.divider} />
        </View>

      </ScrollView>

      <BottomTabBar />
    </View>
  );
}
