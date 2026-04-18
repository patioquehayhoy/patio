import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme, type Theme } from '@/lib/theme';
import { leerMenuDeFoto, type MenuSeccion } from '@/lib/vision';

type Estado = 'idle' | 'camera' | 'processing' | 'review' | 'saved';

export default function FotoMenuScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const [estado, setEstado] = useState<Estado>('idle');
  const [permission, requestPermission] = useCameraPermissions();
  const [secciones, setSecciones] = useState<MenuSeccion[]>([]);
  const [precio, setPrecio] = useState('');
  const cameraRef = useRef<any>(null);

  async function tomarFoto() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setEstado('camera');
  }

  async function capturar() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8, base64: false });
    await analizarImagen(photo.uri);
  }

  async function seleccionarDeGaleria() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      await analizarImagen(result.assets[0].uri);
    }
  }

  async function analizarImagen(uri: string) {
    setEstado('processing');
    try {
      const resultado = await leerMenuDeFoto(uri);
      if (resultado.error) {
        Alert.alert('No se detectó menú', 'Intenta con una foto más clara.');
        setEstado('idle');
        return;
      }
      setSecciones(resultado.secciones);
      setPrecio(resultado.precio);
      setEstado('review');
    } catch {
      Alert.alert('Error', 'No se pudo analizar la foto. Intenta de nuevo.');
      setEstado('idle');
    }
  }

  function actualizarPlatillo(
    secIdx: number,
    platIdx: number,
    campo: 'nombre' | 'descripcion',
    valor: string
  ) {
    setSecciones(prev => {
      const copia = [...prev];
      copia[secIdx] = {
        ...copia[secIdx],
        platillos: copia[secIdx].platillos.map((p, i) =>
          i === platIdx ? { ...p, [campo]: valor } : p
        ),
      };
      return copia;
    });
  }

  function actualizarNombreSeccion(secIdx: number, valor: string) {
    setSecciones(prev => {
      const copia = [...prev];
      copia[secIdx] = { ...copia[secIdx], nombre: valor };
      return copia;
    });
  }

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (estado === 'idle') {
    return (
      <SafeAreaView style={s.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Text style={s.backText}>← Volver</Text>
        </TouchableOpacity>

        <View style={s.idleContent}>
          <View style={s.cameraBtn}>
            <TouchableOpacity
              style={s.cameraBtnInner}
              onPress={tomarFoto}
              activeOpacity={0.85}
            >
              <Text style={s.cameraIcon}>📷</Text>
              <Text style={s.cameraBtnLabel}>Foto de tu menú</Text>
              <Text style={s.cameraBtnSub}>Patio lo lee y llena todo solo</Text>
            </TouchableOpacity>
          </View>

          <View style={s.dividerRow}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>o elige de galería</Text>
            <View style={s.dividerLine} />
          </View>

          <TouchableOpacity style={s.btnSecondary} onPress={seleccionarDeGaleria}>
            <Text style={s.btnSecondaryText}>Seleccionar imagen</Text>
          </TouchableOpacity>

          <View style={s.tipBox}>
            <Text style={s.tipAccent}>✦ Nuevo en Patio V2</Text>
            <Text style={s.tipText}>
              Toma foto de tu menú y Patio llena todo automáticamente.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Camera ────────────────────────────────────────────────────────────────
  if (estado === 'camera') {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <Stack.Screen options={{ headerShown: false }} />
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing={'back' as CameraType}>
          <SafeAreaView style={s.cameraOverlay}>
            <TouchableOpacity
              style={s.backBtnWhite}
              onPress={() => setEstado('idle')}
            >
              <Text style={{ color: '#fff', fontSize: 16 }}>← Volver</Text>
            </TouchableOpacity>
            <Text style={s.cameraHint}>Enfoca tu menú completo</Text>
            <TouchableOpacity style={s.shutterBtn} onPress={capturar}>
              <View style={s.shutterInner} />
            </TouchableOpacity>
          </SafeAreaView>
        </CameraView>
      </View>
    );
  }

  // ── Processing ────────────────────────────────────────────────────────────
  if (estado === 'processing') {
    return (
      <SafeAreaView style={[s.container, s.centerContent]}>
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={[s.processingLabel, { marginTop: 16 }]}>
          Patio está leyendo tu menú...
        </Text>
        <Text style={s.processingSub}>Identificando platillos y precios</Text>
      </SafeAreaView>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────
  if (estado === 'review') {
    return (
      <SafeAreaView style={s.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={s.reviewHeader}>
          <View>
            <Text style={s.reviewTitle}>Revisa y ajusta</Text>
            <Text style={s.reviewSub}>Patio leyó tu menú ✓</Text>
          </View>
          <View style={s.badge}>
            <Text style={s.badgeText}>IA</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          <Text style={s.editHint}>Toca cualquier campo para editar</Text>

          {secciones.map((sec, secIdx) => (
            <View key={secIdx} style={s.seccionBox}>
              <TextInput
                style={s.seccionLabel}
                value={sec.nombre}
                onChangeText={v => actualizarNombreSeccion(secIdx, v)}
              />
              {sec.platillos.map((plat, platIdx) => (
                <View key={platIdx} style={s.platilloRow}>
                  <View style={s.checkCircle}>
                    <Text style={{ color: '#1D9E75', fontSize: 12 }}>✓</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextInput
                      style={s.platNombre}
                      value={plat.nombre}
                      onChangeText={v =>
                        actualizarPlatillo(secIdx, platIdx, 'nombre', v)
                      }
                      placeholder="Platillo"
                      placeholderTextColor={theme.textSecondary}
                    />
                    {plat.descripcion !== '' && (
                      <TextInput
                        style={s.platDesc}
                        value={plat.descripcion}
                        onChangeText={v =>
                          actualizarPlatillo(secIdx, platIdx, 'descripcion', v)
                        }
                        placeholder="Descripción"
                        placeholderTextColor={theme.textSecondary}
                      />
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}

          {precio !== '' && (
            <View style={s.seccionBox}>
              <Text style={s.seccionLabel}>PRECIO</Text>
              <View style={s.platilloRow}>
                <View style={s.checkCircle}>
                  <Text style={{ color: '#1D9E75', fontSize: 12 }}>✓</Text>
                </View>
                <TextInput
                  style={[
                    s.platNombre,
                    { color: theme.accent, fontSize: 22, fontWeight: '900' },
                  ]}
                  value={precio}
                  onChangeText={setPrecio}
                />
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[s.btnPrimary, { marginTop: 16 }]}
            onPress={() => setEstado('saved')}
          >
            <Text style={s.btnPrimaryText}>Guardar menú del día →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btnSecondary, { marginTop: 8 }]}
            onPress={() => setEstado('idle')}
          >
            <Text style={s.btnSecondaryText}>Tomar otra foto</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Saved ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[s.container, s.centerContent]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.successIcon}>
        <Text style={{ color: '#fff', fontSize: 24 }}>✓</Text>
      </View>
      <Text style={s.savedTitle}>¡Menú guardado!</Text>
      <Text style={s.savedSub}>Listo para compartir por WhatsApp</Text>
      <TouchableOpacity
        style={[s.btnPrimary, { marginTop: 32, paddingHorizontal: 32 }]}
        onPress={() => router.push('/preview')}
      >
        <Text style={s.btnPrimaryText}>Ver vista previa</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.btnSecondary, { marginTop: 8, paddingHorizontal: 32 }]}
        onPress={() => setEstado('idle')}
      >
        <Text style={s.btnSecondaryText}>Nuevo menú</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    container:       { flex: 1, backgroundColor: t.bg },
    centerContent:   { alignItems: 'center', justifyContent: 'center', padding: 24 },
    backBtn:         { padding: 16, paddingBottom: 0 },
    backText:        { fontSize: 15, color: t.textSecondary },
    backBtnWhite:    { padding: 16 },
    idleContent:     { flex: 1, padding: 20 },
    cameraBtn: {
      borderWidth: 1.5,
      borderColor: t.border,
      borderStyle: 'dashed',
      borderRadius: 14,
      overflow: 'hidden',
      marginBottom: 16,
    },
    cameraBtnInner: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 40,
      gap: 8,
      backgroundColor: t.surface,
    },
    cameraIcon:      { fontSize: 40 },
    cameraBtnLabel:  { fontSize: 17, fontWeight: '700', color: t.text },
    cameraBtnSub:    { fontSize: 13, color: t.textSecondary },
    dividerRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 },
    dividerLine:     { flex: 1, height: 1, backgroundColor: t.border },
    dividerText:     { fontSize: 12, color: t.textSecondary },
    btnPrimary: {
      backgroundColor: t.accent,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
    },
    btnPrimaryText:  { color: '#fff', fontSize: 16, fontWeight: '700' },
    btnSecondary: {
      backgroundColor: t.surface2,
      borderRadius: 14,
      padding: 14,
      alignItems: 'center',
    },
    btnSecondaryText: { color: t.text, fontSize: 15, fontWeight: '600' },
    tipBox: {
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      padding: 14,
      marginTop: 20,
      gap: 4,
    },
    tipAccent:       { fontSize: 13, fontWeight: '700', color: t.accent },
    tipText:         { fontSize: 12, color: t.textSecondary, lineHeight: 18 },
    cameraOverlay: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
    },
    cameraHint:      { color: '#fff', fontSize: 15, opacity: 0.8, textAlign: 'center' },
    shutterBtn: {
      width: 72,
      height: 72,
      borderRadius: 36,
      borderWidth: 4,
      borderColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 20,
    },
    shutterInner:    { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
    processingLabel: { fontSize: 16, fontWeight: '600', color: t.text, textAlign: 'center' },
    processingSub:   { fontSize: 13, color: t.textSecondary, marginTop: 6, textAlign: 'center' },
    reviewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 20,
      paddingBottom: 10,
    },
    reviewTitle:     { fontSize: 20, fontWeight: '900', color: t.text },
    reviewSub:       { fontSize: 13, color: t.accent, fontWeight: '600', marginTop: 2 },
    badge: {
      backgroundColor: t.surface2,
      borderRadius: 20,
      paddingHorizontal: 10,
      paddingVertical: 4,
    },
    badgeText:       { color: t.accent, fontSize: 11, fontWeight: '700' },
    editHint:        { fontSize: 12, color: t.textSecondary, marginBottom: 12 },
    seccionBox: {
      backgroundColor: t.surface,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      padding: 14,
      marginBottom: 10,
    },
    seccionLabel: {
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.5,
      color: t.accent,
      textTransform: 'uppercase',
      marginBottom: 10,
    },
    platilloRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.border,
    },
    checkCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#e6f7ef',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    },
    platNombre:      { fontSize: 15, fontWeight: '700', color: t.text },
    platDesc:        { fontSize: 13, color: t.textSecondary, marginTop: 2 },
    successIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    savedTitle:      { fontSize: 20, fontWeight: '900', color: t.text },
    savedSub:        { fontSize: 13, color: t.textSecondary, marginTop: 4 },
  });
}
