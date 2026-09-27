import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import type { ScrollEdges } from '@/lib/use-scroll-edges';
import { useTheme } from '@/lib/theme';

type ScrollEdgeFadeProps = ScrollEdges & { height?: number };

/** Overlay sibling of a ScrollView, inside its viewport container. */
export function ScrollEdgeFade({ top, bottom, height = 16 }: ScrollEdgeFadeProps) {
  const { theme } = useTheme();
  if (!top && !bottom) return null;

  // Glass tokens are rgba. Retain their RGB at alpha zero for a clean fade.
  const transparentGlass = theme.glass.replace(/,\s*[\d.]+\)$/, ',0)');
  return (
    <View
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFillObject}>
      {top && (
        <LinearGradient
          pointerEvents="none"
          colors={[theme.glass, transparentGlass]}
          style={[styles.edge, { top: 0, height }]}
        />
      )}
      {bottom && (
        <LinearGradient
          pointerEvents="none"
          colors={[transparentGlass, theme.glass]}
          style={[styles.edge, { bottom: 0, height }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  edge: { position: 'absolute', left: 0, right: 0 },
});
