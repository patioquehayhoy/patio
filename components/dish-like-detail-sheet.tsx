import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, PanResponder, StyleSheet, Text, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarCircle } from '@/components/avatar-circle';
import { fonderoPalette } from '@/lib/fondero-palette';
import { isVerticalSheetDrag, SHEET_DISMISS_MS, SHEET_SPRING, shouldDismissSheet } from '@/lib/sheet-motion';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type DishLikeAuthor = { name: string; avatarUrl?: string; label: string };

// El total de un platillo se acumula entre publicaciones a propósito
// (canonicalDishName en lib/menu-store.ts) — no es "la milanesa del
// martes", es "la milanesa" completa. Tocar una notificación de like abre
// este detalle para que ese acumulado sea visible, no solo el número
// suelto de la fila (pedido explícito de Alejandro 2026-08-29).
export function DishLikeDetailSheet({ visible, onClose, dishName, authors }: {
  visible: boolean;
  onClose: () => void;
  dishName: string;
  authors: DishLikeAuthor[];
}) {
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  const [rendered, setRendered] = useState(visible);

  useEffect(() => {
    if (visible) {
      translateY.setValue(screenHeight);
      setRendered(true);
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    } else if (rendered) {
      Animated.timing(translateY, { toValue: screenHeight, duration: SHEET_DISMISS_MS, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, screenHeight]);

  // El "grabber" existía solo como dibujo — no respondía al arrastre, una
  // afordancia que prometía un gesto y no lo cumplía. Mismo PanResponder
  // ya probado en save-to-list-sheet.tsx: suelta pasado el umbral (70pt o
  // velocidad>0.9) cierra desde donde iba el dedo, si no regresa con
  // resorte (pedido Alejandro 2026-08-30, fundamentos de gesto Apple).
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => isVerticalSheetDrag(gesture.dx, gesture.dy),
    onPanResponderMove: (_event, gesture) => translateY.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_event, gesture) => {
      if (shouldDismissSheet(gesture.dy, gesture.vy)) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onClose();
        return;
      }
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    },
    onPanResponderTerminate: () => {
      Animated.spring(translateY, { toValue: 0, ...SHEET_SPRING }).start();
    },
  })).current;

  const backdropOpacity = translateY.interpolate({ inputRange: [0, screenHeight], outputRange: [1, 0], extrapolate: 'clamp' });

  if (!rendered) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={onClose} accessibilityLabel="Cerrar">
          <Animated.View style={[s.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[s.sheet, { maxHeight: screenHeight * 0.7, paddingBottom: insets.bottom || 20, transform: [{ translateY }] }]}>
          <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
          <View pointerEvents="none" style={[s.tint, { backgroundColor: theme.isDark ? 'rgba(20,21,24,0.72)' : 'rgba(255,255,255,0.70)' }]} />
          <View {...pan.panHandlers} style={s.handleArea}>
            <View style={s.grabber} />
          </View>
          <View style={s.header}>
            <Text style={[s.title, { color: c.text }]} numberOfLines={1}>{noWidow(dishName)}</Text>
            <Text style={[s.subtitle, { color: c.textSecondary }]}>{authors.length === 1 ? '1 like en total' : `${authors.length} likes en total`}</Text>
          </View>
          {authors.map((author, index) => (
            <View key={`${author.name}-${index}`} style={[s.row, index > 0 && { borderTopColor: c.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <AvatarCircle name={author.name} avatarUrl={author.avatarUrl} backgroundColor={c.iconBg} textColor={c.textSecondary} size={34} />
              <View style={s.rowBody}>
                <Text style={[s.rowText, { color: c.text }]} numberOfLines={1}>{author.name}</Text>
                <Text style={[s.rowSubtext, { color: c.textMute }]} numberOfLines={1}>{noWidow(author.label)}</Text>
              </View>
            </View>
          ))}
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.25)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  tint: StyleSheet.absoluteFillObject,
  handleArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 36, height: 5, borderRadius: 3, backgroundColor: 'rgba(128,128,128,0.4)' },
  header: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { marginTop: 2, fontSize: 13, fontWeight: '400' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12 },
  rowBody: { flex: 1, minWidth: 0 },
  rowText: { fontSize: 14.5, fontWeight: '600' },
  rowSubtext: { marginTop: 1, fontSize: 12.5, fontWeight: '400' },
});
