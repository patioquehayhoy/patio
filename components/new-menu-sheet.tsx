import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as ImagePicker from 'expo-image-picker';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getProStatus } from '@/lib/business-pro';
import { fonderoPalette } from '@/lib/fondero-palette';
import { getFonditaId } from '@/lib/menu-store';
import { PLANS } from '@/lib/plans';
import { Radius, useTheme } from '@/lib/theme';
import { SHEET_DISMISS_MS, SHEET_SPRING } from '@/lib/sheet-motion';
import { useTabBarScroll } from '@/lib/tab-bar-visibility';
import { noWidow } from '@/lib/typography';

// Elegir cómo capturar el menú es una acción intencional con tres caminos
// igual de válidos — el patrón real que documenta Apple (HIG "Action
// sheets"): "use an action sheet... to offer choices related to an
// intentional action". La propia guía de privacidad de Apple usa EXACTO este
// flujo como su ejemplo de referencia: elegir "Cámara" en un action sheet es
// el momento correcto para disparar el permiso de cámara — no antes
// (developer.apple.com/design/human-interface-guidelines/privacy). Antes
// esto vivía escondido dentro de foto-menu.tsx (un candado de cámara con
// botones chiquitos después, que se sentía "roto" — reportado 2026-08-29).
// Ahora es el primer momento, tres opciones del mismo peso — mismo criterio
// que WhatsApp/Instagram/ChatGPT usan para "agregar contenido": el picker de
// fuente es una elección explícita, la cámara nunca se activa sola.
// Estructura de dos grupos (opciones + Cancelar separado) copia la
// composición real del action sheet nativo; el lenguaje visual (glass,
// tipografía de marca) es 100% Patio, nunca chrome de iOS literal — mismo
// criterio que ya usa components/action-sheet.tsx.
// «Crear» (2026-11-16, Parco: el negocio crea varias cosas, no solo el menú):
// con `create`, el «＋» de la barra junta todo lo que el negocio puede
// publicar. Arriba, el menú de hoy (sus tres caminos); abajo, los avisos a
// quienes lo siguen. Actividad queda solo con lo que pasó.
export function NewMenuSheet({ visible, onClose, onCancel, replaceOnNavigate, create = false }: {
  visible: boolean;
  onClose: () => void;
  /** Solo al cancelar (no al elegir una opción): p. ej. salir del alta a Menús. */
  onCancel?: () => void;
  replaceOnNavigate?: boolean;
  /** «Crear» del negocio: además del menú, los avisos. */
  create?: boolean;
}) {
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const s = makeStyles(theme.isDark);
  const insets = useSafeAreaInsets();
  const bottomPadding = insets.bottom || 20;
  const [contentHeight, setContentHeight] = useState(232 + bottomPadding);
  const contentHeightRef = useRef(contentHeight);
  contentHeightRef.current = contentHeight;
  const translateY = useRef(new Animated.Value(contentHeight)).current;
  // Avisos especiales: solo con Pro; dice cuántos quedan este mes.
  const [noticesLeft, setNoticesLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!visible || !create) return;
    const id = getFonditaId();
    if (!id) return;
    let active = true;
    getProStatus(id).then((status) => { if (active) setNoticesLeft(status?.proUntil ? status.noticesLeft : null); }).catch(() => {});
    return () => { active = false; };
  }, [visible, create]);
  const [rendered, setRendered] = useState(visible);
  const deferredNavigation = useRef<(() => void) | null>(null);
  const { hide: hideTabBar, reveal: revealTabBar } = useTabBarScroll();
  const finishDismiss = useCallback(() => {
    const navigate = deferredNavigation.current;
    deferredNavigation.current = null;
    navigate?.();
  }, []);
  const backdropOpacity = translateY.interpolate({ inputRange: [0, Math.max(1, contentHeight)], outputRange: [1, 0], extrapolate: 'clamp' });

  useEffect(() => {
    if (rendered || Platform.OS === 'ios') return;
    const frame = requestAnimationFrame(finishDismiss);
    return () => cancelAnimationFrame(frame);
  }, [rendered, finishDismiss]);

  useEffect(() => {
    if (visible) {
      hideTabBar?.();
      translateY.setValue(contentHeightRef.current);
      setRendered(true);
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    } else if (rendered) {
      revealTabBar?.();
      Animated.timing(translateY, { toValue: contentHeightRef.current, duration: SHEET_DISMISS_MS, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const navigate = (path: Href) => {
    if (replaceOnNavigate) router.replace(path); else router.push(path);
  };
  const go = (path: Href) => {
    if (deferredNavigation.current) return;
    deferredNavigation.current = () => navigate(path);
    onClose();
  };
  // Fotos se presenta desde la pantalla actual: sin transición intermedia.
  // Solo con una foto elegida se entra a la lectura; cancelar no navega.
  const pickFromLibrary = () => {
    if (deferredNavigation.current) return;
    deferredNavigation.current = () => {
      void ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 })
        .then((result) => {
          const asset = !result.canceled ? result.assets?.[0] : null;
          if (!asset) return;
          navigate({ pathname: '/foto-menu', params: { source: 'library', uri: asset.uri, width: String(asset.width ?? ''), height: String(asset.height ?? '') } });
        })
        .catch(() => Alert.alert(noWidow('No se pudo abrir Fotos'), noWidow('Inténtalo otra vez.')));
    };
    onClose();
  };

  type Option = { label: string; sub?: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void };
  const options: Option[] = [
    { label: 'Tomar foto', icon: 'camera-outline', onPress: () => go({ pathname: '/foto-menu', params: { source: 'camera' } }) },
    { label: 'Elegir de Fotos', icon: 'images-outline', onPress: pickFromLibrary },
    { label: 'Escribir a mano', icon: 'create-outline', onPress: () => go('/menu-editar') },
  ];
  const notices: Option[] = create ? [
    { label: 'Avisar a quienes te siguen', sub: 'Abrimos tarde, hoy no abrimos, se acabó', icon: 'notifications-outline', onPress: () => go('/avisar') },
    ...(noticesLeft !== null ? [{ label: 'Aviso especial', sub: `Promoción de 24 horas · te quedan ${noticesLeft} de ${PLANS.pro.specialNotices}`, icon: 'megaphone-outline' as const, onPress: () => go('/aviso-especial') }] : []),
  ] : [];
  const renderGroup = (label: string | null, list: Option[]) => (
    <View style={s.group} key={label ?? 'menu'}>
      <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
      <View pointerEvents="none" style={[s.groupTint, { backgroundColor: theme.isDark ? 'rgba(20,21,24,0.90)' : 'rgba(255,255,255,0.88)' }]} />
      {!!label && <Text style={[s.groupLabel, { color: c.textSecondary }]} accessibilityRole="header">{label}</Text>}
      {list.map((option, index) => (
        <TouchableOpacity
          key={option.label}
          onPress={option.onPress}
          style={[s.row, (index > 0 || !!label) && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel={option.sub ? `${option.label}. ${option.sub}` : option.label}>
          <Ionicons name={option.icon} size={20} color={c.text} />
          <View style={s.rowBody}>
            <Text style={[s.rowText, { color: c.text }]}>{noWidow(option.label)}</Text>
            {!!option.sub && <Text style={[s.rowSub, { color: c.textSecondary }]}>{noWidow(option.sub)}</Text>}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <Modal transparent visible={rendered} animationType="none" onDismiss={finishDismiss} onRequestClose={() => { onCancel?.(); onClose(); }} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}>
          <TouchableOpacity activeOpacity={1} style={s.backdrop} onPress={() => { onCancel?.(); onClose(); }} accessibilityRole="button" accessibilityLabel="Cerrar" />
        </Animated.View>
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={() => { onCancel?.(); onClose(); }} onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)} style={[s.wrap, { paddingBottom: bottomPadding, transform: [{ translateY }] }]}>
          {renderGroup(create ? 'MENÚ DE HOY' : null, options)}
          {!!notices.length && renderGroup('AVISOS', notices)}
          <TouchableOpacity onPress={() => { onCancel?.(); onClose(); }} style={s.cancelGroup} accessibilityRole="button" accessibilityLabel="Cancelar">
            <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
            <View pointerEvents="none" style={[s.groupTint, { backgroundColor: theme.isDark ? 'rgba(20,21,24,0.90)' : 'rgba(255,255,255,0.88)' }]} />
            <Text style={[s.cancelText, { color: c.text }]}>Cancelar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(isDark: boolean) {
  const border = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  return StyleSheet.create({
    // Más opaco que antes: el texto de atrás no debe leerse a través del menú.
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.32)' },
    wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 8, gap: 8 },
    group: { borderRadius: Radius.card, borderCurve: 'continuous', overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: border },
    groupTint: StyleSheet.absoluteFillObject,
    row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18 },
    rowBody: { flex: 1, minWidth: 0, paddingVertical: 10 },
    rowText: { fontSize: 16, fontWeight: '500' },
    rowSub: { marginTop: 2, fontSize: 13, lineHeight: 17, fontWeight: '400' },
    groupLabel: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8, fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
    cancelGroup: { minHeight: 56, borderRadius: Radius.card, borderCurve: 'continuous', overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderColor: border },
    cancelText: { fontSize: 16, fontWeight: '700' },
  });
}
