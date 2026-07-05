import { Ionicons } from '@expo/vector-icons';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { MenuComposer } from '@/components/menu-composer';
import { fonderoPalette } from '@/lib/fondero-palette';
import {
  makePlatilloId,
  makeSectionId,
  type MenuData,
} from '@/lib/menu-store';
import { Fonts, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { leerMenuDeFoto, type MenuSeccion } from '@/lib/vision';
import { GlassIconButton } from '@/components/glass-button';

type State = 'idle' | 'camera' | 'processing' | 'review';

export default function FotoMenuScreen() {
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(theme);
  const [state, setState] = useState<State>('idle');
  const [permission, requestPermission] = useCameraPermissions();
  const [menu, setMenu] = useState<MenuData>({ secciones: [] });
  const cameraRef = useRef<CameraView>(null);
  const hintOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (state !== 'camera') return;
    hintOpacity.setValue(0);
    const animation = Animated.sequence([
      Animated.timing(hintOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2100),
      Animated.timing(hintOpacity, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [hintOpacity, state]);

  const openCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Cámara desactivada', 'Puedes elegir una foto de tu galería.');
        return;
      }
    }
    setState('camera');
  };

  const analyze = async (uri: string) => {
    setState('processing');
    try {
      // Convierte HEIC, PNG y RAW/DNG a un JPEG consistente para el modelo.
      const ImageManipulator = await import('expo-image-manipulator');
      const normalized = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      const result = await leerMenuDeFoto(normalized.uri);
      const hasDishes = result.secciones.some(section => section.platillos.some(dish => dish.nombre.trim()));
      if (result.error || !hasDishes) {
        Alert.alert('No pudimos leerlo', 'Prueba con una imagen más clara o escríbelo manualmente.');
        setState('idle');
        return;
      }
      setMenu(visionToMenu(result.secciones, result.precio));
      setState('review');
    } catch {
      Alert.alert('No pudimos leerlo', 'Prueba otra foto o escríbelo manualmente.');
      setState('idle');
    }
  };

  const capture = async () => {
    const photo = await cameraRef.current?.takePictureAsync({ quality: 0.82 });
    if (photo?.uri) await analyze(photo.uri);
  };

  const choosePhoto = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Fotos desactivadas', 'Activa el permiso para elegir una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.9,
    });
    const asset = !result.canceled ? result.assets[0] : null;
    if (asset) await analyze(asset.uri);
  };

  if (state === 'review') {
    return (
      <MenuComposer
        initialData={menu}
        source="foto"
        onBack={() => setState('idle')}
        onRetake={() => setState('camera')}
      />
    );
  }

  if (state === 'camera') {
    return (
      <View style={s.cameraRoot}>
        <Stack.Screen options={{ headerShown: false }} />
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing={'back' as CameraType} />
        <SafeAreaView style={s.cameraOverlay}>
          <Animated.View style={[s.hint, { opacity: hintOpacity }]}>
            <Ionicons name="scan-outline" size={14} color="#fff" />
            <Text style={s.hintText}>Incluye el menú completo</Text>
          </Animated.View>
          <View style={s.cameraControls}>
            <TouchableOpacity style={s.sideControl} onPress={() => setState('idle')} activeOpacity={0.75}>
              <Ionicons name="close" size={23} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={s.shutter} onPress={capture} activeOpacity={0.86}>
              <View style={s.shutterInner} />
            </TouchableOpacity>
            <TouchableOpacity style={s.sideControl} onPress={choosePhoto} activeOpacity={0.75}>
              <Ionicons name="images-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
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

  return (
    <SafeAreaView style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.topBar}>
        <GlassIconButton icon="close" accessibilityLabel="Cerrar" onPress={() => router.replace('/menu')} size={38} iconSize={19} />
      </View>
      <View style={s.content}>
        <Text style={s.eyebrow}>DESDE UNA IMAGEN</Text>
        <Text style={s.title}>Patio lo lee</Text>
        <Text style={s.subtitle}>
          {noWidow('Toma una foto o elige una imagen. Después corriges solo lo necesario.')}
        </Text>

        <TouchableOpacity style={s.cameraCard} onPress={openCamera} activeOpacity={0.88}>
          <LinearGradient colors={['#FF8458', '#F2612F']} style={s.cameraGradient}>
            <Ionicons name="camera" size={28} color="#fff" />
            <Text style={s.cameraTitle}>Tomar foto</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={s.photoRow} onPress={choosePhoto} activeOpacity={0.75}>
          <Ionicons name="images-outline" size={20} color={c.text} />
          <Text style={s.photoText}>Elegir de Fotos</Text>
          <Ionicons name="chevron-forward" size={16} color={c.textMute} />
        </TouchableOpacity>
        <TouchableOpacity style={s.manualRow} onPress={() => router.replace('/menu-editar')} activeOpacity={0.7}>
          <Text style={s.manualText}>Prefiero escribirlo</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function visionToMenu(sections: MenuSeccion[], menuPrice: string): MenuData {
  const price = (value?: string) => (value ?? '').replace(/[^0-9.]/g, '');
  const clean = (value: string) => value
    .replace(/\((?:men[uú]|menu)\)/gi, '')
    .replace(/\b(?:men[uú]|menu)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return {
    secciones: sections.map((section, index) => ({
      id: makeSectionId(),
      nombre: clean(section.nombre) || 'MENÚ DE HOY',
      precio: index === 0 ? price(menuPrice) : price(section.precioSeccion),
      platillos: section.platillos.map(dish => ({
        id: makePlatilloId(),
        nombre: clean(dish.nombre),
        descripcion: clean(dish.descripcion ?? ''),
        precio: '',
      })),
    })),
  };
}

function makeStyles(theme: Theme) {
  const c = fonderoPalette(theme.isDark);
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.bg },
    center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
    topBar: { height: 48, paddingHorizontal: 14, justifyContent: 'center' },
    closeButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, paddingHorizontal: 22, paddingTop: 26 },
    eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: c.accent, marginBottom: 8 },
    title: { fontSize: 36, lineHeight: 38, fontWeight: '900', letterSpacing: -1.2, color: c.text, fontFamily: Fonts.brand },
    subtitle: { maxWidth: 330, marginTop: 8, marginBottom: 30, fontSize: 14, lineHeight: 20, fontWeight: '300', color: c.textSecondary },
    cameraCard: { borderRadius: 22, overflow: 'hidden' },
    cameraGradient: { minHeight: 150, padding: 22, justifyContent: 'flex-end', alignItems: 'flex-start', gap: 12 },
    cameraTitle: { fontSize: 23, fontWeight: '900', color: '#fff', fontFamily: Fonts.brand },
    photoRow: { minHeight: 62, marginTop: 12, paddingHorizontal: 18, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 12 },
    photoText: { flex: 1, fontSize: 15, fontWeight: '600', color: c.text },
    manualRow: { minHeight: 52, alignItems: 'center', justifyContent: 'center' },
    manualText: { fontSize: 13, color: c.textSecondary },
    processingTitle: { marginTop: 18, fontSize: 20, fontWeight: '800', color: c.text },
    processingBody: { maxWidth: 280, marginTop: 7, textAlign: 'center', fontSize: 13, lineHeight: 19, color: c.textSecondary },
    cameraRoot: { flex: 1, backgroundColor: '#000' },
    cameraOverlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 22, paddingBottom: 8 },
    hint: { position: 'absolute', top: '14%', flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 100, paddingHorizontal: 13, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.46)' },
    hintText: { fontSize: 12, fontWeight: '600', color: '#fff' },
    cameraControls: { width: '100%', height: 88, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 },
    sideControl: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(0,0,0,0.38)', alignItems: 'center', justifyContent: 'center' },
    shutter: { width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
    shutterInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  });
}
