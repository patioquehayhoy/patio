import { requireUser } from '../_shared/auth.ts';
import { pushTargets, sendExpoPush } from '../_shared/expo-push.ts';
import { corsHeaders, errorResponse, HttpError, json, readJson } from '../_shared/http.ts';
import { OPERATION_KINDS, operationNoticeText, type OperationKind } from '../_shared/operation-notice.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Aviso de operación (gratis): «Hoy abrimos a las 8 pm.», «Hoy no abrimos.»…
// El dueño elige el tipo y la hora; el texto lo arma este servidor. Uno al día
// por lugar (día de la Ciudad de México). Llega a quien sigue el lugar con
// avisos encendidos y «Menús y avisos» activado, y se ve en la ficha ese día.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { admin, user } = await requireUser(req);
    const body = await readJson(req, 1_024) as { fonditaId?: unknown; kind?: unknown; time?: unknown };
    if (typeof body.fonditaId !== 'string' || !UUID.test(body.fonditaId)) return json({ error: 'Valid fonditaId is required' }, 400);
    if (typeof body.kind !== 'string' || !(OPERATION_KINDS as readonly string[]).includes(body.kind)) {
      throw new HttpError(400, 'Elige qué quieres avisar.');
    }
    const text = operationNoticeText(body.kind as OperationKind, typeof body.time === 'string' ? body.time : null);
    if (!text) throw new HttpError(400, 'Elige la hora.');

    const { data: negocio, error: negocioError } = await admin.from('negocios')
      .select('id,nombre,owner_id').eq('id', body.fonditaId).maybeSingle();
    if (negocioError) throw negocioError;
    if (!negocio || !user.email_confirmed_at || negocio.owner_id !== user.id) {
      return json({ error: 'This Patio does not belong to the current user' }, 403);
    }

    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type: string) => parts.find((value) => value.type === type)?.value;
    // Inicio del día en la Ciudad de México (UTC−6, sin horario de verano).
    const dayStart = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00-06:00`).toISOString();
    const { count, error: countError } = await admin.from('special_notices')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', negocio.id).eq('kind', 'operation').gte('created_at', dayStart);
    if (countError) throw countError;
    if ((count ?? 0) >= 1) throw new HttpError(429, 'Ya avisaste hoy. Mañana puedes avisar otra vez.');

    const { data: notice, error: insertError } = await admin.from('special_notices')
      .insert({ negocio_id: negocio.id, created_by: user.id, body: text, kind: 'operation' }).select('id').single();
    if (insertError || !notice) throw insertError ?? new Error('Could not save notice');

    const { data: follows, error: followsError } = await admin.from('patio_follows')
      .select('user_id').eq('negocio_id', negocio.id).eq('notifications_enabled', true);
    if (followsError) throw followsError;
    const followerIds = [...new Set((follows ?? []).map((follow) => follow.user_id))].filter((id) => id !== user.id);
    // Va con los menús («Menús y avisos», encendido por defecto).
    const targets = await pushTargets(admin, followerIds, 'patio_publications', true);
    const delivered = await sendExpoPush(admin, targets, {
      title: negocio.nombre?.trim() || 'Un Patio',
      body: text,
      data: { type: 'operation_notice', patioId: negocio.id, noticeId: notice.id },
    });
    return json({ noticeId: notice.id, text, delivered });
  } catch (error) {
    return errorResponse(error, 'No pudimos enviar el aviso.');
  }
});
