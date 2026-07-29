import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, TouchableOpacity } from 'react-native';

import { useTheme } from '@/lib/theme';

type Props = {
  value: boolean;
  onValueChange: (v: boolean) => void;
  /** Color del track encendido. Default: accent del tema. */
  activeColor?: string;
  disabled?: boolean;
};

export function ToggleSwitch({ value, onValueChange, activeColor, disabled = false }: Props) {
  const { theme } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: value ? 1 : 0, useNativeDriver: false, speed: 20, bounciness: 0 }).start();
  }, [anim, value]);
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.isDark ? 'rgba(255,255,255,0.22)' : '#cbced4', activeColor ?? theme.accent],
  });
  return (
    <TouchableOpacity
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => {
        void Haptics.selectionAsync();
        onValueChange(!value);
      }}
      activeOpacity={0.85}>
      <Animated.View style={[s.track, disabled && s.disabled, { backgroundColor: trackBg }]}>
        <Animated.View style={[s.thumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  track: { width: 44, height: 26, borderRadius: 13, justifyContent: 'center', paddingHorizontal: 1 },
  thumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  disabled: { opacity: 0.5 },
});
