import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import type { ReactNode, Ref } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/theme';

type Props = Omit<TextInputProps, 'style' | 'ref'> & {
  inputRef?: Ref<TextInput>;
  style?: StyleProp<ViewStyle>;
  onClear?: () => void;
  onCancel?: () => void;
  trailingAction?: ReactNode;
};

// Both discovery surfaces share geometry, focus, clear and text behavior.
export function SearchField({ inputRef, style, onClear, onCancel, trailingAction, ...input }: Props) {
  const { theme } = useTheme();
  return <View style={[s.field, { backgroundColor: theme.glass, borderColor: theme.border }, style]}>
    <BlurView intensity={theme.isDark ? 16 : 20} tint={theme.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} pointerEvents="none" />
    {onCancel ? <TouchableOpacity style={s.control} onPress={onCancel} accessibilityRole="button" accessibilityLabel="Cerrar búsqueda">
      <Ionicons name="chevron-back" size={22} color={theme.text} />
    </TouchableOpacity> : <View style={s.control} pointerEvents="none"><Ionicons name="search-outline" size={21} color={theme.textSecondary} /></View>}
    <TextInput
      ref={inputRef}
      autoCorrect={false}
      autoCapitalize="none"
      returnKeyType="search"
      placeholderTextColor={theme.textSecondary}
      selectionColor={theme.accent}
      {...input}
      style={[s.input, { color: theme.text }]}
    />
    {!!input.value?.length && <TouchableOpacity style={s.control} onPress={() => { if (onClear) onClear(); else input.onChangeText?.(''); }} accessibilityRole="button" accessibilityLabel="Borrar búsqueda">
      <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
    </TouchableOpacity>}
    {trailingAction}
  </View>;
}

const s = StyleSheet.create({
  field: { height: 50, borderRadius: 18, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 3 },
  control: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, minWidth: 0, height: 50, paddingVertical: 0, fontSize: 16, fontWeight: '400' },
});
