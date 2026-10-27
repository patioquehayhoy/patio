import { NativeModules, Platform } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { PLANS, type BillingPeriod, type PaidPlan } from './plans';
import { supabase } from './supabase';

// Kept off until store products and server-side entitlements/quotas are live.
// Never grant paid privileges from local storage or from a successful tap.
export function billingAvailable(): boolean {
  return process.env.EXPO_PUBLIC_PAID_PLANS_ENABLED === 'true'
    && Boolean(NativeModules.RNPurchases) && Boolean(apiKey())
    && Boolean(subscriptionLegalUrls());
}

export function subscriptionLegalUrls(): { privacy: string; terms: string } | null {
  const privacy = process.env.EXPO_PUBLIC_PRIVACY_URL;
  const terms = process.env.EXPO_PUBLIC_TERMS_URL;
  try {
    if (!privacy || !terms || new URL(privacy).protocol !== 'https:' || new URL(terms).protocol !== 'https:') return null;
    return { privacy, terms };
  } catch { return null; }
}

function apiKey() {
  return Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
    : Platform.OS === 'android' ? process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY : undefined;
}
async function client() {
  if (!billingAvailable()) throw new Error('Las suscripciones estarán disponibles pronto.');
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Inicia sesión para administrar tus compras.');
  const Purchases = (await import('react-native-purchases')).default;
  if (!await Purchases.isConfigured()) Purchases.configure({ apiKey: apiKey()!, appUserID: data.user.id });
  else if (await Purchases.getAppUserID() !== data.user.id) await Purchases.logIn(data.user.id);
  return { Purchases, userId: data.user.id };
}
export async function loadPlanPackages(plan: PaidPlan): Promise<Partial<Record<BillingPeriod, PurchasesPackage>>> {
  const { Purchases } = await client();
  const offering = (await Purchases.getOfferings()).all[PLANS[plan].offering];
  return { monthly: offering?.monthly ?? undefined, annual: offering?.annual ?? undefined };
}
async function confirmAccount(userId: string) {
  const { data, error } = await supabase.auth.getUser();
  if (error || data.user?.id !== userId) throw new Error('Tu cuenta cambió. Vuelve a abrir Tu plan.');
}
export async function purchasePlan(plan: PaidPlan, item: PurchasesPackage): Promise<boolean> {
  const { Purchases, userId } = await client();
  // Refetch the approved offering: arbitrary product IDs cannot choose a plan.
  const offering = (await Purchases.getOfferings()).all[PLANS[plan].offering];
  const selected = offering?.availablePackages.find((entry) => entry.identifier === item.identifier && entry.product.identifier === item.product.identifier);
  if (!selected) throw new Error('Este plan cambió. Vuelve a abrir Tu plan.');
  await confirmAccount(userId);
  const { customerInfo } = await Purchases.purchasePackage(selected);
  await confirmAccount(userId);
  return Boolean(customerInfo.entitlements.active[PLANS[plan].entitlement]);
}
export async function restorePlan(plan: PaidPlan): Promise<boolean> {
  const { Purchases, userId } = await client();
  const info = await Purchases.restorePurchases();
  await confirmAccount(userId);
  return Boolean(info.entitlements.active[PLANS[plan].entitlement]);
}
