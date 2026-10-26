import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fonderoPalette } from '@/lib/fondero-palette';
import { SHEET_SPRING } from '@/lib/sheet-motion';
import { useHideTabBarWhile } from '@/lib/tab-bar-visibility';
import { Radius, Type, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export const FONDERO_TOUR_SEEN_KEY = '@patio_fondero_tour_v1';

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  { icon: 'book-outline', title: 'Tus menús viven aquí', body: 'Cada menú que publicas se guarda para reutilizarlo otro día.' },
  { icon: 'add', title: 'Con + publicas lo de hoy', body: 'Toma foto de tu menú, elige una de tus fotos o escríbelo a mano.' },
  { icon: 'storefront-outline', title: 'Mi Patio es tu negocio', body: 'Ahí ajustas horario, pagos y cómo te encuentra la gente.' },
];

// Recorrido de bienvenida, una sola vez después del alta. Termina en la acción
// principal (publicar el primer menú) en lugar de abrir la hoja sobre la celebración.
export function FonderoWelcomeTour({ visible, onDone, onPublish }: { visible: boolean; onDone: () => void; onPublish: () => void }) {
  const { theme } = useTheme();
  const c = fonderoPalette(theme.isDark);
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const enter = useRef(new Animated.Value(0)).current;
  useHideTabBarWhile(visible);

  useEffect(() => {
    if (!visible) return;
    setStep(0);
    enter.setValue(0);
    Animated.spring(enter, { toValue: 1, ...SHEET_SPRING }).start();
  }, [visible, enter]);

  const finish = (publish: boolean) => {
    void AsyncStorage.setItem(FONDERO_TOUR_SEEN_KEY, '1').catch(() => {});
    onDone();
    if (publish) onPublish();
  };
  const last = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={() => finish(false)} statusBarTranslucent>
      <View style={s.backdrop}>
        <Animated.View
          accessibilityViewIsModal
          style={[s.card, { backgroundColor: c.surface2, marginBottom: insets.bottom + 12, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }], opacity: enter }]}>
          <View style={[s.icon, { backgroundColor: c.bg }]}><Ionicons name={current.icon} size={24} color={c.text} /></View>
          <Text style={[s.title, { color: c.text }]} accessibilityRole="header">{noWidow(current.title)}</Text>
          <Text style={[s.body, { color: c.textSecondary }]}>{noWidow(current.body)}</Text>
          <View style={s.dots} accessibilityLabel={`Paso ${step + 1} de ${STEPS.length}`}>
            {STEPS.map((item, index) => <View key={item.title} style={[s.dot, { backgroundColor: index === step ? c.text : c.border }, index === step && s.dotCurrent]} />)}
          </View>
          <TouchableOpacity
            style={[s.primary, { backgroundColor: last ? c.accent : c.text }]}
            onPress={() => (last ? finish(true) : setStep(step + 1))}
            accessibilityRole="button"
            activeOpacity={0.84}>
            <Text style={[s.primaryText, { color: last ? '#fff' : c.bg }]}>{last ? 'Publicar mi primer menú' : 'Siguiente'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.secondary} onPress={() => finish(false)} accessibilityRole="button" activeOpacity={0.7}>
            <Text style={[s.secondaryText, { color: c.textSecondary }]}>{last ? 'Ahora no' : 'Saltar'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 12, backgroundColor: 'rgba(0,0,0,0.42)' },
  card: { borderRadius: Radius.sheet, paddingHorizontal: 24, paddingTop: 28, paddingBottom: 12 },
  icon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { ...Type.title },
  body: { ...Type.body, marginTop: 8 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 22, marginBottom: 22 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotCurrent: { width: 18 },
  primary: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  primaryText: { fontSize: 16, fontWeight: '600' },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  secondaryText: { fontSize: 15 },
});
