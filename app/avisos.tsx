import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
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
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';


export default function AvisosScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const fondero = role === 'fondero';
  const sc = settingsColors(theme);
  const [system, setSystem] = useState<'granted' | 'denied' | 'undetermined' | 'unavailable'>('undetermined');
  const [signedIn, setSignedIn] = useState(true);
  const [preview, setPreview] = useState(false);
  const [updating, setUpdating] = useState<keyof NotificationPreferences | 'reminder' | null>(null);
  const [remote, setRemote] = useState<NotificationPreferences>({
    patioPublications: false,
    businessActivity: true,
    productUpdates: false,
    specialNotices: false,
    newPlaces: false,
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
        if (!active || !(error instanceof CommunitySignInRequiredError)) return;
        // En desarrollo, sin cuenta se ve la pantalla como con cuenta; los
        // cambios se quedan en memoria y no tocan el servidor.
        if (__DEV__) setPreview(true);
        else setSignedIn(false);
      });
    return () => { active = false; };
  }, []));

  const updateRemote = async (patch: Partial<NotificationPreferences>) => {
    const key = Object.keys(patch)[0] as keyof NotificationPreferences;
    const previous = remote;
    setRemote((current) => ({ ...current, ...patch }));
    if (preview) return;
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
        Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Revisa tu conexión e inténtalo otra vez.'));
      }
    } finally {
      setUpdating(null);
    }
  };

  const systemLabel = 'Tu teléfono bloqueó las notificaciones de Patio';
  const toggle = (key: keyof NotificationPreferences, label: string) => (
    <ToggleSwitch value={remote[key]} disabled={updating === key} accessibilityLabel={label} onValueChange={(value) => updateRemote({ [key]: value })} />
  );

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver">
          <Ionicons name="chevron-back" size={21} color={theme.text} />
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[s.navTitle, { color: theme.text }]}>Notificaciones</Text>
        <View style={s.back} />
      </View>

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 34 }]} showsVerticalScrollIndicator={false}>
        {system === 'denied' && <SettingsGroup c={sc}>
          <SettingsRow c={sc} icon="settings-outline" title="Activar en Ajustes" sub={systemLabel} onPress={() => Linking.openSettings()} />
        </SettingsGroup>}

        {!signedIn ? (
          // Sin cuenta no hay a quién avisar: en vez de interruptores muertos, la entrada.
          <SettingsGroup c={sc}>
            <SettingsRow
              c={sc}
              icon="notifications-outline"
              title="Elige qué recibir"
              sub="Entra a tu cuenta para recibir notificaciones de tus lugares"
              onPress={() => fondero ? router.push('/fondero-acceso') : router.push({ pathname: '/comunidad-acceso', params: { returnTo: '/avisos' } })}
            />
          </SettingsGroup>
        ) : fondero ? (
          <SettingsGroup c={sc} label="Tu negocio">
            <SettingsRow c={sc} icon="chatbubble-ellipses-outline" title="Reseñas nuevas" sub="Cuando alguien opina sobre tu Patio" trailing={toggle('businessActivity', 'Reseñas nuevas')} />
          </SettingsGroup>
        ) : (
          // Solo se ofrece lo que el servidor de verdad envía. Promociones
          // (specialNotices), Lugares nuevos (newPlaces) y Novedades
          // (productUpdates) ya se guardan; vuelven aquí cuando exista su envío.
          <SettingsGroup c={sc} label="Tus lugares">
            <SettingsRow c={sc} icon="document-text-outline" title="Menú de hoy" sub="Cuando un lugar que guardaste publica" trailing={toggle('patioPublications', 'Menú de hoy')} />
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
  navTitle: { fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 18, paddingTop: 16 },
});
