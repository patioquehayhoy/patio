import { PinIcon } from '@/components/pin-icon';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { Ref } from 'react';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

/** Shared list membership/selection row; the data remains owned by each role. */
export function LibraryListRow({ title, count, unit, checked, disabled, onPress, onMore, onLongPress, moreRef, pinned, role = 'checkbox', divider = false }: {
  title: string; count: number; unit: 'lugar' | 'menú'; checked: boolean | 'mixed'; disabled?: boolean;
  onPress: () => void; onMore?: () => void; onLongPress?: () => void; moreRef?: Ref<View>; pinned?: boolean; role?: 'checkbox' | 'radio'; divider?: boolean;
}) {
  const { theme } = useTheme();
  const countLabel = `${count} ${count === 1 ? unit : unit === 'lugar' ? 'lugares' : 'menús'}`;
  return <View style={[s.row, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border }]}>
    <Pressable style={({ pressed }) => [s.main, pressed && { backgroundColor: theme.surface2 }]} disabled={disabled} accessibilityRole={role} accessibilityLabel={`${title}, ${countLabel}${pinned ? ', fijada' : ''}`} accessibilityState={{ checked, disabled: !!disabled }} onPress={onPress} onLongPress={onLongPress}>
      <Ionicons name={checked === 'mixed' ? 'remove-circle-outline' : checked ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={checked ? theme.accent : theme.textMute} />
      <Text numberOfLines={2} ellipsizeMode="tail" style={[s.title, { color: theme.text }]}>{noWidow(title)}</Text>
      {pinned && <PinIcon size={14} color={theme.textSecondary} />}
      <Text numberOfLines={2} style={[s.count, { color: theme.textSecondary }]}>{countLabel}</Text>
    </Pressable>
    {onMore && <TouchableOpacity ref={moreRef} style={s.more} disabled={disabled} accessibilityRole="button" accessibilityLabel={`Acciones de ${title}`} accessibilityState={{ disabled: !!disabled }} onPress={onMore}><Ionicons name="ellipsis-horizontal" size={20} color={theme.textSecondary} /></TouchableOpacity>}
  </View>;
}
const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 4 },
  main: { flex: 1, minWidth: 0, minHeight: 52, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20, fontWeight: '500' },
  count: { flexShrink: 1, maxWidth: '35%', fontSize: 13, lineHeight: 18, textAlign: 'right', fontVariant: ['tabular-nums'] },
  more: { width: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
