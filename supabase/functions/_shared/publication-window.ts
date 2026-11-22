// ¿Avisar a quienes siguen un lugar que acaba de publicar? (2026-11-21).
// Jev (docs/research/jev-publicar-avisos-2026-11-21.json): si el negocio
// publica cuando ya cerró, 61 % prefiere no avisar (llegarían a un lugar
// cerrado), 30 % que se le pregunte, 9 % avisar igual. El menú queda publicado;
// solo no sale el aviso. Sin dependencias de Deno para probarlo en Node.

/** Día (0 = domingo) y minuto del día en la Ciudad de México. */
export function cdmxNow(now: Date): { weekday: number; minute: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Mexico_City', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? '';
  return {
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday')),
    minute: Number(part('hour')) * 60 + Number(part('minute')),
  };
}

const toMinute = (hhmm: unknown) => {
  const match = typeof hhmm === 'string' ? /^(\d{1,2}):(\d{2})$/.exec(hhmm) : null;
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

// Sin horario: nada de avisos de noche (de 9 pm a 7 am).
const QUIET_FROM = 21 * 60;
const QUIET_UNTIL = 7 * 60;

/** true si todavía tiene sentido avisar a quienes lo siguen. */
export function followersShouldHear(horario: unknown, now: Date): boolean {
  const { weekday, minute } = cdmxNow(now);
  const day = Array.isArray(horario)
    ? horario.find((entry) => entry && typeof entry === 'object' && (entry as { dia?: unknown }).dia === weekday) as
      { cerrado?: unknown; abre?: unknown; cierra?: unknown } | undefined
    : undefined;
  if (!day) return minute >= QUIET_UNTIL && minute < QUIET_FROM;
  if (day.cerrado === true) return false;
  const opens = toMinute(day.abre);
  const closes = toMinute(day.cierra);
  if (opens == null || closes == null) return minute >= QUIET_UNTIL && minute < QUIET_FROM;
  // Turno que cruza la medianoche (abre 20:00, cierra 03:00): hoy sigue abierto.
  if (closes <= opens) return true;
  return minute < closes;
}
