// Texto de los avisos de operación (gratis). Lo arma el servidor; la app tiene
// una copia idéntica para la vista previa (lib/operation-notice.ts, con prueba
// que compara las dos). Sin dependencias de Deno para poder probarlo en Node.

// 'fresh' (2026-11-21): «Recién salido: Bolillo.» para lo que sale por tandas.
export const OPERATION_KINDS = ['late', 'early', 'closed', 'soldout', 'fresh'] as const;
export type OperationKind = typeof OPERATION_KINDS[number];

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


/** Nombre de platillo para «Recién salido»: una línea, sin punto final, hasta 60 letras. */
export function freshDishName(dish?: string | null): string | null {
  const clean = (dish ?? '').replace(/\s+/g, ' ').trim().replace(/[.。]+$/, '').slice(0, 60).trim();
  return clean || null;
}

/** «Hoy abrimos a las 8 pm.» — «a la 1 pm» en singular. null si falta la hora (o el platillo). */
export function operationNoticeText(kind: OperationKind, time?: string | null, dish?: string | null): string | null {
  if (kind === 'closed') return 'Hoy no abrimos.';
  if (kind === 'soldout') return 'Se acabó lo de hoy.';
  if (kind === 'fresh') {
    const name = freshDishName(dish);
    return name ? `Recién salido: ${name}.` : null;
  }
  const hour = time ? operationHourLabel(time) : null;
  if (!hour) return null;
  const article = hour.startsWith('1 ') || hour.startsWith('1:') ? 'a la' : 'a las';
  return kind === 'late' ? `Hoy abrimos ${article} ${hour}.` : `Hoy cerramos ${article} ${hour}.`;
}
