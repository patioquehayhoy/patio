import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useTheme } from '@/lib/theme';

function RootStack() {
  const { theme } = useTheme();
  return (
    <>
      <Stack
        initialRouteName="index"
        screenOptions={{
          headerShown: true,
          animation: 'none',
          headerStyle: { backgroundColor: theme.bg },
          headerShadowVisible: false,
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.bg },
        }}>
        <Stack.Screen name="index" options={{ title: 'Login / Registro' }} />
        <Stack.Screen name="explorar" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login-callback" options={{ headerShown: false }} />
        <Stack.Screen name="menu" options={{ title: '' }} />
        <Stack.Screen
          name="manifiesto"
          options={{
            title: 'Manifiesto',
            headerBackButtonDisplayMode: 'minimal',
          }}
        />
        <Stack.Screen name="share" options={{ title: 'Compartir' }} />
        <Stack.Screen name="preview" options={{ headerShown: false }} />
        <Stack.Screen name="perfil" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <RootStack />
      </GestureHandlerRootView>
    </ThemeProvider>
  );
}
