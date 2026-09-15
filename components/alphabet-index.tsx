import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { indexAtPosition } from '@/lib/library-index';
import { useTheme } from '@/lib/theme';

// This rail scrolls to a section; it never changes the current filter.
// One adjustable accessibility element avoids dozens of tiny touch targets.
export function AlphabetIndex({ letters, activeLetter, onSelect }: {
  letters: string[]; activeLetter: string; onSelect: (letter: string) => void;
}) {
  const { theme } = useTheme();
  const [availableHeight, setAvailableHeight] = useState(0);
  const lastTouched = useRef<string | null>(null);
  const railHeight = Math.min(letters.length * 18, Math.max(44, availableHeight - 16));
  const choose = (index: number) => {
    const letter = letters[index];
    if (!letter) return;
    if (lastTouched.current !== letter) Haptics.selectionAsync().catch(() => {});
    lastTouched.current = letter;
    onSelect(letter);
  };
  return <View style={s.wrap} pointerEvents="box-none" onLayout={(event) => setAvailableHeight(event.nativeEvent.layout.height)}>
    <View
      style={[s.rail, { height: railHeight }]}
      accessible accessibilityRole="adjustable" accessibilityLabel="Índice alfabético"
      accessibilityHint="Desliza arriba o abajo para ir a otra letra. No cambia los filtros."
      accessibilityValue={{ text: activeLetter || letters[0] }}
      accessibilityActions={[{ name: 'increment', label: 'Siguiente letra' }, { name: 'decrement', label: 'Letra anterior' }]}
      onAccessibilityAction={(event) => {
        const current = Math.max(0, letters.indexOf(activeLetter));
        choose(Math.max(0, Math.min(letters.length - 1, current + (event.nativeEvent.actionName === 'increment' ? 1 : -1))));
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(event) => { lastTouched.current = null; choose(indexAtPosition(event.nativeEvent.locationY, railHeight, letters.length)); }}
      onResponderMove={(event) => choose(indexAtPosition(event.nativeEvent.locationY, railHeight, letters.length))}
      onResponderRelease={() => { lastTouched.current = null; }}
      onResponderTerminate={() => { lastTouched.current = null; }}>
      <View pointerEvents="none" style={s.letters} accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {letters.map((letter) => <View key={letter} style={s.letterSlot}><Text maxFontSizeMultiplier={1.2} style={[s.letter, { color: letter === activeLetter ? theme.accent : theme.textSecondary }]}>{letter}</Text></View>)}
      </View>
    </View>
  </View>;
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', right: 0, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },
  rail: { width: 44 },
  letters: { flex: 1 },
  letterSlot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  letter: { fontSize: 11, fontWeight: '700' },
});
