import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  SafeAreaView,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { router, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { LinearGradient } from 'expo-linear-gradient';
import { AgentSpinner } from '@/components/agent-spinner';
import { Fonts, useTheme, type Theme } from '@/lib/theme';
import { fonderoPalette } from '@/lib/fondero-palette';
import { leerMenuDeFoto, type MenuSeccion } from '@/lib/vision';
import {
  setMenuData as saveMenuData,
  makeSectionId,
  makePlatilloId,
  type MenuData,
  type Seccion,
  type Platillo,
} from '@/lib/menu-store';
import { saveMenuHoy } from '@/lib/db';
import { getFonditaId } from '@/lib/user-store';

// Paleta oscura fija estilo Figma (flujo Fondero siempre oscuro).
const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.04)',
  surface2: 'rgba(255,255,255,0.08)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  border: 'rgba(255,255,255,0.10)',
  sep: 'rgba(255,255,255,0.08)',
  accent: '#FF6A3D',
  accentLight: 'rgba(255,106,61,0.15)',
};

type Estado = 'idle' | 'camera' | 'processing' | 'review' | 'saved';

// ─── MovePlatilloModal ────────────────────────────────────────────────────────
function MovePlatilloModal({
  visible,
  secciones,
  currentSecId,
  onMove,
  onClose,
}: {
  visible: boolean;
  secciones: Seccion[];
  currentSecId: string;
  onMove: (targetSecId: string) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const targets = secciones.filter(sec => sec.id !== currentSecId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={onClose}>
        <View style={s.modalSheet}>
          <Text style={s.modalTitle}>Mover a sección</Text>
          {targets.map(sec => (
            <TouchableOpacity key={sec.id} style={s.modalOption} onPress={() => onMove(sec.id)}>
              <Text style={s.modalOptionText}>{sec.nombre}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.modalCancel} onPress={onClose}>
            <Text style={s.modalCancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── PlatilloCard ─────────────────────────────────────────────────────────────
function PlatilloCard({
  plat,
  onNombre,
  onDesc,
  onPrecio,
  onRemove,
  onMove,
}: {
  plat: Platillo;
  onNombre: (v: string) => void;
  onDesc: (v: string) => void;
  onPrecio: (v: string) => void;
  onRemove: () => void;
  onMove: () => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const c = fonderoPalette(theme.isDark);
  const swipeRef = useRef<any>(null);

  const handleMove = () => {
    swipeRef.current?.close();
    onMove();
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onRemove();
  };

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={() => (
        <View style={s.swipeActionsWrap}>
          <TouchableOpacity style={[s.swipeActionBtn, s.swipeActionMove]} onPress={handleMove} activeOpacity={0.85}>
            <Text style={s.swipeActionText}>Mover</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.swipeActionBtn, s.swipeActionDelete]} onPress={handleDelete} activeOpacity={0.85}>
            <Text style={s.swipeActionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}>
      <View style={s.platCard}>
        <TouchableOpacity onPress={onMove} style={s.handle} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
          <Text style={s.handleIcon}>⠿</Text>
        </TouchableOpacity>
        <View style={s.platMain}>
          <View style={s.platTopRow}>
            <TextInput
              style={s.platName}
              value={plat.nombre}
              onChangeText={onNombre}
              placeholder="Platillo"
              placeholderTextColor={c.textSecondary}
              autoCapitalize="sentences"
              selectionColor={c.accent}
              returnKeyType="next"
            />
            <View style={s.platActions}>
              <Text style={s.pricePrefix}>$</Text>
              <TextInput
                style={s.platPrecio}
                value={plat.precio}
                onChangeText={v => onPrecio(v.replace(/[^0-9.]/g, ''))}
                placeholder="0"
                placeholderTextColor={c.textSecondary}
                keyboardType="decimal-pad"
                selectionColor={c.accent}
              />
            </View>
          </View>
          <TextInput
            style={s.platDesc}
            value={plat.descripcion}
            onChangeText={onDesc}
            placeholder="Descripción"
            placeholderTextColor={c.textSecondary}
            autoCapitalize="none"
            selectionColor={c.accent}
            returnKeyType="next"
          />
        </View>
      </View>
    </Swipeable>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
function SectionCard({
  sec,
  onNombre,
  onPrecio,
  onRemove,
  onMoveUp,
  canMoveUp,
  onAddPlatillo,
  onUpdatePlatillo,
  onRemovePlatillo,
  onMovePlatillo,
}: {
  sec: Seccion;
  onNombre: (v: string) => void;
  onPrecio: (v: string) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  canMoveUp: boolean;
  onAddPlatillo: () => void;
  onUpdatePlatillo: (platId: string, patch: Partial<Platillo>) => void;
  onRemovePlatillo: (platId: string) => void;
  onMovePlatillo: (platId: string) => void;
}) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const c = fonderoPalette(theme.isDark);
  const addLabel = '+ agregar';
  const swipeRef = useRef<any>(null);

  const handleMoveUp = () => {
    swipeRef.current?.close();
    onMoveUp();
  };

  const handleDelete = () => {
    swipeRef.current?.close();
    onRemove();
  };

  return (
    <Swipeable
      ref={swipeRef}
      overshootRight={false}
      rightThreshold={40}
      renderRightActions={() => (
        <View style={s.swipeActionsWrap}>
          {canMoveUp && (
            <TouchableOpacity style={[s.swipeActionBtn, s.swipeActionMove]} onPress={handleMoveUp} activeOpacity={0.85}>
              <Text style={s.swipeActionText}>Subir</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[s.swipeActionBtn, s.swipeActionDelete]} onPress={handleDelete} activeOpacity={0.85}>
            <Text style={s.swipeActionText}>Eliminar</Text>
          </TouchableOpacity>
        </View>
      )}>
      <View style={s.secCard}>
        <View style={s.secHeader}>
          <TextInput
            style={s.secName}
            value={sec.nombre}
            onChangeText={v => onNombre(v.toUpperCase())}
            autoCapitalize="characters"
            selectionColor={c.accent}
            returnKeyType="done"
          />
          <View style={s.priceWrap}>
            <Text style={s.pricePrefix}>$</Text>
            <TextInput
              style={s.secPrecio}
              value={sec.precio}
              onChangeText={v => onPrecio(v.replace(/[^0-9.]/g, ''))}
              placeholder="0"
              placeholderTextColor={c.textSecondary}
              keyboardType="decimal-pad"
              selectionColor={c.accent}
            />
          </View>
        </View>

        {sec.platillos.map(plat => (
          <PlatilloCard
            key={plat.id}
            plat={plat}
            onNombre={v => onUpdatePlatillo(plat.id, { nombre: v })}
            onDesc={v => onUpdatePlatillo(plat.id, { descripcion: v })}
            onPrecio={v => onUpdatePlatillo(plat.id, { precio: v })}
            onRemove={() => onRemovePlatillo(plat.id)}
            onMove={() => onMovePlatillo(plat.id)}
          />
        ))}

        <Pressable
          style={({ pressed }) => [s.addPlatilloBtn, pressed && s.addPlatilloBtnPressed]}
          onPress={onAddPlatillo}
        >
          <Text style={s.addPlatilloText}>{addLabel}</Text>
        </Pressable>
      </View>
    </Swipeable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function FotoMenuScreen() {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const c = fonderoPalette(theme.isDark);

  const [estado, setEstado] = useState<Estado>('idle');
  const [permission, requestPermission] = useCameraPermissions();
  const [reviewData, setReviewData] = useState<MenuData>({ secciones: [] });
  const [movingPlatillo, setMovingPlatillo] = useState<{ secId: string; platId: string } | null>(null);
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
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permiso necesario', 'Habilita el acceso a tus fotos en Ajustes para elegir una imagen.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
      if (!result.canceled && result.assets[0]) {
        await analizarImagen(result.assets[0].uri);
      }
    } catch (err) {
      console.error('seleccionarDeGaleria:', err);
      Alert.alert('Error', 'No se pudo abrir la galería. Intenta de nuevo.');
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
      setReviewData(visionAMenuData(resultado.secciones, resultado.precio));
      setEstado('review');
    } catch {
      Alert.alert('Error', 'No se pudo analizar la foto. Intenta de nuevo.');
      setEstado('idle');
    }
  }

  // ── Review CRUD ─────────────────────────────────────────────────────────────
  function updateSecNombre(secId: string, nombre: string) {
    setReviewData(p => ({ ...p, secciones: p.secciones.map(s => s.id === secId ? { ...s, nombre } : s) }));
  }

  function updateSecPrecio(secId: string, precio: string) {
    setReviewData(p => ({ ...p, secciones: p.secciones.map(s => s.id === secId ? { ...s, precio } : s) }));
  }

  function removeSec(secId: string) {
    setReviewData(p => ({ ...p, secciones: p.secciones.filter(s => s.id !== secId) }));
  }

  function addSec() {
    setReviewData(p => ({
      ...p,
      secciones: [...p.secciones, { id: makeSectionId(), nombre: `SECCIÓN ${p.secciones.length + 1}`, precio: '', platillos: [] }],
    }));
  }

  function addPlatillo(secId: string) {
    setReviewData(p => ({
      ...p,
      secciones: p.secciones.map(s =>
        s.id === secId
          ? { ...s, platillos: [...s.platillos, { id: makePlatilloId(), nombre: '', descripcion: '', precio: '' }] }
          : s
      ),
    }));
  }

  function removePlatillo(secId: string, platId: string) {
    setReviewData(p => ({
      ...p,
      secciones: p.secciones.map(s =>
        s.id === secId ? { ...s, platillos: s.platillos.filter(pl => pl.id !== platId) } : s
      ),
    }));
  }

  function updatePlatillo(secId: string, platId: string, patch: Partial<Platillo>) {
    setReviewData(p => ({
      ...p,
      secciones: p.secciones.map(s =>
        s.id === secId
          ? { ...s, platillos: s.platillos.map(pl => pl.id === platId ? { ...pl, ...patch } : pl) }
          : s
      ),
    }));
  }

  function doMove(targetSecId: string) {
    if (!movingPlatillo) return;
    const { secId, platId } = movingPlatillo;
    setReviewData(p => {
      const srcSec = p.secciones.find(s => s.id === secId);
      if (!srcSec) return p;
      const platillo = srcSec.platillos.find(pl => pl.id === platId);
      if (!platillo) return p;
      return {
        ...p,
        secciones: p.secciones.map(s => {
          if (s.id === secId)       return { ...s, platillos: s.platillos.filter(pl => pl.id !== platId) };
          if (s.id === targetSecId) return { ...s, platillos: [...s.platillos, platillo] };
          return s;
        }),
      };
    });
    setMovingPlatillo(null);
  }

  function moveSecUp(secId: string) {
    setReviewData(prev => {
      const idx = prev.secciones.findIndex(s => s.id === secId);
      if (idx <= 0) return prev;
      const secciones = [...prev.secciones];
      const [item] = secciones.splice(idx, 1);
      secciones.splice(idx - 1, 0, item);
      return { ...prev, secciones };
    });
  }

  async function guardarEnStore() {
    saveMenuData(reviewData);
    const fonditaId = getFonditaId();
    if (fonditaId) await saveMenuHoy(fonditaId, reviewData);
    setEstado('saved');
  }

  useEffect(() => {
    if (estado !== 'saved') return;
    const id = setTimeout(() => {
      // Tras leer la foto, llevar al editor para revisar/ajustar antes de publicar.
      router.replace('/menu-editar');
    }, 800);
    return () => clearTimeout(id);
  }, [estado]);

  // ── Idle ──────────────────────────────────────────────────────────────────
  if (estado === 'idle') {
    return (
      <SafeAreaView style={s.container}>
        <Stack.Screen options={{ headerShown: false }} />

        {/* Header con back a Hoy */}
        <View style={s.idleTop}>
          <TouchableOpacity style={s.idleBack} onPress={() => router.replace('/menu')} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={c.text} />
          </TouchableOpacity>
        </View>

        <View style={s.idleBody}>
          <Text style={s.idleEyebrow} allowFontScaling={true}>Captura</Text>
          <Text style={s.idleTitle} allowFontScaling={true}>Toma foto de tu menú</Text>
          <Text style={s.idleSub} allowFontScaling={true}>Patio lo lee y lo organiza por ti. Sin escribir nada.</Text>

          {/* Card foto héroe (mismo lenguaje que "Hoy") */}
          <TouchableOpacity activeOpacity={0.9} onPress={tomarFoto} style={s.heroCard}>
            <LinearGradient colors={['#FF8458', '#F2612F']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGradient}>
              <View style={s.heroIconBox}>
                <Ionicons name="camera" size={30} color="#fff" />
              </View>
              <Text style={s.heroCardTitle} allowFontScaling={true}>Abrir cámara</Text>
              <Text style={s.heroCardBody} allowFontScaling={true}>Encuadra tu menú y listo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={s.galleryBtn} onPress={seleccionarDeGaleria} activeOpacity={0.82}>
            <Ionicons name="images-outline" size={18} color={c.text} />
            <Text style={s.galleryBtnText} allowFontScaling={true}>Elegir de la galería</Text>
          </TouchableOpacity>
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
              style={s.backIconBtnWhite}
              onPress={() => setEstado('idle')}
              activeOpacity={0.76}
            >
              <Ionicons name="chevron-back" size={20} color="#fff" />
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
        <AgentSpinner variant="dots" size={34} color={c.accent} />
        <Text style={[s.processingLabel, { marginTop: 16 }]}>
          Patio está leyendo tu contenido...
        </Text>
        <Text style={s.processingSub}>Identificando productos y precios</Text>
      </SafeAreaView>
    );
  }

  // ── Review ────────────────────────────────────────────────────────────────
  if (estado === 'review') {
    return (
      <SafeAreaView style={s.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <MovePlatilloModal
          visible={!!movingPlatillo}
          secciones={reviewData.secciones}
          currentSecId={movingPlatillo?.secId ?? ''}
          onMove={doMove}
          onClose={() => setMovingPlatillo(null)}
        />
        <View style={s.reviewHeader}>
          <View>
            <Text style={s.reviewTitle}>Revisa y ajusta</Text>
            <Text style={s.reviewSub}>Patio leyó tu menú ✓</Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {reviewData.secciones.map((sec, idx) => (
            <SectionCard
              key={sec.id}
              sec={sec}
              onNombre={v => updateSecNombre(sec.id, v)}
              onPrecio={v => updateSecPrecio(sec.id, v)}
              onRemove={() => removeSec(sec.id)}
              onMoveUp={() => moveSecUp(sec.id)}
              canMoveUp={idx > 0}
              onAddPlatillo={() => addPlatillo(sec.id)}
              onUpdatePlatillo={(platId, patch) => updatePlatillo(sec.id, platId, patch)}
              onRemovePlatillo={platId => removePlatillo(sec.id, platId)}
              onMovePlatillo={platId => setMovingPlatillo({ secId: sec.id, platId })}
            />
          ))}

          <TouchableOpacity style={s.addSecBtn} onPress={addSec}>
            <Text style={s.addSecText}>+ Agregar sección</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.btnPrimary, { marginTop: 16 }]}
            onPress={guardarEnStore}
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
      <Text style={s.savedTitle}>Guardado</Text>
      <Text style={s.savedSub}>Abriendo compartir...</Text>
    </SafeAreaView>
  );
}

// ─── Vision → MenuData ────────────────────────────────────────────────────────
function visionAMenuData(secciones: MenuSeccion[], precio: string): MenuData {
  const normalizePrice = (value?: string): string => (value ?? '').replace(/[^0-9.]/g, '');
  const cleanNoise = (value: string): string =>
    value
      .replace(/\((?:men[uú]|menu)\)/gi, '')
      .replace(/\b(?:men[uú]|menu)\b/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  const extractPlatilloPrice = (descripcion: string): { descripcionLimpia: string; precio: string } => {
    const match = descripcion.match(/\(\s*\$?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:[^)]*)\)/i);
    if (!match) return { descripcionLimpia: cleanNoise(descripcion.trim()), precio: '' };

    const precio = normalizePrice(match[1]);
    const descripcionLimpia = cleanNoise(descripcion.replace(match[0], ''));
    return { descripcionLimpia, precio };
  };

  return {
    secciones: secciones.map((sec, idx) => ({
      id: makeSectionId(),
      nombre: sec.nombre,
      precio: idx === 0
        ? normalizePrice(precio)
        : normalizePrice(sec.precioSeccion),
      platillos: sec.platillos.map(p => {
        const { descripcionLimpia, precio } = extractPlatilloPrice(p.descripcion ?? '');
        return {
          id: makePlatilloId(),
          nombre: cleanNoise(p.nombre),
          descripcion: descripcionLimpia,
          precio,
        };
      }),
    })),
  };
}

function makeStyles(theme: Theme) {
  // El flujo Fondero ahora respeta el tema. `t` combina el Theme base con la
  // paleta Fondero correcta (clara u oscura) para no romper los estilos que
  // referencian t.surface/t.text/etc.
  const p = fonderoPalette(theme.isDark);
  const t = {
    ...theme,
    bg: p.bg,
    surface: p.surface,
    surface2: p.iconBg,
    text: p.text,
    textSecondary: p.textSecondary,
    border: p.border,
    sep: p.border,
    accent: p.accent,
    accentLight: 'rgba(255,106,61,0.15)',
  };
  return StyleSheet.create({
    container:       { flex: 1, backgroundColor: t.bg },
    centerContent:   { alignItems: 'center', justifyContent: 'center', padding: 24 },
    backIconBtn:     { width: 44, height: 44, borderRadius: 16, marginLeft: 12, marginTop: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    backIconBtnWhite:{ width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.25)' },
    // ── Idle (look Figma) ──
    idleTop:         { paddingHorizontal: 16, paddingTop: 6, height: 46, justifyContent: 'center' },
    idleBack:        { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
    idleBody:        { flex: 1, paddingHorizontal: 22, paddingTop: 12 },
    idleEyebrow:     { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: t.accent, marginBottom: 8 },
    idleTitle:       { fontSize: 32, fontWeight: '900', letterSpacing: -1.2, lineHeight: 34, color: t.text, marginBottom: 6, fontFamily: Fonts.brand },
    idleSub:         { fontSize: 14, fontWeight: '300', lineHeight: 20, color: t.textSecondary, marginBottom: 24 },
    heroCard:        { borderRadius: 24, overflow: 'hidden', marginBottom: 14, shadowColor: '#F2612F', shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.4, shadowRadius: 28, elevation: 8 },
    heroGradient:    { padding: 24, minHeight: 180, justifyContent: 'flex-end' },
    heroIconBox:     { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    heroCardTitle:   { fontSize: 24, fontWeight: '900', letterSpacing: -0.6, color: '#fff', marginBottom: 4, fontFamily: Fonts.brand },
    heroCardBody:    { fontSize: 14, fontWeight: '300', color: 'rgba(255,255,255,0.9)' },
    galleryBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 18, backgroundColor: t.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border },
    galleryBtnText:  { fontSize: 15, fontWeight: '600', color: t.text },
    btnPrimary: {
      backgroundColor: t.accent,
      borderRadius: 18,
      padding: 15,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 3,
    },
    btnPrimaryText:  { color: '#fff', fontSize: 16, fontWeight: '900' },
    btnSecondary: {
      backgroundColor: t.surface2,
      borderRadius: 18,
      padding: 15,
      alignItems: 'center',
    },
    btnSecondaryText: { color: t.text, fontSize: 15, fontWeight: '300' },
    tipBox: {
      backgroundColor: t.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: t.border,
      padding: 16,
      marginTop: 22,
      gap: 0,
    },
    tipText:         { fontSize: 13, color: t.textSecondary, lineHeight: 19 },
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
    processingLabel: { fontSize: 16, fontWeight: '300', color: t.text, textAlign: 'center' },
    processingSub:   { fontSize: 13, color: t.textSecondary, marginTop: 6, textAlign: 'center' },
    reviewHeader: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 14,
    },
    reviewTitle:     { fontSize: 22, fontWeight: '900', color: t.text },
    reviewSub:       { fontSize: 13, color: t.accent, fontWeight: '900', marginTop: 4 },
    // Section card
    secCard:         { backgroundColor: t.surface, borderRadius: 18, padding: 14, marginBottom: 14, borderWidth: 1, borderColor: t.sep, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.04, shadowRadius: 18, elevation: 2 },
    secHeader:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    secName:         { flex: 1, fontSize: 12, fontWeight: '900', color: t.text, textTransform: 'uppercase', paddingVertical: 0 },
    priceWrap:       { width: 86, marginLeft: 'auto', flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 1 },
    pricePrefix:     { fontSize: 13, fontWeight: '900', color: t.accent },
    secPrecio:       { width: 38, fontSize: 13, fontWeight: '300', color: t.textSecondary, textAlign: 'right', paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    secRemove:       { fontSize: 18, lineHeight: 18, color: t.textSecondary, fontWeight: '300' },
    // Platillo card
    platCard:        { backgroundColor: 'transparent', flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.sep },
    handle:          { width: 20, marginRight: 8, paddingTop: 2, alignItems: 'center' },
    handleIcon:      { fontSize: 16, color: t.textSecondary },
    platMain:        { flex: 1, minWidth: 0 },
    platTopRow:      { flexDirection: 'row', alignItems: 'baseline' },
    platActions:     { marginLeft: 8, flexDirection: 'row', alignItems: 'center' },
    platName:        { flex: 1, minWidth: 0, flexShrink: 1, fontSize: 17, fontWeight: '900', color: t.text, paddingVertical: 0, lineHeight: 22 },
    platDesc:        { marginTop: 3, fontSize: 15, color: t.textSecondary, paddingVertical: 0, lineHeight: 21 },
    platPrecio:      { width: 38, fontSize: 13, fontWeight: '300', color: t.textSecondary, textAlign: 'right', paddingVertical: 0, paddingHorizontal: 0, backgroundColor: 'transparent' },
    removeBtn:       { width: 18, height: 18, marginLeft: 6, alignItems: 'center', justifyContent: 'center' },
    platRemove:      { fontSize: 18, lineHeight: 18, color: t.textSecondary },
    // Add platillo
    addPlatilloBtn:  {
      alignSelf: 'stretch',
      alignItems: 'flex-start',
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 12,
      borderRadius: 10,
      marginTop: 2,
    },
    addPlatilloBtnPressed: { backgroundColor: t.surface2 },
    addPlatilloText: { fontSize: 14, color: t.accent, fontWeight: '900', opacity: 0.82 },
    // Swipe actions
    swipeActionsWrap: { flexDirection: 'row', alignItems: 'stretch', marginBottom: 12 },
    swipeActionBtn:   { minWidth: 86, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, borderRadius: 10, marginLeft: 8 },
    swipeActionMove:  { backgroundColor: t.accentLight },
    swipeActionDelete:{ backgroundColor: '#E74C3C' },
    swipeActionText:  { color: '#fff', fontSize: 13, fontWeight: '900' },
    // Add section
    addSecBtn:       { borderWidth: 1, borderColor: t.border, borderStyle: 'dashed', borderRadius: 14, padding: 13, alignItems: 'center', marginTop: 6, marginBottom: 10, backgroundColor: t.surface },
    addSecText:      { fontSize: 14, color: t.accent, fontWeight: '900' },
    // Modal
    modalOverlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    modalSheet:      { backgroundColor: t.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalTitle:      { fontSize: 15, fontWeight: '900', color: t.text, marginBottom: 16 },
    modalOption:     { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: t.sep },
    modalOptionText: { fontSize: 15, color: t.text },
    modalCancel:     { paddingVertical: 14, alignItems: 'center', marginTop: 8 },
    modalCancelText: { fontSize: 15, color: t.textSecondary },
    // Saved
    successIcon: {
      width: 64,
      height: 64,
      borderRadius: 34,
      backgroundColor: t.accent,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 3,
    },
    savedTitle:      { fontSize: 22, fontWeight: '900', color: t.text },
    savedSub:        { fontSize: 14, color: t.textSecondary, marginTop: 4, lineHeight: 20, textAlign: 'center' },
  });
}
