import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts } from '@/lib/theme';

// ── Sistema de header unificado de Patio ───────────────────────────────────────
// Patrón Large Title estilo iOS/WhatsApp: el título grande vive en el scroll y,
// al bajar, se desvanece mientras aparece una barra compacta (con blur) que
// mantiene el título pequeño + los botones. Wayfinding siempre presente
// (Apple HIG 3.1), feedback de scroll suave (3.2), consistente en toda la app
// (3.4). Un solo componente → cero divergencia entre pantallas.

export type HeaderColors = {
  text: string;
  textSecondary: string;
  textMute: string;
  accent: string;
  bg: string;
  surface: string;
  border: string;
  isDark: boolean;
};

export type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
};

// Distancia de scroll en la que el header grande → barra compacta.
const COLLAPSE_START = 8;
const COLLAPSE_END = 64;

// El título grande grande arranca a este tamaño; el subtítulo/eyebrow lo acompañan.
export function CollapsingHeader({
  scrollY,
  c,
  title,
  eyebrow,
  subtitle,
  onBack,
  rightActions,
}: {
  scrollY: Animated.Value;
  c: HeaderColors;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  onBack?: () => void;
  rightActions?: HeaderAction[];
}) {
  const insets = useSafeAreaInsets();

  // Opacidad de la barra compacta: 0 arriba → 1 al colapsar.
  const compactOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_START, COLLAPSE_END],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  // El título grande se desvanece y sube un poco al colapsar.
  const bigOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_START, COLLAPSE_END * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const bigTranslate = scrollY.interpolate({
    inputRange: [0, COLLAPSE_END],
    outputRange: [0, -12],
    extrapolate: 'clamp',
  });

  const barH = 44;
  const hasButtons = !!onBack || (rightActions && rightActions.length > 0);

  return (
    <>
      {/* Barra compacta flotante (aparece al colapsar) */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.compactBar, { height: insets.top + barH, paddingTop: insets.top }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: compactOpacity }]} pointerEvents="none">
          <BlurView intensity={c.isDark ? 40 : 36} tint={c.isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
          <View style={[styles.compactHairline, { backgroundColor: c.border }]} />
        </Animated.View>

        <View style={[styles.compactRow, { height: barH }]}>
          {/* Izquierda: back (si hay) */}
          <View style={styles.sideLeft}>
            {onBack ? (
              <TouchableOpacity onPress={onBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} activeOpacity={0.7}>
                <CircleBtn c={c}>
                  <Ionicons name="chevron-back" size={20} color={c.text} />
                </CircleBtn>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Centro: título compacto (solo visible al colapsar) */}
          <Animated.Text
            numberOfLines={1}
            style={[styles.compactTitle, { color: c.text, opacity: compactOpacity }]}
            allowFontScaling={true}>
            {title}
          </Animated.Text>

          {/* Derecha: acciones */}
          <View style={styles.sideRight}>
            {(rightActions ?? []).map((a, i) => (
              <TouchableOpacity
                key={i}
                onPress={a.onPress}
                accessibilityLabel={a.accessibilityLabel}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                activeOpacity={0.7}>
                <CircleBtn c={c}>
                  <Ionicons name={a.icon} size={19} color={c.text} />
                </CircleBtn>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Animated.View>

    </>
  );
}

// Título grande que vive DENTRO del ScrollView (primer bloque del contenido).
// Se desvanece y sube al colapsar. Se usa junto a <CollapsingHeader/>: la barra
// compacta flota arriba; este bloque es contenido scrolleable normal.
export function CollapsingTitle({
  scrollY,
  c,
  title,
  eyebrow,
  subtitle,
}: {
  scrollY: Animated.Value;
  c: HeaderColors;
  title: string;
  eyebrow?: string;
  subtitle?: string;
}) {
  const bigOpacity = scrollY.interpolate({
    inputRange: [COLLAPSE_START, COLLAPSE_END * 0.7],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const bigTranslate = scrollY.interpolate({
    inputRange: [0, COLLAPSE_END],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View style={[styles.bigWrap, { opacity: bigOpacity, transform: [{ translateY: bigTranslate }] }]}>
      {eyebrow ? <Text style={[styles.eyebrow, { color: c.accent }]} allowFontScaling={true}>{eyebrow}</Text> : null}
      <Text style={[styles.bigTitle, { color: c.text }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={true}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: c.textSecondary }]} allowFontScaling={true}>{subtitle}</Text> : null}
    </Animated.View>
  );
}

function CircleBtn({ c, children }: { c: HeaderColors; children: React.ReactNode }) {
  return (
    <View style={[styles.circleBtn, { backgroundColor: c.surface, borderColor: c.border }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  compactBar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 },
  compactHairline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: StyleSheet.hairlineWidth },
  compactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14 },
  sideLeft: { minWidth: 60, alignItems: 'flex-start', justifyContent: 'center' },
  sideRight: { minWidth: 60, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'flex-end' },
  compactTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  circleBtn: { width: 40, height: 40, borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },

  bigWrap: { paddingHorizontal: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', marginBottom: 8 },
  bigTitle: { fontSize: 38, fontWeight: '900', letterSpacing: -1.3, lineHeight: 40, fontFamily: Fonts.brand },
  subtitle: { fontSize: 14, fontWeight: '300', lineHeight: 20, marginTop: 6 },
});
