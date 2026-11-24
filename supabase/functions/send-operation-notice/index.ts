import { requireUser } from '../_shared/auth.ts';
import { canAct } from '../_shared/team.ts';
import { pushTargets, sendExpoPush } from '../_shared/expo-push.ts';
import { corsHeaders, errorResponse, HttpError, json, readJson } from '../_shared/http.ts';
import { freshDishName, OPERATION_KINDS, operationNoticeText, type OperationKind } from '../_shared/operation-notice.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Aviso de operación (gratis): «Hoy abrimos a las 8 pm.», «Hoy no abrimos.»…
// El dueño elige el tipo y la hora; el texto lo arma este servidor. Uno al día
// por lugar (día de la Ciudad de México). Llega a quien sigue el lugar con
// avisos encendidos y «Menús y avisos» activado, y se ve en la ficha ese día.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { admin, user } = await requireUser(req);
    const body = await readJson(req, 1_024) as { fonditaId?: unknown; kind?: unknown; time?: unknown; dish?: unknown };
    if (typeof body.fonditaId !== 'string' || !UUID.test(body.fonditaId)) return json({ error: 'Valid fonditaId is required' }, 400);
    if (typeof body.kind !== 'string' || !(OPERATION_KINDS as readonly string[]).includes(body.kind)) {
      throw new HttpError(400, 'Elige qué quieres avisar.');
    }
    const kind = body.kind as OperationKind;
    const fresh = kind === 'fresh';
    const dish = typeof body.dish === 'string' ? body.dish : null;
    const text = operationNoticeText(kind, typeof body.time === 'string' ? body.time : null, dish);
    if (!text) throw new HttpError(400, fresh ? 'Elige el platillo.' : 'Elige la hora.');

    const { data: negocio, error: negocioError } = await admin.from('negocios')
      .select('id,nombre,owner_id').eq('id', body.fonditaId).maybeSingle();
    if (negocioError) throw negocioError;
    if (!negocio || !user.email_confirmed_at || !(await canAct(admin, user.id, negocio))) {
      return json({ error: 'This Patio does not belong to the current user' }, 403);
    }

    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const part = (type: string) => parts.find((value) => value.type === type)?.value;
    // Inicio del día en la Ciudad de México (UTC−6, sin horario de verano).
    const dayStart = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00-06:00`).toISOString();
    // «Recién salido» (tandas): solo un platillo de su menú de hoy o de su carta,
    // hasta 3 al día, aparte del aviso del día.
    if (fresh) {
      const today = `${part('year')}-${part('month')}-${part('day')}`;
      const [menu, carta] = await Promise.all([
        admin.from('menus').select('secciones').eq('negocio_id', negocio.id).eq('fecha', today).maybeSingle(),
        admin.from('cartas').select('secciones').eq('negocio_id', negocio.id).maybeSingle(),
      ]);
      const key = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
      const names = new Set<string>();
      for (const source of [menu.data?.secciones, carta.data?.secciones]) {
        const secciones = (source as { secciones?: { platillos?: { nombre?: unknown }[] }[] } | null)?.secciones ?? [];
        for (const seccion of secciones) for (const platillo of seccion.platillos ?? []) {
          if (typeof platillo.nombre === 'string' && platillo.nombre.trim()) names.add(key(platillo.nombre));
        }
      }
      if (!names.has(key(freshDishName(dish) ?? ''))) throw new HttpError(400, 'Elige un platillo de tu menú.');
    }
    const { count, error: countError } = await admin.from('special_notices')
      .select('id', { count: 'exact', head: true })
      .eq('negocio_id', negocio.id).eq('kind', fresh ? 'fresh' : 'operation').gte('created_at', dayStart);
    if (countError) throw countError;
    if (fresh && (count ?? 0) >= 3) throw new HttpError(429, 'Ya avisaste 3 veces hoy. Mañana puedes avisar otra vez.');
    if (!fresh && (count ?? 0) >= 1) throw new HttpError(429, 'Ya avisaste hoy. Mañana puedes avisar otra vez.');

    const { data: notice, error: insertError } = await admin.from('special_notices')
      .insert({ negocio_id: negocio.id, created_by: user.id, body: text, kind: fresh ? 'fresh' : 'operation' }).select('id').single();
    if (insertError || !notice) throw insertError ?? new Error('Could not save notice');

    // Al momento, solo a quien tiene este lugar en «Todas»; «Hoy no abrimos» va también en el resumen de los demás.
    const { data: follows, error: followsError } = await admin.rpc('realtime_followers', { target_negocio: negocio.id });
    if (followsError) throw followsError;
    const followerIds = [...new Set((follows ?? []).map((follow) => follow.user_id))].filter((id) => id !== user.id);
    // Va con los menús («Menús y avisos», encendido por defecto).
    const targets = await pushTargets(admin, followerIds, 'patio_publications', true);
    const delivered = await sendExpoPush(admin, targets, {
      title: negocio.nombre?.trim() || 'Un Patio',
      body: text,
      data: { type: fresh ? 'fresh_notice' : 'operation_notice', patioId: negocio.id, noticeId: notice.id },
    });
    return json({ noticeId: notice.id, text, delivered });
  } catch (error) {
    return errorResponse(error, 'No pudimos enviar el aviso.');
  }
});
