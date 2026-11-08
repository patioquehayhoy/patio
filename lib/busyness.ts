import { ahoraCDMX, type HorarioSemanal } from './horario';
import { supabase } from './supabase';

// «Qué tan lleno» en la ficha (DECISIONES §17). Sale de visitas reales y
// anónimas; el servidor no devuelve nada con menos de 30 visitas en 8 semanas,
// y entonces la sección no aparece.

export type BusynessRow = { weekday: number; hour_of_day: number; level: number; recent_visits: number | null; usual_visits: number | string | null };
export type Busyness = {
  weekday: number;
  currentHour: number;
  hours: { hour: number; level: number }[];
  peak: { from: number; to: number } | null;
  live: 'more' | 'less' | 'usual' | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY_PLURAL = ['domingos', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados'];
const MIN_RECENT = 3;

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
  const current = rows.find((row) => row.recent_visits != null);
  let live: Busyness['live'] = null;
  const usual = Number(current?.usual_visits ?? 0);
  if (current && current.weekday === dia && current.hour_of_day === currentHour && (current.recent_visits ?? 0) >= MIN_RECENT && usual > 0) {
    const ratio = (current.recent_visits ?? 0) / usual;
    live = ratio >= 1.3 ? 'more' : ratio <= 0.7 ? 'less' : 'usual';
  }
  return { weekday: dia, currentHour, hours, peak: { from: top.hour_of_day, to: top.hour_of_day + 1 }, live };
}

export async function getPlaceBusyness(id: string, weeklyHours?: HorarioSemanal | null): Promise<Busyness | null> {
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
