import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { billingAvailable, loadPlanPackages, purchasePlan, restorePlan, subscriptionLegalUrls } from '@/lib/billing';
import { PLANS, type BillingPeriod } from '@/lib/plans';
import { useTheme, Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

export default function Plan() {
  const { role = 'foodie' } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const business = role === 'fondero';
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const free = business ? PLANS.free : PLANS.foodie;
  const paidId = business ? 'pro' : 'creator';
  const paid = PLANS[paidId];
  const benefits = free.benefits;
  const [period, setPeriod] = useState<BillingPeriod>('monthly');
  const [packages, setPackages] = useState<Partial<Record<BillingPeriod, PurchasesPackage>>>({});
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [notice, setNotice] = useState('');
  const available = billingAvailable();
  useEffect(() => {
    let mounted = true;
    setPackages({});
    setNotice('');
    if (available) void loadPlanPackages(paidId).then((items) => { if (mounted) setPackages(items); })
      .catch((error) => { if (mounted) setNotice(error instanceof Error ? error.message : 'No pudimos cargar los planes.'); });
    return () => { mounted = false; };
  }, [available, paidId]);
  const act = async (restore: boolean) => {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    try {
      const item = packages[period];
      if (!restore && !item) throw new Error('Este plan todavía no está disponible.');
      const active = restore ? await restorePlan(paidId) : await purchasePlan(paidId, item!);
      setNotice(active ? `${paid.name} está activo en tu cuenta.` : 'No encontramos una suscripción activa para este plan.');
    } catch (error) {
      if (!(error as { userCancelled?: boolean })?.userCancelled) Alert.alert(noWidow('Tu suscripción'), noWidow(error instanceof Error ? error.message : 'Inténtalo de nuevo.'));
    } finally { pending.current = false; setBusy(false); }
  };
  return <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={s.nav}><TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
      <Text accessibilityRole="header" style={[s.title, { color: theme.text }]}>{noWidow('Tu plan')}</Text>
      <Text style={[s.subtitle, { color: theme.textSecondary }]}>{noWidow(business ? 'Lo esencial para publicar tu negocio.' : 'Lo esencial para encontrar dónde comer.')}</Text>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text accessibilityRole="header" style={[s.planName, { color: theme.text }]}>{noWidow(free.name)}</Text>
        <Text style={[s.price, { color: theme.textSecondary }]}>{noWidow('Sin costo')}</Text>
        <View style={s.benefits}>{benefits.map((benefit) => <View key={benefit} style={s.benefit}>
          <Ionicons name="checkmark" size={18} color={theme.textSecondary} />
          <Text style={[s.benefitText, { color: theme.text }]}>{noWidow(benefit)}</Text>
        </View>)}</View>
      </View>
      <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text accessibilityRole="header" style={[s.planName, { color: theme.text }]}>{paid.name}</Text>
        <Text style={[s.note, { color: theme.textSecondary }]}>{noWidow(available ? 'Elige cómo suscribirte.' : 'Próximamente')}</Text>
        <View style={s.periods}>{(['monthly', 'annual'] as const).map((value) => <TouchableOpacity key={value}
          accessibilityRole="button" accessibilityState={{ selected: period === value }} onPress={() => setPeriod(value)}
          style={[s.period, { borderColor: period === value ? theme.accent : theme.border }]}>
          <Text style={{ color: theme.text }}>{value === 'monthly' ? 'Mensual' : 'Anual'}</Text>
          <Text style={[s.price, { color: theme.textSecondary }]}>{packages[value]?.product.priceString ?? `$${paid[value].toLocaleString('es-MX')} MXN`}</Text>
        </TouchableOpacity>)}</View>
        <View style={s.benefits}>{paid.benefits.map((benefit) => <View key={benefit} style={s.benefit}>
          <Ionicons name="checkmark" size={18} color={theme.textSecondary} />
          <Text style={[s.benefitText, { color: theme.text }]}>{noWidow(benefit)}</Text>
        </View>)}</View>
        {available && <>
          <TouchableOpacity disabled={busy || !packages[period]} onPress={() => act(false)} accessibilityRole="button"
            accessibilityState={{ disabled: busy || !packages[period], busy }} style={[s.subscribe, { backgroundColor: theme.accent, opacity: busy || !packages[period] ? 0.5 : 1 }]}>
            <Text style={s.subscribeText}>{noWidow(busy ? 'Un momento…' : `Suscribirme a ${paid.name}`)}</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={busy} onPress={() => act(true)} accessibilityRole="button" style={s.restore}>
            <Text style={{ color: theme.textSecondary }}>{noWidow('Restaurar compras')}</Text>
          </TouchableOpacity>
          <Text style={[s.note, { color: theme.textSecondary }]}>{noWidow('La suscripción se renueva automáticamente. Puedes cancelarla desde tu tienda.')}</Text>
          {(['privacy', 'terms'] as const).map((kind) => <TouchableOpacity key={kind} onPress={() => {
            const url = subscriptionLegalUrls()?.[kind];
            if (url) void Linking.openURL(url).catch(() => Alert.alert(noWidow('No pudimos abrir el enlace'), noWidow('Inténtalo de nuevo.')));
          }} accessibilityRole="link" style={s.restore}><Text style={{ color: theme.textSecondary }}>{noWidow(kind === 'privacy' ? 'Aviso de privacidad' : 'Condiciones de suscripción')}</Text></TouchableOpacity>)}
        </>}
      </View>
      {business && <View style={[s.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[s.planName, { color: theme.text }]}>{noWidow('Fundadores')}</Text>
        <Text style={[s.benefitText, { color: theme.textSecondary, marginTop: 12 }]}>{noWidow('Por invitación: los primeros 100 negocios por colonia reciben 6 meses de Pro. El sello numerado se gana publicando durante 4 semanas.')}</Text>
      </View>}
      {notice ? <Text accessibilityLiveRegion="polite" style={[s.note, { color: theme.textSecondary }]}>{noWidow(notice)}</Text> : null}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1 },
  periods: { flexDirection: 'row', gap: 10, marginTop: 16 },
  period: { flex: 1, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderRadius: 14 },
  subscribe: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  subscribeText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  restore: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
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
