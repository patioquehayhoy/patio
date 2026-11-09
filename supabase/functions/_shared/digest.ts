// Reglas del resumen de las 18:00, sin dependencias de Deno para probarlas en
// Node (scripts/tests/business-digest.test.cjs). El recordatorio para publicar
// de las 10:00 lo programa el teléfono (avisos.tsx, «Publicar el menú»).

export type DigestRow = {
  negocio_id: string;
  owner_id: string;
  nombre: string | null;
  views_today: number;
  published_today: boolean;
  active_month: boolean;
  horario_semanal: unknown;
};

export type DigestMessage = { ownerId: string; negocioId: string; title: string; body: string; data: Record<string, string> };

/** Día de la semana en la Ciudad de México (0 = domingo). */
export function cdmxWeekday(now: Date): number {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', weekday: 'short' }).format(now);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(weekday);
}

/** Abre hoy según su horario semanal; sin horario se asume que sí. */
export function opensToday(horario: unknown, weekday: number): boolean {
  if (!Array.isArray(horario) || !horario.length) return true;
  const day = horario.find((entry) => entry && typeof entry === 'object' && (entry as { dia?: unknown }).dia === weekday) as { cerrado?: unknown } | undefined;
  return day ? day.cerrado !== true : true;
}

/** «Hoy · 34 personas vieron tu menú.» Solo si alguien lo vio. */
export function summaryMessages(rows: DigestRow[]): DigestMessage[] {
  return rows.filter((row) => Number(row.views_today) > 0).map((row) => {
    const views = Number(row.views_today);
    return {
      ownerId: row.owner_id,
      negocioId: row.negocio_id,
      title: 'Hoy',
      body: `${views.toLocaleString('es-MX')} ${views === 1 ? 'persona vio' : 'personas vieron'} tu menú.`,
      data: { type: 'daily_summary', route: '/hoy' },
    };
  });
}
