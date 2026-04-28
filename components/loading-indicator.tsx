import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { FontFamily, FontSize, FontWeight, IconSize } from '@/constants/design-tokens';

const DOT_FRAMES = ['·', '•', '●', '•'] as const;

type LoadingVariant = 'spinner' | 'dots' | 'logo';

type LoadingIndicatorProps = {
  label?: string;
  color?: string;
  variant?: LoadingVariant;
  style?: StyleProp<ViewStyle>;
};

export function LoadingIndicator({
  label = 'Cargando',
  color = '#1D1D1F',
  variant = 'spinner',
  style,
}: LoadingIndicatorProps) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    if (variant !== 'dots') return;
    const id = setInterval(() => {
      setFrame((current) => (current + 1) % DOT_FRAMES.length);
    }, 90);
    return () => clearInterval(id);
  }, [variant]);

  return (
    <View style={[styles.container, style]}>
      {variant === 'spinner' && (
        <Ionicons name="reload" size={IconSize.lg} color={color} style={styles.spinIcon} />
      )}
      {variant === 'logo' && <Ionicons name="sparkles-outline" size={IconSize.lg} color={color} />}
      {variant === 'dots' && (
        <Text allowFontScaling={false} style={[styles.dots, { color }]}>
          {DOT_FRAMES[frame]}
        </Text>
      )}
      <Text allowFontScaling={false} style={[styles.label, { color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  spinIcon: {
    opacity: 0.9,
  },
  dots: {
    fontFamily: FontFamily.ui,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    includeFontPadding: false,
    textAlign: 'center',
  },
  label: {
    fontFamily: FontFamily.ui,
    fontSize: FontSize.meta,
    fontWeight: FontWeight.medium,
    letterSpacing: 0,
  },
});

