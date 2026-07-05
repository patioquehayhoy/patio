import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { useTheme } from '@/lib/theme';

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
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      activeOpacity={0.72}
      style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
      <BlurView
        intensity={theme.isDark ? 42 : 34}
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
