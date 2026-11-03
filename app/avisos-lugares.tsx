import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import { getMutedPatioIds, setPatioNotifications } from '@/lib/community-notifications';
import { getFavoritePatioIds } from '@/lib/favorites';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

type Place = { id: string; name: string };

// Avisos lugar por lugar, como la campana de YouTube o de Instagram: sigues a
// todos, pero solo te llegan los menús de los que dejas encendidos.
export default function AvisosLugaresScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const sc = settingsColors(theme);
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [failed, setFailed] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setFailed(false);
    (async () => {
      const ids = (await getFavoritePatioIds()).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
      const [rows, silenced] = await Promise.all([
        ids.length ? supabase.from('negocios').select('id,nombre').in('id', ids) : Promise.resolve({ data: [], error: null }),
        getMutedPatioIds(),
      ]);
      if (rows.error) throw rows.error;
      if (!active) return;
      setPlaces(((rows.data ?? []) as { id: string; nombre: string | null }[])
        .filter((row) => row.nombre?.trim())
        .map((row) => ({ id: row.id, name: row.nombre!.trim() }))
        .sort((a, b) => a.name.localeCompare(b.name, 'es')));
      setMuted(silenced);
    })().catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []));

  const toggle = async (id: string, on: boolean) => {
    setMuted((current) => { const next = new Set(current); if (on) next.delete(id); else next.add(id); return next; });
    try {
      await setPatioNotifications(id, on);
    } catch {
      setMuted((current) => { const next = new Set(current); if (on) next.add(id); else next.delete(id); return next; });
      Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
    }
  };
  const setAll = (on: boolean) => { for (const place of places ?? []) if (muted.has(place.id) === on) void toggle(place.id, on); };
  const allOn = !!places?.length && places.every((place) => !muted.has(place.id));

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" numberOfLines={1} style={[s.navTitle, { color: theme.text }]}>Elegir lugares</Text>
        {places?.length ? (
          <TouchableOpacity style={s.navAction} onPress={() => setAll(!allOn)} accessibilityRole="button">
            <Text style={[s.navActionText, { color: theme.accent }]}>{allOn ? 'Silenciar todos' : 'Activar todos'}</Text>
          </TouchableOpacity>
        ) : <View style={s.back} />}
      </View>
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
        <Text style={[s.help, { color: theme.textSecondary }]}>
          {noWidow('Te avisamos cuando estos lugares publican su menú, una vez al día por lugar y no más de tres avisos al día en total.')}
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
              <SettingsRow
                key={place.id}
                c={sc}
                icon={muted.has(place.id) ? 'notifications-off-outline' : 'notifications-outline'}
                title={place.name}
                divider={index > 0}
                trailing={<ToggleSwitch value={!muted.has(place.id)} accessibilityLabel={`Avisos de ${place.name}`} onValueChange={(on) => { void toggle(place.id, on); }} />}
              />
            ))}
          </SettingsGroup>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { flex: 1, textAlign: 'center', fontSize: 17, lineHeight: 22, fontWeight: '700' },
  navAction: { minHeight: 44, justifyContent: 'center' },
  navActionText: { fontSize: 16, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 8 },
  help: { fontSize: 14, lineHeight: 19, marginBottom: 16 },
});
