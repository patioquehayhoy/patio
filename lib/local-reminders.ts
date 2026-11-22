import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { requestSystemNotificationPermission } from '@/lib/community-notifications';
import type { HorarioSemanal } from '@/lib/horario';
import { localMenuDate } from '@/lib/menu-date';
import { publishReminderMinute } from '@/lib/publish-timing';
import { getLocalMenus } from '@/lib/menu-history';
import { getFonditaHorarioSemanal } from '@/lib/menu-store';
import { getClosedDays } from '@/lib/closed-days';
import { cancelScheduledReminders, REMINDER_STORAGE_KEYS } from '@/lib/reminder-cleanup';

// Recordatorios que programa el propio teléfono: funcionan sin cuenta y sin
// servidor. «Publicar» avisa al negocio a las 10 solo los días que aún no
// publica; «Hora de comer» recuerda al Foodie a la 1 qué hay hoy.
export type ReminderKind = 'publish' | 'lunch';

const STORAGE_KEY: Record<ReminderKind, string> = {
  publish: REMINDER_STORAGE_KEYS[0],
  lunch: REMINDER_STORAGE_KEYS[1],
};
// La hora del aviso (una hora antes de abrir) vive en lib/publish-timing.ts:
// la comparten el aviso, el menú programado y el resumen del servidor.
export { publishReminderMinute };
const LUNCH_HOUR = 13;
// Se programa hasta 3 semanas (los avisos semanales caben; iOS guarda 64).
const PUBLISH_DAYS_AHEAD = 21;
// Jev (docs/research/jev-publicar-avisos-2026-11-21.json): tras 3 días que
// abres sin publicar, el aviso deja de ser diario (pausa 53 %, semanal 45 %,
// seguir diario 3 %). Pregunta una vez y luego avisa una vez por semana;
// publicar otra vez lo regresa a diario.
const MISSED_BEFORE_PAUSE = 3;
const WEEK_DAYS = 7;
// Desde cuándo cuentan los días sin publicar: no se castiga lo de antes de
// prender el aviso ni lo de antes de «Avísame a diario».
const PUBLISH_SINCE_KEY = '@patio_publish_reminder_since';
// Botones del aviso (categorías de iOS/Android).
export const PUBLISH_CATEGORY = 'publish-reminder';
export const PUBLISH_ASK_CATEGORY = 'publish-reminder-ask';
export const ACTION_CLOSED_TODAY = 'closed-today';
export const ACTION_DAILY_AGAIN = 'daily-again';

export type PlannedReminder = { date: Date; kind: 'daily' | 'ask' | 'weekly' };

const dayKey = (date: Date) => localMenuDate(date);
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

/**
 * Qué avisos programar (puro, para probarlo): diarios mientras lleve menos de
 * 3 días que abre sin publicar; al llegar a 3, uno que pregunta y después uno
 * por semana. Supone que los días que vienen no publica (si publica, se
 * vuelve a programar).
 */
export function planPublishReminders({ now, horario, published, publishedToday, since, closed = new Set() }: {
  now: Date;
  horario: HorarioSemanal | null;
  /** Fechas publicadas («2026-11-21»). */
  published: Set<string>;
  publishedToday: boolean;
  /** Desde qué día cuentan los días sin publicar. */
  since: Date;
  /** Días que avisó «Hoy no abrimos»: no cuentan como días sin publicar. */
  closed?: Set<string>;
}): PlannedReminder[] {
  const opens = (date: Date) => publishReminderMinute(horario, date.getDay()) != null && !closed.has(dayKey(date));
  // Hoy cuenta como publicado también si ya está en la lista (un menú programado para hoy).
  const doneToday = publishedToday || published.has(dayKey(now));
  const start = new Date(since.getFullYear(), since.getMonth(), since.getDate());
  let missed = 0;
  for (let back = 1; back <= 30; back++) {
    const day = addDays(now, -back);
    if (day < start) break;
    if (published.has(dayKey(day))) break;
    if (opens(day)) missed += 1;
  }
  const plan: PlannedReminder[] = [];
  let nextWeekly: Date | null = null;
  for (let ahead = 0; ahead < PUBLISH_DAYS_AHEAD; ahead++) {
    const base = addDays(now, ahead);
    const minute = publishReminderMinute(horario, base.getDay());
    if (minute == null || closed.has(dayKey(base))) continue;
    // Un día que ya tiene menú (lo dejó programado) no lleva aviso y cuenta como publicado.
    if (ahead > 0 && published.has(dayKey(base))) { missed = 0; continue; }
    const date = new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(minute / 60), minute % 60, 0);
    if (ahead === 0 && (doneToday || date <= now)) {
      // Hoy ya no hay aviso, pero si hoy no publica también cuenta.
      if (!doneToday && date <= now) missed += 1;
      continue;
    }
    if (missed < MISSED_BEFORE_PAUSE) {
      plan.push({ date, kind: 'daily' });
      missed += 1;
    } else if (!nextWeekly) {
      plan.push({ date, kind: 'ask' });
      nextWeekly = addDays(base, WEEK_DAYS);
    } else if (base >= nextWeekly) {
      plan.push({ date, kind: 'weekly' });
      nextWeekly = addDays(base, WEEK_DAYS);
    }
  }
  return plan;
}

