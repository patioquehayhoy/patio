import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const FOODIE_BENEFITS = ['Explorar lugares y sus menús', 'Guardar y organizar lugares', 'Compartir listas', 'Publicar reseñas'];
const FONDERO_BENEFITS = ['Perfil público para tu negocio', 'Publicar menú y carta', 'Compartir tu menú', 'Recibir reseñas y responder'];

export default function Plan() {
  const { role = 'foodie' } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const business = role === 'fondero';
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const benefits = business ? FONDERO_BENEFITS : FOODIE_BENEFITS;
  return <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={s.nav}><TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
      <Text accessibilityRole="header" style={[s.title, { color: theme.text }]}>{noWidow('Tu plan')}</Text>
      <Text style={[s.subtitle, { color: theme.textSecondary }]}>{noWidow(business ? 'Lo esencial para publicar tu negocio.' : 'Lo esencial para encontrar dónde comer.')}</Text>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text accessibilityRole="header" style={[s.planName, { color: theme.text }]}>{noWidow('Patio Gratis')}</Text>
        <Text style={[s.price, { color: theme.textSecondary }]}>{noWidow('Sin costo')}</Text>
        <View style={s.benefits}>{benefits.map((benefit) => <View key={benefit} style={s.benefit}>
          <Ionicons name="checkmark" size={18} color={theme.textSecondary} />
          <Text style={[s.benefitText, { color: theme.text }]}>{noWidow(benefit)}</Text>
        </View>)}</View>
      </View>
      <Text style={[s.note, { color: theme.textSecondary }]}>{noWidow('Las opciones de Patio Pro estarán disponibles más adelante.')}</Text>
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: 52, paddingHorizontal: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 16 },
  title: { ...Type.screen },
  subtitle: { marginTop: 8, fontSize: 15, lineHeight: 21 },
  card: { marginTop: 24, padding: 20, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth },
  planName: { ...Type.section },
  price: { marginTop: 2, fontSize: 14, lineHeight: 20 },
  benefits: { marginTop: 20, gap: 12 },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  benefitText: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 21 },
  note: { marginTop: 20, fontSize: 13, lineHeight: 19 },
});
