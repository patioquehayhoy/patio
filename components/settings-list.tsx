import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Fila/grupo de ajustes compartido entre Cuenta (Foodie) y Mi Patio (Fondero).
// Antes cada pantalla tenía su propia Row con look distinto (una sin iconBox,
// otra con) y sin labels de sección — dos secciones "espejo" que en código no
// se veían igual. Este componente es la única fuente de ese patrón: grupo con
// label opcional (mayúsculas, HIG grouped list) + filas con icono en caja,
// título/subtítulo y trailing (chevron o control).

export type SettingsColors = {
  surface: string;
  border: string;
  text: string;
  textSecondary: string;
  textMute: string;
  accent: string;
  iconBg: string;   // fondo neutro del icono
  accentBg: string; // fondo tibio del icono cuando accent=true
};

type SettingsRowProps = {
  c: SettingsColors;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub?: string;
  accent?: boolean;
  divider?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
};

export function SettingsRow({ c, icon, title, sub, accent, divider, onPress, trailing }: SettingsRowProps) {
  const iconColor = accent ? c.accent : c.textSecondary;
  const iconBg = accent ? c.accentBg : c.iconBg;
  const content = (
    <View style={[styles.row, divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }]}>
      <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: accent ? c.accent : c.text }]} numberOfLines={1} allowFontScaling={true}>
          {title}
        </Text>
        {sub ? (
          <Text style={[styles.sub, { color: c.textSecondary }]} numberOfLines={1} allowFontScaling={true}>
            {sub}
          </Text>
        ) : null}
      </View>
      {trailing ?? (onPress ? <Ionicons name="chevron-forward" size={16} color={c.textMute} /> : null)}
    </View>
  );
  if (!onPress) return content;
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
      {content}
    </TouchableOpacity>
  );
}

export function SettingsGroup({ c, label, children }: { c: SettingsColors; label?: string; children: ReactNode }) {
  return (
    <View style={styles.group}>
      {label ? (
        <Text style={[styles.groupLabel, { color: c.textMute }]} allowFontScaling={true}>
          {label}
        </Text>
      ) : null}
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginTop: 16 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', paddingHorizontal: 6, paddingBottom: 8 },
  card: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  // minHeight 56: altura estándar de fila tocable en toda la app.
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, paddingHorizontal: 16 },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 14.5, fontWeight: '500', letterSpacing: -0.1, lineHeight: 18 },
  sub: { marginTop: 2, fontSize: 12, fontWeight: '400' },
});
