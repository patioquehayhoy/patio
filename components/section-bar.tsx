import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';

import { sectionDisplayName } from '@/lib/section-names';

type Colors = { text: string; textSecondary: string; bg: string; border: string; glass: string; isDark: boolean };

// Barra de secciones para menús largos (2026-11-08, sustituye al índice
// lateral): el patrón que la gente ya conoce de las apps de comida. Fija
// arriba, con el nombre completo de cada sección en cápsulas que se deslizan
// de lado; la sección en pantalla se marca sola mientras bajas y tocar una te
// lleva a ella. El dedo nunca tapa lo que estás leyendo: la barra vive arriba
// y lo que cambia es el menú, abajo.
export function SectionBar({ names, active, onSelect, colors, leading, style }: {
  names: string[];
  active: number;
  onSelect: (index: number) => void;
  colors: Colors;
  leading?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const scroller = useRef<ScrollView>(null);
  const chipX = useRef<number[]>([]);

  // Mantiene a la vista la cápsula de la sección actual.
  useEffect(() => {
    const x = chipX.current[active];
    if (x != null) scroller.current?.scrollTo({ x: Math.max(0, x - 20), animated: true });
  }, [active]);

  return (
    <View style={[s.wrap, { borderBottomColor: colors.border }, style]}>
      <BlurView intensity={colors.isDark ? 16 : 20} tint={colors.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glass }]} />
      <View style={s.row}>
        {leading}
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.chips, !leading && s.chipsAlone]}
          accessibilityRole="tablist">
          {names.map((name, index) => {
            const on = index === active;
            return (
              <TouchableOpacity
                key={`${name}-${index}`}
                onLayout={(event) => { chipX.current[index] = event.nativeEvent.layout.x; }}
                onPress={() => { Haptics.selectionAsync().catch(() => {}); onSelect(index); }}
                activeOpacity={0.7}
                style={[s.chip, on ? { backgroundColor: colors.text } : { borderColor: colors.border }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={sectionDisplayName(name)}>
                <Text style={[s.chipText, { color: on ? colors.bg : colors.text }, on && s.chipTextOn]} numberOfLines={1} allowFontScaling={false}>
                  {sectionDisplayName(name)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth },
  row: { height: 52, flexDirection: 'row', alignItems: 'center' },
  chips: { alignItems: 'center', gap: 8, paddingRight: 20 },
  chipsAlone: { paddingLeft: 20 },
  // Control compacto: cápsula de 32 (mitad de la altura), texto 14.
  chip: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', justifyContent: 'center' },
  chipText: { fontSize: 14, fontWeight: '400' },
  chipTextOn: { fontWeight: '700' },
});
