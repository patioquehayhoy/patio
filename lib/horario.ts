// Horario semanal de una fondita.
//
// Modelo: 7 días expandidos (dia 0=Domingo … 6=Sábado, alineado con Date.getDay()).
// Se persiste como jsonb en Supabase (columna `horario_semanal`). El concepto
// "base + excepción" vive solo en la UI del editor; aquí el dato es plano para
// que el lado Foodie lo consuma trivialmente.
//
// `abre`/`cierra` son "HH:MM" en 24h. Si `cierra <= abre`, el turno cruza la
// medianoche (ej. abre 20:00, cierra 03:00 → cierra a las 3am del día siguiente).

export type DiaHorario = {
  dia: number;            // 0=Dom … 6=Sáb
  cerrado: boolean;
  abre: string | null;    // "HH:MM" 24h, null si cerrado
  cierra: string | null;  // "HH:MM" 24h, null si cerrado
};

export type HorarioSemanal = DiaHorario[]; // SIEMPRE length 7, ordenado dia 0..6

// Etiquetas para chips del editor, en orden Lun→Dom (más natural para el Fondero),
// pero el dato sigue indexado por Date.getDay() (Dom=0).
export const DIAS_ORDEN_LUNES = [1, 2, 3, 4, 5, 6, 0]; // L M M J V S D
export const DIA_LETRA: Record<number, string> = {
  0: 'D', 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S',
};
export const DIA_CORTO: Record<number, string> = {
  0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb',
};

// ─── Tiempo ──────────────────────────────────────────────────────────────────

/** "HH:MM" 24h → minutos desde medianoche. Devuelve null si no parsea. */
export function hhmmToMin(s: string | null): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Date → "HH:MM" 24h. */
export function dateToHHMM(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

/** "HH:MM" 24h → Date (hoy con esa hora). Para alimentar el DateTimePicker. */
export function hhmmToDate(s: string | null): Date {
  const d = new Date();
  const min = hhmmToMin(s);
  if (min == null) { d.setHours(8, 0, 0, 0); return d; }
  d.setHours(Math.floor(min / 60), min % 60, 0, 0);
  return d;
}

/** "19:00" → "7pm" · "08:30" → "8:30am". Para display. */
export function formatHHMM12(s: string | null): string {
  const min = hhmmToMin(s);
  if (min == null) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return m === 0 ? `${h12}${ampm}` : `${h12}:${m.toString().padStart(2, '0')}${ampm}`;
}

// ─── Construcción / serialización ──────────────────────────────────────────────

/** 7 días iguales con el mismo abre/cierra. */
export function crearHorarioBase(abre: string, cierra: string): HorarioSemanal {
  return Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: false, abre, cierra }));
}

/** Default cuando no hay nada definido: 8am–4pm todos los días. */
export function horarioDefault(): HorarioSemanal {
  return crearHorarioBase('08:00', '16:00');
}

export function serialize(h: HorarioSemanal): DiaHorario[] {
  return h.map(d => ({ dia: d.dia, cerrado: d.cerrado, abre: d.abre, cierra: d.cierra }));
}

/** Valida y normaliza un valor crudo de Supabase. null si inválido. */
export function deserialize(raw: unknown): HorarioSemanal | null {
  if (!Array.isArray(raw) || raw.length !== 7) return null;
  const out: HorarioSemanal = [];
  for (let dia = 0; dia < 7; dia++) {
    const item = raw.find((r: any) => r && r.dia === dia);
    if (!item) return null;
    const cerrado = !!item.cerrado;
    const abre = cerrado ? null : (typeof item.abre === 'string' && hhmmToMin(item.abre) != null ? item.abre : null);
    const cierra = cerrado ? null : (typeof item.cierra === 'string' && hhmmToMin(item.cierra) != null ? item.cierra : null);
    out.push({ dia, cerrado, abre, cierra });
  }
  return out;
}

// ─── Migración del string legacy ───────────────────────────────────────────────

/**
 * Convierte el string viejo ("8am – 7pm", "8am-5pm", "Lun · 9am – 6pm") en un
 * horario base de 7 días iguales. null si no se puede parsear.
 * Reusa la misma heurística de regex que tenía isPatioOpen.
 */
export function migrarStringLegacy(horario: string | null | undefined): HorarioSemanal | null {
  if (!horario) return null;
  const m = horario.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return null;
  const toMin = (h: string, min: string | undefined, period: string | undefined): number => {
    let n = parseInt(h, 10);
    const p = period?.toLowerCase();
    if (p === 'pm' && n !== 12) n += 12;
    if (p === 'am' && n === 12) n = 0;
    return n * 60 + (min ? parseInt(min, 10) : 0);
  };
  const abreMin = toMin(m[1], m[2], m[3] ?? m[6]);
  const cierraMin = toMin(m[4], m[5], m[6]);
  const toHHMM = (mins: number) => `${Math.floor(mins / 60).toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`;
  return crearHorarioBase(toHHMM(abreMin), toHHMM(cierraMin));
}

// ─── "Ahora" en CDMX ───────────────────────────────────────────────────────────

/** Día de semana (0-6) y minutos desde medianoche, en horario CDMX (UTC-6). */
export function ahoraCDMX(now: Date = new Date()): { dia: number; minutos: number } {
  // CDMX = UTC-6 (sin horario de verano desde 2023).
  const cdmxMs = now.getTime() + (now.getTimezoneOffset() - 360) * 60000;
  const d = new Date(cdmxMs);
  return { dia: d.getDay(), minutos: d.getHours() * 60 + d.getMinutes() };
}

