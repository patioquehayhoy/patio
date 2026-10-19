import { BottomContentFade } from '@/components/bottom-content-fade';
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

function sheetStyles(t: Theme) {
  const border = t.border;
  return StyleSheet.create({
    kav: { flex: 1 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.16)' },
    sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden', borderTopWidth: StyleSheet.hairlineWidth, borderColor: border },
    sheetTint: { ...StyleSheet.absoluteFillObject, backgroundColor: sheetSurfaceTint(t.isDark) },
    grabberTouch: { alignItems: 'center', flexShrink: 0 },
    grabber: { width: 36, height: 4, borderRadius: 2, marginTop: 8, marginBottom: 12, backgroundColor: t.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.10)' },
    panelHeader: { width: '100%', paddingHorizontal: 16, paddingBottom: 4 },
    toolbar: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', columnGap: 8, rowGap: 4 },
    titleSlot: { position: 'absolute', top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    titleRow: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 8, alignItems: 'center' },
    backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    panelTitle: { textAlign: 'center', flexShrink: 1, fontSize: 17, lineHeight: 23, fontWeight: '700', color: t.text },
    panelActions: { minWidth: 44, maxWidth: '100%', minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 4, flexShrink: 0 },
    headerIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    headerTextAction: { minWidth: 44, minHeight: 44, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    panelClear: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: t.text },
  });
}

