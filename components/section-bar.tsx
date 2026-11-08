import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';

import { sectionDisplayName } from '@/lib/section-names';

type Colors = { text: string; textSecondary: string; bg: string; border: string; glass: string; isDark: boolean };

// Barra de secciones para menús largos (2026-11-08, sustituye al índice
// lateral): el patrón que la gente ya conoce de las apps de comida. Fija
// arriba, con el nombre completo de cada sección; la sección en pantalla se
// marca sola mientras bajas y tocar una te lleva a ella. Como en iOS, las
// secciones son texto y solo la actual lleva un fondo suave. Fondo sólido del
// lienzo: así el desvanecido de las orillas es del mismo color y no se ven
// franjas (con vidrio, el degradado no coincidía con lo de atrás).
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
  const [edges, setEdges] = useState({ start: false, end: false });
  const sizes = useRef({ content: 0, view: 0, x: 0 });

  const updateEdges = () => {
    const { content, view, x } = sizes.current;
    const next = { start: x > 4, end: content - view - x > 4 };
    setEdges((current) => (current.start === next.start && current.end === next.end ? current : next));
  };

  // Mantiene a la vista la sección actual.
  useEffect(() => {
    const x = chipX.current[active];
    if (x != null) scroller.current?.scrollTo({ x: Math.max(0, x - 24), animated: true });
  }, [active]);

  // Desvanecido exacto: del color del lienzo a transparente.
  const tint = rgb(colors.bg);
  const fadeIn = [`rgba(${tint},1)`, `rgba(${tint},0)`] as const;
  const fadeOut = [`rgba(${tint},0)`, `rgba(${tint},1)`] as const;
  const activeFill = colors.isDark ? 'rgba(255,255,255,0.12)' : 'rgba(17,18,20,0.06)';

  return (
    <View style={[s.wrap, { borderBottomColor: colors.border, backgroundColor: colors.bg }, style]}>
      <View style={s.row}>
        {leading}
        <View style={s.track}>
          <ScrollView
            ref={scroller}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.items, !leading && s.itemsAlone]}
            onLayout={(event) => { sizes.current.view = event.nativeEvent.layout.width; updateEdges(); }}
            onContentSizeChange={(width) => { sizes.current.content = width; updateEdges(); }}
            onScroll={(event) => { sizes.current.x = event.nativeEvent.contentOffset.x; updateEdges(); }}
            scrollEventThrottle={32}
            accessibilityRole="tablist">
            {names.map((name, index) => {
              const on = index === active;
              const label = sectionDisplayName(name);
              return (
                <TouchableOpacity
                  key={`${name}-${index}`}
                  onLayout={(event) => { chipX.current[index] = event.nativeEvent.layout.x; }}
                  onPress={() => { Haptics.selectionAsync().catch(() => {}); onSelect(index); }}
                  activeOpacity={0.7}
                  style={[s.item, on && { backgroundColor: activeFill }]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={label}>
                  <Text style={[s.itemText, { color: on ? colors.text : colors.textSecondary }, on && s.itemTextOn]} numberOfLines={1} allowFontScaling={false}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {edges.start && <LinearGradient pointerEvents="none" colors={fadeIn} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[s.fade, s.fadeStart]} />}
          {edges.end && <LinearGradient pointerEvents="none" colors={fadeOut} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={[s.fade, s.fadeEnd]} />}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { overflow: 'hidden', borderBottomWidth: StyleSheet.hairlineWidth },
  row: { height: 52, flexDirection: 'row', alignItems: 'center' },
  track: { flex: 1, height: 52, justifyContent: 'center' },
  items: { alignItems: 'center', gap: 4, paddingLeft: 6, paddingRight: 24 },
  // Sin «volver», el texto de la primera sección cae en el margen de 20.
  itemsAlone: { paddingLeft: 8 },
  // Texto como pestaña; la actual con fondo suave en cápsula de 32.
  item: { height: 32, paddingHorizontal: 12, borderRadius: 16, justifyContent: 'center' },
  itemText: { fontSize: 15, fontWeight: '400' },
  itemTextOn: { fontWeight: '700' },
  fade: { position: 'absolute', top: 0, bottom: 0, width: 28 },
  fadeStart: { left: 0 },
  fadeEnd: { right: 0 },
});

/** «#F8F8F5» → «248,248,245» para armar el degradado con el color exacto. */
function rgb(hex: string): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean.slice(0, 6);
  const value = Number.parseInt(full, 16);
  return Number.isFinite(value) ? `${(value >> 16) & 255},${(value >> 8) & 255},${value & 255}` : '248,248,245';
}
