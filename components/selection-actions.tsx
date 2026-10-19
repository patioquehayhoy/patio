import { PinIcon } from '@/components/pin-icon';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export type SelectionAction = { label: string; icon: keyof typeof Ionicons.glyphMap | 'pin-off-outline'; onPress: () => void; disabled?: boolean };

export function SelectionActions({ actions, busy = false }: { actions: SelectionAction[]; busy?: boolean }) {
  const { theme } = useTheme();
  const { fontScale } = useWindowDimensions();
  const expanded = fontScale > 1.4;
  return <View style={[s.bar, expanded && s.expandedBar, { backgroundColor: theme.glass, borderColor: theme.border }]}>
    <BlurView pointerEvents="none" intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
    {actions.map((action) => <TouchableOpacity key={action.label} onPress={action.onPress} disabled={busy || action.disabled}
      accessibilityRole="button" accessibilityLabel={action.label} accessibilityState={{ disabled: busy || !!action.disabled, busy }}
      style={[s.action, expanded && s.expandedAction]}>
      <View style={s.iconSlot}>
      {action.icon === 'pin-outline' || action.icon === 'pin-off-outline'
        ? <View style={Platform.OS === 'ios' ? s.pinOpticalAlignment : undefined}><PinIcon remove={action.icon === 'pin-off-outline'} size={18} color={busy || action.disabled ? theme.textMute : theme.text} /></View>
        : <Ionicons name={action.icon} size={20} color={busy || action.disabled ? theme.textMute : theme.text} />}
      </View>
      <Text style={[s.label, { color: busy || action.disabled ? theme.textMute : theme.text }]}>{noWidow(action.label)}</Text>
    </TouchableOpacity>)}
  </View>;
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', minHeight: 52, borderRadius: 26, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden', paddingHorizontal: 4, paddingVertical: 2 },
  expandedBar: { flexWrap: 'wrap' },
  expandedAction: { flexBasis: '30%', flexGrow: 1 },
  action: { flex: 1, minWidth: 44, minHeight: 48, paddingVertical: 4, gap: 2, justifyContent: 'center', alignItems: 'center' },
  // SF Symbols and icon-font glyphs have different optical baselines.
  pinOpticalAlignment: { transform: [{ translateY: 1.5 }] },
  iconSlot: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11, lineHeight: 14, fontWeight: '500', textAlign: 'center' },
});
