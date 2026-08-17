import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Fonts, useTheme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const FOODIE_PRO = ['Busca por intención, no sólo palabras', 'Compara tus lugares guardados', 'Resume patrones en reseñas', 'Alertas cuando aparezca tu antojo'];
const FONDERO_PRO = ['Identidad del negocio verificada', 'Menú vigente de forma automática', 'Qué busca la gente cerca de ti', 'Resumen de reputación y oportunidades'];

export default function Plan() {
  const { role = 'foodie' } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const business = role === 'fondero';
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const pro = business ? FONDERO_PRO : FOODIE_PRO;

  return (
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Regresar"><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 44 }]}>
        <Text style={[s.subtitle, { color: theme.textSecondary, marginTop: 8 }]}>
          {noWidow(business ? 'Publica gratis. Sube a Pro cuando quieras medir y crecer.' : 'Guarda gratis. Sube a Pro para decidir con más contexto.')}
        </Text>

        <View style={[s.freeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={s.planHead}>
            <View>
              <Text style={[s.planName, { color: theme.text }]}>{noWidow('Patio Gratis')}</Text>
              <Text style={[s.planPrice, { color: theme.textSecondary }]}>$0</Text>
            </View>
            <View style={[s.currentPill, { backgroundColor: theme.accentSoft }]}><Text style={[s.currentText, { color: theme.accent }]}>GRATIS</Text></View>
          </View>
          {business && (
            <View style={s.verificationStatus}>
              <Ionicons name="ellipse-outline" size={16} color={theme.textSecondary} />
              <Text style={[s.verificationStatusText, { color: theme.textSecondary }]}>{noWidow('Negocio sin verificar')}</Text>
            </View>
          )}
        </View>

        <View style={s.proCard}>
          <BlurView intensity={theme.isDark ? 28 : 18} tint="dark" style={StyleSheet.absoluteFill} />
          <Text style={s.proEyebrow}>{noWidow('PATIO PRO · PRÓXIMAMENTE')}</Text>
          <Text style={s.proLead}>{noWidow(business ? 'Entiende qué hace volver a tu clientela.' : 'Convierte una idea en un lugar concreto para comer.')}</Text>
          <View style={s.proBenefits}>
            {pro.map((benefit) => <Benefit key={benefit} label={benefit} color="#F8F8F5" mute="rgba(248,248,245,0.68)" />)}
          </View>
          <View style={s.billingOptions}>
            <TouchableOpacity onPress={() => setBilling('monthly')} style={[s.billingOption, billing === 'monthly' && s.billingOptionActive]} accessibilityRole="button" accessibilityState={{ selected: billing === 'monthly' }} accessibilityLabel="Plan mensual, $99 MXN al mes">
              <Text style={s.billingOptionLabel}>Mensual</Text>
              <Text style={s.billingOptionPrice}>$99</Text>
              <Text style={s.billingOptionMeta}>{noWidow('MXN al mes')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBilling('annual')} style={[s.billingOption, billing === 'annual' && s.billingOptionActive]} accessibilityRole="button" accessibilityState={{ selected: billing === 'annual' }} accessibilityLabel="Plan anual, $990 MXN al año, ahorra dos meses">
              <Text style={s.billingSaving}>{noWidow('AHORRA 2 MESES')}</Text>
              <Text style={s.billingOptionLabel}>Anual</Text>
              <Text style={s.billingOptionPrice}>$990</Text>
              <Text style={s.billingOptionMeta}>{noWidow('MXN al año')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={s.proButton}
            accessibilityRole="button"
            accessibilityLabel="Continuar con Pro"
            onPress={() => Alert.alert('Patio Pro', noWidow('La activación se completará mediante la compra segura de Apple cuando conectemos StoreKit. No se realizó ningún cobro.'))}>
            <Text style={s.proButtonText}>{noWidow('Continuar con Pro')}</Text>
          </TouchableOpacity>
          <Text style={s.billingNote}>{noWidow(`${billing === 'annual' ? 'Se renueva por $990 MXN al año' : 'Se renueva por $99 MXN al mes'} · Cancela cuando quieras`)}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Benefit({ label, color, mute }: { label: string; color: string; mute: string }) {
  return (
    <View style={s.benefit}>
      <Ionicons name="checkmark-circle" size={19} color={mute} />
      <Text style={[s.benefitText, { color }]}>{noWidow(label)}</Text>
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
  freeCard: { marginTop: 26, padding: 19, borderRadius: 24, borderWidth: StyleSheet.hairlineWidth, gap: 10 },
  planHead: { marginBottom: 5, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  planName: { fontFamily: Fonts.brand, fontSize: 21, fontWeight: '900' },
  planPrice: { marginTop: 3, fontSize: 14 },
  currentPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100 },
  currentText: { fontSize: 9.5, fontWeight: '700', letterSpacing: 0.8 },
  verificationStatus: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 7 },
  verificationStatusText: { fontSize: 12.5, fontWeight: '700' },
  benefit: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { flex: 1, fontSize: 14.5, lineHeight: 19, fontWeight: '600' },
  proCard: { marginTop: 14, padding: 22, borderRadius: 28, overflow: 'hidden', backgroundColor: '#111214' },
  proEyebrow: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.5, color: '#FF6A3D' },
  proLead: { marginTop: 8, maxWidth: 310, fontSize: 15, lineHeight: 21, color: 'rgba(248,248,245,0.76)' },
  proBenefits: { marginTop: 22, gap: 14 },
  billingOptions: { marginTop: 24, flexDirection: 'row', gap: 10 },
  billingOption: { flex: 1, minHeight: 126, padding: 14, borderRadius: 18, borderWidth: 1.5, borderColor: 'rgba(248,248,245,0.14)', justifyContent: 'flex-end' },
  billingOptionActive: { borderColor: '#F8F8F5', backgroundColor: 'rgba(248,248,245,0.06)' },
  billingSaving: { position: 'absolute', top: 12, left: 14, fontSize: 9, lineHeight: 12, fontWeight: '800', color: '#FF6A3D', letterSpacing: 0.55 },
  billingOptionLabel: { fontSize: 13, fontWeight: '700', color: 'rgba(248,248,245,0.70)' },
  billingOptionPrice: { marginTop: 5, fontFamily: Fonts.brand, fontSize: 25, lineHeight: 29, fontWeight: '900', color: '#F8F8F5' },
  billingOptionMeta: { marginTop: 2, fontSize: 11, color: 'rgba(248,248,245,0.52)' },
  // Única acción prominente de esta pantalla (regla homologada 2026-08-16
  // en CLAUDE.md: cualquier verbo cuenta si es la única acción destacada).
  proButton: { height: 52, marginTop: 24, borderRadius: 26, backgroundColor: '#F2612F', alignItems: 'center', justifyContent: 'center' },
  proButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  billingNote: { marginTop: 11, textAlign: 'center', fontSize: 11.5, color: 'rgba(248,248,245,0.48)' },
});
