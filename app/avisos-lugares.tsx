import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { createRef, useCallback, useRef, useState, type RefObject } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ActionSheet } from '@/components/action-sheet';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { getPatioNotificationModes, PATIO_NOTIFY_HINTS, PATIO_NOTIFY_ICONS, PATIO_NOTIFY_LABELS, setPatioNotificationMode, type PatioNotifyMode } from '@/lib/community-notifications';
import { getFavoritePatioIds } from '@/lib/favorites';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Place = { id: string; name: string };

// Notificaciones lugar por lugar, con la campana de YouTube tal cual
// (2026-11-21): «Todas», «Personalizadas» (por defecto) o «Ninguna». Tocar el
// lugar abre las tres ahí mismo.
const MODES: PatioNotifyMode[] = ['every', 'digest', 'off'];
const MODE_ICON = PATIO_NOTIFY_ICONS;
export default function AvisosLugaresScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const sc = settingsColors(theme);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [modes, setModes] = useState<Map<string, PatioNotifyMode>>(new Map());
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, RefObject<View | null>>());
  const refFor = (id: string) => {
    let ref = rowRefs.current.get(id);
    if (!ref) { ref = createRef<View>(); rowRefs.current.set(id, ref); }
    return ref;
  };
  const modeOf = (id: string): PatioNotifyMode => modes.get(id) ?? 'digest';
  const [failed, setFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setFailed(false);
    (async () => {
      const ids = (await getFavoritePatioIds()).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
      const [rows, current] = await Promise.all([
        ids.length ? supabase.from('negocios').select('id,nombre').in('id', ids) : Promise.resolve({ data: [], error: null }),
        getPatioNotificationModes(),
      ]);
      if (rows.error) throw rows.error;
      if (!active) return;
      setPlaces(((rows.data ?? []) as { id: string; nombre: string | null }[])
        .filter((row) => row.nombre?.trim())
        .map((row) => ({ id: row.id, name: row.nombre!.trim() }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')));
      setModes(current);
    })().catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []));

  const choose = async (id: string, mode: PatioNotifyMode) => {
    const before = modeOf(id);
    if (before === mode) return;
    setModes((current) => new Map(current).set(id, mode));
    try {
      await setPatioNotificationMode(id, mode);
    } catch {
      setModes((current) => new Map(current).set(id, before));
      Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    }
  };
  const menuPlace = places?.find((place) => place.id === menuFor) ?? null;

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" numberOfLines={1} style={[s.navTitle, { color: theme.text }]}>Elegir lugares</Text>
        <View style={s.back} />
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={[s.help, { color: theme.textSecondary }]}>
          {noWidow('«Todas»: te avisamos al momento en que publica. «Personalizadas»: va en tu resumen del día, un solo aviso con tus lugares (8:00 para desayunos, 11:30 para la comida y 17:30 si hay algo nuevo). «Ninguna»: no te avisamos.')}
        </Text>
        {places === null && !failed ? (
          <ActivityIndicator style={{ marginTop: 32 }} color={theme.textSecondary} accessibilityLabel="Cargando" />
        ) : failed ? (
          <Text style={[s.help, { color: theme.textSecondary, marginTop: 24 }]}>{noWidow('No pudimos cargar tus lugares. Revisa tu conexión.')}</Text>
        ) : !places?.length ? (
          <Text style={[s.help, { color: theme.textSecondary, marginTop: 24 }]}>{noWidow('Todavía no sigues ningún lugar.')}</Text>
        ) : (
          <SettingsGroup c={sc} label="Lugares que sigues">
            {places.map((place, index) => (
              <View key={place.id} ref={refFor(place.id)} collapsable={false}>
                <SettingsRow
                  c={sc}
                  icon={MODE_ICON[modeOf(place.id)]}
                  title={place.name}
                  sub={PATIO_NOTIFY_LABELS[modeOf(place.id)]}
                  divider={index > 0}
                  onPress={() => setMenuFor(place.id)}
                />
              </View>
            ))}
          </SettingsGroup>
        )}
      </ScrollView>
      <ActionSheet
        visible={!!menuPlace}
        anchorRef={menuPlace ? refFor(menuPlace.id) : { current: null }}
        title={menuPlace ? `Notificaciones de ${menuPlace.name}` : undefined}
        onDismiss={() => setMenuFor(null)}
        options={menuPlace ? MODES.map((mode) => ({
          label: PATIO_NOTIFY_LABELS[mode],
          icon: MODE_ICON[mode],
          accessibilityHint: PATIO_NOTIFY_HINTS[mode],
          description: PATIO_NOTIFY_HINTS[mode],
          selected: modeOf(menuPlace.id) === mode,
          onPress: () => { void choose(menuPlace.id, mode); },
        })) : []}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 22, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  help: { fontSize: 14, lineHeight: 19, marginBottom: 16 },
});
