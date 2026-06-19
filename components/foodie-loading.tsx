import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useTheme, type Theme } from '@/lib/theme';

// Loading del mapa Foodie — sobrio y editorial: un arco que gira (no la "peca"
// naranja con ondas) + label fino. Consistente con el resto de la app.
export function FoodieLoading({ label = 'Buscando alrededor' }: { label?: string }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 900, easing: Easing.linear, useNativeDriver: true })
    );
    a.start();
    return () => a.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.root} pointerEvents="none">
      <Animated.View style={[s.arc, { transform: [{ rotate }] }]} />
      <Text style={s.label} allowFontScaling={true}>{label}</Text>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    arc: {
      width: 34, height: 34, borderRadius: 17,
      borderWidth: 2.5,
      borderColor: t.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      borderTopColor: t.accent,
    },
    label: { marginTop: 20, fontSize: 11, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase', color: t.textSecondary },
  });
}
