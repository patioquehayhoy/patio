import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { MenuComposer } from '@/components/menu-composer';
import { useFotoMenuController } from '@/lib/controllers/useFotoMenuController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { useTheme, type Theme } from '@/lib/theme';

// Cámara mínima de Patio: conserva captura nativa mediante expo-camera, pero
// Patio controla jerarquía, encuadre y acciones. No agrega filtros ni edición
// cosmética: el objetivo es obtener un menú legible con la menor fricción.
export default function FotoMenuScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(theme);
  const { analyzePhoto, cancelRead, choosePhoto, menu, prepareCamera, state } = useFotoMenuController({
    onExit: () => router.replace('/menu'),
    onManual: () => router.replace('/menu-editar'),
  });
  const launched = useRef(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  useEffect(() => {
    if (!launched.current) {
      launched.current = true;
      if (source === 'library') void choosePhoto();
      else void prepareCamera().then(setCameraAllowed);
    }
  }, [choosePhoto, prepareCamera, source]);

  const capture = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, exif: false, shutterSound: true });
      if (photo) await analyzePhoto(photo.uri, photo.width, photo.height);
    } finally {
      setCapturing(false);
    }
  };

  const retake = async () => {
    const allowed = await prepareCamera();
    setCameraAllowed(allowed);
  };

  if (state === 'review') {
    return (
      <MenuComposer
        initialData={menu}
        source="foto"
        // Cerrar la revisión sale del flujo — regresar a 'idle' dejaba una
        // pantalla en blanco sin cámara ni salida.
        onBack={() => router.replace('/menu')}
        onRetake={retake}
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

  // Captura: visor completo, guía vertical flexible y controles en zonas
  // seguras. La guía no recorta la foto; solo ayuda a mantener el menú recto.
  return (
    <View style={s.cameraRoot}>
      <Stack.Screen options={{ headerShown: false }} />
      {cameraAllowed ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          flash={flashOn ? 'on' : 'off'}
          mode="picture"
          animateShutter
          responsiveOrientationWhenOrientationLocked
          onCameraReady={() => setCameraReady(true)}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.cameraLoading]}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      <SafeAreaView style={s.cameraOverlay} pointerEvents="box-none">
        <View style={s.cameraTop}>
          <TouchableOpacity accessibilityLabel="Cerrar cámara" style={s.cameraControl} onPress={() => router.replace('/menu')}>
            <Ionicons name="close" size={23} color="#fff" />
          </TouchableOpacity>
          <View style={s.cameraCopy}>
            <Text style={s.cameraTitle}>Fotografía el menú</Text>
            <Text style={s.cameraHint}>Completo, de frente y con buena luz</Text>
          </View>
          <TouchableOpacity accessibilityLabel={flashOn ? 'Apagar flash' : 'Encender flash'} style={s.cameraControl} onPress={() => setFlashOn((value) => !value)}>
            <Ionicons name={flashOn ? 'flash' : 'flash-off-outline'} size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={s.guide} pointerEvents="none">
          <View style={[s.corner, s.cornerTL]} />
          <View style={[s.corner, s.cornerTR]} />
          <View style={[s.corner, s.cornerBL]} />
          <View style={[s.corner, s.cornerBR]} />
        </View>

        <View style={s.cameraBottom}>
          <TouchableOpacity accessibilityLabel="Elegir de Fotos" style={s.libraryButton} onPress={choosePhoto}>
            <Ionicons name="images-outline" size={22} color="#fff" />
            <Text style={s.libraryText}>Fotos</Text>
          </TouchableOpacity>
          <TouchableOpacity accessibilityLabel="Tomar foto" style={[s.shutterOuter, (!cameraReady || capturing) && s.shutterOff]} onPress={capture} disabled={!cameraReady || capturing}>
            <View style={s.shutterInner} />
          </TouchableOpacity>
          <View style={s.libraryButton} />
        </View>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(theme: Theme) {
  const c = fonderoPalette(theme.isDark);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    processingTitle: { marginTop: 18, fontSize: 20, fontWeight: '900', color: c.text },
    processingBody: { maxWidth: 280, marginTop: 7, textAlign: 'center', fontSize: 13, lineHeight: 19, fontWeight: '400', color: c.textSecondary },
    cancelBtn: { marginTop: 28, minHeight: 44, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
    cancelText: { fontSize: 15, fontWeight: '400', color: c.textSecondary },
    cameraRoot: { flex: 1, backgroundColor: '#000' },
    cameraLoading: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#090909' },
    cameraOverlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 18, backgroundColor: 'rgba(0,0,0,0.08)' },
    cameraTop: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12 },
    cameraControl: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
    cameraCopy: { flex: 1, alignItems: 'center' },
    cameraTitle: { color: '#fff', fontSize: 16, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 8 },
    cameraHint: { marginTop: 3, color: 'rgba(255,255,255,0.72)', fontSize: 11.5, fontWeight: '400', textShadowColor: 'rgba(0,0,0,0.45)', textShadowRadius: 8 },
    guide: { alignSelf: 'center', width: '88%', flex: 1, maxHeight: '68%', marginVertical: 18 },
    corner: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.86)' },
    cornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 8 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 8 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 8 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 8 },
    cameraBottom: { minHeight: 122, paddingBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    libraryButton: { width: 72, minHeight: 54, alignItems: 'center', justifyContent: 'center' },
    libraryText: { marginTop: 4, color: '#fff', fontSize: 11.5, fontWeight: '600' },
    shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
    shutterOff: { opacity: 0.45 },
  });
}
