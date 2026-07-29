import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type RequestBody = {
  fonditaId?: string;
  kind?: 'menu_published' | 'availability_changed';
};

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

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

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Server not configured' }, 500);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing authorization' }, 401);

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: authData, error: authError } = await admin.auth.getUser(token);
  if (authError || !authData.user) return json({ error: 'Invalid session' }, 401);

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }
  if (!body.fonditaId) return json({ error: 'fonditaId is required' }, 400);
  const kind = body.kind ?? 'menu_published';

  // The legacy ownership link is the verified auth email stored in telefono.
  // It stays here until fonditas.owner_id is backfilled in a dedicated migration.
  const { data: fondita } = await admin
    .from('fonditas')
    .select('id,nombre,telefono')
    .eq('id', body.fonditaId)
    .maybeSingle();
  if (!fondita || !authData.user.email || fondita.telefono !== authData.user.email) {
    return json({ error: 'This Patio does not belong to the current user' }, 403);
  }

  const menuDate = new Date().toISOString().slice(0, 10);
  const { data: existing } = await admin
    .from('publication_events')
    .select('id')
    .eq('fondita_id', fondita.id)
    .eq('menu_date', menuDate)
    .eq('kind', kind)
    .maybeSingle();

  // Corrections to the same daily menu do not generate repeated noise.
  if (existing) return json({ eventId: existing.id, delivered: 0, deduplicated: true });

  const { data: event, error: eventError } = await admin
    .from('publication_events')
    .insert({
      fondita_id: fondita.id,
      menu_date: menuDate,
      kind,
      created_by: authData.user.id,
    })
    .select('id')
    .single();
  if (eventError || !event) return json({ error: eventError?.message ?? 'Could not create event' }, 500);

  const { data: follows } = await admin
    .from('patio_follows')
    .select('user_id')
    .eq('fondita_id', fondita.id)
    .eq('notifications_enabled', true);
  const followerIds = [...new Set((follows ?? []).map((follow) => follow.user_id))];
  if (!followerIds.length) return json({ eventId: event.id, delivered: 0 });

  const [{ data: prefs }, { data: devices }, { data: menu }] = await Promise.all([
    admin.from('notification_preferences').select('user_id,patio_publications').in('user_id', followerIds),
    admin.from('push_devices').select('id,user_id,expo_push_token').in('user_id', followerIds).eq('active', true),
    admin.from('menus').select('secciones').eq('fondita_id', fondita.id).eq('fecha', menuDate).maybeSingle(),
  ]);
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

  const pushResponse = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: expoHeaders,
    body: JSON.stringify(messages),
  });
  const pushPayload = await pushResponse.json().catch(() => ({ data: [] }));
  const tickets: ExpoTicket[] = Array.isArray(pushPayload.data) ? pushPayload.data : [];

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
  await admin.from('notification_deliveries').insert(deliveries);

  const deadTokens = targets
    .filter((_, index) => tickets[index]?.details?.error === 'DeviceNotRegistered')
    .map((device) => device.id);
  if (deadTokens.length) await admin.from('push_devices').update({ active: false }).in('id', deadTokens);

  return json({
    eventId: event.id,
    delivered: deliveries.filter((delivery) => delivery.status === 'sent').length,
    failed: deliveries.filter((delivery) => delivery.status !== 'sent').length,
  });
});
