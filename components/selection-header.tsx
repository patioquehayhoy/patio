import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Cabecera del modo selección (2026-11-15), la misma en Guardados y en Menús:
// «1 menú seleccionado» a la izquierda y, a la derecha, «Todos»/«Ninguno» y
// «Cancelar». Antes cada pantalla tenía la suya y en Menús los dos botones
// quedaban pegados («TodosCancelar») y el texto no se alineaba con ellos.
// Un solo componente: mismos tamaños, misma separación, todo centrado en el
// mismo renglón y cada botón con su área de 44.
export function SelectionHeader({ label, allSelected, canSelectAll = true, onToggleAll, onCancel, style }: {
  /** «Seleccionar menús» sin nada elegido; «2 menús seleccionados» después. */
  label: string;
  allSelected: boolean;
  canSelectAll?: boolean;
  onToggleAll: () => void;
  onCancel: () => void;
  /** Solo márgenes de la pantalla (cada una conserva su retícula). */
  style?: StyleProp<ViewStyle>;
}) {
  const { theme } = useTheme();
  return (
    <View style={[s.row, style]}>
      <Text style={[s.label, { color: theme.textSecondary }]} allowFontScaling={true}>{noWidow(label)}</Text>
      <View style={s.actions}>
        <TouchableOpacity
          style={s.button}
          disabled={!canSelectAll}
          onPress={onToggleAll}
          activeOpacity={0.7}
          accessibilityRole="checkbox"
          accessibilityLabel={allSelected ? 'Quitar la selección' : 'Seleccionar todos'}
          accessibilityState={{ checked: allSelected, disabled: !canSelectAll }}>
          <Text style={[s.buttonText, { color: canSelectAll ? theme.textSecondary : theme.textMute }]} allowFontScaling={true}>
            {allSelected ? 'Ninguno' : 'Todos'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.button} onPress={onCancel} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Cancelar selección">
          <Text style={[s.buttonText, { color: theme.textSecondary }]} allowFontScaling={true}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 12 },
  label: { flex: 1, fontSize: 13, lineHeight: 17, fontWeight: '400' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  button: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 14, lineHeight: 18, fontWeight: '700' },
});
