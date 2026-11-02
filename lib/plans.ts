/**
 * Approved prices in MXN; checkout always displays the store's actual price.
 * Only the business side has plans (Cold Start: the Foodie and the Creador
 * never pay while the network is starting). Free lists only what exists today;
 * photoReads mirrors the daily read-menu limits in consume_ai_request
 * (supabase/migrations/20261102120000_business_pro.sql).
 * Pro (supabase/migrations/20261102120000_business_pro.sql) is offered only
 * when billing is on; founders get it by hand and see it as their plan.
 */
export const PLANS = {
  free: { name: 'Gratis', monthly: 0, annual: 0, photoReads: 20, benefits: ['Perfil público para tu negocio', 'Menú a mano sin límite', '20 lecturas con foto al día', 'Compartir tu menú como imagen', 'Aviso a tus seguidores cuando publicas', 'Recibir reseñas y responder', 'Quién te sigue y «me gusta» de tus platillos'] },
  pro: { name: 'Pro', monthly: 99, annual: 990, photoReads: 60, specialNotices: 8, entitlement: 'patio_pro', offering: 'patio_pro', benefits: ['60 lecturas con foto al día', '8 avisos especiales al mes', 'Platillo destacado en tu ficha', 'Día y hora con más interés'] },
} as const;
export type PaidPlan = 'pro';
export type BillingPeriod = 'monthly' | 'annual';
