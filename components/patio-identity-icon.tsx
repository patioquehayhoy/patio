import { PlaceIcon } from '@/components/place-icon';
import type { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { PatioStatusIndicator } from '@/components/patio-status-indicator';
import type { Patio } from '@/lib/patios';
import { useTheme } from '@/lib/theme';

/** Fixed identity slot; availability belongs to its corner, never to the glyph. */
export function PatioIdentityIcon({ patio, icon = 'location-outline' }: { patio: Patio; icon?: keyof typeof Ionicons.glyphMap }) {
  const { theme } = useTheme();
  return <View style={s.box}>
    <PlaceIcon name={icon} size={18} color={theme.textSecondary} />
    <PatioStatusIndicator patio={patio} />
  </View>;
}
const s = StyleSheet.create({
  box: { width: 36, height: 36, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
});
