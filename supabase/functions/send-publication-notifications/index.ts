import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';

type RequestBody = {
  fonditaId?: string;
  kind?: 'menu_published';
};

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

function firstDishNames(secciones: unknown): string[] {
  if (!secciones || typeof secciones !== 'object') return [];
  const raw = (secciones as { secciones?: unknown[] }).secciones;
  if (!Array.isArray(raw)) return [];
  return raw
    .flatMap((section) => {
      if (!section || typeof section !== 'object') return [];
      const dishes = (section as { platillos?: unknown[] }).platillos;
      return Array.isArray(dishes) ? dishes : [];
    })
    .map((dish) => (
      dish && typeof dish === 'object' && typeof (dish as { nombre?: unknown }).nombre === 'string'
        ? (dish as { nombre: string }).nombre.trim()
        : ''
    ))
    .filter(Boolean)
    .slice(0, 2);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { admin, user } = await requireUser(req);
    const body = await readJson(req, 4_096) as RequestBody;
    if (typeof body.fonditaId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.fonditaId)) {
      return json({ error: 'Valid fonditaId is required' }, 400);
    }
    if (body.kind !== undefined && body.kind !== 'menu_published') {
      return json({ error: 'Unsupported publication kind' }, 400);
    }
    const kind = body.kind ?? 'menu_published';

    const { data: fondita, error: fonditaError } = await admin
      .from('fonditas')
      .select('id,nombre,owner_id')
      .eq('id', body.fonditaId)
      .maybeSingle();
    if (fonditaError) throw fonditaError;
    if (!fondita || !user.email_confirmed_at || fondita.owner_id !== user.id) {
      return json({ error: 'This Patio does not belong to the current user' }, 403);
    }

    const dateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date());
    const part = (type: string) => dateParts.find((value) => value.type === type)?.value;
    const menuDate = `${part('year')}-${part('month')}-${part('day')}`;
    const { data: menu, error: menuError } = await admin.from('menus')
      .select('secciones').eq('fondita_id', fondita.id).eq('fecha', menuDate).maybeSingle();
    if (menuError) throw menuError;
    if (!menu) return json({ error: 'Publish today\'s menu before announcing it' }, 409);

    const { data: existing, error: existingError } = await admin
      .from('publication_events')
      .select('id')
      .eq('fondita_id', fondita.id)
      .eq('menu_date', menuDate)
      .eq('kind', kind)
      .maybeSingle();
    if (existingError) throw existingError;

    // Corrections to the same daily menu do not generate repeated noise.
    if (existing) return json({ eventId: existing.id, delivered: 0, deduplicated: true });

    const { data: event, error: eventError } = await admin
      .from('publication_events')
      .insert({
        fondita_id: fondita.id,
        menu_date: menuDate,
        kind,
        created_by: user.id,
      })
      .select('id')
      .single();
    if (eventError?.code === '23505') return json({ delivered: 0, deduplicated: true });
    if (eventError || !event) throw eventError ?? new Error('Could not create event');

    const { data: follows, error: followsError } = await admin
      .from('patio_follows')
      .select('user_id')
      .eq('fondita_id', fondita.id)
      .eq('notifications_enabled', true);
    if (followsError) throw followsError;
    const followerIds = [...new Set((follows ?? []).map((follow) => follow.user_id))];
    if (!followerIds.length) return json({ eventId: event.id, delivered: 0 });

    const [prefsResult, devicesResult] = await Promise.all([
      admin.from('notification_preferences').select('user_id,patio_publications').in('user_id', followerIds),
      admin.from('push_devices').select('id,user_id,expo_push_token').in('user_id', followerIds).eq('active', true),
    ]);
    if (prefsResult.error) throw prefsResult.error;
    if (devicesResult.error) throw devicesResult.error;
    const prefs = prefsResult.data;
    const devices = devicesResult.data;
    const allowed = new Set((prefs ?? []).filter((pref) => pref.patio_publications).map((pref) => pref.user_id));
    const targets = (devices ?? []).filter((device) => allowed.has(device.user_id));
    if (!targets.length) return json({ eventId: event.id, delivered: 0 });

    const dishes = firstDishNames(menu?.secciones);
    const bodyText = dishes.length
      ? `Hoy hay ${dishes.join(' y ')}.`
      : 'Ya puedes ver lo que hay hoy.';
    const messages = targets.map((device) => ({
      to: device.expo_push_token,
      title: `${fondita.nombre || 'Un Patio'} publicó lo de hoy`,
      body: bodyText,
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

    return json({
      eventId: event.id,
      delivered: deliveries.filter((delivery) => delivery.status === 'sent').length,
      failed: deliveries.filter((delivery) => delivery.status !== 'sent').length,
    });
  } catch (error) {
    return errorResponse(error, 'No pudimos enviar los avisos.');
  }
});
