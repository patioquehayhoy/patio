import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef } from 'react';
import { Animated, Dimensions, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, useTheme, type Theme } from '@/lib/theme';

const SCREEN_HEIGHT = Dimensions.get('screen').height;

type HintSheetProps = {
  visible: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  onDismiss: () => void;
};

export function HintSheet({ visible, icon, title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary, onDismiss }: HintSheetProps) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const insets = useSafeAreaInsets();
  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideY, { toValue: 0, speed: 14, bounciness: 0, useNativeDriver: true }).start();
    }
  }, [visible, slideY]);

  const animateOut = useCallback((cb: () => void) => {
    Animated.spring(slideY, { toValue: SCREEN_HEIGHT, speed: 14, bounciness: 0, useNativeDriver: true }).start(() => {
      slideY.setValue(SCREEN_HEIGHT);
      cb();
    });
  }, [slideY]);

  const dismiss = useCallback(() => animateOut(onDismiss), [animateOut, onDismiss]);

  const handlePrimary = useCallback(() => animateOut(onPrimary), [animateOut, onPrimary]);

  const handleSecondary = useCallback(() => {
    if (onSecondary) animateOut(onSecondary);
  }, [animateOut, onSecondary]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <View style={s.overlay}>
        <TouchableWithoutFeedback onPress={dismiss}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>
        <Animated.View style={[s.sheet, { paddingBottom: insets.bottom + 32, transform: [{ translateY: slideY }] }]}>
          <TouchableOpacity style={s.closeBtn} onPress={dismiss} activeOpacity={0.76} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={20} color={theme.text} />
          </TouchableOpacity>
          <View style={s.iconBadge}>
            <Ionicons name={icon} size={28} color={theme.accent} />
          </View>
          <Text style={s.title} allowFontScaling={true}>{title}</Text>
          <Text style={s.body} allowFontScaling={true}>{body}</Text>
          <TouchableOpacity style={s.primaryBtn} onPress={handlePrimary} activeOpacity={0.86}>
            <Text style={s.primaryText} allowFontScaling={true}>{primaryLabel}</Text>
          </TouchableOpacity>
          {!!secondaryLabel && (
            <TouchableOpacity style={s.secondaryBtn} onPress={handleSecondary} activeOpacity={0.76}>
              <Text style={s.secondaryText} allowFontScaling={true}>{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.40)', justifyContent: 'flex-end' },
    sheet:        { backgroundColor: t.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 24, paddingTop: 20 },
    closeBtn:     { position: 'absolute', top: 16, right: 16, width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: 0.4 },
    iconBadge:    { alignSelf: 'center', width: 56, height: 56, borderRadius: 16, backgroundColor: t.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 16, marginTop: 12 },
    title:        { fontSize: 24, fontWeight: '900', fontFamily: Fonts.brand, textAlign: 'center', color: t.text, marginBottom: 10 },
    body:         { fontSize: 15, fontWeight: '400', fontFamily: Fonts.brand, textAlign: 'center', color: t.textSecondary, lineHeight: 22, marginBottom: 28 },
    primaryBtn:   { minHeight: 56, borderRadius: 16, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' },
    primaryText:  { fontSize: 16, fontWeight: '900', fontFamily: Fonts.brand, color: t.bg },
    secondaryBtn: { marginTop: 10, minHeight: 48, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: t.border, alignItems: 'center', justifyContent: 'center' },
    secondaryText:{ fontSize: 15, fontWeight: '400', fontFamily: Fonts.brand, color: t.text },
  });
}
