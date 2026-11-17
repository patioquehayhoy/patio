import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useFocusEffect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useCallback, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hasUnseenFoodieActivity } from '@/lib/activity-feed';
import { BottomTabBar } from '@/components/bottom-tab-bar';
import { bottomTabClearance } from '@/lib/layout-metrics';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { Type, useTheme, type Theme } from '@/lib/theme';
import { supabase } from '@/lib/supabase';
import { noWidow } from '@/lib/typography';
import { ProfileView } from './foodie/[id]';

// Pestaña Perfil (2026-11-16): tu perfil público, tal como lo ven los demás.
// Arriba a la derecha, la campana (Actividad) y el engrane (Ajustes). Sin
// cuenta, la misma pestaña invita a entrar.
export default function CuentaScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const { onScroll } = useTabBarScroll();
  // undefined mientras se sabe; null sin cuenta.
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [hasNews, setHasNews] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    supabase.auth.getUser()
      .then(({ data }) => { if (active) setUserId(data.user && !data.user.is_anonymous ? data.user.id : null); })
      .catch(() => { if (active) setUserId(null); });
    hasUnseenFoodieActivity().then((value) => { if (active) setHasNews(value); }).catch(() => {});
    return () => { active = false; };
  }, []));

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false, presentation: 'card' }} />
      {userId ? (
        <ProfileView id={userId} root hasNews={hasNews} bottomInset={bottomTabClearance(insets.bottom)} onScroll={onScroll} />
      ) : userId === null ? (
        <View style={[s.signedOut, { paddingTop: insets.top }]}>
          <View style={s.nav}>
            <TouchableOpacity style={s.navButton} onPress={() => router.push('/ajustes')} accessibilityRole="button" accessibilityLabel="Ajustes">
              <Ionicons name="settings-outline" size={22} color={theme.text} />
            </TouchableOpacity>
          </View>
          <View style={s.head}>
            <View style={s.avatar}><Ionicons name="person" size={30} color={theme.textMute} /></View>
            <Text style={s.name}>{noWidow('Tu perfil')}</Text>
            <Text style={s.body}>{noWidow('Entra para reseñar, armar tus listas y seguir a quien recomienda.')}</Text>
            <TouchableOpacity style={s.enter} onPress={() => router.push('/comunidad-acceso')} accessibilityRole="button" accessibilityLabel="Entrar">
              <Text style={s.enterText}>Entrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ActivityIndicator style={{ marginTop: insets.top + 80 }} color={theme.textSecondary} accessibilityLabel="Cargando perfil" />
      )}
      <BottomTabBar variant="foodie" />
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: t.bg },
    signedOut: { flex: 1, paddingHorizontal: 20 },
    nav: { height: 52, marginHorizontal: -6, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
    navButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    head: { alignItems: 'center', paddingVertical: 20 },
    avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface },
    name: { ...Type.title, color: t.text, marginTop: 12, textAlign: 'center' },
    body: { fontSize: 14, lineHeight: 20, color: t.textSecondary, textAlign: 'center', marginTop: 10, maxWidth: 300 },
    enter: { minHeight: 50, marginTop: 20, paddingHorizontal: 40, borderRadius: 25, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: t.accent },
    enterText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  });
}
