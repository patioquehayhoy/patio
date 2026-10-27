/** Approved prices in MXN; checkout always displays the store's actual price. */
export const PLANS = {
  foodie: { name: 'Foodie', monthly: 0, annual: 0, benefits: ['Explorar lugares y sus menús', 'Guardar y organizar lugares', 'Compartir listas', 'Publicar reseñas'] },
  creator: { name: 'Creador', monthly: 199, annual: 1990, entitlement: 'patio_creator', offering: 'patio_creator', benefits: ['Listas destacadas', 'Estadísticas de tus listas', 'Sello de Creador', 'Enlace de invitación'] },
  free: { name: 'Gratis', monthly: 0, annual: 0, photoReads: 10, benefits: ['Perfil público para tu negocio', 'Menú a mano sin límite', '10 lecturas con foto al mes', 'Compartir tu menú', 'Recibir reseñas y responder'] },
  pro: { name: 'Pro', monthly: 99, annual: 990, photoReads: 60, specialNotices: 8, entitlement: 'patio_pro', offering: 'patio_pro', benefits: ['60 lecturas con foto al mes', '8 avisos especiales al mes', 'Ver quién te guarda', 'Platillo destacado'] },
} as const;
export type PaidPlan = 'pro' | 'creator';
export type BillingPeriod = 'monthly' | 'annual';
