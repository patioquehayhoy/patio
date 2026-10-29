import { requireUser } from '../_shared/auth.ts';
import { pushTargets, sendExpoPush } from '../_shared/expo-push.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TARGETS: Record<string, string> = { review: 'una reseña', profile: 'un perfil', patio: 'un lugar', collection: 'una lista' };
const REASONS: Record<string, string> = { spam: 'Spam o publicidad', abuse: 'Abuso u ofensivo', inaccurate: 'Información incorrecta', other: 'Otro motivo' };

// Avisa al equipo de soporte (cuentas en SUPPORT_ADMIN_USER_IDS) de un reporte
// nuevo, para atenderlo a tiempo. Una vez por reporte, solo quien lo hizo.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { admin, user } = await requireUser(req);
    const body = await readJson(req, 1_024) as { reportId?: string };
    if (typeof body.reportId !== 'string' || !UUID.test(body.reportId)) return json({ error: 'Valid reportId is required' }, 400);

    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const { data: report, error } = await admin.from('content_reports')
      .update({ notified_at: new Date().toISOString() })
      .eq('id', body.reportId).eq('reporter_id', user.id)
      .is('notified_at', null).gte('created_at', since)
      .select('target_type,reason').maybeSingle();
    if (error) throw error;
    if (!report) return json({ delivered: 0, deduplicated: true });

    const supportIds = (Deno.env.get('SUPPORT_ADMIN_USER_IDS') ?? '').split(',').map((id) => id.trim()).filter((id) => UUID.test(id));
    const devices = await pushTargets(admin, supportIds);
    const delivered = await sendExpoPush(admin, devices, {
      title: 'Nuevo reporte en Patio',
      body: `Reportaron ${TARGETS[report.target_type] ?? 'contenido'} · ${REASONS[report.reason] ?? report.reason}`,
      data: { type: 'content_report', reportId: body.reportId },
    });
    return json({ delivered });
  } catch (error) {
    return errorResponse(error, 'No pudimos avisar a soporte.');
  }
});
