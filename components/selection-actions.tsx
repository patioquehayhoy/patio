import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type SelectionAction = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean };

export function SelectionActions({ actions, busy = false }: { actions: SelectionAction[]; busy?: boolean }) {
  const { theme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const expanded = fontScale > 1.4;
  return <View style={[s.bar, expanded && s.expandedBar, { backgroundColor: theme.glass, borderColor: theme.border }]}>
    <BlurView pointerEvents="none" intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
    {actions.map((action) => <TouchableOpacity key={action.label} onPress={action.onPress} disabled={busy || action.disabled}
      accessibilityRole="button" accessibilityLabel={action.label} accessibilityState={{ disabled: busy || !!action.disabled, busy }}
      style={[s.action, expanded && s.expandedAction]}>
      <Ionicons name={action.icon} size={22} color={busy || action.disabled ? theme.textMute : theme.text} />
      <Text style={[s.label, { color: busy || action.disabled ? theme.textMute : theme.text }]}>{noWidow(action.label)}</Text>
    </TouchableOpacity>)}
  </View>;
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', minHeight: 60, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingHorizontal: 4 },
  expandedBar: { flexWrap: 'wrap' },
  expandedAction: { flexBasis: '30%', flexGrow: 1 },
  action: { flex: 1, minWidth: 44, minHeight: 52, paddingVertical: 8, gap: 4, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
});
