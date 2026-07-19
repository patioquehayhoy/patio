import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { MenuComposer } from '@/components/menu-composer';
import { useFotoMenuController } from '@/lib/controllers/useFotoMenuController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { useTheme, type Theme } from '@/lib/theme';

// Sin UI propia de captura: la interfaz es la cámara nativa de iOS
// (decisión 2026-07-18, Alejandro). Esta pantalla solo muestra el estado
// de lectura y la revisión; al entrar lanza la cámara del sistema.
export default function FotoMenuScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(theme);
  const { choosePhoto, menu, openCamera, resetToIdle, state } = useFotoMenuController({
    onExit: () => router.replace('/menu'),
    onManual: () => router.replace('/menu-editar'),
  });
  const launched = useRef(false);

  useEffect(() => {
    if (!launched.current) {
      launched.current = true;
      void (source === 'library' ? choosePhoto() : openCamera());
    }
  }, [choosePhoto, openCamera, source]);

  if (state === 'review') {
    return (
      <MenuComposer
        initialData={menu}
        source="foto"
        onBack={resetToIdle}
        onRetake={openCamera}
      />
    );
  }

  if (state === 'processing') {
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AgentSpinner variant="dots" size={34} color={c.accent} />
        <Text style={s.processingTitle}>Leyendo tu menú…</Text>
        <Text style={s.processingBody}>Detectando cada platillo.</Text>
      </SafeAreaView>
    );
  }

  // idle: la cámara nativa está encima; solo un fondo neutro detrás.
  return (
    <SafeAreaView style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
    </SafeAreaView>
  );
}

function makeStyles(theme: Theme) {
  const c = fonderoPalette(theme.isDark);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    processingTitle: { marginTop: 18, fontSize: 20, fontWeight: '900', color: c.text },
    processingBody: { maxWidth: 280, marginTop: 7, textAlign: 'center', fontSize: 13, lineHeight: 19, fontWeight: '300', color: c.textSecondary },
  });
}
