import { Ionicons } from '@expo/vector-icons';
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

const OPTIONS: { key: keyof BusinessPayments; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'efectivo', label: 'Efectivo', icon: 'cash-outline' },
  { key: 'transferencia', label: 'Transferencia', icon: 'swap-horizontal-outline' },
  { key: 'tarjeta', label: 'Tarjeta', icon: 'card-outline' },
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
            activeOpacity={0.72}
            style={[s.row, { backgroundColor: colors.surface, borderColor: active ? colors.accent : colors.border }]}>
            <View style={[s.icon, { backgroundColor: colors.bg }]}>
              <Ionicons name={option.icon} size={19} color={active ? colors.accent : colors.textSecondary} />
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
  list: { gap: 10 },
  row: { minHeight: 62, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontSize: 16, lineHeight: 20, fontWeight: '600' },
});
