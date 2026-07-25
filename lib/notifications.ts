import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// expo-notifications es un MÓDULO NATIVO: no existe en Expo Go, solo en un
// build de desarrollo (eas build / expo run:ios). Por eso se carga de forma
// diferida y con guarda: en Expo Go la app no crashea, solo los avisos no
// se programan hasta que haya build.
const PREF_AVISAR = '@patio_notif_avisar';
const PREF_CERCANAS = '@patio_notif_cercanas';
const PREF_FONDERO = '@patio_notif_fondero';
const DAILY_ID = 'patio-daily-menu-check';
const FONDERO_DAILY_ID = 'patio-fondero-daily-menu';

type NotifModule = typeof import('expo-notifications');
let Notifications: NotifModule | null | undefined;

function getModule(): NotifModule | null {
  if (Notifications !== undefined) return Notifications ?? null;
  try {
    Notifications = require('expo-notifications') as NotifModule;
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch {
    Notifications = null; // no disponible (Expo Go)
  }
  return Notifications;
}

export async function getNotifPrefs(): Promise<{ avisar: boolean; cercanas: boolean; fondero: boolean }> {
  const [a, c, f] = await Promise.all([
    AsyncStorage.getItem(PREF_AVISAR),
    AsyncStorage.getItem(PREF_CERCANAS),
    AsyncStorage.getItem(PREF_FONDERO),
  ]);
  return { avisar: a === '1', cercanas: c === '1', fondero: f === '1' };
}

async function ensurePermission(): Promise<boolean> {
  const N = getModule();
  if (!N) return false;
  const current = await N.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const req = await N.requestPermissionsAsync();
  return req.granted;
}

// Recordatorio diario LOCAL a las 13:00 para revisar qué hay hoy. No requiere
// servidor (notificación local programada en el dispositivo).
async function scheduleDailyReminder() {
  const N = getModule();
  if (!N) return;
  await N.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  await N.scheduleNotificationAsync({
    identifier: DAILY_ID,
    content: {
      title: '¿Qué hay hoy?',
      body: 'Revisa tus lugares guardados. Saaaaaaabes.',
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour: 13,
      minute: 0,
    },
  });
}

// La preferencia nunca puede afirmar que los avisos están activos si el sistema
// no concedió permiso. Esto mantiene alineados la UI, Ajustes y el estado real.
export async function setAvisar(value: boolean): Promise<boolean> {
  if (value) {
    const granted = await ensurePermission();
    await AsyncStorage.setItem(PREF_AVISAR, granted ? '1' : '0');
    if (granted) await scheduleDailyReminder().catch(() => {});
    return granted;
  }

  await AsyncStorage.setItem(PREF_AVISAR, '0');
  const N = getModule();
  if (N) await N.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  return false;
}

export async function setCercanas(value: boolean): Promise<boolean> {
  // Geofencing real es siguiente nivel. Por ahora guarda la preferencia siempre
  // y pide permiso en best-effort, sin revertir el toggle.
  await AsyncStorage.setItem(PREF_CERCANAS, value ? '1' : '0');
  if (value && Platform.OS === 'ios') {
    ensurePermission().catch(() => {});
  }
  return value;
}

export async function setFonderoAvisos(value: boolean): Promise<boolean> {
  if (value) {
    const granted = await ensurePermission();
    await AsyncStorage.setItem(PREF_FONDERO, granted ? '1' : '0');
    if (granted) {
      const N = getModule();
      if (N) {
        await N.cancelScheduledNotificationAsync(FONDERO_DAILY_ID).catch(() => {});
        await N.scheduleNotificationAsync({
          identifier: FONDERO_DAILY_ID,
          content: {
            title: 'Tu Patio está listo',
            body: 'Publica o actualiza lo que vendes hoy.',
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.DAILY,
            hour: 10,
            minute: 0,
          },
        }).catch(() => {});
      }
    }
    return granted;
  }

  await AsyncStorage.setItem(PREF_FONDERO, '0');
  const N = getModule();
  if (N) await N.cancelScheduledNotificationAsync(FONDERO_DAILY_ID).catch(() => {});
  return false;
}
