import { createClient } from 'npm:@supabase/supabase-js@2';

// Webhook de RevenueCat: mantiene business_plans al día con la tienda. La app
// configura RevenueCat con el id de Supabase, así que app_user_id es la cuenta.
// Autoriza con el encabezado secreto REVENUECAT_WEBHOOK_AUTH (sin JWT).
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ACTIVE = new Set(['INITIAL_PURCHASE', 'RENEWAL', 'PRODUCT_CHANGE', 'UNCANCELLATION', 'NON_RENEWING_PURCHASE', 'SUBSCRIPTION_EXTENDED']);
const ENDED = new Set(['EXPIRATION']);

type RevenueCatEvent = {
  type?: string; app_user_id?: string; original_app_user_id?: string;
  entitlement_ids?: string[] | null; expiration_at_ms?: number | null;
};

function sameSecret(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let index = 0; index < Math.max(left.length, right.length); index++) diff |= (left[index] ?? 0) ^ (right[index] ?? 0);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!secret || !url || !key) return new Response('Not configured', { status: 503 });
  if (!sameSecret(req.headers.get('Authorization') ?? '', secret)) return new Response('Unauthorized', { status: 401 });

  let event: RevenueCatEvent;
  try {
    event = ((await req.json()) as { event?: RevenueCatEvent }).event ?? {};
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  const userId = [event.app_user_id, event.original_app_user_id].find((id) => typeof id === 'string' && UUID.test(id));
  const type = event.type ?? '';
  // Otros eventos (cancelación, problema de cobro, prueba) no cambian la fecha:
  // Pro dura hasta su expiración y la tienda avisa con EXPIRATION.
  if (!userId || !(event.entitlement_ids ?? []).includes('patio_pro') || (!ACTIVE.has(type) && !ENDED.has(type))) {
    return Response.json({ ignored: true });
  }
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const expiresAt = ENDED.has(type) ? new Date().toISOString()
    : new Date(event.expiration_at_ms ?? Date.now() + 366 * 86_400_000).toISOString();
  // Los meses de Fundador que duran más que la compra se conservan.
  const { data: current, error: readError } = await admin.from('business_plans')
    .select('expires_at,source').eq('user_id', userId).maybeSingle();
  if (readError) { console.error('revenuecat-webhook', readError); return new Response('Error', { status: 500 }); }
  const keep = current?.source === 'founder' && new Date(current.expires_at) > new Date(expiresAt);
  const { error } = await admin.from('business_plans').upsert({
    user_id: userId, plan: 'pro', source: keep ? 'founder' : 'store',
    expires_at: keep ? current.expires_at : expiresAt, updated_at: new Date().toISOString(),
  });
  if (error) { console.error('revenuecat-webhook', error); return new Response('Error', { status: 500 }); }
  return Response.json({ ok: true });
});
