import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import { useTheme, type Theme } from '@/lib/theme';

// Estado de carga del mapa Foodie (FoodieLoading de Figma): pin naranja con
// ondas que pulsan + label "Buscando alrededor", sobre un velo del mapa.
export function FoodieLoading({ label = 'Buscando alrededor' }: { label?: string }) {
  const { theme } = useTheme();
  const s = makeStyles(theme);

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 1600, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ])
      );
    const a = loop(ring1, 0);
    const b = loop(ring2, 600);
    a.start();
    b.start();
    return () => { a.stop(); b.stop(); };
  }, [ring1, ring2]);

  const ringStyle = (val: Animated.Value) => ({
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] }) }],
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
  });

  return (
    <View style={s.root} pointerEvents="none">
      <View style={s.pinWrap}>
        <Animated.View style={[s.ring, ringStyle(ring1)]} />
        <Animated.View style={[s.ring, ringStyle(ring2)]} />
        <View style={s.pinCore} />
      </View>
      <Text style={s.label} allowFontScaling={true}>{label}</Text>
    </View>
  );
}

function makeStyles(t: Theme) {
  return StyleSheet.create({
    root: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
    pinWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center' },
    ring: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: t.accent },
    pinCore: { width: 28, height: 28, borderRadius: 14, backgroundColor: t.accent, shadowColor: t.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 6 },
    label: { marginTop: 26, fontSize: 11, fontWeight: '900', letterSpacing: 1.6, textTransform: 'uppercase', color: t.accent },
  });
}
