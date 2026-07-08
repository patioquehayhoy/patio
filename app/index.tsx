import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { initializeSignedInUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Fonts, useTheme } from '@/lib/theme';

const ROLE_KEY = '@patio_user_role';
const ONBOARDING_KEY = 'onboarding_done';
const DEV_VERSION = 'HOY · 2026.07.04 · 12:52';

export default function LoginScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // En desarrollo siempre mostramos esta entrada: sirve como selector de
        // rol y como prueba visible de que el iPhone cargó el bundle actual.
        if (__DEV__) {
          setCheckingSession(false);
          return;
        }
        const onboardingDone = await AsyncStorage.getItem(ONBOARDING_KEY);
        if (onboardingDone !== '1') {
          router.replace('/onboarding');
          return;
        }
        const [{ data }, savedRole] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem(ROLE_KEY),
        ]);
        if (data.session) await initializeSignedInUser(data.session);
        if (savedRole === 'fondero' && data.session) {
          router.replace('/menu');
          return;
        }
        if (savedRole === 'foodie') {
          router.replace('/explorar');
          return;
        }
      } catch {}
      setCheckingSession(false);
    })();
  }, []);

  const handleExplore = () => {
    AsyncStorage.setItem(ROLE_KEY, 'foodie').catch(() => {});
    router.replace('/explorar');
  };

  const handlePublishMenu = () => {
    AsyncStorage.setItem(ROLE_KEY, 'fondero').catch(() => {});
    // En dev entra directo al flujo Fondero sin magic link, para poder probar.
    if (__DEV__) { router.replace('/menu'); return; }
    router.push('/fondero-acceso');
  };

  const handleDevFoodie = () => {
    AsyncStorage.setItem(ROLE_KEY, 'foodie').catch(() => {});
    router.replace('/explorar');
  };

  const handleDevFondero = () => {
    AsyncStorage.setItem(ROLE_KEY, 'fondero').catch(() => {});
    router.replace('/menu');
  };

  if (checkingSession) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <AgentSpinner variant="arc" size={28} color={theme.text} />
      </View>
    );
  }

  const logo = theme.isDark
    ? require('../assets/images/logo-blanco.png')
    : require('../assets/images/logo-negro.png');

  return (
    <View style={[styles.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.choiceRoot, { paddingBottom: insets.bottom + 18 }]}>
        <View style={styles.logoArea}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={[styles.taglineBold, { color: theme.text }]}>¿Qué hay hoy?</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>Saaaaaaabes.</Text>
        </View>
        <View style={styles.choiceActions}>
          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: theme.text }]}
            onPress={handleExplore}
            activeOpacity={0.86}>
            <Text style={[styles.primaryBtnText, { color: theme.bg }]}>Explorar cocinas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handlePublishMenu}
            activeOpacity={0.7}>
            <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>Publicar mi menú</Text>
          </TouchableOpacity>

          {__DEV__ && (
            <>
              <Text style={[styles.devVersion, { color: theme.textMute }]}>DEV · {DEV_VERSION}</Text>
              <View style={[styles.devBar, { borderColor: theme.border }]}>
                <TouchableOpacity
                  style={[styles.devBtn, { borderColor: theme.border }]}
                  onPress={handleDevFoodie}
                  activeOpacity={0.7}>
                  <Text style={[styles.devBtnText, { color: theme.textSecondary }]}>DEV · Foodie</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.devBtn, { borderColor: theme.border }]}
                  onPress={handleDevFondero}
                  activeOpacity={0.7}>
                  <Text style={[styles.devBtnText, { color: theme.textSecondary }]}>DEV · Fondero</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.devBtn, { borderColor: theme.border }]}
                  onPress={() => router.replace('/onboarding')}
                  activeOpacity={0.7}>
                  <Text style={[styles.devBtnText, { color: theme.textSecondary }]}>DEV · Onboarding</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, paddingHorizontal: 24 },

  // Choice layout
  choiceRoot: { flex: 1, justifyContent: 'space-between' },
  logoArea: { alignItems: 'center', paddingTop: 150 },
  logo: { width: 270, height: 100, marginLeft: -6, marginBottom: 14 },
  taglineBold: { fontSize: 15, fontWeight: '900', fontFamily: Fonts.brand, textAlign: 'center' },
  tagline: { fontSize: 15, fontWeight: '300', fontFamily: Fonts.brand, textAlign: 'center' },
  choiceActions: { gap: 10 },
  primaryBtn: { minHeight: 56, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  secondaryBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '300' },
  devVersion: { marginTop: 8, textAlign: 'center', fontSize: 10, fontWeight: '600', letterSpacing: 0.8 },
  devBar: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  devBtn: { flex: 1, minHeight: 38, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  devBtnText: { fontSize: 12, fontWeight: '300' },
});
