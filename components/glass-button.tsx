import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/lib/theme';

// Objetivo táctil ≥44×44pt (Apple HIG) sin agrandar el círculo visual: el
// hitSlop crece hacia afuera lo que falte según `size` para completar los
// 44pt, en vez de inflar el glass en sí.
function hitSlopFor(size: number) {
  const extra = Math.max(0, Math.ceil((44 - size) / 2));
  return { top: extra, bottom: extra, left: extra, right: extra };
}

export function GlassIconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
  iconSize = 20,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  size?: number;
  iconSize?: number;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      hitSlop={hitSlopFor(size)}
      activeOpacity={0.72}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: theme.surface }}>
      <BlurView
        intensity={theme.isDark ? 16 : 20}
        tint={theme.isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          styles.ring,
          { borderRadius: size / 2, borderColor: theme.isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)' },
        ]}>
        <Ionicons name={icon} size={iconSize} color={theme.text} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
