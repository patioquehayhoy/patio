import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollEdges } from '@/lib/use-scroll-edges';
import { isVerticalSheetDrag, SHEET_DISMISS_MS, SHEET_SPRING, shouldDismissSheet } from '@/lib/sheet-motion';
import { useSheetKeyboard } from '@/lib/use-sheet-keyboard';
import { type Theme, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { libraryFooterMaxHeight, librarySheetHeight } from '@/lib/layout-metrics';
import { sheetSurfaceTint } from '@/lib/surface-styles';

const CLEAR_HIT_SLOP = { top: 13, bottom: 13, left: 8, right: 4 };
function sheetStyles(t: Theme) {
  const border = t.border;
  return StyleSheet.create({
    kav: { flex: 1 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.16)' },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderTopWidth: StyleSheet.hairlineWidth, borderColor: border },
    sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: sheetSurfaceTint(t.isDark) },
    grabberTouch: { alignItems: 'center', flexShrink: 0 },
    grabber: { width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 12, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' },
    panelHeader: { width: '100%', minHeight: 44, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8 },
    panelHeading: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center' },
    backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: -12 },
    panelTitle: { flexShrink: 1, fontSize: 17, fontWeight: '700', color: t.text },
    panelActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    panelClear: { fontSize: 14, fontWeight: '600', color: t.text },
  });
}