export function LibrarySheet({ visible, onClose, title, viewKey: viewKeyProp, onClear, onBack, hideTitle, hideClose, onCreate, leadingAction, headerActions, footer, dismissDisabled, editing, preserveBrowsingHeight, stabilizeEditor, editor, preferredHeight, children, overlay, onOverlayClose, theme }: {
  visible: boolean; onClose: () => boolean | void; title: string; viewKey?: string; onClear?: () => void; onBack?: () => void;
  preferredHeight: number; hideTitle?: boolean; hideClose?: boolean; onCreate?: () => void; leadingAction?: React.ReactNode; headerActions?: React.ReactNode; footer?: React.ReactNode; dismissDisabled?: boolean; editing?: boolean; preserveBrowsingHeight?: boolean; stabilizeEditor?: boolean; editor?: React.ReactNode;
  children: React.ReactNode; overlay?: React.ReactNode; onOverlayClose?: () => void; theme: ReturnType<typeof useTheme>['theme'];
}) {
  const s = sheetStyles(theme);
  const edges = useScrollEdges(`${visible}:${viewKeyProp ?? title}`);
  const insets = useSafeAreaInsets();
  // El título puede cambiar dentro de la misma vista ("2 seleccionadas"); la
  // vista, no el título, decide cuándo se remonta el scroll y se re-mide.
  const viewKey = viewKeyProp ?? title;
  const { width: screenWidth, height: screenHeight, fontScale } = useWindowDimensions();
  const { keyboardInset, keyboardVisible, viewportHeight } = useSheetKeyboard();
  const [leadingMeasures, setLeadingMeasures] = useState<Record<string, number>>({});
  const [trailingMeasures, setTrailingMeasures] = useState<Record<string, number>>({});
  const leadingWidth = leadingMeasures[viewKey] ?? 44;
  const trailingWidth = trailingMeasures[viewKey] ?? 44;
  const sideWidth = Math.max(44, leadingWidth, trailingWidth);
  const controlsMeasured = leadingMeasures[viewKey] !== undefined && trailingMeasures[viewKey] !== undefined;
  const titleKey = `${title}:${fontScale}`;
  const [titleMeasure, setTitleMeasure] = useState({ key: '', width: 0 });
  // Measure the actual themed text; a fixed 128 pt minimum split even short titles.
  const titleWidth = titleMeasure.key === titleKey ? titleMeasure.width : title.length * 9 * fontScale;
  const separateTitle = fontScale > 1.4 || screenWidth - 32 - sideWidth * 2 < titleWidth + 16;
  const [contentSizes, setContentSizes] = useState<Record<string, number>>({});
  const contentHeight = contentSizes[viewKey] ?? 0;
  const [headerHeight, setHeaderHeight] = useState(68);
  const [footerHeight, setFooterHeight] = useState(60);
  // La hoja sigue por debajo del teclado (mismo cuerpo, mismo vidrio): las
  // esquinas redondeadas del teclado ya no dejan ver el mapa como un filo.
  const bottomPadding = keyboardVisible ? 8 : insets.bottom || 8;
  const naturalHeight = contentHeight > 0
    ? headerHeight + contentHeight + (footer ? bottomPadding : 0)
    : preferredHeight + bottomPadding;
  const measuredHeight = librarySheetHeight({ available: screenHeight - insets.top - 16,
    preferred: preferredHeight, natural: naturalHeight, header: headerHeight,
    footer: footer ? footerHeight : 0, safeBottom: bottomPadding, fontScale });
  const browsingHeight = useRef(measuredHeight);
  if (!editing && !preserveBrowsingHeight && !stabilizeEditor) browsingHeight.current = measuredHeight;
  // Preserve physical height while the naming field mounts and the keyboard
  // opens; only move further when the field really needs more visible space.
  const sheetHeight = stabilizeEditor
    ? Math.max(measuredHeight, browsingHeight.current - keyboardInset)
    : editing ? browsingHeight.current : measuredHeight;
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
    <Modal transparent visible animationType="none" onRequestClose={overlay && onOverlayClose ? onOverlayClose : onBack ?? (() => dismissRef.current())} statusBarTranslucent>
      {/* The absolute sheet follows the keyboard frame; adding padding to a
          KeyboardAvoidingView cannot reposition an absolute bottom child. */}
      <View style={s.kav}>
        <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity activeOpacity={1} style={StyleSheet.absoluteFillObject} onPress={() => dismissRef.current()} accessibilityRole="button" accessibilityLabel="Cerrar" />
        </Animated.View>
        <Animated.View accessibilityViewIsModal accessibilityElementsHidden={!!overlay} importantForAccessibility={overlay ? 'no-hide-descendants' : 'auto'} onAccessibilityEscape={onBack ?? (() => dismissRef.current())} style={[s.sheet, { height: visibleSheetHeight + keyboardInset, bottom: 0, paddingBottom: (footer ? bottomPadding : 0) + keyboardInset, transform: [{ translateY }] }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={s.sheetTint} />
          {/* Zona de arrastre ampliada (antes 22pt, muy angosta para agarrar
              con precisión — reportado como "no funciona el swipe" 2026-08-24):
              ahora cubre el grabber Y el header completo. */}
          <View {...pan.panHandlers} style={s.grabberTouch} onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
            <View style={s.grabber} />
            <View style={s.panelHeader}>
              {!hideTitle && <Text key={titleKey} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" pointerEvents="none"
                style={[s.panelTitle, { position: 'absolute', opacity: 0, alignSelf: 'flex-start' }]}
                onLayout={(event) => setTitleMeasure({ key: titleKey, width: event.nativeEvent.layout.width })}>{noWidow(title)}</Text>}
              {/* Measure actions at their natural width. Constraining them to
                  the measured width would trap text controls at the 44 pt fallback. */}
              <View style={s.toolbar}>
                <View style={s.panelActions} onLayout={(event) => {
                  const width = event.nativeEvent.layout.width;
                  setLeadingMeasures((current) => current[viewKey] === width ? current : { ...current, [viewKey]: width });
                }}>
                  {leadingAction ?? (onBack
                    ? <TouchableOpacity onPress={onBack} style={s.backButton} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="chevron-back" size={20} color={theme.text} /></TouchableOpacity>
                    : !hideClose && <TouchableOpacity style={s.headerIcon} accessibilityRole="button" accessibilityLabel="Cerrar" accessibilityState={{ disabled: !!dismissDisabled }} disabled={dismissDisabled} onPress={() => dismissRef.current()}><Ionicons name="close" size={20} color={theme.textSecondary} /></TouchableOpacity>)}
                </View>
                {!separateTitle && <View pointerEvents="none" accessibilityElementsHidden={!controlsMeasured} style={[s.titleSlot, { left: sideWidth, right: sideWidth }, !controlsMeasured && { opacity: 0 }]}>{!hideTitle && <Text accessibilityRole="header" accessibilityLiveRegion="polite" style={s.panelTitle}>{noWidow(title)}</Text>}</View>}
                <View style={[s.panelActions, { marginLeft: 'auto', justifyContent: 'flex-end' }]} onLayout={(event) => {
                  const width = event.nativeEvent.layout.width;
                  setTrailingMeasures((current) => current[viewKey] === width ? current : { ...current, [viewKey]: width });
                }}>
                  {!!onClear && <TouchableOpacity style={s.headerTextAction} accessibilityRole="button" accessibilityLabel={`Limpiar ${title.toLowerCase()}`} onPress={onClear}><Text numberOfLines={1} style={s.panelClear}>Limpiar</Text></TouchableOpacity>}
                  {headerActions}
                  {onCreate && <TouchableOpacity style={s.headerIcon} disabled={dismissDisabled} accessibilityState={{ disabled: !!dismissDisabled }} onPress={onCreate} accessibilityRole="button" accessibilityLabel="Nueva lista"><Ionicons name="add" size={22} color={theme.text} /></TouchableOpacity>}
                </View>
              </View>
              {separateTitle && !hideTitle && <View style={s.titleRow}><Text accessibilityRole="header" accessibilityLiveRegion="polite" style={s.panelTitle}>{noWidow(title)}</Text></View>}
            </View>
          </View>
          <View style={{ flex: 1, minHeight: 0 }}>
            <ScrollView key={`${visible}:${viewKey}`} style={{ flex: 1 }} onLayout={edges.onLayout} onScroll={edges.onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'}
            onContentSizeChange={(width, height) => { edges.onContentSizeChange(width, height); setContentSizes((current) => current[viewKey] === height ? current : { ...current, [viewKey]: height }); }}
            contentContainerStyle={{ paddingBottom: footer ? Math.min(footerHeight, footerMaxHeight) + 16 : 16 + bottomPadding }}>
              {editor}
              {children}
            </ScrollView>
          </View>
          {footer && <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: bottomPadding + keyboardInset }}>
            <BottomContentFade height={Math.min(footerHeight, footerMaxHeight) + bottomPadding + 16} bottom={-bottomPadding} />
            <ScrollView style={{ flexGrow: 0, flexShrink: 0, height: Math.min(footerHeight, footerMaxHeight), maxHeight: footerMaxHeight }}
              keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator indicatorStyle={theme.isDark ? 'white' : 'black'}
              onContentSizeChange={(_width, height) => setFooterHeight(height)}>{footer}</ScrollView>
          </View>}
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
