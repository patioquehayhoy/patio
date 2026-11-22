import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';
import { announcePublication } from '../_shared/publication.ts';

type RequestBody = {
  fonditaId?: string;
  kind?: 'menu_published';
};


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
      .from('negocios')
      .select('id,nombre,owner_id,horario_semanal')
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
      .select('secciones').eq('negocio_id', fondita.id).eq('fecha', menuDate).maybeSingle();
    if (menuError) throw menuError;
    if (!menu) return json({ error: 'Publish today\'s menu before announcing it' }, 409);

    return json(await announcePublication(admin, fondita, menuDate, user.id, kind));
  } catch (error) {
    return errorResponse(error, 'No pudimos enviar los avisos.');
  }
});
