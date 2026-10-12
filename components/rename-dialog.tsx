import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

/** A failed save retains the editor and its text. The caller reports the error. */
export function RenameDialog({ visible, title, value, onChangeText, onClose, onSave, maxLength = 60 }: {
  visible: boolean; title: string; value: string; onChangeText: (value: string) => void;
  onClose: () => void; onSave: () => Promise<boolean>; maxLength?: number;
}) {
  const { theme } = useTheme();
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const close = () => { if (!pending.current) onClose(); };
  const save = async () => {
    if (pending.current || !value.trim()) return;
    pending.current = true; setBusy(true);
    try { if (await onSave()) onClose(); }
    finally { pending.current = false; setBusy(false); }
  };
  return <Modal transparent visible={visible} animationType="fade" onRequestClose={close}>
    <KeyboardAvoidingView style={s.overlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityRole="button" accessibilityLabel="Cancelar" />
      <View accessibilityViewIsModal onAccessibilityEscape={close} style={[s.card, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
        <Text accessibilityRole="header" style={[s.title, { color: theme.text }]}>{noWidow(title)}</Text>
        <TextInput autoFocus value={value} editable={!busy} onChangeText={onChangeText} maxLength={maxLength}
          accessibilityLabel="Nombre" placeholder="Nombre" placeholderTextColor={theme.textMute} selectionColor={theme.accent}
          returnKeyType="done" onSubmitEditing={() => { void save(); }} style={[s.input, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} />
        <View style={s.actions}>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy }} disabled={busy} onPress={close} style={s.button}><Text style={[s.label, { color: theme.text }]}>Cancelar</Text></TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" accessibilityState={{ disabled: busy || !value.trim(), busy }} disabled={busy || !value.trim()} onPress={() => { void save(); }} style={[s.button, { backgroundColor: theme.accent, opacity: busy || !value.trim() ? 0.4 : 1 }]}><Text style={[s.label, { color: '#FFFFFF' }]}>{busy ? 'Guardando…' : 'Guardar'}</Text></TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}
const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.26)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 360, padding: 20, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, gap: 16 },
  title: { fontSize: 17, lineHeight: 23, fontWeight: '700', textAlign: 'center' },
  input: { minHeight: 48, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12, fontSize: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  button: { flex: 1, minHeight: 48, paddingVertical: 12, paddingHorizontal: 8, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
