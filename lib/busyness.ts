import { ahoraCDMX, type HorarioSemanal } from './horario';
import { supabase } from './supabase';

// «Qué tan lleno» en la ficha (DECISIONES §17 y §19), como «Popular times» de
// Google: historial de semanas con visitas reales y anónimas, y «Ahora» con
// quien está dentro en este momento. Sin visitas suficientes el servidor no
// devuelve nada y la sección no aparece.

export type BusynessRow = { weekday: number; hour_of_day: number; level: number; present_now: number | null; usual_present: number | string | null };
export type Busyness = {
  weekday: number;
  currentHour: number;
  hours: { hour: number; level: number }[];
  peak: { from: number; to: number } | null;
  live: 'more' | 'less' | 'usual' | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];

function hourParts(hhmm: string | null | undefined): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? '');
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

export function shapeBusyness(rows: BusynessRow[], now = new Date(), weeklyHours?: HorarioSemanal | null): Busyness | null {
  const { dia, minutos } = ahoraCDMX(now);
  const currentHour = Math.floor(minutos / 60);
  const today = rows.filter((row) => row.weekday === dia && row.level > 0);
  if (!today.length) return null;

  // Barras dentro del horario de hoy; sin horario, de la primera a la última hora con visitas.
  let from = Math.min(...today.map((row) => row.hour_of_day));
  let to = Math.max(...today.map((row) => row.hour_of_day));
  const day = weeklyHours?.find((item) => item.dia === dia);
  const opens = day && !day.cerrado ? hourParts(day.abre) : null;
  const closes = day && !day.cerrado ? hourParts(day.cierra) : null;
  // Abre 13:30 → la barra de la 1; cierra 17:15 → la última barra es la de las 5.
  const lastHour = closes ? closes.hour - (closes.minute === 0 ? 1 : 0) : null;
  if (opens && lastHour != null && lastHour >= opens.hour) { from = opens.hour; to = lastHour; }
  const levels = new Map(today.map((row) => [row.hour_of_day, row.level]));
  const hours = Array.from({ length: to - from + 1 }, (_, index) => ({ hour: from + index, level: levels.get(from + index) ?? 0 }));

  const top = today.reduce((best, row) => (row.level > best.level ? row : best));
  // El servidor solo manda present_now si hay suficientes personas dentro.
  const current = rows.find((row) => row.present_now != null);
  let live: Busyness['live'] = null;
  if (current && current.weekday === dia && current.hour_of_day === currentHour) {
    const usual = Number(current.usual_present ?? 0);
    const ratio = usual > 0 ? (current.present_now ?? 0) / usual : Infinity;
    live = ratio >= 1.3 ? 'more' : ratio <= 0.7 ? 'less' : 'usual';
  }
  return { weekday: dia, currentHour, hours, peak: { from: top.hour_of_day, to: top.hour_of_day + 1 }, live };
}

export async function getPlaceBusyness(id: string, weeklyHours?: HorarioSemanal | null): Promise<Busyness | null> {
  // Lugares de prueba en desarrollo: datos sintéticos para ver la sección.
  if (typeof __DEV__ !== 'undefined' && __DEV__ && id.startsWith('demo-')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { demoBusynessRows } = require('./demo') as typeof import('./demo');
    return shapeBusyness(demoBusynessRows(id), new Date(), weeklyHours);
  }
  if (!UUID.test(id)) return null;
  const { data, error } = await supabase.rpc('place_busyness', { target: id });
  if (error || !Array.isArray(data)) return null;
  return shapeBusyness(data as BusynessRow[], new Date(), weeklyHours);
}

const h12 = (hour: number) => (hour % 12 === 0 ? 12 : hour % 12);
const meridiem = (hour: number) => (hour % 24 < 12 ? 'am' : 'pm');

/** «2 pm», «12 pm» — eje de la gráfica sin el sufijo, como Google. */
export function axisHour(hour: number): string {
  return String(h12(hour));
}

export function peakLabel(busyness: Busyness): string | null {
  if (!busyness.peak) return null;
  const { from, to } = busyness.peak;
  const range = meridiem(from) === meridiem(to)
    ? `${h12(from)} a ${h12(to)} ${meridiem(to)}`
    : `${h12(from)} ${meridiem(from)} a ${h12(to)} ${meridiem(to)}`;
  return `Los ${DAY_PLURAL[busyness.weekday]} suele llenarse de ${range}`;
}

export function liveLabel(busyness: Busyness): string | null {
  if (busyness.live === 'more') return 'Ahora: más lleno de lo normal';
  if (busyness.live === 'less') return 'Ahora: menos lleno de lo normal';
  if (busyness.live === 'usual') return 'Ahora: como de costumbre';
  return null;
}
