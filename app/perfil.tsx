import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';

import { BottomTabBar } from '@/components/bottom-tab-bar';
import { supabase } from '@/lib/supabase';
import { FONDITA_ID_KEY } from '@/lib/db';
import { getFonditaId, setFonditaId } from '@/lib/user-store';
import { getFonditaName, setFonditaName, getFonditaDescription, setFonditaDescription, getFonditaDireccion, setFonditaDireccion } from '@/lib/menu-store';
import { useTheme, type Theme } from '@/lib/theme';

// ─── Design System ────────────────────────────────────────────────────────────
const PLACEHOLDER = 'rgba(255,94,0,0.2)';
const MAX_NOMBRE = 30;
const MAX_DESC = 80;
const MAX_DIR = 60;

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: t.bg },
    customHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
    customHeaderTitle: { fontSize: 18, fontWeight: '900', color: t.text },
    headerSaveBtn:  { fontSize: 11, fontWeight: '900', color: t.orange, backgroundColor: 'rgba(255,94,0,0.14)', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12, overflow: 'hidden' },
    scroll:         { flex: 1 },
    scrollContent:  { paddingHorizontal: 24, paddingBottom: 24 },
    heroSection:    { paddingTop: 24, paddingBottom: 8, gap: 12 },
    heroInput:      { fontSize: 30, fontWeight: '900', color: t.text, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    descInput:      { fontSize: 14, fontWeight: '300', color: t.text, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    dirInput:       { fontSize: 13, fontWeight: '300', color: t.gray, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    heroDivider:    { height: StyleSheet.hairlineWidth, backgroundColor: t.sep, marginTop: 4 },
    block:          { paddingTop: 28 },
    blockLabel:     { fontSize: 11, fontWeight: '900', color: t.orange, marginBottom: 14 },
    row:            { flexDirection: 'row', alignItems: 'center', minHeight: 36, paddingBottom: 12 },
    rowIcon:        { marginRight: 10 },
    rowLabel:       { flex: 1, fontSize: 15, fontWeight: '300', color: t.text },
    emailInput:     { flex: 1, fontSize: 15, fontWeight: '300', color: t.gray, paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    divider:        { height: StyleSheet.hairlineWidth, backgroundColor: t.sep },
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
  const [nombre, setNombre] = useState(getFonditaName());
  const [descripcion, setDescripcion] = useState(getFonditaDescription());
  const [direccion, setDireccion] = useState(getFonditaDireccion());
  const [email, setEmail] = useState('');
  const [ready, setReady] = useState(false);
  const [noSession, setNoSession] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedValues, setSavedValues] = useState({
    nombre: getFonditaName(),
    descripcion: getFonditaDescription(),
    direccion: getFonditaDireccion(),
  });
  const isDirty = nombre !== savedValues.nombre || descripcion !== savedValues.descripcion || direccion !== savedValues.direccion;
  // fonditaId resuelto localmente — no depende del store
  const fonditaIdRef = useRef<string | null>(getFonditaId());
  const nombreUpdatedAtRef = useRef<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Obtener usuario autenticado
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        console.log('[perfil] getUser user.email:', user?.email);
        console.log('[perfil] getUser error:', userError);

        // Fallback si no hay sesión (AuthSessionMissingError o sin email)
        if (!user?.email) {
          console.log('[perfil] sin sesión — intentando fallback de fonditaId');
          let fallbackId: string | null = getFonditaId();
          if (!fallbackId) fallbackId = await AsyncStorage.getItem(FONDITA_ID_KEY);
          console.log('[perfil] fallbackId:', fallbackId);
          if (fallbackId) {
            fonditaIdRef.current = fallbackId;
          } else {
            setNoSession(true);
          }
          return;
        }

        setEmail(user.email);

        // 2. Buscar fondita por telefono = user.email
        const selectResult = await supabase
          .from('fonditas')
          .select('id, nombre, descripcion, nombre_updated_at, direccion, direccion_visible')
          .eq('telefono', user.email)
          .maybeSingle();
        console.log('[perfil] select telefono="' + user.email + '" data:', JSON.stringify(selectResult.data));
        console.log('[perfil] select error:', JSON.stringify(selectResult.error));

        let fondita = selectResult.data;

        // 3. Si no existe, crear
        if (!fondita) {
          console.log('[perfil] no row found, inserting...');
          const insertResult = await supabase
            .from('fonditas')
            .insert({ telefono: user.email, nombre: 'Mi Fondita' })
            .select('id, nombre, descripcion, nombre_updated_at, direccion, direccion_visible')
            .single();
          console.log('[perfil] insert data:', JSON.stringify(insertResult.data));
          console.log('[perfil] insert error:', JSON.stringify(insertResult.error));
          fondita = insertResult.data;
        }

        console.log('[perfil] final fondita:', JSON.stringify(fondita));
        if (!fondita) return;

        // 4. Guardar id en ref local y en store global
        fonditaIdRef.current = fondita.id;
        setFonditaId(fondita.id);
        console.log('[perfil] fonditaIdRef set to:', fondita.id);

        const n   = fondita.nombre      ?? getFonditaName();
        const d   = fondita.descripcion ?? getFonditaDescription();
        const dir = fondita.direccion   ?? getFonditaDireccion();
        setNombre(n); setFonditaName(n);
        setDescripcion(d); setFonditaDescription(d);
        setDireccion(dir); setFonditaDireccion(dir);
        setSavedValues({ nombre: n, descripcion: d, direccion: dir });
        if (fondita.nombre_updated_at) { nombreUpdatedAtRef.current = fondita.nombre_updated_at; }
      } finally {
        setReady(true);
      }
    };

    init();
    // Dark mode is managed by ThemeContext (reads AsyncStorage on mount)
  }, []);

  const handleSaveAll = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const newSaved = { ...savedValues };
      // Nombre: verificar restricción de 15 días si cambió
      if (nombre !== savedValues.nombre) {
        const lastUpdated = nombreUpdatedAtRef.current;
        const blocked = lastUpdated && (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24) < 15;
        if (blocked) {
          const fechaDisponible = new Date(new Date(lastUpdated!).getTime() + 15 * 24 * 60 * 60 * 1000);
          const fechaStr = fechaDisponible.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
          Alert.alert('Nombre en pausa', `Tu nombre está bloqueado hasta el ${fechaStr}. Los demás cambios sí se guardaron.`);
        } else {
          await saveField('nombre', nombre);
          newSaved.nombre = nombre.trim();
        }
      }
      if (descripcion !== savedValues.descripcion) {
        await saveField('descripcion', descripcion);
        newSaved.descripcion = descripcion.trim();
      }
      if (direccion !== savedValues.direccion) {
        await saveField('direccion', direccion);
        newSaved.direccion = direccion.trim();
      }
      setSavedValues(newSaved);
    } finally {
      setIsSaving(false);
    }
  };

  const saveField = async (fieldName: 'nombre' | 'descripcion' | 'direccion', value: string) => {
    const trimmed = value.trim();
    const fonditaId = fonditaIdRef.current;
    console.log('[perfil] saveField INICIO ─────────────────────────');
    console.log(`[perfil]   field      : "${fieldName}"`);
    console.log(`[perfil]   value      : "${trimmed}"`);
    console.log(`[perfil]   fonditaId  : ${fonditaId}`);
    console.log(`[perfil]   ready state: ${fonditaId !== null ? 'ok' : 'NULL — guard activado'}`);
    if (!fonditaId) {
      // Sin cuenta — guardar solo en store local para que se refleje en menú y vista previa
      if (fieldName === 'nombre') setFonditaName(trimmed);
      if (fieldName === 'descripcion') setFonditaDescription(trimmed);
      if (fieldName === 'direccion') setFonditaDireccion(trimmed);
      console.log('[perfil] sin fonditaId — guardado solo en store local');
      return;
    }

    // Restricción de 15 días para nombre
    if (fieldName === 'nombre') {
      const lastUpdated = nombreUpdatedAtRef.current;
      if (lastUpdated) {
        const diasDesdeUltimoCambio = (Date.now() - new Date(lastUpdated).getTime()) / (1000 * 60 * 60 * 24);
        if (diasDesdeUltimoCambio < 15) {
          const fechaDisponible = new Date(new Date(lastUpdated).getTime() + 15 * 24 * 60 * 60 * 1000);
          const fechaStr = fechaDisponible.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
          Alert.alert('Cambio no permitido', `Solo puedes cambiar tu nombre una vez cada 15 días. Podrás cambiarlo el ${fechaStr}.`);
          return;
        }
      }
    }

    const updatePayload: Record<string, string> = { [fieldName]: trimmed };
    if (fieldName === 'nombre') updatePayload['nombre_updated_at'] = new Date().toISOString();

    try {
      console.log('fonditaIdRef.current:', fonditaIdRef.current);
      console.log('ready state:', ready);
      console.log('[perfil] Enviando update a Supabase...');
      const result = await supabase
        .from('fonditas')
        .update(updatePayload)
        .eq('id', fonditaId)
        .select();
      console.log('[perfil] update COMPLETO ────────────────────────');
      console.log('[perfil]   data  :', JSON.stringify(result.data));
      console.log('[perfil]   error :', JSON.stringify(result.error));
      console.log('[perfil]   status:', result.status);
      console.log('[perfil]   statusText:', result.statusText);
      if (result.error) {
        console.error('[perfil] Guardado fallido — error:', result.error.message, '| code:', result.error.code, '| details:', result.error.details);
        return;
      }
      console.log('[perfil] Guardado exitoso. Filas afectadas:', result.data?.length ?? 0);
    } catch (e) {
      console.error('[perfil] update lanzó excepción:', e);
      return;
    }

    if (fieldName === 'nombre') {
      setFonditaName(trimmed);
      nombreUpdatedAtRef.current = new Date().toISOString();
    }
    if (fieldName === 'descripcion') setFonditaDescription(trimmed);
    if (fieldName === 'direccion') setFonditaDireccion(trimmed);
    console.log('[perfil] Store local actualizado.');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* ── Custom header ── */}
      <View style={s.customHeader}>
        <Text style={s.customHeaderTitle}>{nombre || 'Perfil'}</Text>
        {isDirty && (
          <TouchableOpacity onPress={handleSaveAll} disabled={isSaving} activeOpacity={0.7}>
            <Text style={[s.headerSaveBtn, isSaving && { opacity: 0.4 }]}>{isSaving ? 'Guardando…' : 'Guardar'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Nombre + Descripción + Dirección ── */}
        <View style={s.heroSection}>
          <TextInput
            style={s.heroInput}
            value={nombre}
            onChangeText={(v) => setNombre(v.slice(0, MAX_NOMBRE))}
            placeholder="Nombre"
            placeholderTextColor={PLACEHOLDER}
            selectionColor={theme.orange}
            editable={ready}
            returnKeyType="done"
          />
          <TextInput
            style={s.descInput}
            value={descripcion}
            onChangeText={(v) => setDescripcion(v.slice(0, MAX_DESC))}
            placeholder="Cuenta algo de tu fondita…"
            placeholderTextColor={PLACEHOLDER}
            selectionColor={theme.orange}
            multiline
            editable={ready}
          />
          <TextInput
            style={s.dirInput}
            value={direccion}
            onChangeText={(v) => setDireccion(v.slice(0, MAX_DIR))}
            placeholder="Dirección o zona"
            placeholderTextColor={PLACEHOLDER}
            selectionColor={theme.orange}
            autoCapitalize="words"
            editable={ready}
            returnKeyType="done"
          />
          <View style={s.heroDivider} />
        </View>

        {/* ── Cuenta ── */}
        <View style={s.block}>
          <Text style={s.blockLabel}>CUENTA</Text>
          <View style={s.row}>
            <Ionicons name="mail-outline" size={17} color={theme.gray} style={s.rowIcon} />
            <TextInput style={s.emailInput} value={email} placeholder="Correo" placeholderTextColor={PLACEHOLDER} editable={false} numberOfLines={1} />
          </View>
          <View style={s.divider} />
        </View>

        {/* ── Preferencias ── */}
        <View style={s.block}>
          <Text style={s.blockLabel}>PREFERENCIAS</Text>
          <View style={s.row}>
            <Ionicons name="moon-outline" size={17} color={theme.gray} style={s.rowIcon} />
            <Text style={s.rowLabel}>Modo oscuro</Text>
            <ToggleSwitch value={theme.isDark} onValueChange={toggleTheme} />
          </View>
          <View style={s.divider} />
        </View>

        {/* ── Soporte ── */}
        <View style={s.block}>
          <Text style={s.blockLabel}>SOPORTE</Text>
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL('mailto:contacto.parco@gmail.com?subject=Problema%20en%20La%20Fondita')} activeOpacity={0.7}>
            <Ionicons name="bug-outline" size={17} color={theme.gray} style={s.rowIcon} />
            <Text style={s.rowLabel}>Contactar con soporte</Text>
          </TouchableOpacity>
          <View style={s.divider} />
          <TouchableOpacity style={s.row} onPress={() => Linking.openURL('https://apple.com')} activeOpacity={0.7}>
            <Ionicons name="star-outline" size={17} color={theme.gray} style={s.rowIcon} />
            <Text style={s.rowLabel}>Calificar la app</Text>
          </TouchableOpacity>
          <View style={s.divider} />
        </View>

        {/* ── Sesión ── */}
        <View style={s.block}>
          <Text style={s.blockLabel}>SESIÓN</Text>
          <TouchableOpacity style={s.row} onPress={handleSignOut} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={17} color={theme.gray} style={s.rowIcon} />
            <Text style={s.rowLabel}>Cerrar sesión</Text>
          </TouchableOpacity>
          <View style={s.divider} />
        </View>

      </ScrollView>

      <BottomTabBar />
    </View>
  );
}
