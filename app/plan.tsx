import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fonts, useTheme } from '@/lib/theme';

const BENEFITS = ['Mapa y guardados', 'Colecciones y perfil público', 'Reseñas y avisos de tus lugares'];

export default function Plan() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  return <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={s.nav}><TouchableOpacity style={s.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity></View>
    <ScrollView contentContainerStyle={s.content}>
      <Text style={[s.eyebrow, { color: theme.accent }]}>TU PLAN</Text>
      <Text style={[s.title, { color: theme.text }]}>Patio Gratis</Text>
      <Text style={[s.subtitle, { color: theme.textSecondary }]}>Todo lo necesario para descubrir, guardar y volver.</Text>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {BENEFITS.map((benefit) => <View key={benefit} style={s.benefit}><Ionicons name="checkmark-circle" size={20} color={theme.accent} /><Text style={[s.benefitText, { color: theme.text }]}>{benefit}</Text></View>)}
      </View>
      <View style={[s.proCard, { backgroundColor: theme.text }]}>
        <Text style={[s.proEyebrow, { color: theme.bg }]}>PRÓXIMAMENTE</Text>
        <Text style={[s.proTitle, { color: theme.bg }]}>Patio Pro</Text>
        <Text style={[s.proBody, { color: theme.bg }]}>Búsqueda avanzada, alertas inteligentes y preferencias persistentes. Te avisaremos antes de activar cualquier cobro.</Text>
        <TouchableOpacity style={[s.proButton, { backgroundColor: theme.bg }]} onPress={() => router.push({ pathname: '/avisos', params: { role: 'foodie' } })}><Text style={[s.proButtonText, { color: theme.text }]}>Avísame cuando llegue</Text></TouchableOpacity>
      </View>
    </ScrollView>
  </View>;
}

const s = StyleSheet.create({
  root: { flex: 1 }, nav: { height: 54, paddingHorizontal: 16 }, back: { width: 44, height: 54, justifyContent: 'center' },
  content: { paddingHorizontal: 22, paddingBottom: 44 }, eyebrow: { marginTop: 10, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 8, fontFamily: Fonts.brand, fontSize: 38, lineHeight: 41, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { marginTop: 8, maxWidth: 320, fontSize: 15, lineHeight: 21 }, card: { marginTop: 26, padding: 18, borderRadius: 22, borderWidth: StyleSheet.hairlineWidth, gap: 15 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 11 }, benefitText: { fontSize: 15, fontWeight: '600' },
  proCard: { marginTop: 16, padding: 22, borderRadius: 26 }, proEyebrow: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.4, opacity: 0.55 },
  proTitle: { marginTop: 8, fontFamily: Fonts.brand, fontSize: 28, fontWeight: '900' }, proBody: { marginTop: 8, fontSize: 14, lineHeight: 20, opacity: 0.7 },
  proButton: { alignSelf: 'flex-start', minHeight: 44, marginTop: 20, paddingHorizontal: 17, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }, proButtonText: { fontSize: 14, fontWeight: '700' },
});
