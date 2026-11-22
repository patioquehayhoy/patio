import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildFollowerDigests, type DigestCandidate } from '../_shared/follower-digest.ts';
import { sendExpoPush } from '../_shared/expo-push.ts';
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

const cdmxDay = (now: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);

// Resumen de los lugares que sigues: 8:00 (desayunos), 11:30 y, si hubo algo
// nuevo, 17:30.
// Solo la llama pg_cron (migración 20261121110000) con el secreto de Vault.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) throw new HttpError(503, 'El servicio no está disponible');
    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    const token = req.headers.get('Authorization')?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? '';
    const { data: expected, error: secretError } = await admin.rpc('cron_secret');
    if (secretError) throw secretError;
    if (typeof expected !== 'string' || expected.length < 32 || !sameSecret(token, expected)) throw new HttpError(401, 'Unauthorized');
    const body = await readJson(req, 512) as { slot?: unknown };
    if (body.slot !== 'manana' && body.slot !== 'mediodia' && body.slot !== 'tarde') throw new HttpError(400, 'slot must be manana, mediodia or tarde');
    const slot = body.slot;

    const { data, error } = await admin.rpc('follower_digest_candidates');
    if (error) throw error;
    const rows = (data ?? []) as DigestCandidate[];
    const userIds = [...new Set(rows.map((row) => row.user_id))];
    if (!userIds.length) return json({ slot: body.slot, users: 0, delivered: 0 });

    const [prefsResult, devicesResult] = await Promise.all([
      admin.from('notification_preferences').select('user_id,patio_publications,special_notices,paused').in('user_id', userIds),
      admin.from('push_devices').select('id,user_id,expo_push_token').in('user_id', userIds).eq('active', true),
    ]);
    if (prefsResult.error) throw prefsResult.error;
    if (devicesResult.error) throw devicesResult.error;
    const prefs = new Map((prefsResult.data ?? []).map((row) => [row.user_id as string, row]));
    const now = new Date();
    // Valores por defecto de las columnas: menús encendido, promociones apagado
    // (App Review 4.5.4); «Pausar todo» apaga los dos.
    const digests = buildFollowerDigests(rows, now, (userId) => {
      const pref = prefs.get(userId);
      const paused = pref?.paused === true;
      return { menus: !paused && (pref?.patio_publications ?? true) === true, promos: !paused && pref?.special_notices === true };
    }, slot);

    const day = cdmxDay(now);
    let delivered = 0;
    for (const digest of digests) {
      const devices = (devicesResult.data ?? []).filter((device) => device.user_id === digest.userId);
      if (!devices.length) continue;
      const sent = await sendExpoPush(admin, devices, { title: digest.title, body: digest.body, data: digest.data });
      if (!sent) continue;
      delivered += sent;
      // Lo que ya salió no se repite en el resumen de la tarde.
      await admin.from('follower_digest_items').upsert(
        digest.items.map((item) => ({ user_id: digest.userId, negocio_id: item.negocioId, day, kind: item.kind })),
        { onConflict: 'user_id,negocio_id,day,kind', ignoreDuplicates: true },
      );
    }
    return json({ slot: body.slot, users: digests.length, delivered });
  } catch (error) {
    return errorResponse(error, 'No pudimos enviar el resumen.');
  }
});
