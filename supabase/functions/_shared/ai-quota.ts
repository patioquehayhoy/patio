import type { requireUser } from './auth.ts';
import { HttpError } from './http.ts';

/** The service-only RPC owns limits; app-supplied quotas are never trusted. */
export async function consumeAIRequest(auth: Awaited<ReturnType<typeof requireUser>>, feature: 'read-menu' | 'smart-setup' | 'search-intent', count = 1) {
  const { data, error } = await auth.admin.rpc('consume_ai_request', { p_user_id: auth.user.id, p_feature: feature, p_count: count });
  // Fail closed if the migration is absent or the persistent counter is down.
  if (error || typeof data !== 'boolean') throw new HttpError(503, 'La lectura está temporalmente fuera de servicio.');
  if (!data) throw new HttpError(429, feature === 'read-menu'
    ? count > 1
      ? 'No te alcanzan las lecturas de hoy para todas esas hojas. Elige menos, escríbelo a mano (siempre es gratis) o vuelve mañana. Con Pro tienes 30 al día.'
      : 'Ya usaste tus lecturas con foto de hoy. Escribe el menú a mano, que siempre es gratis, o vuelve mañana. Con Pro tienes 30 al día.'
    : 'Alcanzaste el límite por hoy. Inténtalo más tarde.');
}

/** Gives back what consumeAIRequest charged when the reading service never answered. */
export async function returnAIRequest(auth: Awaited<ReturnType<typeof requireUser>>, feature: 'read-menu' | 'smart-setup' | 'search-intent', count = 1) {
  const { error } = await auth.admin.rpc('return_ai_request', { p_user_id: auth.user.id, p_feature: feature, p_count: count });
  if (error) throw error;
}
