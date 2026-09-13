// El lanzamiento opera en CDMX. Cliente y servidor comparten el día del
// negocio aunque el teléfono viaje o UTC ya haya cambiado de fecha.
export const MENU_TIME_ZONE = 'America/Mexico_City';

export function localMenuDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: MENU_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
