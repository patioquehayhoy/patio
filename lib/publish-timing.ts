import type { HorarioSemanal } from './horario';
import { localMenuDate } from './menu-date';

// Cuándo se publica (2026-11-21), sin dependencias nativas para probarlo en
// Node. Lo usan el aviso «¿Ya publicaste lo de hoy?» (lib/local-reminders.ts),
// el menú programado («Mañana a las 9 am», components/menu-composer.tsx) y,
// copiada, el resumen del servidor (supabase/functions/_shared/digest.ts; una
// prueba compara las dos).

const PUBLISH_HOUR = 10;
// Una hora antes de abrir (un lugar de desayunos no espera a las 10), nunca
// antes de las 7 ni después de las 12. Números de Patio.
export const PUBLISH_LEAD_MIN = 60;
export const PUBLISH_EARLIEST_MIN = 7 * 60;
export const PUBLISH_LATEST_MIN = 12 * 60;
// Sin horario, después de las 6 de la tarde ya pasó el servicio del día.
const EVENING_MIN = 18 * 60;
const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const toMinute = (hhmm: string | null | undefined) => {
  const [h, m] = (hhmm ?? '').split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};

/** A qué hora avisar (y publicar lo programado) ese día; null si ese día cierra. */
export function publishReminderMinute(horario: HorarioSemanal | null, weekday: number): number | null {
  const day = horario?.find((entry) => entry.dia === weekday);
  if (!day) return PUBLISH_HOUR * 60;
  if (day.cerrado) return null;
  const opens = toMinute(day.abre);
  if (opens == null) return PUBLISH_HOUR * 60;
  return Math.min(PUBLISH_LATEST_MIN, Math.max(PUBLISH_EARLIEST_MIN, opens - PUBLISH_LEAD_MIN));
}

/**
 * ¿Ya pasó el servicio de hoy? Hoy cierra, o ya es después de su hora de
 * cerrar (sin horario, después de las 6 pm). Un turno que cruza la medianoche
 * (abre 20:00, cierra 03:00) nunca «ya pasó» de día: lo de hoy es para la noche.
 */
export function isAfterService(horario: HorarioSemanal | null, now = new Date()): boolean {
  const minute = now.getHours() * 60 + now.getMinutes();
  const day = horario?.find((entry) => entry.dia === now.getDay());
  if (!day) return minute >= EVENING_MIN;
  if (day.cerrado) return true;
  const opens = toMinute(day.abre);
  const closes = toMinute(day.cierra);
  if (opens == null || closes == null) return minute >= EVENING_MIN;
  if (closes <= opens) return false;
  return minute >= closes;
}

/** «9 am», «8:30 am», «1 pm». */
export function hourLabel(minute: number): string {
  const hours = Math.floor(minute / 60);
  const minutes = minute % 60;
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''} ${hours < 12 ? 'am' : 'pm'}`;
}

/** «a las 9 am» · «a la 1 pm». */
export function atHour(minute: number): string {
  const label = hourLabel(minute);
  return `${label.startsWith('1 ') || label.startsWith('1:') ? 'a la' : 'a las'} ${label}`;
}

export type PublishSlot = { fecha: string; at: Date; label: string };

/**
 * El siguiente día que abre, a la hora del aviso (una hora antes de abrir):
 * «Mañana a las 9 am» o, si mañana cierra, «El lunes a las 9 am».
 */
export function nextPublishSlot(horario: HorarioSemanal | null, now = new Date()): PublishSlot {
  for (let ahead = 1; ahead <= 7; ahead++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead);
    const minute = publishReminderMinute(horario, day.getDay());
    if (minute == null) continue;
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minute / 60), minute % 60, 0);
    const when = ahead === 1 ? 'Mañana' : `El ${WEEKDAYS[day.getDay()]}`;
    return { fecha: localMenuDate(at), at, label: `${when} ${atHour(minute)}` };
  }
  // Un horario sin días abiertos: mañana a las 10.
  const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, PUBLISH_HOUR, 0, 0);
  return { fecha: localMenuDate(at), at, label: `Mañana ${atHour(PUBLISH_HOUR * 60)}` };
}

/**
 * Los siguientes días que abre (hasta `count`, dentro de una semana), cada uno
 * a la hora del aviso: para dejar listo el menú de la semana un lunes.
 */
export function nextPublishSlots(horario: HorarioSemanal | null, now = new Date(), count = 5): PublishSlot[] {
  const slots: PublishSlot[] = [];
  for (let ahead = 1; ahead <= 7 && slots.length < count; ahead++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead);
    const minute = publishReminderMinute(horario, day.getDay());
    if (minute == null) continue;
    const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), Math.floor(minute / 60), minute % 60, 0);
    const when = ahead === 1 ? 'Mañana' : `El ${WEEKDAYS[day.getDay()]}`;
    slots.push({ fecha: localMenuDate(at), at, label: `${when} ${atHour(minute)}` });
  }
  return slots.length ? slots : [nextPublishSlot(horario, now)];
}

/** «Mañana a las 9 am» para un menú ya programado (en Menús y al confirmar). */
export function scheduledLabel(publishAt: string, now = new Date()): string {
  const at = new Date(publishAt);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = new Date(at.getFullYear(), at.getMonth(), at.getDate());
  const ahead = Math.round((day.getTime() - today.getTime()) / 86_400_000);
  const when = ahead <= 0 ? 'Hoy' : ahead === 1 ? 'Mañana' : `El ${WEEKDAYS[at.getDay()]}`;
  return `${when} ${atHour(at.getHours() * 60 + at.getMinutes())}`;
}
