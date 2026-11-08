import { importPKCS8, SignJWT } from 'npm:jose@5';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

// Verificación directa con Apple (App Store Server API) y Google (Play
// Developer API). Nunca se confía en lo que manda el teléfono ni en el cuerpo
// de un aviso: siempre se vuelve a preguntar a la tienda.

export const PRO_PRODUCTS = new Set(['patio_pro_mensual', 'patio_pro_anual']);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StoreState = {
  platform: 'ios' | 'android';
  /** originalTransactionId (Apple) o purchaseToken (Google). */
  ref: string;
  productId: string;
  userId: string | null;
  expiresAt: Date | null;
  active: boolean;
  needsAck?: boolean;
};

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Falta ${name}`);
  return value;
}

function decodeJws<T>(jws: string): T {
  const part = jws.split('.')[1] ?? '';
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  return JSON.parse(atob(b64)) as T;
}

// ---------- Apple ----------

async function appleToken(): Promise<string> {
  const key = await importPKCS8(env('APPLE_IAP_PRIVATE_KEY').replace(/\\n/g, '\n'), 'ES256');
  return new SignJWT({ bid: env('APPLE_BUNDLE_ID') })
    .setProtectedHeader({ alg: 'ES256', kid: env('APPLE_IAP_KEY_ID'), typ: 'JWT' })
    .setIssuer(env('APPLE_IAP_ISSUER_ID'))
    .setIssuedAt()
    .setExpirationTime('10m')
    .setAudience('appstoreconnect-v1')
    .sign(key);
}

type AppleTransaction = {
  transactionId: string; originalTransactionId: string; productId: string; bundleId: string;
  appAccountToken?: string; expiresDate?: number; revocationDate?: number;
};

export async function appleTransaction(transactionId: string): Promise<StoreState | null> {
  if (!/^\d{1,30}$/.test(transactionId)) return null;
  const token = await appleToken();
  // Producción primero; si no existe, sandbox (TestFlight y testers).
  for (const host of ['api.storekit.itunes.apple.com', 'api.storekit-sandbox.itunes.apple.com']) {
    const res = await fetch(`https://${host}/inApps/v1/transactions/${transactionId}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404) continue;
    if (!res.ok) throw new Error(`Apple ${res.status}`);
    const { signedTransactionInfo } = await res.json() as { signedTransactionInfo: string };
    const tx = decodeJws<AppleTransaction>(signedTransactionInfo);
    if (tx.bundleId !== env('APPLE_BUNDLE_ID')) return null;
    const expiresAt = tx.expiresDate ? new Date(tx.expiresDate) : null;
    return {
      platform: 'ios', ref: tx.originalTransactionId, productId: tx.productId,
      userId: tx.appAccountToken && UUID.test(tx.appAccountToken) ? tx.appAccountToken.toLowerCase() : null,
      expiresAt, active: !tx.revocationDate && !!expiresAt && expiresAt > new Date(),
    };
  }
  return null;
}

/** Del aviso de Apple solo se toma el id de transacción para volver a consultar. */
export function appleNotificationTransactionId(signedPayload: string): string | null {
  try {
    const payload = decodeJws<{ data?: { signedTransactionInfo?: string } }>(signedPayload);
    const info = payload.data?.signedTransactionInfo;
    return info ? decodeJws<AppleTransaction>(info).transactionId : null;
  } catch { return null; }
}

// ---------- Google ----------

