import { requireUser } from '../_shared/auth.ts';
import { pushTargets, sendExpoPush } from '../_shared/expo-push.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Avisa al dueño de un Patio que recibió una reseña. Solo quien la escribió
// puede dispararlo, una vez por reseña y en los minutos siguientes a publicarla.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { admin, user } = await requireUser(req);
    const body = await readJson(req, 1_024) as { fonditaId?: string };
    if (typeof body.fonditaId !== 'string' || !UUID.test(body.fonditaId)) return json({ error: 'Valid fonditaId is required' }, 400);

    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    // Reclamar el aviso es atómico: una segunda llamada no encuentra la fila.
    const { data: review, error: reviewError } = await admin.from('reviews')
      .update({ owner_notified_at: new Date().toISOString() })
      .eq('user_id', user.id).eq('fondita_id', body.fonditaId).eq('status', 'published')
      .is('owner_notified_at', null).gte('created_at', since)
      .select('stars').maybeSingle();
    if (reviewError) throw reviewError;
    if (!review) return json({ delivered: 0, deduplicated: true });

    const { data: fondita, error: fonditaError } = await admin.from('fonditas')
      .select('nombre,owner_id').eq('id', body.fonditaId).maybeSingle();
    if (fonditaError) throw fonditaError;
    if (!fondita?.owner_id || fondita.owner_id === user.id) return json({ delivered: 0 });

    const devices = await pushTargets(admin, [fondita.owner_id], 'business_activity', true);
    const delivered = await sendExpoPush(admin, devices, {
      title: `Nueva reseña en ${fondita.nombre || 'tu Patio'}`,
      body: `${'★'.repeat(review.stars)}${'☆'.repeat(5 - review.stars)} · Ábrela para responder.`,
      data: { type: 'review_received', patioId: body.fonditaId, url: 'patio://resenas' },
    });
    return json({ delivered });
  } catch (error) {
    return errorResponse(error, 'No pudimos avisar al negocio.');
  }
});
