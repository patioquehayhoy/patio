import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View, type View as RNView } from 'react-native';

import { Radius, useTheme, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

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
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [layout, setLayout] = useState<{ top?: number; bottom?: number; left: number } | null>(null);

  useEffect(() => {
    if (!visible || !anchorRef.current) return;
    anchorRef.current.measureInWindow((x, y, width, height) => {
      const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
      const spaceBelow = screenHeight - (y + height);
      const left = Math.min(Math.max(8, x + width - MENU_WIDTH), screenWidth - MENU_WIDTH - 8);
      if (spaceBelow > 220 || spaceBelow > screenHeight - y) {
        setLayout({ top: y + height + GAP, left });
      } else {
        setLayout({ bottom: screenHeight - y + GAP, left });
      }
    });
    scale.setValue(0.9);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, stiffness: 420, damping: 28, mass: 0.7, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 130, useNativeDriver: true }),
    ]).start();
  }, [visible, anchorRef, scale, opacity]);

  const runOption = useCallback((option: ActionSheetOption) => {
    onDismiss();
    option.onPress();
  }, [onDismiss]);

  if (!visible || !layout) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={StyleSheet.absoluteFillObject} />
      </TouchableWithoutFeedback>
      <Animated.View
        style={[
          s.menu,
          { width: MENU_WIDTH, left: layout.left, top: layout.top, bottom: layout.bottom },
          { opacity, transform: [{ scale }] },
        ]}>
        <BlurView intensity={theme.isDark ? 26 : 30} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        <View pointerEvents="none" style={s.tint} />
        {!!title && (
          <View style={s.titleRow}><Text style={s.titleText} numberOfLines={1}>{noWidow(title)}</Text></View>
        )}
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.label}
            onPress={() => runOption(option)}
            style={[s.row, (index > 0 || !!title) && s.divider]}
            accessibilityRole="button"
            accessibilityLabel={option.label}>
            <Text style={[s.rowText, { color: theme.text }]}>{option.label}</Text>
            <Ionicons name={option.icon} size={17} color={theme.text} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </Modal>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    menu: { position: 'absolute', borderRadius: Radius.card, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: t.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.75)', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: t.isDark ? 0.32 : 0.16, shadowRadius: 20, elevation: 10 },
    tint: { ...StyleSheet.absoluteFillObject, backgroundColor: t.isDark ? 'rgba(28,29,32,0.78)' : 'rgba(255,255,255,0.78)' },
    titleRow: { minHeight: 34, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
    titleText: { fontSize: 12, fontWeight: '700', color: t.textSecondary, textAlign: 'center' },
    row: { minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.border },
    rowText: { fontSize: 15.5, fontWeight: '500' },
  });
}
