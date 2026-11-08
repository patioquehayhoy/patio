// A dónde lleva tocar un aviso. Solo destinos conocidos: un aviso nunca abre
// una ruta arbitraria.
export type NotificationRoute =
  | { pathname: '/patio/[id]'; params: { id: string } }
  | { pathname: '/foodie/[id]'; params: { id: string } }
  | { pathname: '/resena/[id]'; params: { id: string } }
  | { pathname: '/notificaciones' | '/historial' | '/explorar' };

const ROUTES = new Set(['/notificaciones', '/historial', '/explorar']);

export function routeForNotification(data: Record<string, unknown> | null | undefined): NotificationRoute | null {
  if (!data) return null;
  if (data.type === 'follow_request') return { pathname: '/notificaciones' };
  // «¿Qué te pareció?» después de una visita real: abre la reseña del lugar.
  if (data.type === 'visit_review' && typeof data.patioId === 'string' && data.patioId) {
    return { pathname: '/resena/[id]', params: { id: data.patioId } };
  }
  if (data.type === 'new_follower' && typeof data.profileId === 'string' && data.profileId) {
    return { pathname: '/foodie/[id]', params: { id: data.profileId } };
  }
  if (typeof data.patioId === 'string' && data.patioId) return { pathname: '/patio/[id]', params: { id: data.patioId } };
  if (typeof data.route === 'string' && ROUTES.has(data.route)) return { pathname: data.route as '/notificaciones' | '/historial' | '/explorar' };
  return null;
}
