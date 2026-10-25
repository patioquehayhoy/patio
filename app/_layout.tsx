import { PlusJakartaSans_800ExtraBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/lib/theme';
import { TabBarVisibilityProvider } from '@/lib/tab-bar-visibility';
import { PatioGiros } from '@/components/business-category-icon';
import { FoodieFiltersProvider } from '@/lib/foodie-filters-context';

SplashScreen.preventAutoHideAsync().catch(() => {});

// Botánicas de entrada/onboarding/acceso: precargarlas evita el flash negro
// del arranque (en dev los assets llegan por red desde Metro).
const HERO_ASSETS = [
  require('../assets/hero/botanica-1.jpg'),
  require('../assets/hero/botanica-2.jpg'),
  require('../assets/hero/botanica-3.jpg'),
  require('../assets/hero/botanica-5.jpg'),
];

function RootStack() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const [pendingPatioId, setPendingPatioId] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingPatioId || ['/', '/index', '/warmup', '/login-callback'].includes(pathname)) return;
    router.push({ pathname: '/patio/[id]', params: { id: pendingPatioId } });
    setPendingPatioId(null);
  }, [pathname, pendingPatioId]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const refresh = (state: string) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    };
    refresh(AppState.currentState);
    const subscription = AppState.addEventListener('change', refresh);
    return () => { subscription.remove(); supabase.auth.stopAutoRefresh(); };
  }, []);

  useEffect(() => {
    let Notifications: typeof import('expo-notifications') | null = null;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Notifications = require('expo-notifications') as typeof import('expo-notifications');
    } catch {
      return;
    }

    let lastOpened: string | null = null;
    const openResponse = (response: import('expo-notifications').NotificationResponse | null) => {
      const identifier = response?.notification.request.identifier;
      if (!identifier || identifier === lastOpened) return;
      const patioId = response?.notification.request.content.data?.patioId;
      if (typeof patioId === 'string' && patioId) {
        lastOpened = identifier;
        setPendingPatioId(patioId);
        Notifications?.clearLastNotificationResponseAsync().catch(() => {});
      }
    };

    // Covers a tap while Patio is foreground/background and a cold launch.
    const subscription = Notifications.addNotificationResponseReceivedListener(openResponse);
    Notifications.getLastNotificationResponseAsync().then(openResponse).catch(() => {});
    return () => subscription.remove();
  }, []);

  return (
    <>
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: true,
          animation: 'fade',
          animationDuration: 160,
          headerStyle: { backgroundColor: theme.bg },
          headerShadowVisible: false,
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.bg },
        }}>
        <Stack.Screen name="index" options={{ title: 'Login / Registro', headerShown: false, animation: 'none' }} />
        <Stack.Screen name="warmup" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="entrada" options={{ headerShown: false }} />
        <Stack.Screen name="fondero-acceso" options={{ headerShown: false }} />
        <Stack.Screen name="comunidad-acceso" options={{ headerShown: false }} />
        <Stack.Screen name="perfil-comunidad" options={{ headerShown: false }} />
        <Stack.Screen name="avisos" options={{ headerShown: false }} />
        <Stack.Screen name="cuenta" options={{ headerShown: false }} />
        <Stack.Screen name="explorar" options={{ headerShown: false }} />
        <Stack.Screen name="actividad" options={{ headerShown: false }} />
        <Stack.Screen name="coleccion/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="guardar/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="foodie/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="coleccion-publica/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="privacidad" options={{ headerShown: false }} />
        <Stack.Screen name="plan" options={{ headerShown: false }} />
        <Stack.Screen name="favoritos" options={{ headerShown: false }} />
        <Stack.Screen name="vistos" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login-callback" options={{ headerShown: false }} />
        <Stack.Screen name="foto-menu" options={{ headerShown: false }} />
        <Stack.Screen name="menu-editar" options={{ headerShown: false }} />
        <Stack.Screen name="menu-publicado" options={{ headerShown: false }} />
        <Stack.Screen name="historial" options={{ headerShown: false }} />
        <Stack.Screen name="manifiesto" options={{ headerShown: false }} />
        <Stack.Screen name="soporte" options={{ headerShown: false }} />
        <Stack.Screen name="preview" options={{ headerShown: false }} />
        <Stack.Screen name="perfil" options={{ headerShown: false }} />
        <Stack.Screen name="perfil-editar" options={{ headerShown: false }} />
        <Stack.Screen name="resenas" options={{ headerShown: false }} />
        <Stack.Screen name="patio-smart" options={{ headerShown: false }} />
        <Stack.Screen name="patio/[id]" options={{ headerShown: false, presentation: 'transparentModal', animation: 'slide_from_bottom', animationDuration: 220, contentStyle: { backgroundColor: 'transparent' } }} />
        <Stack.Screen name="resena/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ PlusJakartaSans_800ExtraBold, ...MaterialCommunityIcons.font, ...PatioGiros.font });
  const [herosLoaded, setHerosLoaded] = useState(false);

  useEffect(() => {
    // Si un asset falla, no bloquear el arranque.
    Asset.loadAsync(HERO_ASSETS).catch(() => {}).finally(() => setHerosLoaded(true));
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && herosLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontError, fontsLoaded, herosLoaded]);

  if ((!fontsLoaded && !fontError) || !herosLoaded) return null;

  return (
    <ThemeProvider>
      <TabBarVisibilityProvider>
        <FoodieFiltersProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootStack />
          </GestureHandlerRootView>
        </FoodieFiltersProvider>
      </TabBarVisibilityProvider>
    </ThemeProvider>
  );
}
