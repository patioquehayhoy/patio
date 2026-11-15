import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import type { ScheduleEditorColors } from '@/components/business-schedule-editor';
import { cleanPhoneInput, formatPhone } from '@/lib/business-contact';
import { noWidow } from '@/lib/typography';

type Props = {
  colors: ScheduleEditorColors;
  telefono: string;
  whatsapp: boolean;
  editable?: boolean;
  onChangeTelefono: (value: string) => void;
  onChangeWhatsapp: (value: boolean) => void;
};

// Número del negocio (2026-11-11): solo el número, opcional. El mismo editor
// sirve para el alta y para «Editar mi negocio».
export function BusinessContactEditor({ colors, telefono, whatsapp, editable = true, onChangeTelefono, onChangeWhatsapp }: Props) {
  const hasNumber = telefono.length > 0;
  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.label, { color: colors.textMute }]}>Número</Text>
      <TextInput
        style={[s.value, { color: colors.text }]}
        value={formatPhone(telefono)}
        onChangeText={(value) => {
          const next = cleanPhoneInput(value);
          // Borrar justo sobre un espacio no cambia los dígitos: se borra el
          // dígito anterior, como en el teclado de Teléfono.
          onChangeTelefono(next === telefono && value.length < formatPhone(telefono).length ? telefono.slice(0, -1) : next);
        }}
        placeholder="55 1234 5678"
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        autoComplete="tel"
        editable={editable}
        accessibilityLabel="Número del negocio"
        accessibilityHint="Diez dígitos. La gente podrá llamarte desde tu ficha."
      />
      <View style={[s.divider, { backgroundColor: colors.border }]} />
      <TouchableOpacity
        style={s.row}
        onPress={() => onChangeWhatsapp(!whatsapp)}
        disabled={!editable || !hasNumber}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: hasNumber && whatsapp, disabled: !editable || !hasNumber }}
        accessibilityLabel="Este número tiene WhatsApp">
        <Ionicons name="logo-whatsapp" size={20} color={hasNumber && whatsapp ? colors.accent : colors.textSecondary} />
        <Text style={[s.rowText, { color: hasNumber ? colors.text : colors.textSecondary }]}>{noWidow('Este número tiene WhatsApp')}</Text>
        <Ionicons name={hasNumber && whatsapp ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={hasNumber && whatsapp ? colors.accent : colors.textMute} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderRadius: 18, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 14 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '400', paddingVertical: 0, paddingHorizontal: 0 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 12 },
  row: { minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { flex: 1, fontSize: 16, lineHeight: 20, fontWeight: '400' },
});
