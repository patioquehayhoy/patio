import { router, Stack, useFocusEffect } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSettings } from '@/components/account-settings';
import { GlassIconButton } from '@/components/glass-button';
import { getFollowRequests, getMyProfilePrivacy, setProfilePrivate } from '@/lib/profile-privacy';
import { ToggleSwitch } from '@/components/toggle-switch';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { useFoodieAccountController } from '@/lib/controllers/useFoodieAccountController';
import { Type, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Ajustes del Foodie (2026-11-16): lo que antes era la pestaña Perfil. La
// pestaña ahora es tu perfil público; esto se abre con su engrane.
function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    nav: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
    title: { ...Type.screen, color: t.text, paddingHorizontal: 20, marginBottom: 12 },
    body: { paddingHorizontal: 20 },
  });
}

export default function AjustesScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const sc = settingsColors(theme);
  const insets = useSafeAreaInsets();
  const { handleDevFondero, handleFonderoAccess, hasSession } = useFoodieAccountController();
  // Perfil privado, como Instagram: null mientras no hay perfil de Foodie.
  const [isPrivate, setIsPrivate] = useState<boolean | null>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    getMyProfilePrivacy().then((value) => { if (active) setIsPrivate(value); }).catch(() => {});
    return () => { active = false; };
  }, []));

  const applyPrivacy = async (next: boolean) => {
    setSavingPrivacy(true);
    setIsPrivate(next);
    try {
      await setProfilePrivate(next);
    } catch {
      setIsPrivate(!next);
      Alert.alert(noWidow('No se guardó el cambio'), noWidow('Revisa tu conexión e inténtalo de nuevo.'));
    } finally {
      setSavingPrivacy(false);
    }
  };

  // Al volver a público, las solicitudes pendientes se aceptan (Instagram).
  const changePrivacy = async (next: boolean) => {
    if (next) { void applyPrivacy(true); return; }
    const pending = await getFollowRequests().catch(() => []);
    if (!pending.length) { void applyPrivacy(false); return; }
    Alert.alert(
      noWidow('¿Cambiar a perfil público?'),
      noWidow(`Se aceptarán ${pending.length === 1 ? 'la solicitud pendiente' : `las ${pending.length} solicitudes pendientes`}.`),
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cambiar', onPress: () => { void applyPrivacy(false); } },
      ],
    );
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <GlassIconButton icon="chevron-back" accessibilityLabel="Volver" onPress={() => { if (router.canGoBack()) router.back(); else router.replace('/cuenta'); }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <Text style={s.title} accessibilityRole="header">Ajustes</Text>
        <View style={s.body}>
          <SettingsGroup c={sc} label="Perfil">
            <SettingsRow c={sc} icon="person-outline" title={hasSession ? 'Editar perfil' : 'Iniciar sesión'} sub={hasSession ? 'Nombre, foto y descripción' : 'Entra para reseñar y compartir listas'} onPress={() => router.push(hasSession ? '/perfil-comunidad' : '/comunidad-acceso')} />
            {isPrivate !== null && <SettingsRow
              c={sc}
              icon={isPrivate ? 'lock-closed-outline' : 'lock-open-outline'}
              title="Perfil privado"
              sub={isPrivate ? 'Solo tus seguidores aprobados ven tus listas' : 'Cualquiera ve tus listas públicas'}
              divider
              trailing={<ToggleSwitch value={isPrivate} disabled={savingPrivacy} onValueChange={(value) => { void changePrivacy(value); }} accessibilityLabel="Perfil privado" />}
            />}
          </SettingsGroup>

          {/* El Foodie no tiene planes: la única puerta es registrar un negocio. */}
          <SettingsGroup c={sc}>
            <SettingsRow c={sc} icon="storefront-outline" title="¿Tienes un negocio?" sub="Publica tu menú gratis" onPress={() => void (__DEV__ ? handleDevFondero() : handleFonderoAccess())} />
          </SettingsGroup>

          <AccountSettings role="foodie" />
        </View>
      </ScrollView>
    </View>
  );
}
