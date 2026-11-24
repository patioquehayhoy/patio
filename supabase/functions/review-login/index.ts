import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, errorResponse, HttpError, json, readJson } from '../_shared/http.ts';

// Acceso de la revisión de Apple y Google (docs/STORE_CONSOLES_2026-11-11.md §7).
// El revisor no puede leer el buzón donde llega el código. Para UN solo
// correo (secreto REVIEW_EMAIL) se acepta un código fijo (secreto
// REVIEW_CODE); la función pide a Supabase un código de un solo uso para ese
// correo y la app entra con él, por el mismo camino que cualquier persona.
// Sin los dos secretos, la función no abre nada. Nada fijo en la app ni en Git.

function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const reviewEmail = (Deno.env.get('REVIEW_EMAIL') ?? '').trim().toLowerCase();
    const reviewCode = (Deno.env.get('REVIEW_CODE') ?? '').trim();
    const url = Deno.env.get('SUPABASE_URL');
    const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!reviewEmail || !/^\d{8}$/.test(reviewCode) || !url || !key) throw new HttpError(404, 'No disponible');

    const body = await readJson(req, 512) as { email?: unknown; code?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    if (!sameText(email, reviewEmail) || !sameText(code, reviewCode)) {
      // Frena a quien pruebe códigos al azar.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      throw new HttpError(401, 'Código incorrecto');
    }

    const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
    // La cuenta se crea la primera vez, ya confirmada.
    await admin.auth.admin.createUser({ email: reviewEmail, email_confirm: true }).catch(() => null);
    const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email: reviewEmail });
    const token = data?.properties?.email_otp;
    if (error || !token) throw new HttpError(503, 'No pudimos abrir la sesión');
    return json({ token });
  } catch (error) {
    return errorResponse(error, 'No pudimos abrir la sesión');
  }
});
