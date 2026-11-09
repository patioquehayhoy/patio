import { supabase } from '@/lib/supabase';

// Avisos de operación (gratis, v4 §4): el dueño elige qué pasa hoy y, si hace
// falta, la hora; el servidor arma el mismo texto (supabase/functions/_shared/
// operation-notice.ts; una prueba compara las dos copias).
export type OperationKind = 'late' | 'early' | 'closed' | 'soldout';

export const OPERATION_OPTIONS: { kind: OperationKind; label: string; needsTime: boolean; defaultTime?: string }[] = [
  { kind: 'late', label: 'Abrimos tarde', needsTime: true, defaultTime: '20:00' },
  { kind: 'early', label: 'Cerramos temprano', needsTime: true, defaultTime: '16:00' },
  { kind: 'closed', label: 'Hoy no abrimos', needsTime: false },
  { kind: 'soldout', label: 'Se acabó', needsTime: false },
];

/** «20:00» → «8 pm»; «08:30» → «8:30 am»; «13:00» → «1 pm». */
export function operationHourLabel(hhmm: string): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const meridiem = hours < 12 ? 'am' : 'pm';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}${minutes ? `:${String(minutes).padStart(2, '0')}` : ''} ${meridiem}`;
}

/** «Hoy abrimos a las 8 pm.» — «a la 1 pm» en singular. null si falta la hora. */
export function operationNoticeText(kind: OperationKind, time?: string | null): string | null {
  if (kind === 'closed') return 'Hoy no abrimos.';
  if (kind === 'soldout') return 'Se acabó lo de hoy.';
  const hour = time ? operationHourLabel(time) : null;
  if (!hour) return null;
  const article = hour.startsWith('1 ') || hour.startsWith('1:') ? 'a la' : 'a las';
  return kind === 'late' ? `Hoy abrimos ${article} ${hour}.` : `Hoy cerramos ${article} ${hour}.`;
}

export function timeFromDate(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function dateFromTime(hhmm: string): Date {
  const [hours, minutes] = hhmm.split(':').map(Number);
  const date = new Date();
  date.setHours(hours || 0, minutes || 0, 0, 0);
  return date;
}

export async function sendOperationNotice(negocioId: string, kind: OperationKind, time: string | null): Promise<{ delivered: number }> {
  const { data, error } = await supabase.functions.invoke('send-operation-notice', { body: { fonditaId: negocioId, kind, time } });
  if (!error) return { delivered: Number((data as { delivered?: unknown } | null)?.delivered ?? 0) };
  const context = 'context' in error ? (error as { context?: unknown }).context : null;
  if (context instanceof Response && [400, 403, 429].includes(context.status)) {
    const body = await context.clone().json().catch(() => null);
    if (typeof body?.error === 'string' && body.error.trim() && context.status !== 403) throw new Error(body.error.slice(0, 200));
  }
  throw new Error('No pudimos enviar el aviso. Inténtalo de nuevo.');
}
