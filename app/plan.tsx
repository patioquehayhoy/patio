import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import type { PurchasesPackage } from 'react-native-purchases';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { billingAvailable, loadPlanPackages, purchasePlan, restorePlan, subscriptionLegalUrls } from '@/lib/billing';
import { useFoodieAccountController } from '@/lib/controllers/useFoodieAccountController';
import { PLANS, type BillingPeriod } from '@/lib/plans';
import { useTheme, Type, type Theme } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const SUPPORT_EMAIL = 'quehayhoy.patio@gmail.com';
const FOUNDER_BENEFITS = ['6 meses de Pro sin costo', 'Para los primeros 100 negocios de cada colonia', 'Sello numerado al publicar 4 semanas seguidas'];
const PREVIEW = 3;
const mxn = (value: number) => `$${value.toLocaleString('es-MX')}`;
// Ahorro real del anual frente a 12 meses; es el mismo en Pro y Creador.
const ANNUAL_SAVING = Math.round((1 - PLANS.pro.annual / (PLANS.pro.monthly * 12)) * 100);

type Action = { label: string; onPress: () => void; tone: 'accent' | 'ink' | 'outline'; disabled?: boolean };
type CardProps = {
  t: Theme; name: string; tagline: string; price: string; was?: string; unit: string; badge?: string;
  highlight?: boolean; action?: Action; benefits: readonly string[];
};

// Esqueleto de pricing: nombre y descuento → para quién → precio → acción →
// tres beneficios y el resto bajo «Mostrar más».
function PlanCard({ t, name, tagline, price, was, unit, badge, highlight, action, benefits }: CardProps) {
  const [open, setOpen] = useState(false);
  const shown = open ? benefits : benefits.slice(0, PREVIEW);
  return <View style={[s.card, { backgroundColor: t.surface, borderColor: highlight ? t.accent : t.border, borderWidth: highlight ? 1 : StyleSheet.hairlineWidth }]}>
    <View style={s.cardHead}>
      <Text accessibilityRole="header" style={[s.planName, { color: t.text }]}>{name}</Text>
      {badge && <View style={[s.badge, { backgroundColor: t.accentLight }]}><Text style={[s.badgeText, { color: t.accent }]}>{badge}</Text></View>}
    </View>
    <Text style={[s.tagline, { color: t.textSecondary }]}>{noWidow(tagline)}</Text>
    <View style={s.priceRow}>
      {was && <Text style={[s.was, { color: t.textMute }]}>{was}</Text>}
      <Text style={[s.price, { color: t.text }]}>{price}</Text>
      <Text style={[s.unit, { color: t.textSecondary }]}>{unit}</Text>
    </View>
    {action && <TouchableOpacity disabled={action.disabled} onPress={action.onPress} accessibilityRole="button"
      accessibilityState={{ disabled: !!action.disabled }}
      style={[s.cta, action.tone === 'accent' && { backgroundColor: t.accent }, action.tone === 'ink' && { backgroundColor: t.text },
        action.tone === 'outline' && { borderWidth: 1.5, borderColor: t.border }, action.disabled && { opacity: 0.5 }]}>
      <Text style={[s.ctaText, { color: action.tone === 'accent' ? '#fff' : action.tone === 'ink' ? t.bg : t.text }]}>{noWidow(action.label)}</Text>
    </TouchableOpacity>}
    <View style={s.benefits}>{shown.map((benefit) => <View key={benefit} style={s.benefit}>
      <Ionicons name="checkmark" size={18} color={t.accent} />
      <Text style={[s.benefitText, { color: t.text }]}>{noWidow(benefit)}</Text>
    </View>)}</View>
    {benefits.length > PREVIEW && <TouchableOpacity onPress={() => setOpen((value) => !value)} accessibilityRole="button" style={s.more}>
      <Text style={[s.moreText, { color: t.textSecondary }]}>{open ? 'Mostrar menos' : 'Mostrar más'}</Text>
      <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={15} color={t.textSecondary} />
    </TouchableOpacity>}
  </View>;
}