async function publishSince(): Promise<Date> {
  const raw = await AsyncStorage.getItem(PUBLISH_SINCE_KEY).catch(() => null);
  const parsed = raw ? new Date(raw) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed;
  // Quien ya lo tenía prendido empieza a contar hoy.
  const now = new Date();
  await AsyncStorage.setItem(PUBLISH_SINCE_KEY, now.toISOString()).catch(() => {});
  return now;
}

/** «Avísame a diario» (o prenderlo): los días sin publicar empiezan a contar hoy. */
export async function resumeDailyPublishReminder(publishedToday = false) {
  await AsyncStorage.setItem(PUBLISH_SINCE_KEY, new Date().toISOString()).catch(() => {});
  await syncPublishReminder(publishedToday);
}

/** Los botones de los avisos de publicar. Se registran al abrir la app. */
export async function registerReminderCategories() {
  const N = notifications();
  if (!N) return;
  await N.setNotificationCategoryAsync(PUBLISH_CATEGORY, [
    { identifier: ACTION_CLOSED_TODAY, buttonTitle: 'Hoy no abro', options: { opensAppToForeground: true } },
  ]).catch(() => {});
  await N.setNotificationCategoryAsync(PUBLISH_ASK_CATEGORY, [
    { identifier: ACTION_DAILY_AGAIN, buttonTitle: 'Avísame a diario', options: { opensAppToForeground: true } },
    { identifier: ACTION_CLOSED_TODAY, buttonTitle: 'Hoy no abro', options: { opensAppToForeground: true } },
  ]).catch(() => {});
}

function notifications(): typeof import('expo-notifications') | null {
  if (Platform.OS === 'web') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('expo-notifications') as typeof import('expo-notifications');
  } catch {
    return null;
  }
}

export async function getReminder(kind: ReminderKind): Promise<boolean> {
  return (await AsyncStorage.getItem(STORAGE_KEY[kind]).catch(() => null)) === '1';
}


/** Devuelve false si el teléfono no dio permiso; en ese caso queda apagado. */
export async function setReminder(kind: ReminderKind, enabled: boolean, publishedToday = false): Promise<boolean> {
  if (enabled && !await requestSystemNotificationPermission()) return false;
  await AsyncStorage.setItem(STORAGE_KEY[kind], enabled ? '1' : '0');
  if (kind === 'publish' && enabled) await AsyncStorage.setItem(PUBLISH_SINCE_KEY, new Date().toISOString()).catch(() => {});
  if (kind === 'publish') await syncPublishReminder(publishedToday);
  else await syncLunchReminder();
  return true;
}

async function syncLunchReminder() {
  const N = notifications();
  if (!N) return;
  await cancelScheduledReminders(['lunch-reminder']);
  if (!await getReminder('lunch')) return;
  await N.scheduleNotificationAsync({
    identifier: 'lunch-reminder',
    content: { title: '¿Qué hay hoy?', body: 'Saaaaaaabes.', data: { route: '/explorar' } },
    trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: LUNCH_HOUR, minute: 0, channelId: 'default' },
  });
}

const REMINDER_COPY: Record<PlannedReminder['kind'], { title: string; body: string; categoryIdentifier: string }> = {
  // Abre el editor con tu último menú: cambias lo que no hay y publicas.
  daily: { title: '¿Ya publicaste lo de hoy?', body: 'Tu último menú ya está listo: cambia lo que no hay y publica.', categoryIdentifier: PUBLISH_CATEGORY },
  ask: { title: '¿Te seguimos avisando a diario?', body: 'Llevas unos días sin publicar. Desde hoy te avisamos una vez por semana.', categoryIdentifier: PUBLISH_ASK_CATEGORY },
  weekly: { title: '¿Ya publicaste lo de hoy?', body: 'Tu último menú ya está listo: cambia lo que no hay y publica.', categoryIdentifier: PUBLISH_ASK_CATEGORY },
};

/**
 * Reprograma los avisos de publicar: solo los días que abres, una hora antes
 * de abrir, se salta hoy si ya publicaste, y tras 3 días sin publicar pasa a
 * uno por semana (`planPublishReminders`).
 */
export async function syncPublishReminder(publishedToday: boolean) {
  const N = notifications();
  if (!N) return;
  await cancelScheduledReminders(['publish-reminder']);
  if (!await getReminder('publish')) return;
  const menus = await getLocalMenus().catch(() => []);
  const plan = planPublishReminders({
    now: new Date(),
    horario: getFonditaHorarioSemanal(),
    published: new Set(menus.filter((menu) => menu.published).map((menu) => menu.fecha)),
    publishedToday,
    since: await publishSince(),
    closed: await getClosedDays().catch(() => new Set<string>()),
  });
  for (const [index, item] of plan.entries()) {
    const copy = REMINDER_COPY[item.kind];
    await N.scheduleNotificationAsync({
      identifier: `publish-reminder-${index}`,
      content: { title: copy.title, body: copy.body, categoryIdentifier: copy.categoryIdentifier, data: { type: 'publish_reminder' } },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: item.date, channelId: 'default' },
    });
  }
}
