import { PlusJakartaSans_800ExtraBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/lib/theme';
import { TabBarVisibilityProvider } from '@/lib/tab-bar-visibility';

SplashScreen.preventAutoHideAsync();

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
        <Stack.Screen name="index" options={{ title: 'Login / Registro' }} />
        <Stack.Screen name="fondero-acceso" options={{ headerShown: false }} />
        <Stack.Screen name="cuenta" options={{ headerShown: false }} />
        <Stack.Screen name="explorar" options={{ headerShown: false }} />
        <Stack.Screen name="favoritos" options={{ headerShown: false }} />
        <Stack.Screen name="vistos" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="push-prompt" options={{ headerShown: false }} />
        <Stack.Screen name="login-callback" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ title: '' }} />
        <Stack.Screen name="foto-menu" options={{ headerShown: false }} />
        <Stack.Screen name="menu-editar" options={{ headerShown: false }} />
        <Stack.Screen name="menu-publicado" options={{ headerShown: false }} />
        <Stack.Screen name="historial" options={{ headerShown: false }} />
        <Stack.Screen name="manifiesto" options={{ headerShown: false }} />
        <Stack.Screen name="preview" options={{ headerShown: false }} />
        <Stack.Screen name="perfil" options={{ headerShown: false }} />
        <Stack.Screen name="perfil-editar" options={{ headerShown: false }} />
        <Stack.Screen name="patio-smart" options={{ headerShown: false }} />
        <Stack.Screen name="patio/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="resena/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_800ExtraBold });
  const [herosLoaded, setHerosLoaded] = useState(false);

  useEffect(() => {
    // Si un asset falla, no bloquear el arranque.
    Asset.loadAsync(HERO_ASSETS).catch(() => {}).finally(() => setHerosLoaded(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded && herosLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded, herosLoaded]);

  if (!fontsLoaded || !herosLoaded) return null;

  return (
    <ThemeProvider>
      <TabBarVisibilityProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <RootStack />
        </GestureHandlerRootView>
      </TabBarVisibilityProvider>
    </ThemeProvider>
  );
}