export function LibrarySheet({ visible, onClose, title, viewKey: viewKeyProp, onClear, onBack, hideTitle, onCreate, headerActions, footer, dismissDisabled, editing, editor, preferredHeight, children, overlay, theme }: {
  visible: boolean; onClose: () => boolean | void; title: string; viewKey?: string; onClear?: () => void; onBack?: () => void;
  preferredHeight: number; hideTitle?: boolean; onCreate?: () => void; headerActions?: React.ReactNode; footer?: React.ReactNode; dismissDisabled?: boolean; editing?: boolean; editor?: React.ReactNode;
  children: React.ReactNode; overlay?: React.ReactNode; theme: ReturnType<typeof useTheme>['theme'];
}) {
  const s = sheetStyles(theme);
  const edges = useScrollEdges(`${visible}:${viewKeyProp ?? title}`);
  const insets = useSafeAreaInsets();
  // El título puede cambiar dentro de la misma vista ("2 seleccionadas"); la
  // vista, no el título, decide cuándo se remonta el scroll y se re-mide.
  const viewKey = viewKeyProp ?? title;
  const { height: screenHeight, fontScale } = useWindowDimensions();
  const { keyboardInset, keyboardVisible, viewportHeight } = useSheetKeyboard();
  const [contentSize, setContentSize] = useState({ title: '', height: 0 });
  const [headerHeight, setHeaderHeight] = useState(68);
  const [footerHeight, setFooterHeight] = useState(60);
  // La hoja sigue por debajo del teclado (mismo cuerpo, mismo vidrio): las
  // esquinas redondeadas del teclado ya no dejan ver el mapa como un filo.
  const bottomPadding = keyboardVisible ? 8 : insets.bottom || 8;
  const naturalHeight = contentSize.title === viewKey && contentSize.height > 0
    ? headerHeight + contentSize.height + (footer ? footerHeight + bottomPadding : 0)
    : preferredHeight + bottomPadding;
  const measuredHeight = librarySheetHeight({ available: screenHeight - insets.top - 16,
    preferred: preferredHeight, natural: naturalHeight, header: headerHeight,
    footer: footer ? footerHeight : 0, safeBottom: bottomPadding, fontScale });
  const browsingHeight = useRef(measuredHeight);
  if (!editing) browsingHeight.current = measuredHeight;
  const sheetHeight = editing ? browsingHeight.current : measuredHeight;
  const translateY = useRef(new Animated.Value(sheetHeight)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const dismissDisabledRef = useRef(!!dismissDisabled);
  dismissDisabledRef.current = !!dismissDisabled;
  const animatedClose = useRef(false);
  const [rendered, setRendered] = useState(visible);
  const visibleSheetHeight = Math.max(0, Math.min(sheetHeight, viewportHeight - insets.top - 16));
  const footerMaxHeight = libraryFooterMaxHeight(visibleSheetHeight, headerHeight, bottomPadding, fontScale);
  const visibleSheetHeightRef = useRef(visibleSheetHeight);
  visibleSheetHeightRef.current = visibleSheetHeight;
  const visibleRef = useRef(visible);
  visibleRef.current = visible;
  const backdropOpacity = translateY.interpolate({ inputRange: [0, Math.max(1, visibleSheetHeight)], outputRange: [1, 0], extrapolate: 'clamp' });

  const dismiss = (withFeedback = false) => {
    if (animatedClose.current || dismissDisabledRef.current) return;
    animatedClose.current = true;
    if (withFeedback) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Animated.timing(translateY, { toValue: visibleSheetHeightRef.current, duration: SHEET_DISMISS_MS, useNativeDriver: true }).start(({ finished }) => {
      if (!finished) {
        animatedClose.current = false;
        if (visibleRef.current) Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
        return;
      }
      const accepted = onCloseRef.current();
      if (accepted === false) {
        animatedClose.current = false;
        Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
      }
    });
  };
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;

  useEffect(() => {
    if (visible) {
      animatedClose.current = false;
      translateY.setValue(sheetHeight);
      setRendered(true);
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    } else if (rendered) {
      if (animatedClose.current) {
        animatedClose.current = false;
        setRendered(false);
        return;
      }
      Animated.timing(translateY, { toValue: sheetHeight, duration: SHEET_DISMISS_MS, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => !dismissDisabledRef.current && isVerticalSheetDrag(gesture.dx, gesture.dy),
      onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
      onPanResponderRelease: (_event, gesture) => {
        if (!dismissDisabledRef.current && shouldDismissSheet(gesture.dy, gesture.vy)) {
          dismissRef.current(true);
        } else {
          Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
        }
      },
      onPanResponderTerminate: () => Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start(),
    })
  ).current;

  if (!rendered) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onBack ?? (() => dismissRef.current())} statusBarTranslucent>
      {/* The absolute sheet follows the keyboard frame; adding padding to a
          KeyboardAvoidingView cannot reposition an absolute bottom child. */}
      <View style={s.kav}>
        <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => dismissRef.current()} accessibilityRole="button" accessibilityLabel="Cerrar" />
        </Animated.View>
        <Animated.View accessibilityViewIsModal onAccessibilityEscape={onBack ?? (() => dismissRef.current())} style={[s.sheet, { height: visibleSheetHeight + keyboardInset, bottom: 0, paddingBottom: (footer ? bottomPadding : 0) + keyboardInset, transform: [{ translateY }] }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={s.sheetTint} />
          {/* Zona de arrastre ampliada (antes 22pt, muy angosta para agarrar
              con precisión — reportado como "no funciona el swipe" 2026-08-24):
              ahora cubre el grabber Y el header completo. */}
          <View {...pan.panHandlers} style={s.grabberTouch} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
            <View style={s.grabber} />
            <View style={s.panelHeader}>
              <View style={s.panelHeading}>
                {onBack && <TouchableOpacity onPress={onBack} style={s.backButton} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="chevron-back" size={20} color={theme.text} /></TouchableOpacity>}
                {!hideTitle && <Text accessibilityRole="header" style={s.panelTitle}>{noWidow(title)}</Text>}
              </View>
              <View style={s.panelActions}>
                {onCreate && <TouchableOpacity style={s.headerIcon} onPress={onCreate} accessibilityRole="button" accessibilityLabel="Nueva lista"><Ionicons name="add" size={22} color={theme.text} /></TouchableOpacity>}
                {!!onClear && <TouchableOpacity hitSlop={CLEAR_HIT_SLOP} accessibilityRole="button" accessibilityLabel={`Limpiar ${title.toLowerCase()}`} onPress={onClear}><Text style={s.panelClear}>Limpiar</Text></TouchableOpacity>}
                {headerActions}
                <TouchableOpacity style={s.headerIcon} accessibilityRole="button" accessibilityLabel="Cerrar" accessibilityState={{ disabled: !!dismissDisabled }} disabled={dismissDisabled} onPress={() => dismissRef.current()}><Ionicons name="close" size={20} color={theme.textSecondary} /></TouchableOpacity>
              </View>
            </View>
          </View>
          <View style={{ flex: 1, minHeight: 0 }}>
            <ScrollView key={`${visible}:${viewKey}`} style={{ flex: 1 }} onLayout={edges.onLayout} onScroll={edges.onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'}
            onContentSizeChange={(width, height) => { edges.onContentSizeChange(width, height); setContentSize((current) => current.title === viewKey && current.height === height ? current : { title: viewKey, height }); }}
            contentContainerStyle={{ paddingBottom: footer ? 16 : 16 + bottomPadding }}>
              {editor}
              {children}
            </ScrollView>
          </View>
          {footer && <ScrollView style={{ flexGrow: 0, flexShrink: 0, height: Math.min(footerHeight, footerMaxHeight), maxHeight: footerMaxHeight }}
            keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'}
            onContentSizeChange={(_width, height) => setFooterHeight(height)}>{footer}</ScrollView>}
        </Animated.View>
        {/* El menú de acciones por lista vive AQUÍ — dentro del mismo Modal
            (evita el bug real de dos <Modal> de RN anidados en iOS, ver
            auditoría 2026-08-24), pero FUERA del Animated.View del sheet: ese
            contenedor tiene alto fijo + overflow:hidden + esquinas
            redondeadas propias, así que un overlay puesto DENTRO se recortaba
            contra esos bordes en vez de cubrir la pantalla completa (bug real
            reportado por Alejandro — esquinas cortadas, card apretada contra
            el panel de abajo). Como hermano del sheet, cubre toda la pantalla
            igual que el ActionSheet real. */}
        {overlay}
      </View>
    </Modal>
  );
}
