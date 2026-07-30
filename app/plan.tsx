import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, useTheme } from '@/lib/theme';

const FOODIE_FREE = ['Mapa y búsqueda por menú', 'Listas y notas privadas', 'Reseñas y perfil público'];
const FOODIE_PRO = ['Búsqueda conversacional y por voz', 'Alertas por antojo y cercanía', 'Preferencias y filtros persistentes', 'Listas compartidas sin límite'];
const FONDERO_FREE = ['Perfil, menú y póster', 'Avisos a seguidores', 'Reseñas y respuesta oficial'];
const FONDERO_PRO = ['Estadísticas y retorno de clientes', 'Lectura de menús con mayor frecuencia', 'Alertas y campañas segmentadas', 'Historial y aprendizaje del menú'];

export default function Plan() {
  const { role = 'foodie' } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const business = role === 'fondero';
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const free = business ? FONDERO_FREE : FOODIE_FREE;
  const pro = business ? FONDERO_PRO : FOODIE_PRO;

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()}><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 44 }]}>
        <Text style={[s.eyebrow, { color: theme.accent }]}>{business ? 'PLAN PARA TU NEGOCIO' : 'TU PLAN'}</Text>
        <Text style={[s.title, { color: theme.text }]}>Elige tu Patio</Text>
        <Text style={[s.subtitle, { color: theme.textSecondary }]}>
          {business ? 'Publica gratis. Sube a Pro cuando quieras medir y crecer.' : 'Guarda gratis. Sube a Pro para decidir con más contexto.'}
        </Text>

        <View style={[s.freeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.planHead}>
            <View>
              <Text style={[s.planName, { color: theme.text }]}>Patio Gratis</Text>
              <Text style={[s.planPrice, { color: theme.textSecondary }]}>$0</Text>
            </View>
            <View style={[s.currentPill, { backgroundColor: theme.accentSoft }]}><Text style={[s.currentText, { color: theme.accent }]}>PLAN ACTUAL</Text></View>
          </View>
          {free.map((benefit) => <Benefit key={benefit} label={benefit} color={theme.text} mute={theme.textSecondary} />)}
        </View>

        <View style={s.proCard}>
          <BlurView intensity={theme.isDark ? 28 : 18} tint="dark" style={StyleSheet.absoluteFill} />
          <Text style={s.proEyebrow}>PATIO PRO</Text>
          <View style={s.priceRow}>
            <Text style={s.proPrice}>$99</Text>
            <Text style={s.proCycle}>MXN / mes</Text>
          </View>
          <Text style={s.proLead}>{business ? 'Entiende qué hace volver a tu clientela.' : 'Convierte tus guardados en mejores decisiones.'}</Text>
          <View style={s.proBenefits}>
            {pro.map((benefit) => <Benefit key={benefit} label={benefit} color="#F8F8F5" mute="rgba(248,248,245,0.68)" />)}
          </View>
          <TouchableOpacity
            style={s.proButton}
            onPress={() => Alert.alert('Patio Pro', 'La activación se completará mediante la compra segura de Apple cuando conectemos StoreKit. No se realizó ningún cobro.')}>
            <Text style={s.proButtonText}>Elegir Pro</Text>
          </TouchableOpacity>
          <Text style={s.billingNote}>Cancela cuando quieras · Compra administrada por Apple</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Benefit({ label, color, mute }: { label: string; color: string; mute: string }) {
  return (
    <View style={s.benefit}>
      <Ionicons name="checkmark-circle" size={19} color={mute} />
      <Text style={[s.benefitText, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { height: 54, paddingHorizontal: 12 },
  back: { width: 44, height: 54, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20 },
  eyebrow: { marginTop: 10, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 },
  title: { marginTop: 8, fontFamily: Fonts.brand, fontSize: 38, lineHeight: 42, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { marginTop: 8, maxWidth: 350, fontSize: 15, lineHeight: 21 },
  freeCard: { marginTop: 26, padding: 19, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, gap: 14 },
  planHead: { marginBottom: 5, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planName: { fontFamily: Fonts.brand, fontSize: 21, fontWeight: '900' },
  planPrice: { marginTop: 3, fontSize: 14 },
  currentPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  currentText: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8 },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { flex: 1, fontSize: 14.5, lineHeight: 19, fontWeight: '600' },
  proCard: { marginTop: 14, padding: 22, borderRadius: 28, overflow: 'hidden', backgroundColor: '#111214' },
  proEyebrow: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, color: '#FF6A3D' },
  priceRow: { marginTop: 8, flexDirection: 'row', alignItems: 'baseline', gap: 7 },
  proPrice: { fontFamily: Fonts.brand, fontSize: 40, lineHeight: 44, fontWeight: '900', color: '#F8F8F5' },
  proCycle: { fontSize: 13, color: 'rgba(248,248,245,0.62)' },
  proLead: { marginTop: 8, maxWidth: 310, fontSize: 15, lineHeight: 21, color: 'rgba(248,248,245,0.76)' },
  proBenefits: { marginTop: 22, gap: 14 },
  proButton: { height: 52, marginTop: 24, borderRadius: 26, backgroundColor: '#F8F8F5', alignItems: 'center', justifyContent: 'center' },
  proButtonText: { fontSize: 16, fontWeight: '700', color: '#111214' },
  billingNote: { marginTop: 11, textAlign: 'center', fontSize: 11.5, color: 'rgba(248,248,245,0.48)' },
});
