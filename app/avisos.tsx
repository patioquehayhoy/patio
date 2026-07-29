import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsGroup, SettingsRow, type SettingsColors } from '@/components/settings-list';
import { ToggleSwitch } from '@/components/toggle-switch';
import {
  CommunitySignInRequiredError,
  getRemoteNotificationPreferences,
  getSystemNotificationStatus,
  type NotificationPreferences,
  updateRemoteNotificationPreferences,
  syncSavedPatioNotificationSubscriptions,
} from '@/lib/community-notifications';
import { getFavoritePatioIds } from '@/lib/favorites';
import { Fonts, useTheme, type Theme } from '@/lib/theme';

function colors(t: Theme): SettingsColors {
  return {
    surface: t.surface,
    border: t.border,
    text: t.text,
    textSecondary: t.textSecondary,
    textMute: t.textMute,
    accent: t.accent,
    iconBg: t.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(17,18,20,0.04)',
    accentBg: t.accentSoft,
  };
}

export default function AvisosScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const fondero = role === 'fondero';
  const sc = colors(theme);
  const [system, setSystem] = useState<'granted' | 'denied' | 'undetermined' | 'unavailable'>('undetermined');
  const [signedIn, setSignedIn] = useState(true);
  const [updating, setUpdating] = useState<keyof NotificationPreferences | 'reminder' | null>(null);
  const [remote, setRemote] = useState<NotificationPreferences>({
    patioPublications: false,
    businessActivity: true,
    productUpdates: false,
  });

  useFocusEffect(useCallback(() => {
    let active = true;
    getSystemNotificationStatus().then((status) => {
      if (!active) return;
      setSystem(status);
    });
    getRemoteNotificationPreferences()
      .then((prefs) => {
        if (active) {
          setRemote(prefs);
          setSignedIn(true);
        }
      })
      .catch((error) => {
        if (active && error instanceof CommunitySignInRequiredError) setSignedIn(false);
      });
    return () => { active = false; };
  }, []));

  const updateRemote = async (patch: Partial<NotificationPreferences>) => {
    const key = Object.keys(patch)[0] as keyof NotificationPreferences;
    const previous = remote;
    setRemote((current) => ({ ...current, ...patch }));
    setUpdating(key);
    try {
      const next = await updateRemoteNotificationPreferences(patch);
      setRemote(next);
      if (patch.patioPublications !== undefined) {
        const savedIds = await getFavoritePatioIds();
        await syncSavedPatioNotificationSubscriptions(savedIds);
      }
      setSystem(await getSystemNotificationStatus());
    } catch (error) {
      setRemote(previous);
      if (error instanceof CommunitySignInRequiredError) {
        router.push({ pathname: '/comunidad-acceso', params: { returnTo: '/avisos' } });
      } else {
        Alert.alert('No pudimos guardar el cambio', 'Revisa tu conexión e inténtalo otra vez.');
      }
    } finally {
      setUpdating(null);
    }
  };

  const systemLabel = system === 'granted'
    ? 'Permitidos en este iPhone'
    : system === 'denied'
      ? 'Desactivados en Ajustes de iOS'
      : system === 'unavailable'
        ? 'Disponibles en la app instalada'
        : 'Se pedirán cuando actives un aviso';

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.header}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: theme.text }]}>Avisos</Text>
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 34 }]} showsVerticalScrollIndicator={false}>
        <SettingsGroup c={sc} label={fondero ? 'Tu negocio' : 'Tus guardados'}>
          {fondero ? (
            <SettingsRow
              c={sc}
              icon="chatbubble-ellipses-outline"
              title="Actividad importante"
              sub="Reseñas y actividad de tu Patio"
              trailing={<ToggleSwitch value={signedIn && remote.businessActivity} disabled={updating === 'businessActivity'} onValueChange={(value) => signedIn ? updateRemote({ businessActivity: value }) : router.push('/fondero-acceso')} />}
            />
          ) : (
            <SettingsRow
              c={sc}
              icon="restaurant-outline"
              title="Menús nuevos"
              sub="Cuando un lugar que guardaste publica"
              trailing={<ToggleSwitch value={signedIn && remote.patioPublications} disabled={updating === 'patioPublications'} onValueChange={(value) => signedIn ? updateRemote({ patioPublications: value }) : router.push({ pathname: '/comunidad-acceso', params: { returnTo: '/avisos' } })} />}
            />
          )}
        </SettingsGroup>

        {system === 'denied' && <SettingsGroup c={sc} label="Este iPhone">
          <SettingsRow
            c={sc}
            icon="settings-outline"
            title="Activar en Ajustes"
            sub={systemLabel}
            onPress={() => Linking.openSettings()}
          />
        </SettingsGroup>}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 22, paddingTop: 4 },
  back: { width: 42, height: 42, marginLeft: -10, marginBottom: 10, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 38, lineHeight: 40, letterSpacing: -1.3, fontWeight: '900', fontFamily: Fonts.brand },
  content: { paddingHorizontal: 18, paddingTop: 18 },
});
