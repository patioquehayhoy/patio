import type { requireUser } from './auth.ts';
import { followersShouldHear } from './publication-window.ts';

type Admin = Awaited<ReturnType<typeof requireUser>>['admin'];
export type PublishedPlace = { id: string; nombre: string | null; horario_semanal: unknown };

const DAILY_CAP = 3;

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

/**
 * Anuncia un menú publicado a quienes tienen ese lugar en «Todas» (una vez por
 * lugar y día). Lo usan la publicación al momento (send-publication-
 * notifications, con la sesión del dueño) y la programada (send-scheduled-
 * publications, con pg_cron). Regresa lo que la función responde.
 */
export async function announcePublication(
  admin: Admin,
  fondita: PublishedPlace,
  menuDate: string,
  createdBy: string | null,
  kind = 'menu_published',
): Promise<Record<string, unknown>> {
  const { data: existing, error: existingError } = await admin
    .from('publication_events')
    .select('id')
    .eq('negocio_id', fondita.id)
    .eq('menu_date', menuDate)
    .eq('kind', kind)
    .maybeSingle();
  if (existingError) throw existingError;

  // Corrections to the same daily menu do not generate repeated noise.
  if (existing) return { eventId: existing.id, delivered: 0, deduplicated: true };

  const { data: event, error: eventError } = await admin
    .from('publication_events')
    .insert({
      negocio_id: fondita.id,
      menu_date: menuDate,
      kind,
      created_by: createdBy,
    })
    .select('id')
    .single();
  if (eventError?.code === '23505') return { delivered: 0, deduplicated: true };
  if (eventError || !event) throw eventError ?? new Error('Could not create event');

  // Publicó ya cerrado (o de noche, sin horario): el menú queda, sin aviso.
  if (!followersShouldHear(fondita.horario_semanal, new Date())) {
    return { eventId: event.id, delivered: 0, afterClose: true };
  }

  // Al momento, solo a quien tiene este lugar en «Todas»; los demás lo reciben en su resumen de las 11:30 (send-follower-digest).
  const { data: follows, error: followsError } = await admin.rpc('realtime_followers', { target_negocio: fondita.id });
  if (followsError) throw followsError;
  const followerIds = [...new Set((follows ?? []).map((follow) => follow.user_id))];
  if (!followerIds.length) return { eventId: event.id, delivered: 0 };

  const [prefsResult, devicesResult] = await Promise.all([
    admin.from('notification_preferences').select('user_id,patio_publications,paused').in('user_id', followerIds),
    admin.from('push_devices').select('id,user_id,expo_push_token').in('user_id', followerIds).eq('active', true),
  ]);
  if (prefsResult.error) throw prefsResult.error;
  if (devicesResult.error) throw devicesResult.error;
  const prefs = prefsResult.data;
  const devices = devicesResult.data;
  // «Pausar todo» silencia también los menús.
  const allowed = new Set((prefs ?? []).filter((pref) => pref.patio_publications && pref.paused !== true).map((pref) => pref.user_id));
  // Tope contra la fatiga de avisos: cada persona recibe como máximo
  // DAILY_CAP menús publicados al día, sin importar cuántos lugares siga.
  const { data: todaySent, error: todayError } = await admin.from('notification_deliveries')
    .select('user_id,event_id').in('user_id', [...allowed]).eq('status', 'sent')
    .gte('created_at', new Date(`${menuDate}T00:00:00-06:00`).toISOString());
  if (todayError) throw todayError;
  const eventsByUser = new Map<string, Set<string>>();
  for (const row of todaySent ?? []) {
    const events = eventsByUser.get(row.user_id) ?? new Set<string>();
    events.add(row.event_id);
    eventsByUser.set(row.user_id, events);
  }
  const targets = (devices ?? []).filter((device) => allowed.has(device.user_id)
    && (eventsByUser.get(device.user_id)?.size ?? 0) < DAILY_CAP);
  if (!targets.length) return { eventId: event.id, delivered: 0 };

  const messages = targets.map((device) => ({
    to: device.expo_push_token,
    title: fondita.nombre?.trim() || 'Un Patio',
    // Copy homologado: título = quién, cuerpo = el hecho en una línea.
    body: 'Publicó su menú de hoy.',
    sound: 'default',
    channelId: 'default',
    data: {
      type: 'patio_publication',
      patioId: fondita.id,
      eventId: event.id,
      url: `patio://patio/${fondita.id}`,
    },
  }));

  const expoHeaders: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'Accept-Encoding': 'gzip, deflate',
  };
  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (expoAccessToken) expoHeaders.Authorization = `Bearer ${expoAccessToken}`;

  // Expo accepts at most 100 messages per request. Preserve one ticket slot
  // per target even when a batch fails so errors are attributed correctly.
  const tickets: ExpoTicket[] = [];
  for (let start = 0; start < messages.length; start += 100) {
    const batch = messages.slice(start, start + 100);
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST', headers: expoHeaders, body: JSON.stringify(batch),
        signal: AbortSignal.timeout(15_000),
      });
      const payload = await response.json();
      const batchTickets = response.ok && Array.isArray(payload.data) ? payload.data : [];
      for (let index = 0; index < batch.length; index++) {
        tickets.push(batchTickets[index] ?? {
          status: 'error', message: 'Expo did not return a ticket',
          details: { error: `ExpoHTTP${response.status}` },
        });
      }
    } catch {
      tickets.push(...batch.map(() => ({
        status: 'error' as const, message: 'Expo request failed', details: { error: 'ExpoNetworkError' },
      })));
    }
  }

  const deliveries = targets.map((device, index) => {
    const ticket = tickets[index];
    const unregistered = ticket?.details?.error === 'DeviceNotRegistered';
    return {
      event_id: event.id,
      user_id: device.user_id,
      push_device_id: device.id,
      expo_ticket_id: ticket?.id ?? null,
      status: ticket?.status === 'ok' ? 'sent' : unregistered ? 'device_unregistered' : 'error',
      error_code: ticket?.details?.error ?? null,
      error_detail: ticket?.message ?? null,
    };
  });
  const { error: deliveryError } = await admin.from('notification_deliveries').insert(deliveries);
  if (deliveryError) throw deliveryError;

  const deadTokens = targets
    .filter((_, index) => tickets[index]?.details?.error === 'DeviceNotRegistered')
    .map((device) => device.id);
  if (deadTokens.length) {
    const { error } = await admin.from('push_devices').update({ active: false }).in('id', deadTokens);
    if (error) throw error;
  }

  return {
    eventId: event.id,
    delivered: deliveries.filter((delivery) => delivery.status === 'sent').length,
    failed: deliveries.filter((delivery) => delivery.status !== 'sent').length,
  };
}
