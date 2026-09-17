import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type SelectionAction = { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean };

export function SelectionActions({ actions, busy = false }: { actions: SelectionAction[]; busy?: boolean }) {
  const { theme } = useTheme();
  return <View style={[s.bar, { backgroundColor: theme.glass, borderColor: theme.border }]}>
    <BlurView pointerEvents="none" intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
    {actions.map((action) => <TouchableOpacity key={action.label} onPress={action.onPress} disabled={busy || action.disabled}
      accessibilityRole="button" accessibilityLabel={action.label} accessibilityState={{ disabled: busy || !!action.disabled, busy }}
      style={s.action}>
      <Ionicons name={action.icon} size={22} color={busy || action.disabled ? theme.textMute : theme.text} />
      <Text style={[s.label, { color: busy || action.disabled ? theme.textMute : theme.text }]}>{noWidow(action.label)}</Text>
    </TouchableOpacity>)}
  </View>;
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', minHeight: 60, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingHorizontal: 4 },
  action: { flex: 1, minWidth: 44, minHeight: 52, paddingVertical: 8, gap: 4, justifyContent: 'center', alignItems: 'center' },
  label: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
});
