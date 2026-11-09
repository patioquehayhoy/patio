import { createClient } from 'npm:@supabase/supabase-js@2';
import { summaryMessages, type DigestRow } from '../_shared/digest.ts';
import { pushTargets, sendExpoPush } from '../_shared/expo-push.ts';
import { corsHeaders, errorResponse, HttpError, json, readJson } from '../_shared/http.ts';

/** Comparación en tiempo constante para el secreto de la tarea programada. */
function sameSecret(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) diff |= left[index] ^ right[index];
  return diff === 0;
}

// Resumen de las 18:00 («Hoy · 34 personas vieron tu menú.»). Solo la llama
// pg_cron (migración 20261109111000) con PATIO_CRON_SECRET; nadie más puede.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const expected = Deno.env.get('PATIO_CRON_SECRET') ?? '';
    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? '';
    if (expected.length < 32 || !sameSecret(token, expected)) throw new HttpError(401, 'Unauthorized');
    const body = await readJson(req, 512) as { mode?: unknown };
    if (body.mode !== 'summary') throw new HttpError(400, 'mode must be summary');

    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new HttpError(503, 'El servicio no está disponible');
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const { data, error } = await admin.rpc('business_daily_digest');
    if (error) throw error;
    const rows = (data ?? []) as DigestRow[];
    const messages = summaryMessages(rows);
    if (!messages.length) return json({ mode: body.mode, owners: 0, delivered: 0 });

    const devices = await pushTargets(admin, [...new Set(messages.map((message) => message.ownerId))], 'daily_summary', true);
    let delivered = 0;
    for (const message of messages) {
      const own = devices.filter((device) => device.user_id === message.ownerId);
      if (!own.length) continue;
      delivered += await sendExpoPush(admin, own, { title: message.title, body: message.body, data: { ...message.data, negocioId: message.negocioId } });
    }
    return json({ mode: body.mode, owners: messages.length, delivered });
  } catch (error) {
    return errorResponse(error, 'No pudimos enviar el resumen.');
  }
});