export default function Plan() {
  const { role = 'foodie' } = useLocalSearchParams<{ role?: 'foodie' | 'fondero' }>();
  const business = role === 'fondero';
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { handleDevFondero, handleFonderoAccess } = useFoodieAccountController();
  const free = business ? PLANS.free : PLANS.foodie;
  const paidId = business ? 'pro' : 'creator';
  const paid = PLANS[paidId];
  // El plan de pago incluye todo lo del gratuito.
  const paidBenefits = [...paid.benefits, ...free.benefits.filter((item) => !/lecturas con foto/i.test(item))];
  const [packages, setPackages] = useState<Partial<Record<BillingPeriod, PurchasesPackage>>>({});
  const [busy, setBusy] = useState<BillingPeriod | 'restore' | null>(null);
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
  const act = async (period: BillingPeriod | 'restore') => {
    if (pending.current) return;
    pending.current = true;
    setBusy(period);
    try {
      const item = period === 'restore' ? undefined : packages[period];
      if (period !== 'restore' && !item) throw new Error('Este plan todavía no está disponible.');
      const active = period === 'restore' ? await restorePlan(paidId) : await purchasePlan(paidId, item!);
      setNotice(active ? `${paid.name} está activo en tu cuenta.` : 'No encontramos una suscripción activa para este plan.');
    } catch (error) {
      if (!(error as { userCancelled?: boolean })?.userCancelled) Alert.alert(noWidow('Tu suscripción'), noWidow(error instanceof Error ? error.message : 'Inténtalo de nuevo.'));
    } finally { pending.current = false; setBusy(null); }
  };
  const subscribe = (period: BillingPeriod, tone: Action['tone']): Action | undefined => available ? {
    label: busy === period ? 'Un momento…' : `Obtener ${paid.name} ${period === 'annual' ? 'anual' : 'mensual'}`,
    onPress: () => void act(period), tone, disabled: busy !== null || !packages[period],
  } : undefined;
  const openMail = (subject: string) => void Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`)
    .catch(() => Alert.alert(noWidow('No pudimos abrir el correo'), noWidow(`Puedes escribirnos a ${SUPPORT_EMAIL}.`)));
  const tagline = business ? 'Para publicar todos los días' : 'Para quien recomienda dónde comer';
  type Cell = boolean | string;
  const reads = (item: string) => /lecturas con foto/i.test(item);
  const rows: { label: string; free: Cell; paid: Cell }[] = [
    ...free.benefits.map((item) => reads(item)
      ? { label: 'Lecturas con foto al mes', free: String(PLANS.free.photoReads), paid: String(PLANS.pro.photoReads) }
      : { label: item, free: true, paid: true }),
    ...paid.benefits.filter((item) => !reads(item)).map((item) => {
      const count = /^(\d+)\s(.+)$/.exec(item);
      return count ? { label: count[2][0].toUpperCase() + count[2].slice(1), free: false, paid: count[1] } : { label: item, free: false, paid: true };
    }),
  ];
  const cell = (value: Cell, strong: boolean) => typeof value === 'string'
    ? <Text style={[s.cell, { color: theme.text }]}>{value}</Text>
    : value ? <Ionicons name="checkmark" size={18} color={strong ? theme.accent : theme.text} />
      : <Text style={[s.cell, { color: theme.textMute }]}>—</Text>;

  return <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
    <Stack.Screen options={{ headerShown: false }} />
    <View style={s.nav}><TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Volver"><Ionicons name="chevron-back" size={22} color={theme.text} /></TouchableOpacity></View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}>
      <Text accessibilityRole="header" style={[s.title, { color: theme.text }]}>{noWidow('Elige tu plan')}</Text>
      <Text style={[s.title, { color: theme.accent }]}>{noWidow(`y ahorra ${ANNUAL_SAVING}% al año`)}</Text>

      <PlanCard t={theme} name={free.name} tagline={business ? 'Para empezar a publicar' : 'Para descubrir qué hay hoy'}
        price="$0" unit="siempre" benefits={free.benefits} />
      <PlanCard t={theme} highlight name={`${paid.name} anual`} badge={`−${ANNUAL_SAVING}%`} tagline={tagline}
        was={packages.annual ? undefined : mxn(paid.monthly)} price={packages.annual?.product.priceString ?? mxn(Math.round(paid.annual / 12))}
        unit={packages.annual ? 'al año' : `/mes · ${mxn(paid.annual)} al año`}
        action={subscribe('annual', 'accent')} benefits={paidBenefits} />
      <PlanCard t={theme} name={`${paid.name} mensual`} tagline={tagline}
        price={packages.monthly?.product.priceString ?? mxn(paid.monthly)} unit="/mes"
        action={subscribe('monthly', 'outline')} benefits={paidBenefits} />

      {business && <View style={[s.special, { backgroundColor: theme.accentLight }]}>
        <View style={s.cardHead}>
          <Text accessibilityRole="header" style={[s.planName, { color: theme.text }]}>Fundadores</Text>
          <View style={[s.badge, { backgroundColor: theme.surface }]}><Text style={[s.badgeText, { color: theme.accent }]}>Por invitación</Text></View>
        </View>
        <Text style={[s.specialBody, { color: theme.text }]}>{noWidow(FOUNDER_BENEFITS.join(' · '))}</Text>
        <TouchableOpacity accessibilityRole="button" style={[s.cta, { backgroundColor: theme.text }]} onPress={() => openMail('Patio · Fundadores')}>
          <Text style={[s.ctaText, { color: theme.bg }]}>Pedir invitación</Text>
        </TouchableOpacity>
      </View>}

      <Text style={[s.compareTitle, { color: theme.text }]}>{noWidow('Comparar planes')}</Text>
      <View style={[s.tableHead, { borderBottomColor: theme.sep }]}>
        <View style={{ flex: 1 }} />
        <Text style={[s.col, s.colHead, { color: theme.textSecondary }]}>{free.name}</Text>
        <Text style={[s.col, s.colHead, { color: theme.textSecondary }]}>{paid.name}</Text>
      </View>
      {rows.map((row) => <View key={row.label} style={[s.tableRow, { borderBottomColor: theme.sep }]}>
        <Text style={[s.rowText, { color: theme.text }]}>{noWidow(row.label)}</Text>
        <View style={s.col}>{cell(row.free, false)}</View>
        <View style={s.col}>{cell(row.paid, true)}</View>
      </View>)}

      {/* Cada lado ve solo sus planes, como Uber One o DashPass; la puerta al
          otro lado es un renglón discreto, no una tarjeta de precio. */}
      {!business && <TouchableOpacity style={[s.businessRow, { borderColor: theme.border }]} accessibilityRole="button"
        onPress={() => void (__DEV__ ? handleDevFondero() : handleFonderoAccess())}>
        <Ionicons name="storefront-outline" size={20} color={theme.textSecondary} />
        <Text style={[s.businessText, { color: theme.text }]}>{noWidow('¿Tienes un negocio? Regístralo gratis')}</Text>
        <Ionicons name="chevron-forward" size={17} color={theme.textMute} />
      </TouchableOpacity>}

      {available && <View style={s.footer}>
        <TouchableOpacity disabled={busy !== null} onPress={() => act('restore')} accessibilityRole="button" style={s.link}>
          <Text style={[s.linkText, { color: theme.textSecondary }]}>Restaurar compras</Text>
        </TouchableOpacity>
        <Text style={[s.legal, { color: theme.textSecondary }]}>{noWidow('La suscripción se renueva automáticamente. Puedes cancelarla desde tu tienda.')}</Text>
        {(['privacy', 'terms'] as const).map((kind) => <TouchableOpacity key={kind} onPress={() => {
          const url = subscriptionLegalUrls()?.[kind];
          if (url) void Linking.openURL(url).catch(() => Alert.alert(noWidow('No pudimos abrir el enlace'), noWidow('Inténtalo de nuevo.')));
        }} accessibilityRole="link" style={s.link}><Text style={[s.linkText, { color: theme.textSecondary }]}>{noWidow(kind === 'privacy' ? 'Aviso de privacidad' : 'Condiciones de suscripción')}</Text></TouchableOpacity>)}
      </View>}
      {notice ? <Text accessibilityLiveRegion="polite" style={[s.legal, { color: theme.textSecondary }]}>{noWidow(notice)}</Text> : null}
    </ScrollView>
  </View>;
}
const s = StyleSheet.create({
  root: { flex: 1 },
  nav: { minHeight: 52, paddingHorizontal: 12 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 0 },
  title: { ...Type.title, textAlign: 'center' },
  card: { marginTop: 16, padding: 20, borderRadius: 18 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planName: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 100 },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: '700' },
  tagline: { marginTop: 2, fontSize: 14, lineHeight: 19 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 4, marginTop: 16 },
  was: { fontSize: 17, textDecorationLine: 'line-through' },
  price: { ...Type.number },
  unit: { fontSize: 14 },
  cta: { minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  ctaText: { fontSize: 15, fontWeight: '700' },
  benefits: { marginTop: 16, gap: 8 },
  benefit: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  benefitText: { flex: 1, minWidth: 0, fontSize: 15, lineHeight: 20 },
  more: { minHeight: 40, marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  moreText: { fontSize: 14 },
  special: { marginTop: 16, padding: 20, borderRadius: 18 },
  specialBody: { marginTop: 8, fontSize: 15, lineHeight: 20 },
  compareTitle: { ...Type.section, marginTop: 40, marginBottom: 8 },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  colHead: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  col: { width: 72, alignItems: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth },
  rowText: { flex: 1, minWidth: 0, fontSize: 14, lineHeight: 19, paddingRight: 8 },
  cell: { fontSize: 14, fontWeight: '500' },
  footer: { marginTop: 24, alignItems: 'center' },
  businessRow: { marginTop: 32, minHeight: 56, paddingHorizontal: 16, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', alignItems: 'center', gap: 8 },
  businessText: { flex: 1, fontSize: 15, fontWeight: '600' },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontSize: 14 },
  legal: { marginTop: 8, fontSize: 13, lineHeight: 18, textAlign: 'center' },
});
