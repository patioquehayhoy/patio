import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { getPatioCardInfo } from '@/lib/patio-card-info';
import type { Patio } from '@/lib/patios';
import { useTheme } from '@/lib/theme';

/** Badge anchored to the business icon container, never the glyph or map pin. */
export function PatioStatusIndicator({ patio, style }: { patio: Patio; style?: StyleProp<ViewStyle> }) {
  const { theme } = useTheme();
  const info = getPatioCardInfo(patio);
  if (info.open === null) return null;
  const color = info.open ? (info.closingSoon ? '#B88600' : '#1F9D55') : theme.textMute;
  return <View accessible accessibilityLabel={info.openLabel} style={[s.slot, style]}>
    <View style={[s.dot, { backgroundColor: color }]} />
  </View>;
}
const s = StyleSheet.create({
  slot: { position: 'absolute', top: -3, right: -3, width: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});