async function googleAccessToken(): Promise<string> {
  const account = JSON.parse(env('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON')) as { client_email: string; private_key: string };
  const key = await importPKCS8(account.private_key, 'RS256');
  const assertion = await new SignJWT({ scope: 'https://www.googleapis.com/auth/androidpublisher' })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(account.client_email)
    .setAudience('https://oauth2.googleapis.com/token')
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!res.ok) throw new Error(`Google OAuth ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

type GoogleSubscription = {
  subscriptionState?: string;
  acknowledgementState?: string;
  lineItems?: { productId: string; expiryTime?: string }[];
  externalAccountIdentifiers?: { obfuscatedExternalAccountId?: string };
};

const GOOGLE_ACTIVE = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD', 'SUBSCRIPTION_STATE_CANCELED']);

export async function googleSubscription(purchaseToken: string): Promise<StoreState | null> {
  if (!/^[\w.\-]{10,500}$/.test(purchaseToken)) return null;
  const pkg = env('GOOGLE_PLAY_PACKAGE');
  const access = await googleAccessToken();
  const res = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptionsv2/tokens/${purchaseToken}`,
    { headers: { Authorization: `Bearer ${access}` } });
  if (res.status === 404 || res.status === 410) return null;
  if (!res.ok) throw new Error(`Google ${res.status}`);
  const sub = await res.json() as GoogleSubscription;
  const line = (sub.lineItems ?? []).find((item) => PRO_PRODUCTS.has(item.productId)) ?? sub.lineItems?.[0];
  if (!line) return null;
  const expiresAt = line.expiryTime ? new Date(line.expiryTime) : null;
  const account = sub.externalAccountIdentifiers?.obfuscatedExternalAccountId;
  return {
    platform: 'android', ref: purchaseToken, productId: line.productId,
    userId: account && UUID.test(account) ? account.toLowerCase() : null,
    expiresAt,
    // CANCELED = no renovará, pero sigue pagado hasta expiryTime.
    active: GOOGLE_ACTIVE.has(sub.subscriptionState ?? '') && !!expiresAt && expiresAt > new Date(),
    needsAck: sub.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING',
  };
}

/** Google reembolsa solo si no se reconoce en 3 días. */
export async function googleAcknowledge(state: StoreState): Promise<void> {
  const pkg = env('GOOGLE_PLAY_PACKAGE');
  const access = await googleAccessToken();
  const res = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/purchases/subscriptions/${state.productId}/tokens/${state.ref}:acknowledge`,
    { method: 'POST', headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' }, body: '{}' });
  if (!res.ok && res.status !== 400) throw new Error(`Google ack ${res.status}`);
}

// ---------- Patio ----------

/**
 * Guarda la compra y actualiza business_plans. Los meses de Fundador que
 * duran más que la compra se conservan. Una compra de otra cuenta no se aplica.
 */
export async function applyStoreState(admin: SupabaseClient, state: StoreState, expectedUser?: string): Promise<{ applied: boolean; userId: string | null }> {
  if (!PRO_PRODUCTS.has(state.productId)) return { applied: false, userId: null };
  const { data: known } = await admin.from('store_purchases').select('user_id').eq('platform', state.platform).eq('store_ref', state.ref).maybeSingle();
  const userId = state.userId ?? known?.user_id ?? expectedUser ?? null;
  if (!userId) return { applied: false, userId: null };
  if (expectedUser && userId !== expectedUser) return { applied: false, userId };
  if (known && known.user_id !== userId) return { applied: false, userId };

  const now = new Date().toISOString();
  const { error: saveError } = await admin.from('store_purchases').upsert({
    platform: state.platform, store_ref: state.ref, user_id: userId, product_id: state.productId,
    expires_at: state.expiresAt?.toISOString() ?? null, active: state.active, updated_at: now,
  }, { onConflict: 'platform,store_ref' });
  if (saveError) throw saveError;

  const expiresAt = state.active && state.expiresAt ? state.expiresAt.toISOString() : now;
  const { data: current, error: readError } = await admin.from('business_plans').select('expires_at,source').eq('user_id', userId).maybeSingle();
  if (readError) throw readError;
  const keepFounder = current?.source === 'founder' && new Date(current.expires_at) > new Date(expiresAt);
  if (keepFounder) return { applied: true, userId };
  if (!current && !state.active) return { applied: true, userId };
  const { error } = await admin.from('business_plans').upsert({
    user_id: userId, plan: 'pro', source: 'store', expires_at: expiresAt, updated_at: now,
  });
  if (error) throw error;
  return { applied: true, userId };
}
