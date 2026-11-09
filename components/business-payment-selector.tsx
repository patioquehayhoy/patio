import { Ionicons } from '@expo/vector-icons';

import { PaymentIcon, type PaymentMethod } from '@/components/payment-icon';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { ScheduleEditorColors } from '@/components/business-schedule-editor';

export type BusinessPayments = {
  efectivo: boolean;
  transferencia: boolean;
  tarjeta: boolean;
};

type Props = {
  colors: ScheduleEditorColors;
  value: BusinessPayments;
  onChange: (value: BusinessPayments) => void;
};

// Mismo orden y mismos dibujos que la ficha del negocio.
const OPTIONS: { key: keyof BusinessPayments; label: PaymentMethod }[] = [
  { key: 'efectivo', label: 'Efectivo' },
  { key: 'tarjeta', label: 'Tarjeta' },
  { key: 'transferencia', label: 'Transferencia' },
];

export function BusinessPaymentSelector({ colors, value, onChange }: Props) {
  return (
    <View style={s.list}>
      {OPTIONS.map((option) => {
        const active = value[option.key];
        return (
          <TouchableOpacity
            key={option.key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
            accessibilityLabel={`${option.label}: ${active ? 'aceptado' : 'no aceptado'}`}
            onPress={() => onChange({ ...value, [option.key]: !active })}
            activeOpacity={0.7}
            style={[s.row, { backgroundColor: colors.surface, borderColor: active ? colors.accent : colors.border }]}>
            <View style={[s.icon, { backgroundColor: colors.bg }]}>
              <PaymentIcon method={option.label} size={20} color={active ? colors.accent : colors.textSecondary} />
            </View>
            <Text style={[s.label, { color: colors.text }]} maxFontSizeMultiplier={1.4}>{option.label}</Text>
            <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={active ? colors.accent : colors.textMute} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  list: { gap: 8 },
  row: { minHeight: 62, borderRadius: 14, borderCurve: 'continuous', borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  icon: { width: 38, height: 38, borderRadius: 12, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 16, lineHeight: 20, fontWeight: '700' },
});
