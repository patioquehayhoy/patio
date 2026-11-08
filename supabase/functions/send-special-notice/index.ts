import { requireUser } from '../_shared/auth.ts';
import { pushTargets, sendExpoPush } from '../_shared/expo-push.ts';
import { corsHeaders, errorResponse, HttpError, json, readJson } from '../_shared/http.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTHLY_NOTICES = 8;

// Aviso especial de Pro: el dueño escribe hasta 140 caracteres, se guarda
// (la base revisa el lenguaje) y llega a quien guardó el lugar y activó
// Promociones. Cupo de 8 por mes calendario de la Ciudad de México.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { admin, user } = await requireUser(req);
    const body = await readJson(req, 2_048) as { fonditaId?: unknown; text?: unknown };
    if (typeof body.fonditaId !== 'string' || !UUID.test(body.fonditaId)) return json({ error: 'Valid fonditaId is required' }, 400);
    const text = typeof body.text === 'string' ? body.text.replace(/\s+/g, ' ').trim() : '';
    if (!text || text.length > 140) throw new HttpError(400, 'El aviso debe tener de 1 a 140 caracteres.');

    const { data: negocio, error: negocioError } = await admin.from('negocios')
      .select('id,nombre,owner_id').eq('id', body.fonditaId).maybeSingle();
    if (negocioError) throw negocioError;
    if (!negocio || !user.email_confirmed_at || negocio.owner_id !== user.id) {
      return json({ error: 'This Patio does not belong to the current user' }, 403);
    }
    const { data: pro, error: proError } = await admin.rpc('has_pro', { p_user: user.id });
    if (proError) throw proError;
    if (pro !== true) throw new HttpError(402, 'Los avisos especiales son parte de Pro.');

    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit' }).formatToParts(new Date());
    const part = (type: string) => parts.find((value) => value.type === type)?.value;
    // Inicio del mes en la Ciudad de México (UTC−6, sin horario de verano).
    const monthStart = new Date(`${part('year')}-${part('month')}-01T00:00:00-06:00`).toISOString();
    const { count, error: countError } = await admin.from('special_notices')
      .select('id', { count: 'exact', head: true }).eq('negocio_id', negocio.id).gte('created_at', monthStart);
    if (countError) throw countError;
    if ((count ?? 0) >= MONTHLY_NOTICES) throw new HttpError(429, 'Ya enviaste tus 8 avisos de este mes.');

    const { data: notice, error: insertError } = await admin.from('special_notices')
      .insert({ negocio_id: negocio.id, created_by: user.id, body: text }).select('id').single();
    if (insertError?.message?.includes('CONTENT_REJECTED')) throw new HttpError(422, 'Patio no permite insultos ni lenguaje ofensivo.');
    if (insertError || !notice) throw insertError ?? new Error('Could not save notice');

    const { data: follows, error: followsError } = await admin.from('patio_follows')
      .select('user_id').eq('negocio_id', negocio.id).eq('notifications_enabled', true);
    if (followsError) throw followsError;
    const followerIds = [...new Set((follows ?? []).map((follow) => follow.user_id))].filter((id) => id !== user.id);
    // Promociones viene apagado por defecto (App Review 4.5.4).
    const targets = await pushTargets(admin, followerIds, 'special_notices', false);
    const delivered = await sendExpoPush(admin, targets, {
      title: negocio.nombre?.trim() || 'Un Patio',
      body: `Aviso: ${text}`,
      data: { type: 'special_notice', patioId: negocio.id, noticeId: notice.id },
    });
    return json({ noticeId: notice.id, delivered });
  } catch (error) {
    return errorResponse(error, 'No pudimos enviar el aviso.');
  }
});
