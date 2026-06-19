import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// expo-notifications es un MÓDULO NATIVO: no existe en Expo Go, solo en un
// build de desarrollo (eas build / expo run:ios). Por eso se carga de forma
// diferida y con guarda: en Expo Go la app no crashea, solo los avisos no
// se programan hasta que haya build.
const PREF_AVISAR = '@patio_notif_avisar';
const PREF_CERCANAS = '@patio_notif_cercanas';
const DAILY_ID = 'patio-daily-menu-check';

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

export async function getNotifPrefs(): Promise<{ avisar: boolean; cercanas: boolean }> {
  const [a, c] = await Promise.all([
    AsyncStorage.getItem(PREF_AVISAR),
    AsyncStorage.getItem(PREF_CERCANAS),
  ]);
  return { avisar: a === '1', cercanas: c === '1' };
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
      body: 'Tus fonditas guardadas ya publicaron menú. Saaaaaaabes.',
    },
    trigger: {
      type: N.SchedulableTriggerInputTypes.DAILY,
      hour: 13,
      minute: 0,
    },
  });
}

// La PREFERENCIA del usuario (el toggle) se respeta siempre y se guarda, aunque
// el permiso nativo del sistema no esté disponible (Expo Go) o no se conceda.
// Intentamos programar el recordatorio en best-effort, pero NUNCA revertimos el
// toggle por eso — antes el switch "rebotaba" a apagado en simulador.
export async function setAvisar(value: boolean): Promise<boolean> {
  await AsyncStorage.setItem(PREF_AVISAR, value ? '1' : '0');
  if (value) {
    // best-effort: pide permiso y programa, pero no afecta el valor devuelto.
    ensurePermission().then((ok) => { if (ok) scheduleDailyReminder().catch(() => {}); });
  } else {
    const N = getModule();
    if (N) await N.cancelScheduledNotificationAsync(DAILY_ID).catch(() => {});
  }
  return value;
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
