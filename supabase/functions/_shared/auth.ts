import { createClient } from 'npm:@supabase/supabase-js@2';
import { HttpError } from './http.ts';

/** An API/publishable key alone must never authorize paid or destructive work. */
export async function requireUser(request: Request) {
  const header = request.headers.get('Authorization');
  const token = header?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) throw new HttpError(401, 'Inicia sesión para continuar');

  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new HttpError(503, 'El servicio no está disponible');
  const admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user || data.user.is_anonymous) {
    throw new HttpError(401, 'Inicia sesión para continuar');
  }
  return { admin, user: data.user };
}
