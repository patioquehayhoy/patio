import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, InteractionManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { MenuComposer } from '@/components/menu-composer';
import { useFotoMenuController } from '@/lib/controllers/useFotoMenuController';
import { fonderoPalette } from '@/lib/fondero-palette';
import { useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Cámara mínima de Patio: conserva captura nativa mediante expo-camera, pero
// Patio controla jerarquía, encuadre y acciones. No agrega filtros ni edición
// cosmética: el objetivo es obtener un menú legible con la menor fricción.
export default function FotoMenuScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  // Cámara solo con elección explícita: cualquier otra entrada abre Fotos.
  const fromLibrary = source !== 'camera';
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(theme);
  const { analyzePhoto, cameraAllowed, cancelRead, choosePhoto, menu, prepareCamera, state } = useFotoMenuController({
    onExit: () => router.replace('/historial'),
    onManual: () => router.replace('/menu-editar'),
    photoSource: fromLibrary ? 'library' : 'camera',
  });
  const launched = useRef(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  // expo-camera no trae pellizco propio. `zoom` es 0–1 del rango del equipo;
  // en iOS crece de forma exponencial, por eso el pellizco suma log2(escala).
  const [zoom, setZoom] = useState(0);
  const zoomRef = useRef(0);
  const pinchBase = useRef(0);
  const zoomFrame = useRef<number | null>(null);
  const applyZoom = (value: number) => {
    zoomRef.current = Math.min(MAX_ZOOM, Math.max(0, value));
    if (zoomFrame.current !== null) return;
    zoomFrame.current = requestAnimationFrame(() => {
      zoomFrame.current = null;
      setZoom(zoomRef.current);
    });
  };
  const pinch = Gesture.Pinch()
    .runOnJS(true)
    .onStart(() => { pinchBase.current = zoomRef.current; })
    .onUpdate((event) => { applyZoom(pinchBase.current + Math.log2(Math.max(event.scale, 0.01)) * ZOOM_PER_DOUBLING); });

  // Pedir el permiso de cámara aquí ya es seguro (HIG Privacy: acceso en
  // contexto): para llegar a esta pantalla con `source=camera` la persona
  // ya eligió "Tomar foto" en NewMenuSheet — la elección explícita vive un
  // paso antes, no aquí. Antes esta pantalla se abría directo desde el "+"
  // y pedía el permiso de golpe sin que la persona hubiera elegido cámara
  // todavía; ahora ese momento de elección ocurre siempre antes de entrar.
  useEffect(() => {
    if (launched.current) return;
    if (!fromLibrary) { launched.current = true; void prepareCamera(); return; }
    // iOS no presenta Fotos mientras la transición de entrada sigue activa.
    const task = InteractionManager.runAfterInteractions(() => {
      if (launched.current) return;
      launched.current = true;
      void choosePhoto();
    });
    return () => task.cancel();
  }, [choosePhoto, fromLibrary, prepareCamera]);

  useEffect(() => () => { if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current); }, []);

  const shutterDisabled = !cameraReady || capturing;

  const capture = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, exif: false, shutterSound: true });
      if (photo) await analyzePhoto(photo.uri, photo.width, photo.height);
    } catch {
      Alert.alert(noWidow('No se pudo tomar la foto'), noWidow('Inténtalo otra vez o elige una foto de tu galería.'));
    } finally {
      setCapturing(false);
    }
  };

  const retake = async () => {
    if (fromLibrary) { await choosePhoto(); return; }
    setCameraReady(false);
    applyZoom(0);
    await prepareCamera();
  };

  if (state === 'review') {
    return (
      <MenuComposer
        initialData={menu}
        source="foto"
        // Cerrar la revisión sale del flujo — regresar a 'idle' dejaba una
        // pantalla en blanco sin cámara ni salida.
        onBack={() => router.replace('/historial')}
        onRetake={retake}
      />
    );
  }

  if (state === 'processing') {
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AgentSpinner variant="dots" size={34} color={c.accent} />
        <Text style={s.processingTitle}>{noWidow('Leyendo tu menú…')}</Text>
        <Text style={s.processingBody}>{noWidow('Detectando cada platillo.')}</Text>
        <TouchableOpacity style={s.cancelBtn} onPress={cancelRead} accessibilityRole="button" accessibilityLabel="Cancelar lectura" activeOpacity={0.7}>
          <Text style={s.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Photos is a separate source: never mount or show the camera while its
  // native picker opens, is retried, or returns a reading error.
  if (fromLibrary) {
    return <SafeAreaView style={[s.root, s.center]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Ionicons name="images-outline" size={32} color={c.textSecondary} />
      <Text style={s.processingTitle}>{noWidow('Elige una foto de tu menú')}</Text>
      <TouchableOpacity style={s.cancelBtn} onPress={() => { void choosePhoto(); }} accessibilityRole="button" accessibilityLabel="Elegir de Fotos">
        <Text style={s.cancelText}>{noWidow('Elegir de Fotos')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.cancelBtn} onPress={cancelRead} accessibilityRole="button" accessibilityLabel="Cancelar selección de foto">
        <Text style={s.cancelText}>Cancelar</Text>
      </TouchableOpacity>
    </SafeAreaView>;
  }

  // Captura: visor completo, guía vertical flexible y controles en zonas
  // seguras. La guía no recorta la foto; solo ayuda a mantener el menú recto.
  return (
    <GestureDetector gesture={pinch}>
    <View style={s.cameraRoot}>
      <Stack.Screen options={{ headerShown: false }} />
      {cameraAllowed ? (
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing="back"
          flash={flashOn ? 'on' : 'off'}
          zoom={zoom}
          mode="picture"
          animateShutter
          responsiveOrientationWhenOrientationLocked
          onCameraReady={() => setCameraReady(true)}
          onMountError={() => {
            setCameraReady(false);
            Alert.alert(noWidow('No se pudo abrir la cámara'), noWidow('Puedes elegir una foto de tu galería.'), [
              { text: 'Elegir de Fotos', onPress: () => { void choosePhoto(); } },
              { text: 'Cerrar', style: 'cancel', onPress: cancelRead },
            ]);
          }}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.cameraLoading]}>
          <ActivityIndicator color="#fff" />
        </View>
      )}

      <SafeAreaView style={s.cameraOverlay} pointerEvents="box-none">
        <View style={s.cameraTop}>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar cámara" style={s.cameraControl} onPress={() => router.replace('/historial')}>
            <Ionicons name="close" size={23} color="#fff" />
          </TouchableOpacity>
          <View style={s.cameraCopy}>
            <Text style={s.cameraTitle}>{noWidow('Fotografía el menú')}</Text>
            <Text style={s.cameraHint}>{noWidow('Completo, de frente y con buena luz')}</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={flashOn ? 'Apagar flash' : 'Encender flash'}
            accessibilityState={{ selected: flashOn }}
            style={s.cameraControl}
            onPress={() => setFlashOn((value) => !value)}>
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
          {zoom > 0.001 ? (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Quitar zoom" style={s.zoomReset} onPress={() => applyZoom(0)}>
              <Text style={s.zoomResetText}>1×</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Tomar foto"
            accessibilityState={{ disabled: shutterDisabled }}
            style={[s.shutterOuter, shutterDisabled && s.shutterOff]}
            onPress={capture}
            disabled={shutterDisabled}>
            <View style={s.shutterInner} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
    </GestureDetector>
  );
}

const MAX_ZOOM = 0.6;
const ZOOM_PER_DOUBLING = 0.16;

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
    cameraTop: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    cameraBottom: { minHeight: 122, paddingBottom: 10, alignItems: 'center', justifyContent: 'center', gap: 14 },
    zoomReset: { minWidth: 44, height: 32, borderRadius: 16, paddingHorizontal: 10, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
    zoomResetText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
    shutterOff: { opacity: 0.45 },
  });
}
