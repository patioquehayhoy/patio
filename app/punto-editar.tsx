import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassIconButton } from '@/components/glass-button';
import { deletePunto, loadWhereTheySell, savePunto } from '@/lib/business-places';
import { dayName, dayShort, WEEK_ORDER } from '@/lib/puntos';
import { Type, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { getFonditaId } from '@/lib/user-store';

// Una sucursal o un día de tianguis (2026-11-21, lib/puntos.ts), como una
// dirección en Contactos: nombre, dirección, los días (solo tianguis) y el
// punto en el mapa, que se marca estando ahí o buscando la dirección.
export default function PuntoEditarScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string; tipo?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const dia = params.tipo === 'dia';
  const negocioId = getFonditaId();

  const [loading, setLoading] = useState(!!id);
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [dias, setDias] = useState<number[]>([]);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState<'gps' | 'search' | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id || !negocioId) return;
    let active = true;
    loadWhereTheySell(negocioId).then((where) => {
      if (!active) return;
      const punto = where.puntos.find((item) => item.id === id);
      if (punto) {
        setNombre(punto.nombre);
        setDireccion(punto.direccion ?? '');
        setDias(punto.dias ?? []);
        setCoords({ latitude: punto.latitude, longitude: punto.longitude });
      }
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, negocioId]);

  const markHere = async () => {
    setLocating('gps');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(noWidow('Sin permiso de ubicación'), noWidow('Activa la ubicación en Ajustes, o busca la dirección.'));
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude });
    } catch {
      Alert.alert(noWidow('No pudimos ubicarte'), noWidow('Inténtalo otra vez o busca la dirección.'));
    } finally {
      setLocating(null);
    }
  };
  const searchAddress = async () => {
    if (!direccion.trim()) {
      Alert.alert(noWidow('Escribe la dirección'), noWidow('Calle, número y colonia; o márcalo estando ahí.'));
      return;
    }
    setLocating('search');
    try {
      const [found] = await Location.geocodeAsync(`${direccion.trim()}, Ciudad de México, México`);
      if (!found) throw new Error('not found');
      setCoords({ latitude: found.latitude, longitude: found.longitude });
    } catch {
      Alert.alert(noWidow('No encontramos esa dirección'), noWidow('Revisa la calle y la colonia, o márcalo estando ahí.'));
    } finally {
      setLocating(null);
    }
  };
  const toggleDay = (day: number) => setDias((current) => (current.includes(day) ? current.filter((item) => item !== day) : [...current, day]));

  const missing = [
    !nombre.trim() ? 'el nombre' : null,
    dia && !dias.length ? 'los días' : null,
    !coords ? 'el lugar en el mapa' : null,
  ].filter((item): item is string => !!item);
  const blockedBy = missing.length ? `Falta ${missing.length > 1 ? `${missing.slice(0, -1).join(', ')} y ${missing[missing.length - 1]}` : missing[0]}` : null;

  const save = async () => {
    if (!negocioId || !coords || blockedBy || saving) return;
    setSaving(true);
    try {
      await savePunto(negocioId, { id, nombre, direccion, latitude: coords.latitude, longitude: coords.longitude, ...(dia ? { dias } : {}) });
      router.back();
    } catch (error) {
      const rejected = error instanceof Error && /CONTENT_REJECTED/.test(error.message);
      Alert.alert(noWidow('No se guardó'), noWidow(rejected ? 'Patio no permite insultos ni lenguaje ofensivo.' : 'Revisa tu conexión e inténtalo otra vez.'));
    } finally {
      setSaving(false);
    }
  };
  const remove = () => {
    if (!id) return;
    Alert.alert(noWidow(dia ? '¿Eliminar este lugar?' : '¿Eliminar esta sucursal?'), noWidow('Deja de verse en tu ficha y en el mapa.'), [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => {
          deletePunto(id).then(() => router.back()).catch(() => Alert.alert(noWidow('No se eliminó'), noWidow('Revisa tu conexión e inténtalo otra vez.')));
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[s.nav, { paddingTop: insets.top + 8 }]}>
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={() => router.back()} />
      </View>
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} color={theme.textSecondary} accessibilityLabel="Cargando" />
      ) : (
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
          <Text style={s.title} accessibilityRole="header">{noWidow(id ? (dia ? 'Lugar' : 'Sucursal') : dia ? 'Agregar lugar' : 'Agregar sucursal')}</Text>
          <Text style={s.help}>{noWidow(dia ? 'Dónde te encuentran esos días. Ese día, tu pin del mapa se pone aquí.' : 'Otro lugar donde vendes lo mismo. Sale en el mapa y en tu ficha.')}</Text>

          <View style={s.card}>
            <Text style={s.label}>Nombre</Text>
            <TextInput
              style={s.input}
              value={nombre}
              onChangeText={(value) => setNombre(value.slice(0, 60))}
              placeholder={dia ? 'Tianguis de la Portales' : 'Sucursal Roma'}
              placeholderTextColor={theme.textMute}
              selectionColor={theme.accent}
              autoCapitalize="sentences"
              returnKeyType="next"
              accessibilityLabel="Nombre"
            />
            <View style={s.divider} />
            <Text style={s.label}>Dirección</Text>
            <TextInput
              style={s.input}
              value={direccion}
              onChangeText={(value) => setDireccion(value.slice(0, 200))}
              placeholder="Calle y colonia"
              placeholderTextColor={theme.textMute}
              selectionColor={theme.accent}
              autoCapitalize="sentences"
              returnKeyType="search"
              onSubmitEditing={() => { void searchAddress(); }}
              accessibilityLabel="Dirección"
            />
          </View>

          {dia && (
            <>
              <Text style={s.sectionLabel}>Días</Text>
              <View style={s.days}>
                {WEEK_ORDER.map((day) => {
                  const on = dias.includes(day);
                  return (
                    <TouchableOpacity
                      key={day}
                      style={[s.day, on && s.dayOn]}
                      onPress={() => toggleDay(day)}
                      activeOpacity={0.8}
                      accessibilityRole="button"
                      accessibilityLabel={dayName(day)}
                      accessibilityState={{ selected: on }}>
                      <Text style={[s.dayText, on && s.dayTextOn]}>{dayShort(day)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          <Text style={s.sectionLabel}>En el mapa</Text>
          <View style={s.card}>
            <TouchableOpacity style={s.action} onPress={() => { void markHere(); }} disabled={!!locating} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Marcar donde estoy">
              <Ionicons name="navigate-outline" size={18} color={theme.accent} />
              <Text style={s.actionText}>{locating === 'gps' ? 'Ubicando…' : 'Marcar donde estoy'}</Text>
            </TouchableOpacity>
            <View style={s.divider} />
            <TouchableOpacity style={s.action} onPress={() => { void searchAddress(); }} disabled={!!locating} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Buscar la dirección">
              <Ionicons name="search-outline" size={18} color={theme.accent} />
              <Text style={s.actionText}>{locating === 'search' ? 'Buscando…' : 'Buscar la dirección'}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.status} accessibilityLiveRegion="polite">
            <Ionicons name={coords ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={coords ? theme.accent : theme.textMute} />
            <Text style={s.statusText}>{noWidow(coords ? 'Marcado en el mapa' : 'Todavía no está en el mapa')}</Text>
          </View>

          {!!id && (
            <TouchableOpacity style={s.delete} onPress={remove} activeOpacity={0.7} accessibilityRole="button">
              <Text style={s.deleteText}>{dia ? 'Eliminar este lugar' : 'Eliminar esta sucursal'}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
      <View style={[s.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.cta, (!!blockedBy || saving) && s.ctaIdle]}
          onPress={() => { void save(); }}
          disabled={!!blockedBy || saving}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ disabled: !!blockedBy || saving, busy: saving }}>
          <Text style={[s.ctaText, !!blockedBy && s.ctaTextIdle]}>{noWidow(saving ? 'Guardando…' : blockedBy ?? 'Guardar')}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { paddingHorizontal: 14, paddingBottom: 4 },
    content: { paddingHorizontal: 20, paddingTop: 8 },
    title: { ...Type.title, color: t.text },
    help: { marginTop: 6, marginBottom: 20, fontSize: 14, lineHeight: 19, color: t.textSecondary },
    card: { borderRadius: 18, borderCurve: 'continuous', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, paddingHorizontal: 16 },
    label: { marginTop: 12, fontSize: 13, fontWeight: '700', color: t.textSecondary },
    input: { minHeight: 44, paddingVertical: 8, fontSize: 16, color: t.text },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: t.border },
    sectionLabel: { marginTop: 24, marginBottom: 8, fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: t.textSecondary },
    days: { flexDirection: 'row', gap: 8 },
    day: { flex: 1, maxWidth: 44, aspectRatio: 1, borderRadius: 100, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    dayOn: { backgroundColor: t.text, borderColor: t.text },
    dayText: { fontSize: 15, fontWeight: '700', color: t.text },
    dayTextOn: { color: t.bg },
    action: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10 },
    actionText: { fontSize: 15, fontWeight: '700', color: t.accent },
    status: { marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusText: { fontSize: 13, color: t.textSecondary },
    delete: { marginTop: 32, minHeight: 44, justifyContent: 'center' },
    deleteText: { fontSize: 15, fontWeight: '600', color: t.danger },
    ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: t.bg },
    cta: { minHeight: 54, borderRadius: 27, borderCurve: 'continuous', backgroundColor: t.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
    ctaIdle: { backgroundColor: t.iconBg },
    ctaText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
    ctaTextIdle: { color: t.textSecondary },
  });
}
