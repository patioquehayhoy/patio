import AsyncStorage from '@react-native-async-storage/async-storage';

import { supabase } from '@/lib/supabase';
import { cdmxDay, deviceDay } from '@/lib/visits';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SENT_KEY = '@patio_views_sent';

/**
 * Cuenta que alguien vio la ficha (para «Hoy» y el resumen de las 18:00):
 * una vez por teléfono, lugar y día, sin nombre (migración 20261109110000).
 * El dueño no se cuenta. De mejor esfuerzo: nunca detiene la ficha.
 */
export async function recordPatioView(negocioId: string): Promise<void> {
  if (!UUID.test(negocioId)) return;
  const now = Date.now();
  const day = cdmxDay(now);
  try {
    const raw = await AsyncStorage.getItem(SENT_KEY);
    const sent = raw ? JSON.parse(raw) as { day?: string; ids?: string[] } : null;
    const ids = sent?.day === day && Array.isArray(sent.ids) ? sent.ids : [];
    if (ids.includes(negocioId)) return;
    const { error } = await supabase.rpc('record_patio_view', { p_negocio: negocioId, p_device_day: await deviceDay(now) });
    if (error) return;
    await AsyncStorage.setItem(SENT_KEY, JSON.stringify({ day, ids: [...ids, negocioId].slice(-300) }));
  } catch {
    // Sin red o sin la migración todavía: la vista simplemente no se cuenta.
  }
}
