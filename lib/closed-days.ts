import AsyncStorage from '@react-native-async-storage/async-storage';

import { localMenuDate } from '@/lib/menu-date';

// Días que el negocio avisó «Hoy no abrimos» (los últimos 60): no cuentan como
// días sin publicar para el aviso de publicar (lib/local-reminders.ts).
const CLOSED_DAYS_KEY = '@patio_closed_days';

export async function getClosedDays(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(CLOSED_DAYS_KEY).catch(() => null);
  let list: unknown = [];
  try { list = raw ? JSON.parse(raw) : []; } catch { list = []; }
  return new Set(Array.isArray(list) ? list.filter((day): day is string => typeof day === 'string') : []);
}

export async function markClosedToday(): Promise<void> {
  const days = [...await getClosedDays(), localMenuDate()];
  await AsyncStorage.setItem(CLOSED_DAYS_KEY, JSON.stringify([...new Set(days)].slice(-60)));
}
