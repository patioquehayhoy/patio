import type { requireUser } from './auth.ts';
import { HttpError } from './http.ts';

/** The service-only RPC owns limits; app-supplied quotas are never trusted. */
export async function consumeAIRequest(auth: Awaited<ReturnType<typeof requireUser>>, feature: 'read-menu' | 'smart-setup' | 'search-intent') {
  const { data, error } = await auth.admin.rpc('consume_ai_request', { p_user_id: auth.user.id, p_feature: feature });
  // Fail closed if the migration is absent or the persistent counter is down.
  if (error || typeof data !== 'boolean') throw new HttpError(503, 'La lectura está temporalmente fuera de servicio.');
  if (!data) throw new HttpError(429, 'Alcanzaste el límite de lecturas. Inténtalo más tarde o continúa manualmente.');
}
