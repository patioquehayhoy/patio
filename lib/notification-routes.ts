// A dónde lleva tocar un aviso. Solo destinos conocidos: un aviso nunca abre
// una ruta arbitraria.
export type NotificationRoute =
  | { pathname: '/patio/[id]'; params: { id: string } }
  | { pathname: '/foodie/[id]'; params: { id: string } }
  | { pathname: '/resena/[id]'; params: { id: string } }
  | { pathname: '/menu-editar'; params: { desde: 'ultimo' } }
  | { pathname: '/avisar'; params: { tipo: 'closed'; auto: '1' } }
  | { pathname: '/notificaciones' | '/historial' | '/explorar' | '/hoy' | '/resenas' | '/favoritos' };

// `/favoritos`: el resumen de los lugares que sigues (varios lugares).
const ROUTES = new Set(['/notificaciones', '/historial', '/explorar', '/hoy', '/favoritos']);

export function routeForNotification(data: Record<string, unknown> | null | undefined): NotificationRoute | null {
  if (!data) return null;
  if (data.type === 'follow_request') return { pathname: '/notificaciones' };
  // Negocio (2026-11-21): cada aviso lleva a donde se hace lo que pide, sin
  // pasos de más. «¿Ya publicaste?» abre el editor con tu último menú listo
  // (cambias lo que no hay y «Publicar»); «Nueva reseña · Toca para
  // responder» abre Actividad, donde se responde, no tu ficha.
  if (data.type === 'publish_reminder') return { pathname: '/menu-editar', params: { desde: 'ultimo' } };
  if (data.type === 'review_received') return { pathname: '/resenas' };
  // «¿Qué te pareció?» después de una visita real: abre la reseña del lugar.
  if (data.type === 'visit_review' && typeof data.patioId === 'string' && data.patioId) {
    return { pathname: '/resena/[id]', params: { id: data.patioId } };
  }
  if (data.type === 'new_follower' && typeof data.profileId === 'string' && data.profileId) {
    return { pathname: '/foodie/[id]', params: { id: data.profileId } };
  }
  if (typeof data.patioId === 'string' && data.patioId) return { pathname: '/patio/[id]', params: { id: data.patioId } };
  if (typeof data.route === 'string' && ROUTES.has(data.route)) return { pathname: data.route as '/notificaciones' | '/historial' | '/explorar' | '/hoy' | '/favoritos' };
  return null;
}
