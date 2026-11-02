/**
 * Approved prices in MXN; checkout always displays the store's actual price.
 * Only the business side has plans (Cold Start: the Foodie and the Creador
 * never pay while the network is starting). Free lists only what exists today;
 * photoReads mirrors the daily read-menu limit in
 * supabase/migrations/20261009100000_ai_request_limits.sql.
 * Pro is shown only when billing is on — never turn billing on until every Pro
 * benefit exists and its quota is enforced on the server.
 */
export const PLANS = {
  free: { name: 'Gratis', monthly: 0, annual: 0, photoReads: 20, benefits: ['Perfil público para tu negocio', 'Menú a mano sin límite', '20 lecturas con foto al día', 'Compartir tu menú como imagen', 'Aviso a quien te guarda cuando publicas', 'Recibir reseñas y responder', 'Guardados y «me gusta» de tus platillos'] },
  pro: { name: 'Pro', monthly: 99, annual: 990, photoReads: 60, specialNotices: 8, entitlement: 'patio_pro', offering: 'patio_pro', benefits: ['60 lecturas con foto al día', '8 avisos especiales al mes', 'Estadísticas por horario y colonia', 'Platillo destacado'] },
} as const;
export type PaidPlan = 'pro';
export type BillingPeriod = 'monthly' | 'annual';
