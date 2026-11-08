import { createClient } from 'npm:@supabase/supabase-js@2';
import { appleNotificationTransactionId, appleTransaction, applyStoreState, googleSubscription } from '../_shared/store.ts';

// Avisos de renovación, cancelación, reembolso y cobro fallido.
//   Apple:  App Store Server Notifications V2 → POST { signedPayload }
//   Google: Pub/Sub push (RTDN) → POST ?token=STORE_NOTIFICATIONS_TOKEN
// Del aviso solo se toma el identificador: el estado se vuelve a pedir a la
// tienda, así que un aviso falso no puede conceder Pro.

function sameSecret(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) return new Response('Not configured', { status: 503 });
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return new Response('Bad request', { status: 400 }); }

  try {
    if (typeof body.signedPayload === 'string') {
      const transactionId = appleNotificationTransactionId(body.signedPayload);
      const state = transactionId ? await appleTransaction(transactionId) : null;
      if (state) await applyStoreState(admin, state);
      return Response.json({ ok: true });
    }

    const message = body.message as { data?: string } | undefined;
    if (message?.data) {
      const secret = Deno.env.get('STORE_NOTIFICATIONS_TOKEN') ?? '';
      if (!secret || !sameSecret(new URL(req.url).searchParams.get('token') ?? '', secret)) return new Response('Unauthorized', { status: 401 });
      const data = JSON.parse(atob(message.data)) as { packageName?: string; subscriptionNotification?: { purchaseToken?: string } };
      const token = data.subscriptionNotification?.purchaseToken;
      if (data.packageName === Deno.env.get('GOOGLE_PLAY_PACKAGE') && token) {
        const state = await googleSubscription(token);
        if (state) await applyStoreState(admin, state);
      }
      return Response.json({ ok: true });
    }
    return Response.json({ ignored: true });
  } catch (error) {
    // 500 hace que Apple y Google reintenten más tarde.
    console.error('store-notifications', error);
    return new Response('Error', { status: 500 });
  }
});
