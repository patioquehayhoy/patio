import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, HttpError, json, readJson } from '../_shared/http.ts';
import { appleTransaction, applyStoreState, googleAcknowledge, googleSubscription, PRO_PRODUCTS } from '../_shared/store.ts';

// La app manda la compra recién hecha (o restaurada). Se confirma con la
// tienda, se liga a la cuenta que llama y se actualiza business_plans.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { admin, user } = await requireUser(req);
    const body = await readJson(req, 4096);
    const productId = typeof body.productId === 'string' ? body.productId : '';
    if (!PRO_PRODUCTS.has(productId)) throw new HttpError(400, 'Producto desconocido');

    const state = body.platform === 'ios' && typeof body.transactionId === 'string'
      ? await appleTransaction(body.transactionId)
      : body.platform === 'android' && typeof body.purchaseToken === 'string'
        ? await googleSubscription(body.purchaseToken)
        : null;
    if (!state || state.productId !== productId) throw new HttpError(404, 'No encontramos esta compra');

    const result = await applyStoreState(admin, state, user.id);
    if (!result.applied) throw new HttpError(403, 'Esta compra pertenece a otra cuenta');
    if (state.platform === 'android' && state.active && state.needsAck) await googleAcknowledge(state);
    return json({ active: state.active, expiresAt: state.expiresAt?.toISOString() ?? null });
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    console.error('verify-purchase', error);
    return json({ error: 'No pudimos confirmar la compra' }, 500);
  }
});
