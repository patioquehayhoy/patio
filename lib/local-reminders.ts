import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { requestSystemNotificationPermission } from '@/lib/community-notifications';
import { cancelScheduledReminders, REMINDER_STORAGE_KEYS } from '@/lib/reminder-cleanup';

// Recordatorios que programa el propio teléfono: funcionan sin cuenta y sin
// servidor. «Publicar» avisa al negocio a las 10 solo los días que aún no
// publica; «Hora de comer» recuerda al Foodie a la 1 qué hay hoy.
export type ReminderKind = 'publish' | 'lunch';

const STORAGE_KEY: Record<ReminderKind, string> = {
  publish: REMINDER_STORAGE_KEYS[0],
  lunch: REMINDER_STORAGE_KEYS[1],
};
const PUBLISH_HOUR = 10;
const LUNCH_HOUR = 13;
const PUBLISH_DAYS_AHEAD = 7;

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
    content: { title: '¿Qué hay hoy?', body: 'Saaaaaaabes.' },
    trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour: LUNCH_HOUR, minute: 0, channelId: 'default' },
  });
}

/** Reprograma la semana: se salta hoy si ya se publicó o si ya pasó la hora. */
export async function syncPublishReminder(publishedToday: boolean) {
  const N = notifications();
  if (!N) return;
  await cancelScheduledReminders(['publish-reminder']);
  if (!await getReminder('publish')) return;
  const now = new Date();
  for (let day = 0; day < PUBLISH_DAYS_AHEAD; day++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + day, PUBLISH_HOUR, 0, 0);
    if (day === 0 && (publishedToday || date <= now)) continue;
    await N.scheduleNotificationAsync({
      identifier: `publish-reminder-${day}`,
      content: { title: '¿Ya publicaste lo de hoy?', body: 'Toma la foto de tu menú y queda publicado en un minuto.' },
      trigger: { type: N.SchedulableTriggerInputTypes.DATE, date, channelId: 'default' },
    });
  }
}
