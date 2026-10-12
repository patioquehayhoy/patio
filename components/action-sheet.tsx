import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, useWindowDimensions, View, type View as RNView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Radius, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';
import { floatingSurfaceShadow } from '@/lib/surface-styles';

// Traduce el PATRÓN del menú contextual real de iOS (UIMenu — Archivos,
// Fotos, Notas: aparece anclado junto al botón que tocaste, no desde abajo,
// sin fila de "Cancelar" porque tocar fuera ya cierra) al lenguaje visual de
// Patio (vidrio, tipografía de marca, geometría redondeada) — NUNCA al
// chrome literal de iOS. Auditado 2026-08-24: usar el UIMenu real (nativo,
// gris de sistema) rompería la identidad de marca justo como ya rompía
// Alert.alert — la app tiene diseño propio en todo lo que es navegación/menú
// suyo; lo nativo queda solo para cámara, share sheet, selector de fotos y
// pickers estándar, donde el usuario YA espera ver el sistema.
export type ActionSheetOption = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  sectionLabel?: string;
  selected?: boolean;
  accessibilityHint?: string;
  afterDismiss?: boolean;
  destructive?: boolean;
  onPress: () => void;
};

type ActionSheetProps = {
  visible: boolean;
  anchorRef: React.RefObject<RNView | null>;
  title?: string;
  options: ActionSheetOption[];
  onDismiss: () => void;
};

export const ACTION_SHEET_MENU_WIDTH = 240;
const MENU_WIDTH = ACTION_SHEET_MENU_WIDTH;
const GAP = 8;

export function ActionSheet({ visible, anchorRef, title, options, onDismiss }: ActionSheetProps) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const menuWidth = Math.min(MENU_WIDTH, screenWidth - insets.left - insets.right - GAP * 2);
  const grouped = options.some((option) => option.sectionLabel);
  const estimatedHeight = options.length * 46 + options.filter((option) => option.sectionLabel).length * 28 + (title ? 34 : 0);
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [layout, setLayout] = useState<{ top?: number; bottom?: number; left: number; maxHeight: number } | null>(null);
  const deferredAction = useRef<(() => void) | null>(null);
  const finishDismiss = useCallback(() => {
    const action = deferredAction.current;
    deferredAction.current = null;
    action?.();
  }, []);

  // UIKit reports the actual end of dismissal. Android's Modal has no
  // onDismiss event; with animationType=none, wait for the hidden render.
  useEffect(() => {
    if (visible || Platform.OS === 'ios') return;
    const frame = requestAnimationFrame(finishDismiss);
    return () => cancelAnimationFrame(frame);
  }, [visible, finishDismiss]);

  useEffect(() => {
    if (!visible || !anchorRef.current) return;
    let cancelled = false;
    anchorRef.current.measureInWindow((x, y, width, height) => {
      if (cancelled) return;
      const topEdge = insets.top + GAP;
      const bottomEdge = screenHeight - insets.bottom - GAP;
      const below = Math.min(bottomEdge - 44, Math.max(topEdge, y + height + GAP));
      const above = Math.max(topEdge + 44, Math.min(bottomEdge, y - GAP));
      const spaceBelow = bottomEdge - below;
      const spaceAbove = above - topEdge;
      const left = Math.min(Math.max(insets.left + GAP, x + width - menuWidth), screenWidth - insets.right - menuWidth - GAP);
      if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
        setLayout({ top: below, left, maxHeight: spaceBelow });
      } else {
        setLayout({ bottom: screenHeight - above, left, maxHeight: spaceAbove });
      }
    });
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, stiffness: 420, damping: 28, mass: 0.7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
    return () => { cancelled = true; };
  }, [visible, anchorRef, scale, opacity, screenWidth, screenHeight, insets.top, insets.bottom, insets.left, insets.right, menuWidth, estimatedHeight]);

  const runOption = useCallback((option: ActionSheetOption) => {
    if (option.afterDismiss) deferredAction.current = option.onPress;
    onDismiss();
    if (!option.afterDismiss) option.onPress();
  }, [onDismiss]);

  // Keep the native modal mounted while hidden so iOS can send onDismiss.
  if (!layout) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss} onDismiss={finishDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={StyleSheet.absoluteFillObject} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          s.menu,
          { width: menuWidth, ...layout },
          { opacity, transform: [{ scale }] },
        ]}>
        <BlurView intensity={theme.isDark ? 26 : 30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        <View pointerEvents="none" style={s.tint} />
        <ScrollView bounces={false} keyboardShouldPersistTaps="handled" accessibilityViewIsModal>
        {!!title && (
          <View style={s.titleRow}><Text style={s.titleText} numberOfLines={1}>{noWidow(title)}</Text></View>
        )}
        {options.map((option, index) => (
          <View key={option.label}>
            {!!option.sectionLabel && (
              <View style={[s.sectionLabelRow, (index > 0 || !!title) && s.divider]}>
                <Text style={s.sectionLabelText}>{noWidow(option.sectionLabel)}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={() => runOption(option)}
              style={[s.row, !grouped && (index > 0 || !!title) && s.divider]}
              accessibilityRole="button"
              accessibilityLabel={option.label}
              accessibilityHint={option.accessibilityHint}
              accessibilityState={option.selected === undefined ? undefined : { selected: option.selected }}>
              {grouped && <View style={s.selectionMark}>{option.selected && <Ionicons name="checkmark" size={20} color={theme.text} />}</View>}
              <Ionicons name={option.icon} size={20} color={option.destructive ? theme.accent : theme.text} />
              <Text style={s.rowText}>{noWidow(option.label)}</Text>
              {!grouped && option.selected && <Ionicons name="checkmark" size={20} color={theme.text} />}
            </TouchableOpacity>
          </View>
        ))}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    menu: { position: 'absolute', borderRadius: Radius.card, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, ...floatingSurfaceShadow(t.isDark) },
    tint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(28,29,32,0.78)' : 'rgba(255,255,255,0.78)' },
    titleRow: { minHeight: 34, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
    titleText: { fontSize: 12, fontWeight: '700', color: t.textSecondary, textAlign: 'center' },
    sectionLabelRow: { minHeight: 28, paddingHorizontal: 14, justifyContent: 'flex-end', paddingBottom: 5 },
    sectionLabelText: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', color: t.textSecondary },
    row: { minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    rowText: { flex: 1, fontSize: 15, fontWeight: '500', color: t.text, paddingVertical: 8 },
    selectionMark: { width: 20, alignItems: 'center' },
  });
}
