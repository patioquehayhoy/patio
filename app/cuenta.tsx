import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountSettings } from '@/components/account-settings';
import { hasUnseenFoodieActivity } from '@/lib/activity-feed';
import { getFollowRequests, getMyProfilePrivacy, getProfileStats, setProfilePrivate } from '@/lib/profile-privacy';
import { ToggleSwitch } from '@/components/toggle-switch';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { bottomTabClearance } from '@/lib/layout-metrics';
import { SettingsGroup, SettingsRow, settingsColors } from '@/components/settings-list';
import { useFoodieAccountController } from '@/lib/controllers/useFoodieAccountController';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { useTheme, type Theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { noWidow } from '@/lib/typography';

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    content: { paddingBottom: 120 },

    body: { paddingHorizontal: 20, paddingTop: 20 },
    newsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    newsDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: t.accent },
  });
}


export default function CuentaScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const sc = settingsColors(theme);
  const insets = useSafeAreaInsets();
  const { onScroll } = useTabBarScroll();
  const { handleDevFondero, handleFonderoAccess, hasSession } = useFoodieAccountController();
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)).catch(() => {}); }, []);
  // El punto de la pestaña Perfil lleva a algún lado: el mismo punto marca la
  // fila de Actividad, que es donde está lo nuevo.
  const [hasNews, setHasNews] = useState(false);
  // Perfil privado, como Instagram: null mientras no hay perfil de Foodie.
  const [isPrivate, setIsPrivate] = useState<boolean | null>(null);
  const [follow, setFollow] = useState<{ followers: number; following: number } | null>(null);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    hasUnseenFoodieActivity().then((value) => { if (active) setHasNews(value); }).catch(() => {});
    getMyProfilePrivacy().then((value) => { if (active) setIsPrivate(value); }).catch(() => {});
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      getProfileStats(data.user.id).then((stats) => { if (active) setFollow({ followers: stats.followers, following: stats.following }); }).catch(() => {});
    }).catch(() => {});
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
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottomTabClearance(insets.bottom) }]} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
        {/* Pestaña raíz: sin flecha 'atrás' — se navega con la tab bar (modelo
            Instagram). El back solo existe en pantallas hijas. La identidad
            de la pestaña ya la da la tab bar; no se repite aquí arriba. */}
        <View style={s.body}>
          {/* Un solo nivel: quién eres arriba, ajustes abajo. */}
          <SettingsGroup c={sc} label="Perfil">
            <SettingsRow c={sc} icon="person-outline" title={hasSession ? 'Editar perfil' : 'Iniciar sesión'} sub={hasSession ? 'Nombre, foto y descripción' : 'Sincroniza listas y reseñas'} onPress={() => router.push(hasSession ? '/perfil-comunidad' : '/comunidad-acceso')} />
            {userId && <SettingsRow c={sc} icon="at-outline" title="Ver mi perfil" sub={follow ? `${follow.followers} ${follow.followers === 1 ? 'seguidor' : 'seguidores'} · ${follow.following} siguiendo` : undefined} divider onPress={() => router.push({ pathname: '/foodie/[id]', params: { id: userId } })} />}
            {isPrivate !== null && <SettingsRow
              c={sc}
              icon={isPrivate ? 'lock-closed-outline' : 'lock-open-outline'}
              title="Perfil privado"
              sub={isPrivate ? 'Solo quienes apruebas ven tus listas' : 'Cualquiera ve tus listas públicas'}
              divider
              trailing={<ToggleSwitch value={isPrivate} disabled={savingPrivacy} onValueChange={(value) => { void changePrivacy(value); }} accessibilityLabel="Perfil privado" />}
            />}
            {userId && <SettingsRow
              c={sc}
              icon="heart-outline"
              title="Actividad"
              sub={hasNews ? 'Tienes novedades' : 'Comentarios, me gusta y seguidores'}
              divider
              onPress={() => router.push('/notificaciones')}
              trailing={hasNews ? (
                <View style={s.newsRow}>
                  <View style={s.newsDot} />
                  <Ionicons name="chevron-forward" size={16} color={theme.textMute} />
                </View>
              ) : undefined}
            />}
          </SettingsGroup>

          {/* El Foodie no tiene planes: la única puerta es registrar un negocio. */}
          <SettingsGroup c={sc}>
            <SettingsRow c={sc} icon="storefront-outline" title="¿Tienes un negocio?" sub="Publica tu menú gratis" onPress={() => void (__DEV__ ? handleDevFondero() : handleFonderoAccess())} />
          </SettingsGroup>

          <AccountSettings role="foodie" />
        </View>
      </ScrollView>
      <BottomTabBar variant="foodie" />
    </View>
  );
}