// ─── Estado abierto / cerrado ──────────────────────────────────────────────────

/**
 * ¿Está abierto ahora? Soporta cruce de medianoche y día de semana.
 * Devuelve null si no hay datos suficientes para decidir.
 */
export function estaAbiertoAhora(h: HorarioSemanal | null, ahora = ahoraCDMX()): boolean | null {
  if (!h) return null;
  const { dia, minutos } = ahora;
  const hoy = h.find(d => d.dia === dia);
  const ayer = h.find(d => d.dia === (dia + 6) % 7);

  // Turno de hoy.
  if (hoy && !hoy.cerrado) {
    const a = hhmmToMin(hoy.abre);
    const c = hhmmToMin(hoy.cierra);
    if (a != null && c != null) {
      if (c > a) { if (minutos >= a && minutos < c) return true; }     // normal
      else { if (minutos >= a) return true; }                          // cruza medianoche: parte de hoy
    }
  }
  // Madrugada que pertenece al turno de ayer (ayer cruzó medianoche).
  if (ayer && !ayer.cerrado) {
    const a = hhmmToMin(ayer.abre);
    const c = hhmmToMin(ayer.cierra);
    if (a != null && c != null && c <= a && minutos < c) return true;
  }
  return false;
}

/** El día relevante para mostrar "hoy" (su rango abre–cierra). */
export function horarioDeHoy(h: HorarioSemanal | null, ahora = ahoraCDMX()): DiaHorario | null {
  if (!h) return null;
  return h.find(d => d.dia === ahora.dia) ?? null;
}

/** Próxima apertura a partir de ahora: { dia, abre } o null si nunca abre. */
export function proximaApertura(h: HorarioSemanal | null, ahora = ahoraCDMX()): { dia: number; abre: string } | null {
  if (!h) return null;
  for (let i = 0; i < 8; i++) {
    const dia = (ahora.dia + i) % 7;
    const d = h.find(x => x.dia === dia);
    if (!d || d.cerrado || !d.abre) continue;
    const a = hhmmToMin(d.abre);
    if (a == null) continue;
    // Hoy solo cuenta si aún no abre.
    if (i === 0 && ahora.minutos >= a) continue;
    return { dia, abre: d.abre };
  }
  return null;
}

// ─── Resumen en lenguaje natural ───────────────────────────────────────────────

function mismoHorario(a: DiaHorario, b: DiaHorario): boolean {
  return a.cerrado === b.cerrado && a.abre === b.abre && a.cierra === b.cierra;
}

function etiquetaRango(dias: number[]): string {
  // dias viene en orden lunes-first ya filtrado/contiguo.
  if (dias.length === 1) return DIA_CORTO[dias[0]];
  return `${DIA_CORTO[dias[0]]}–${DIA_CORTO[dias[dias.length - 1]]}`;
}

/**
 * Texto natural: "Todos los días 8am–7pm" · "L–V 8am–7pm · S–D hasta 3am" ·
 * "Cerrado". Agrupa días contiguos (en orden lunes-first) con mismo horario.
 */
export function resumenHorario(h: HorarioSemanal | null): string {
  if (!h) return '';
  const orden = DIAS_ORDEN_LUNES;
  const byDia = (dia: number) => h.find(d => d.dia === dia)!;

  // ¿Todos iguales?
  const first = byDia(orden[0]);
  if (orden.every(d => mismoHorario(byDia(d), first))) {
    if (first.cerrado) return 'Cerrado';
    return `Todos los días ${formatHHMM12(first.abre)}–${formatHHMM12(first.cierra)}`;
  }

  // Agrupar contiguos con mismo horario.
  const grupos: number[][] = [];
  for (const dia of orden) {
    const last = grupos[grupos.length - 1];
    if (last && mismoHorario(byDia(dia), byDia(last[0]))) last.push(dia);
    else grupos.push([dia]);
  }

  const partes = grupos.map(g => {
    const d = byDia(g[0]);
    const r = etiquetaRango(g);
    if (d.cerrado) return `${r} cerrado`;
    return `${r} ${formatHHMM12(d.abre)}–${formatHHMM12(d.cierra)}`;
  });
  return partes.join(' · ');
}

/**
 * Igual que resumenHorario pero estructurado en filas { dias, horas } para
 * mostrarlo agrupado (Grouping/Proximity), no como párrafo de corrido.
 * "dias" = etiqueta del rango ("L–V", "Sáb"); "horas" = "8am–7pm" o "Cerrado".
 */
export function resumenHorarioFilas(h: HorarioSemanal | null): { dias: string; horas: string }[] {
  if (!h) return [];
  const orden = DIAS_ORDEN_LUNES;
  const byDia = (dia: number) => h.find(d => d.dia === dia)!;

  const grupos: number[][] = [];
  for (const dia of orden) {
    const last = grupos[grupos.length - 1];
    if (last && mismoHorario(byDia(dia), byDia(last[0]))) last.push(dia);
    else grupos.push([dia]);
  }

  return grupos.map(g => {
    const d = byDia(g[0]);
    return {
      dias: etiquetaRango(g),
      horas: d.cerrado ? 'Cerrado' : `${formatHHMM12(d.abre)}–${formatHHMM12(d.cierra)}`,
    };
  });
}
