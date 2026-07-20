import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
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
  const { cancelRead, choosePhoto, menu, openCamera, state } = useFotoMenuController({
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
        // Cerrar la revisión sale del flujo — regresar a 'idle' dejaba una
        // pantalla en blanco sin cámara ni salida.
        onBack={() => router.replace('/menu')}
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
        <TouchableOpacity style={s.cancelBtn} onPress={cancelRead} accessibilityLabel="Cancelar lectura" activeOpacity={0.7}>
          <Text style={s.cancelText}>Cancelar</Text>
        </TouchableOpacity>
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
    cancelBtn: { marginTop: 28, minHeight: 44, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
    cancelText: { fontSize: 15, fontWeight: '300', color: c.textSecondary },
  });
}
