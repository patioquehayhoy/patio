// Reglas del resumen de la mañana («Ayer · 34 personas vieron tu menú»), sin
// dependencias de Deno para probarlas en Node (scripts/tests/business-digest.
// test.cjs). Llega a la hora del aviso de publicar que programa el teléfono:
// una hora antes de abrir, entre 7 y 12, nunca los días que cierra
// (lib/local-reminders.ts, `publishReminderMinute`; las dos copias se
// comparan en la prueba). Antes era a las 18:00 (cambió el 2026-11-21).

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

/** Minuto del aviso de publicar ese día; null si cierra. Copia de lib/local-reminders.ts. */
export function publishReminderMinute(horario: unknown, weekday: number): number | null {
  const day = Array.isArray(horario)
    ? horario.find((entry) => entry && typeof entry === 'object' && (entry as { dia?: unknown }).dia === weekday) as { cerrado?: unknown; abre?: unknown } | undefined
    : undefined;
  if (!day) return 10 * 60;
  if (day.cerrado === true) return null;
  const [h, m] = (typeof day.abre === 'string' ? day.abre : '').split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 10 * 60;
  return Math.min(12 * 60, Math.max(7 * 60, h * 60 + m - 60));
}

/** Hora de la Ciudad de México (0–23). */
export function cdmxHour(now: Date): number {
  return Number(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', hour: '2-digit', hourCycle: 'h23' }).format(now));
}

/** Los negocios cuyo aviso de publicar cae en esta hora (y que abren hoy). */
export function dueThisHour(rows: DigestRow[], now: Date): DigestRow[] {
  const weekday = cdmxWeekday(now);
  const hour = cdmxHour(now);
  return rows.filter((row) => {
    const minute = publishReminderMinute(row.horario_semanal, weekday);
    return minute != null && Math.floor(minute / 60) === hour;
  });
}

/** «Ayer · 34 personas vieron tu menú.» Solo si alguien lo vio. */
export function summaryMessages(rows: DigestRow[]): DigestMessage[] {
  return rows.filter((row) => Number(row.views_today) > 0).map((row) => {
    const views = Number(row.views_today);
    return {
      ownerId: row.owner_id,
      negocioId: row.negocio_id,
      title: 'Ayer',
      body: `${views.toLocaleString('es-MX')} ${views === 1 ? 'persona vio' : 'personas vieron'} tu menú.`,
      // Si hoy aún no publica, tocarlo abre su último menú listo para publicar
      // (llega a la hora del aviso de publicar); si ya publicó, abre Hoy.
      data: row.published_today ? { type: 'daily_summary', route: '/hoy' } : { type: 'publish_reminder' },
    };
  });
}
