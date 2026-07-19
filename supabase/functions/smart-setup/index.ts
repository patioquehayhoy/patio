const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SetupRequest = { relato?: string };

const PROMPT = `
Extrae datos de un negocio local de comida en México a partir de lo que cuenta su responsable.

REGLAS:
- Usa solamente datos explícitos. No inventes nombre, dirección, horarios, pagos ni especialidades.
- Normaliza horas explícitas a HH:MM en formato 24 horas.
- dia usa 0=domingo, 1=lunes ... 6=sábado.
- Incluye los 7 días en horario. Los días no mencionados llevan confirmado=false.
- tipo solo puede ser fondita, taqueria, reposteria, mariscos u otro.
- descripcion debe ser breve, humana y fiel; no agregues marketing.
- faltantes enumera únicamente campos de este JSON que necesitan confirmación:
  nombre, dirección, horario o formas de pago. No pidas teléfono, redes ni otros
  datos que este flujo todavía no guarda.

Responde SOLO JSON válido con esta forma:
{"nombre":"","descripcion":"","direccion":"","tipo":"otro","especialidades":[],"pagos":{"efectivo":false,"transferencia":false,"tarjeta":false},"horario":[{"dia":0,"cerrado":false,"abre":null,"cierra":null,"confirmado":false}],"faltantes":[]}
`;

function string(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalize(value: unknown) {
  const raw = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  const rawPayments = raw.pagos && typeof raw.pagos === 'object'
    ? raw.pagos as Record<string, unknown>
    : {};
  const rawSchedule = Array.isArray(raw.horario) ? raw.horario : [];
  const allowedTypes = new Set(['fondita', 'taqueria', 'reposteria', 'mariscos', 'otro']);

  const pagos = {
    efectivo: rawPayments.efectivo === true,
    transferencia: rawPayments.transferencia === true,
    tarjeta: rawPayments.tarjeta === true,
  };
  const hasPayment = pagos.efectivo || pagos.transferencia || pagos.tarjeta;
  const faltantes = Array.isArray(raw.faltantes)
    ? raw.faltantes.map(string).filter(Boolean).slice(0, 6)
    : [];

  return {
    nombre: string(raw.nombre),
    descripcion: string(raw.descripcion),
    direccion: string(raw.direccion),
    tipo: allowedTypes.has(string(raw.tipo)) ? string(raw.tipo) : 'otro',
    especialidades: Array.isArray(raw.especialidades)
      ? raw.especialidades.map(string).filter(Boolean).slice(0, 8)
      : [],
    pagos,
    horario: Array.from({ length: 7 }, (_, dia) => {
      const found = rawSchedule.find((entry) => (
        entry && typeof entry === 'object' && (entry as Record<string, unknown>).dia === dia
      )) as Record<string, unknown> | undefined;
      return {
        dia,
        cerrado: found?.cerrado === true,
        abre: string(found?.abre) || null,
        cierra: string(found?.cierra) || null,
        confirmado: found?.confirmado === true,
      };
    }),
    faltantes: hasPayment
      ? faltantes.filter((item) => !/pago|tarjeta|transferencia|efectivo/i.test(item))
      : faltantes,
  };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada');
    const { relato } = await request.json() as SetupRequest;
    if (!relato?.trim() || relato.trim().length < 12) {
      return Response.json({ error: 'Cuéntanos un poco más de tu negocio' }, { status: 400, headers: corsHeaders });
    }

    const anthropic = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1400,
        messages: [{ role: 'user', content: `${PROMPT}\nRELATO:\n${relato.trim()}` }],
      }),
    });
    if (!anthropic.ok) throw new Error('El servicio no respondió');
    const payload = await anthropic.json();
    const answer = payload?.content?.find((item: { type?: string }) => item.type === 'text')?.text ?? '';
    const parsed = JSON.parse(answer.replace(/```json|```/g, '').trim());
    return Response.json(normalize(parsed), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'No pudimos preparar tu Patio' },
      { status: 500, headers: corsHeaders },
    );
  }
});
