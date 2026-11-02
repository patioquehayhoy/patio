// Como Instagram: dos cambios de nombre cada 14 días, para negocios y para
// personas. El servidor aplica la regla; esto solo calcula qué decir antes.
export const NAME_CHANGE_LIMIT = 2;
export const NAME_CHANGE_WINDOW_DAYS = 14;

/** Fecha desde la que se puede volver a cambiar, o null si hoy se puede. */
export function nameLockEnd(changedAt: string[], now = Date.now()): Date | null {
  const windowMs = NAME_CHANGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const recent = changedAt
    .map((value) => new Date(value).getTime())
    .filter((time) => Number.isFinite(time) && now - time < windowMs)
    .sort((a, b) => b - a);
  if (recent.length < NAME_CHANGE_LIMIT) return null;
  return new Date(recent[NAME_CHANGE_LIMIT - 1] + windowMs);
}
