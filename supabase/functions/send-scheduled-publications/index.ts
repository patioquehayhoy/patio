import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, errorResponse, HttpError, json } from '../_shared/http.ts';
import { announcePublication } from '../_shared/publication.ts';

/** Comparación en tiempo constante para el secreto de la tarea programada. */
function sameSecret(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) diff |= left[index] ^ right[index];
  return diff === 0;
}

// Menús programados (2026-11-21): cuando llega su hora, se anuncian como si se
// publicaran en ese momento (el mismo camino que publicar al momento,
// _shared/publication.ts). Solo la llama pg_cron cada 5 minutos (migración
// 20261121120000) con el secreto de Vault.
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

    const { data, error } = await admin.rpc('due_scheduled_publications');
    if (error) throw error;
    const due = (data ?? []) as { negocio_id: string; nombre: string | null; horario_semanal: unknown; fecha: string }[];
    const results = [];
    for (const row of due) {
      try {
        results.push(await announcePublication(admin, { id: row.negocio_id, nombre: row.nombre, horario_semanal: row.horario_semanal }, row.fecha, null));
      } catch {
        // Un lugar que falla no detiene a los demás; se reintenta en 5 minutos.
      }
    }
    return json({ due: due.length, announced: results.length });
  } catch (error) {
    return errorResponse(error, 'No pudimos anunciar los menús programados.');
  }
});
