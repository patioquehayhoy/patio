import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
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
import { getReminder, setReminder } from '@/lib/local-reminders';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { disableVisits, enableVisits, visitsAvailable, visitsEnabled } from '@/lib/visits';


export default function AvisosScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { role } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const fondero = role === 'fondero';
  const sc = settingsColors(theme);
  const [system, setSystem] = useState<'granted' | 'denied' | 'undetermined' | 'unavailable'>('undetermined');
  const [signedIn, setSignedIn] = useState(true);
  const [preview, setPreview] = useState(false);
  const [updating, setUpdating] = useState<keyof NotificationPreferences | 'reminder' | 'visits' | null>(null);
  const [reminder, setReminderOn] = useState(false);
  const [visits, setVisits] = useState(false);
  // Solo en los builds que ya traen las geocercas (expo-task-manager y
  // ubicación en segundo plano en el Info.plist / manifiesto).
  const [canAskOpinion, setCanAskOpinion] = useState(false);
  useEffect(() => {
    if (fondero) return;
    let active = true;
    visitsAvailable().then((ok) => { if (active) setCanAskOpinion(ok); }).catch(() => {});
    return () => { active = false; };
  }, [fondero]);
  const reminderKind = fondero ? 'publish' : 'lunch';
  const [remote, setRemote] = useState<NotificationPreferences>({
    patioPublications: false,
    businessActivity: true,
    productUpdates: false,
    specialNotices: false,
    newPlaces: false,
    socialActivity: true,
  });

  useFocusEffect(useCallback(() => {
    let active = true;
    getReminder(reminderKind).then((on) => { if (active) setReminderOn(on); }).catch(() => {});
    visitsEnabled().then((on) => { if (active) setVisits(on); }).catch(() => {});
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
  }, [reminderKind]));

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

  const updateReminder = async (value: boolean) => {
    setReminderOn(value);
    setUpdating('reminder');
    try {
      const granted = await setReminder(reminderKind, value);
      if (!granted) setReminderOn(false);
      setSystem(await getSystemNotificationStatus());
    } catch {
      setReminderOn(!value);
      Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Inténtalo otra vez.'));
    } finally {
      setUpdating(null);
    }
  };

  // «Tus visitas»: necesita ubicación «Siempre» para notar visitas reales.
  const updateVisits = async (value: boolean) => {
    setVisits(value);
    setUpdating('visits');
    try {
      if (!value) {
        await disableVisits();
        return;
      }
      const result = await enableVisits();
      if (result === 'enabled') return;
      setVisits(false);
      Alert.alert(
        noWidow('Falta el permiso de ubicación'),
        noWidow('Elige «Siempre» en Ajustes para que Patio note tus visitas.'),
        [{ text: 'Ahora no', style: 'cancel' }, { text: 'Abrir Ajustes', onPress: () => { Linking.openSettings().catch(() => {}); } }],
      );
    } catch {
      setVisits(!value);
      Alert.alert(noWidow('No pudimos guardar el cambio'), noWidow('Inténtalo otra vez.'));
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
          <SettingsGroup c={sc} label={fondero ? 'Tu negocio' : 'Tus lugares'}>
            <SettingsRow
              c={sc}
              icon="person-circle-outline"
              title="Entra a tu cuenta"
              sub={fondero ? 'Para saber cuando alguien opina sobre tu Patio' : 'Para saber cuando tus lugares publican'}
              onPress={() => fondero ? router.push('/fondero-acceso') : router.push({ pathname: '/comunidad-acceso', params: { returnTo: '/avisos' } })}
            />
          </SettingsGroup>
        ) : fondero ? (
          <SettingsGroup c={sc} label="Tu negocio">
            <SettingsRow c={sc} icon="star-outline" title="Reseñas nuevas" sub="Cuando alguien opina sobre tu Patio" trailing={toggle('businessActivity', 'Reseñas nuevas')} />
            <SettingsRow c={sc} icon="chatbubble-ellipses-outline" title="Respuestas" sub="Cuando alguien responde lo que comentaste" divider trailing={toggle('socialActivity', 'Respuestas')} />
          </SettingsGroup>
        ) : (
          // Solo se ofrece lo que de verdad se envía. Lugares nuevos
          // (newPlaces) y Novedades (productUpdates) ya se guardan; vuelven
          // aquí cuando exista su envío. Promociones viene apagado (4.5.4).
          <>
            <SettingsGroup c={sc} label="Tus lugares">
              <SettingsRow c={sc} icon="document-text-outline" title="Menú de hoy" sub="Cuando un lugar que sigues publica" trailing={toggle('patioPublications', 'Menú de hoy')} />
              {remote.patioPublications && <SettingsRow c={sc} icon="options-outline" title="Elegir lugares" sub="Silencia los que no quieres oír" divider onPress={() => router.push('/avisos-lugares')} />}
              <SettingsRow c={sc} icon="megaphone-outline" title="Promociones" sub="Avisos especiales de lugares que sigues" divider trailing={toggle('specialNotices', 'Promociones')} />
            </SettingsGroup>
            <SettingsGroup c={sc} label="Tu comunidad">
              <SettingsRow c={sc} icon="chatbubble-ellipses-outline" title="Comentarios y seguidores" sub="Cuando comentan tus reseñas, te responden o te quieren seguir" trailing={toggle('socialActivity', 'Comentarios y seguidores')} />
            </SettingsGroup>
          </>
        )}

        {/* Los programa el teléfono: funcionan con o sin cuenta. */}
        <SettingsGroup c={sc} label="Recordatorios">
          <SettingsRow
            c={sc}
            icon={fondero ? 'camera-outline' : 'restaurant-outline'}
            title={fondero ? 'Publicar el menú' : 'Hora de comer'}
            sub={fondero ? 'A las 10 de la mañana, si aún no publicas' : 'A la 1 de la tarde, para ver qué hay hoy'}
            trailing={<ToggleSwitch value={reminder} disabled={updating === 'reminder'} accessibilityLabel={fondero ? 'Publicar el menú' : 'Hora de comer'} onValueChange={updateReminder} />}
          />
          {canAskOpinion && (
            <SettingsRow
              c={sc}
              icon="location-outline"
              title="Tus visitas"
              sub="Al salir de un lugar, te preguntamos qué te pareció. Tu visita cuenta, sin tu nombre, para «Qué tan lleno»."
              divider
              trailing={<ToggleSwitch value={visits} disabled={updating === 'visits'} accessibilityLabel="Tus visitas" onValueChange={updateVisits} />}
            />
          )}
        </SettingsGroup>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  navTitle: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  content: { paddingHorizontal: 20, paddingTop: 16 },
});
