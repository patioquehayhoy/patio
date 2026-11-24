import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, InteractionManager, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { MenuComposer } from '@/components/menu-composer';
import { getProStatus } from '@/lib/business-pro';
import { MAX_PAGES, useFotoMenuController } from '@/lib/controllers/useFotoMenuController';
import { getFonditaId } from '@/lib/menu-store';
import { fonderoPalette } from '@/lib/fondero-palette';
import { Type, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Cámara mínima de Patio: conserva captura nativa mediante expo-camera, pero
// Patio controla jerarquía, encuadre y acciones. No agrega filtros ni edición
// cosmética: el objetivo es obtener un menú legible con la menor fricción.
export default function FotoMenuScreen() {
  const { source, uri, width, height } = useLocalSearchParams<{ source?: string; uri?: string; width?: string; height?: string }>();
  // Cámara solo con elección explícita: cualquier otra entrada abre Fotos.
  const fromLibrary = source !== 'camera';
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(theme);
  const { analyzePages, analyzePhoto, cameraAllowed, cancelRead, choosePhoto, menu, prepareCamera, state } = useFotoMenuController({
    onExit: () => router.replace('/historial'),
    onManual: () => router.replace('/menu-editar'),
    photoSource: fromLibrary ? 'library' : 'camera',
  });
  const [slowRead, setSlowRead] = useState(false);
  useEffect(() => {
    setSlowRead(false);
    if (state !== 'processing') return;
    const timer = setTimeout(() => setSlowRead(true), 12_000);
    return () => clearTimeout(timer);
  }, [state]);
  const launched = useRef(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  // Hojas tomadas: una fonda toma una (su pizarrón); un restaurante, su carta
  // completa. «Leer» las manda juntas, como el escáner de Notas.
  const [pages, setPages] = useState<{ uri: string; width?: number; height?: number }[]>([]);
  // «Aviso especial» solo con Pro (dice cuántos quedan).
  const [promoLeft, setPromoLeft] = useState<number | null>(null);
  useEffect(() => {
    const id = getFonditaId();
    if (!id) return;
    let active = true;
    getProStatus(id).then((status) => { if (active) setPromoLeft(status?.proUntil ? status.noticesLeft : null); }).catch(() => {});
    return () => { active = false; };
  }, []);
  const exit = () => { if (router.canGoBack()) router.back(); else router.replace('/historial'); };
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

  // «Crear» (el «＋» del negocio) abre esta cámara: el permiso se pide aquí,
  // en contexto (HIG Privacy), al tocar «＋» para crear. Si se niega, Fotos y
  // «A mano» siguen en la misma pantalla.
  useEffect(() => {
    if (launched.current) return;
    if (!fromLibrary) { launched.current = true; void prepareCamera(); return; }
    // La foto ya se eligió en Nuevo menú: leerla sin volver a abrir Fotos.
    if (uri) { launched.current = true; void analyzePhoto(uri, Number(width) || undefined, Number(height) || undefined); return; }
    // iOS no presenta Fotos mientras la transición de entrada sigue activa.
    const task = InteractionManager.runAfterInteractions(() => {
      if (launched.current) return;
      launched.current = true;
      void choosePhoto();
    });
    return () => task.cancel();
  }, [analyzePhoto, choosePhoto, fromLibrary, height, prepareCamera, uri, width]);

  useEffect(() => () => { if (zoomFrame.current !== null) cancelAnimationFrame(zoomFrame.current); }, []);

  const shutterDisabled = !cameraReady || capturing || pages.length >= MAX_PAGES;

  const capture = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.9, exif: false, shutterSound: true });
      if (photo) setPages((current) => [...current, { uri: photo.uri, width: photo.width, height: photo.height }].slice(0, MAX_PAGES));
    } catch {
      Alert.alert(noWidow('No se pudo tomar la foto'), noWidow('Inténtalo otra vez o elige una foto de tu galería.'));
    } finally {
      setCapturing(false);
    }
  };

  const read = () => { if (pages.length) void analyzePages(pages); };
  const removePage = (index: number) => {
    Alert.alert(noWidow('Quitar esta hoja'), undefined, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Quitar', style: 'destructive', onPress: () => setPages((current) => current.filter((_, i) => i !== index)) },
    ]);
  };

  const retake = async () => {
    setPages([]);
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

  // Con foto ya elegida, la pantalla entra directo a la lectura.
  if (state === 'processing' || (uri && !launched.current)) {
    return (
      <SafeAreaView style={[s.root, s.center]}>
        <Stack.Screen options={{ headerShown: false }} />
        <AgentSpinner variant="dots" size={34} color={c.accent} />
        <Text style={s.processingTitle}>{noWidow('Leyendo tu menú…')}</Text>
        <Text style={s.processingBody}>{noWidow(slowRead ? 'Está tardando más de lo esperado. Puedes cancelar y continuar a mano.' : 'Detectando cada platillo.')}</Text>
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
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Cerrar" style={s.cameraControl} onPress={exit}>
            <Ionicons name="close" size={23} color="#fff" />
          </TouchableOpacity>
          <View style={s.cameraCopy} />
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

        {/* Hojas tomadas, en orden. Tocar una la quita. */}
        <View style={s.pagesRow}>
          {pages.map((page, index) => (
            <TouchableOpacity key={page.uri} onPress={() => removePage(index)} accessibilityRole="button" accessibilityLabel={`Hoja ${index + 1}. Quitar`}>
              <Image source={{ uri: page.uri }} style={s.pageThumb} />
            </TouchableOpacity>
          ))}
          {pages.length > 0 && pages.length < MAX_PAGES && (
            <Text style={s.pagesHint} maxFontSizeMultiplier={1.3}>{noWidow('¿Es largo? Toma la siguiente hoja.')}</Text>
          )}
        </View>

        {/* Crear, como la cámara de Instagram: en el centro, tomar la foto; a la
            izquierda, Fotos; a la derecha, escribir a mano o «Leer» cuando ya
            hay hojas. Abajo, qué se crea: menú o aviso. Sin hoja de abajo. */}
        <View style={s.cameraBottom}>
          <TouchableOpacity style={s.sideControl} onPress={() => { void choosePhoto(); }} accessibilityRole="button" accessibilityLabel="Elegir de Fotos">
            <View style={s.sideIcon}><Ionicons name="images-outline" size={22} color="#fff" /></View>
            <Text style={s.sideText} maxFontSizeMultiplier={1.2}>Fotos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={pages.length ? `Tomar la hoja ${pages.length + 1}` : 'Tomar foto'}
            accessibilityState={{ disabled: shutterDisabled }}
            style={[s.shutterOuter, shutterDisabled && s.shutterOff]}
            onPress={capture}
            disabled={shutterDisabled}>
            <View style={s.shutterInner} />
          </TouchableOpacity>
          {pages.length ? (
            <TouchableOpacity style={s.readButton} onPress={read} accessibilityRole="button" accessibilityLabel={pages.length === 1 ? 'Leer la hoja' : `Leer ${pages.length} hojas`}>
              <Text style={s.readText} maxFontSizeMultiplier={1.2}>{pages.length === 1 ? 'Leer' : `Leer ${pages.length}`}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.sideControl} onPress={() => router.replace('/menu-editar')} accessibilityRole="button" accessibilityLabel="Escribir a mano">
              <View style={s.sideIcon}><Ionicons name="create-outline" size={22} color="#fff" /></View>
              <Text style={s.sideText} maxFontSizeMultiplier={1.2}>A mano</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={s.modes} accessibilityRole="tablist">
          <Text style={[s.mode, s.modeOn]} accessibilityRole="tab" accessibilityState={{ selected: true }}>Menú</Text>
          <TouchableOpacity onPress={() => router.replace('/avisar')} accessibilityRole="tab" accessibilityState={{ selected: false }} accessibilityLabel="Aviso a quienes te siguen" hitSlop={10}>
            <Text style={s.mode}>Aviso</Text>
          </TouchableOpacity>
          {promoLeft !== null && (
            <TouchableOpacity onPress={() => router.replace('/aviso-especial')} accessibilityRole="tab" accessibilityState={{ selected: false }} accessibilityLabel={`Aviso especial, te quedan ${promoLeft}`} hitSlop={10}>
              <Text style={s.mode}>Promo</Text>
            </TouchableOpacity>
          )}
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
    processingTitle: { marginTop: 18, ...Type.section, color: c.text },
    processingBody: { maxWidth: 280, marginTop: 7, textAlign: 'center', fontSize: 13, lineHeight: 19, fontWeight: '400', color: c.textSecondary },
    cancelBtn: { marginTop: 28, minHeight: 44, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
    cancelText: { fontSize: 15, fontWeight: '400', color: c.textSecondary },
    cameraRoot: { flex: 1, backgroundColor: '#000' },
    cameraLoading: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#090909' },
    cameraOverlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 18 },
    cameraTop: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 8 },
    cameraControl: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
    cameraCopy: { flex: 1, alignItems: 'center' },
    guide: { alignSelf: 'center', width: '88%', flex: 1, maxHeight: '68%', marginVertical: 18 },
    corner: { position: 'absolute', width: 28, height: 28, borderColor: 'rgba(255,255,255,0.86)' },
    cornerTL: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 8 },
    cornerTR: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 8 },
    cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 8 },
    cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 8 },
    cameraBottom: { minHeight: 96, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
    sideControl: { width: 76, minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 4 },
    sideIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.42)', alignItems: 'center', justifyContent: 'center' },
    sideText: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: '#fff' },
    readButton: { width: 76, height: 44, borderRadius: 22, backgroundColor: theme.accent, alignItems: 'center', justifyContent: 'center' },
    readText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    pagesRow: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
    pageThumb: { width: 42, height: 56, borderRadius: 6, borderWidth: 1.5, borderColor: '#fff' },
    pagesHint: { flexShrink: 1, fontSize: 13, lineHeight: 18, color: '#fff' },
    modes: { flexDirection: 'row', justifyContent: 'center', gap: 28, paddingTop: 6, paddingBottom: 10 },
    mode: { fontSize: 13, lineHeight: 18, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' },
    modeOn: { color: '#fff' },
    shutterOuter: { width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: '#fff' },
    shutterOff: { opacity: 0.4 },
  });
}
