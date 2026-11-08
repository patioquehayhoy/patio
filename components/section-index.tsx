import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { sectionIndexAt, sectionIndexLabels } from '@/lib/section-index';

type Colors = { text: string; textMute: string; accent: string; surface: string; border: string };

// Índice lateral de secciones para menús largos, como las letras de Contactos
// o de Música: en lugar de letras, cada marca es una sección. Tocar o
// deslizar el dedo salta a esa sección; mientras se desliza, una burbuja
// muestra el nombre completo y cada cambio da un toque de vibración. Va en
// una cápsula de vidrio para leerse igual sobre foto o sobre el menú.
export function SectionIndex({ names, onSelect, colors, dark = false, maxHeight = 520, style }: {
  names: string[];
  onSelect: (index: number, dragging: boolean) => void;
  colors: Colors;
  dark?: boolean;
  maxHeight?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const labels = useMemo(() => sectionIndexLabels(names), [names]);
  const [active, setActive] = useState<number | null>(null);
  const strip = useRef<View>(null);
  const frame = useRef({ top: 0, height: 0 });
  const last = useRef(-1);
  const select = useRef(onSelect);
  select.current = onSelect;
  const count = labels.length;
  // Con muchas secciones las marcas se juntan (mínimo 14 de alto) para caber.
  const item = Math.max(14, Math.min(22, Math.floor((maxHeight - 12) / Math.max(1, count))));

  const pick = (pageY: number, dragging: boolean) => {
    const index = sectionIndexAt(pageY - frame.current.top - 6, frame.current.height - 12, count);
    if (index === last.current) return;
    last.current = index;
    Haptics.selectionAsync().catch(() => {});
    setActive(index);
    select.current(index, dragging);
  };

  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (event) => {
      const pageY = event.nativeEvent.pageY;
      strip.current?.measureInWindow((_x, y, _w, h) => {
        frame.current = { top: y, height: h };
        pick(pageY, true);
      });
    },
    onPanResponderMove: (event) => pick(event.nativeEvent.pageY, true),
    onPanResponderRelease: () => { last.current = -1; setActive(null); },
    onPanResponderTerminate: () => { last.current = -1; setActive(null); },
    // pick() solo lee refs: no hace falta recrear el responder.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [count]);

  if (count < 2) return null;
  return (
    <View style={[s.wrap, style]} pointerEvents="box-none">
      {active != null && (
        <View pointerEvents="none" style={[s.bubble, { top: 6 + active * item + item / 2 - 18, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.bubbleText, { color: colors.text }]} numberOfLines={1}>{names[active]?.trim() || `Sección ${active + 1}`}</Text>
        </View>
      )}
      <View
        ref={strip}
        style={[s.strip, { borderColor: dark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.18)' }]}
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Ir a una sección"
        accessibilityValue={{ text: names[Math.max(0, last.current)] ?? '' }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const current = Math.max(0, last.current);
          const next = event.nativeEvent.actionName === 'increment' ? Math.min(count - 1, current + 1) : Math.max(0, current - 1);
          last.current = next;
          select.current(next, false);
        }}>
        <BlurView intensity={dark ? 16 : 20} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        {labels.map((label, index) => (
          <Text
            key={`${label}-${index}`}
            style={[s.item, { height: item, lineHeight: item, fontSize: item >= 18 ? 10 : 9, color: index === active ? colors.accent : colors.textMute }]}
            allowFontScaling={false}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', right: 0, flexDirection: 'row', alignItems: 'flex-start' },
  // 24 de ancho: con el margen de 20 de la pantalla, apenas roza la columna derecha.
  strip: { width: 24, paddingVertical: 6, alignItems: 'center', borderRadius: 12, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth },
  item: { fontWeight: '700', letterSpacing: 0, textAlign: 'center' },
  bubble: { position: 'absolute', right: 32, height: 36, maxWidth: 230, paddingHorizontal: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  bubbleText: { fontSize: 15, fontWeight: '700' },
});
