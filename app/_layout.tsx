import { PlusJakartaSans_800ExtraBold, useFonts } from '@expo-google-fonts/plus-jakarta-sans';
import * as SplashScreen from 'expo-splash-screen';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/lib/theme';
import { TabBarVisibilityProvider } from '@/lib/tab-bar-visibility';

SplashScreen.preventAutoHideAsync();

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
        <Stack.Screen name="patio/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="resena/[id]" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_800ExtraBold });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

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
