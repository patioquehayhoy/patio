import type { requireUser } from './auth.ts';

type Admin = Awaited<ReturnType<typeof requireUser>>['admin'];
type Device = { id: string; user_id: string; expo_push_token: string };
type Message = { title: string; body: string; data: Record<string, string> };
type ExpoTicket = { status: 'ok' | 'error'; details?: { error?: string } };

/** Active devices of these users, optionally narrowed by a preference column. */
export async function pushTargets(admin: Admin, userIds: string[], preference?: string, preferenceDefault = true): Promise<Device[]> {
  if (!userIds.length) return [];
  const { data: devices, error } = await admin.from('push_devices')
    .select('id,user_id,expo_push_token').in('user_id', userIds).eq('active', true);
  if (error) throw error;
  if (!preference) return devices ?? [];
  const { data: prefs, error: prefsError } = await admin.from('notification_preferences')
    .select(`user_id,${preference}`).in('user_id', userIds);
  if (prefsError) throw prefsError;
  const chosen = new Map((prefs ?? []).map((pref: Record<string, unknown>) => [pref.user_id, pref[preference]]));
  // Sin fila de preferencias se respeta el valor por defecto de la columna.
  return (devices ?? []).filter((device) => (chosen.get(device.user_id) ?? preferenceDefault) === true);
}

/** Sends through Expo in batches of 100 and retires tokens Expo reports as dead. */
export async function sendExpoPush(admin: Admin, devices: Device[], message: Message): Promise<number> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' };
  const token = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (token) headers.Authorization = `Bearer ${token}`;
  let sent = 0;
  const dead: string[] = [];
  for (let start = 0; start < devices.length; start += 100) {
    const batch = devices.slice(start, start + 100);
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST', headers, signal: AbortSignal.timeout(15_000),
        body: JSON.stringify(batch.map((device) => ({ to: device.expo_push_token, sound: 'default', channelId: 'default', ...message }))),
      });
      const payload = await response.json();
      const tickets: ExpoTicket[] = response.ok && Array.isArray(payload.data) ? payload.data : [];
      batch.forEach((device, index) => {
        if (tickets[index]?.status === 'ok') sent++;
        else if (tickets[index]?.details?.error === 'DeviceNotRegistered') dead.push(device.id);
      });
    } catch {
      // Un lote caído no detiene los demás; el aviso es de mejor esfuerzo.
    }
  }
  if (dead.length) await admin.from('push_devices').update({ active: false }).in('id', dead);
  return sent;
}
