import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';
import type { Purchase } from 'expo-iap';
import { type BillingPeriod, type PaidPlan } from './plans';
import { supabase } from './supabase';

/**
 * Cobro directo con App Store (StoreKit 2) y Google Play Billing, sin
 * intermediarios. La tienda cobra; la función `verify-purchase` confirma la
 * compra con Apple o Google y escribe `business_plans`. La app nunca concede
 * Pro por un toque exitoso ni por almacenamiento local: solo lee la respuesta
 * del servidor. Apagado hasta tener contratos, productos y URLs legales.
 */

/** IDs de producto. Deben ser idénticos en App Store Connect y Play Console. */
export const STORE_PRODUCTS: Record<PaidPlan, Record<BillingPeriod, string>> = {
  pro: { monthly: 'patio_pro_mensual', annual: 'patio_pro_anual' },
};

export type StorePackage = {
  productId: string;
  priceString: string;
  /** Android: oferta elegida (la de prueba gratis si la persona es elegible). */
  offerToken?: string;
  /** Hay prueba gratis disponible para esta persona. */
  freeTrial: boolean;
};

export class PurchaseCancelled extends Error {
  userCancelled = true;
  constructor() { super('Compra cancelada.'); }
}

export function billingAvailable(): boolean {
  return process.env.EXPO_PUBLIC_PAID_PLANS_ENABLED === 'true'
    && (Platform.OS === 'ios' || Platform.OS === 'android')
    && Boolean(requireOptionalNativeModule('ExpoIap'))
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

let connected = false;
async function store() {
  if (!billingAvailable()) throw new Error('Las suscripciones estarán disponibles pronto.');
  const iap = await import('expo-iap');
  if (!connected) { await iap.initConnection(); connected = true; }
  return iap;
}

async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) throw new Error('Inicia sesión para administrar tus compras.');
  return data.user.id;
}

export async function loadPlanPackages(plan: PaidPlan): Promise<Partial<Record<BillingPeriod, StorePackage>>> {
  const iap = await store();
  const ids = STORE_PRODUCTS[plan];
  const products = await iap.fetchProducts({ skus: Object.values(ids), type: 'subs' });
  const result: Partial<Record<BillingPeriod, StorePackage>> = {};
  for (const period of Object.keys(ids) as BillingPeriod[]) {
    const product = (products ?? []).find((item) => item.id === ids[period]);
    if (!product || product.type !== 'subs') continue;
    const offers = 'subscriptionOffers' in product ? (product.subscriptionOffers ?? []) : [];
    const trial = offers.find((offer) => offer.paymentMode === 'free-trial');
    const chosen = Platform.OS === 'android' ? (trial ?? offers[0]) : undefined;
    result[period] = {
      productId: product.id,
      priceString: product.displayPrice,
      offerToken: chosen?.offerTokenAndroid ?? undefined,
      freeTrial: Boolean(trial),
    };
  }
  return result;
}

type Verified = { active: boolean; expiresAt: string | null };

async function verifyOnServer(purchase: Purchase): Promise<Verified> {
  const body = Platform.OS === 'ios'
    ? { platform: 'ios', productId: purchase.productId, transactionId: purchase.id }
    : { platform: 'android', productId: purchase.productId, purchaseToken: purchase.purchaseToken };
  const { data, error } = await supabase.functions.invoke<Verified>('verify-purchase', { body });
  if (error || !data) throw new Error('No pudimos confirmar tu compra. Usa «Restaurar compras» en un momento.');
  return data;
}

/** Inicia la compra y espera a que la tienda responda y el servidor confirme. */
export async function purchasePlan(plan: PaidPlan, item: StorePackage): Promise<boolean> {
  const iap = await store();
  const userId = await currentUserId();
  if (!Object.values(STORE_PRODUCTS[plan]).includes(item.productId)) throw new Error('Este plan cambió. Vuelve a abrir Tu plan.');

  const purchase = await new Promise<Purchase>((resolve, reject) => {
    const done = (fn: () => void) => { ok.remove(); fail.remove(); fn(); };
    const ok = iap.purchaseUpdatedListener((p) => {
      if (p.productId === item.productId && p.purchaseState === 'purchased') done(() => resolve(p));
    });
    const fail = iap.purchaseErrorListener((e) => done(() => reject(iap.isUserCancelledError(e) ? new PurchaseCancelled() : new Error(e.message || 'La tienda no completó la compra.'))));
    iap.requestPurchase({
      type: 'subs',
      request: {
        // Liga la compra a la cuenta: el servidor rechaza compras de otra cuenta.
        apple: { sku: item.productId, appAccountToken: userId },
        google: {
          skus: [item.productId],
          obfuscatedAccountId: userId,
          subscriptionOffers: item.offerToken ? [{ sku: item.productId, offerToken: item.offerToken }] : undefined,
        },
      },
    }).catch((e: unknown) => done(() => reject(e instanceof Error ? e : new Error('La tienda no completó la compra.'))));
  });

  const verified = await verifyOnServer(purchase);
  // Solo se cierra la transacción cuando el servidor la registró; si falla,
  // la tienda la vuelve a entregar y «Restaurar compras» la recupera.
  if (verified.active) await iap.finishTransaction({ purchase, isConsumable: false });
  return verified.active;
}

export async function restorePlan(plan: PaidPlan): Promise<boolean> {
  const iap = await store();
  await currentUserId();
  const ids = Object.values(STORE_PRODUCTS[plan]);
  const purchases = (await iap.getAvailablePurchases()).filter((p) => ids.includes(p.productId));
  let active = false;
  for (const purchase of purchases) {
    const verified = await verifyOnServer(purchase);
    if (verified.active) { active = true; await iap.finishTransaction({ purchase, isConsumable: false }).catch(() => {}); }
  }
  return active;
}
