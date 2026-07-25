const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type MenuRequest = {
  imageBase64?: string;
  mediaType?: 'image/jpeg' | 'image/png' | 'image/webp';
  tipo?: string | null;
};

type UnknownRecord = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeResult(value: unknown) {
  const raw = value && typeof value === 'object' ? value as UnknownRecord : {};
  const rawSections = Array.isArray(raw.secciones) ? raw.secciones : [];

  return {
    secciones: rawSections.map((section) => {
      const item = section && typeof section === 'object' ? section as UnknownRecord : {};
      const rawDishes = Array.isArray(item.platillos) ? item.platillos : [];
      return {
        nombre: text(item.nombre) || 'MENÚ DE HOY',
        platillos: rawDishes.map((dish) => {
          const entry = dish && typeof dish === 'object' ? dish as UnknownRecord : {};
          return {
            nombre: text(entry.nombre),
            descripcion: text(entry.descripcion),
            precio: text(entry.precio),
            confianza: typeof entry.confianza === 'number' ? entry.confianza : 0,
            requiereRevision: entry.requiereRevision === true,
            motivoRevision: text(entry.motivoRevision),
          };
        }).filter((dish) => dish.nombre.trim()),
        precioSeccion: text(item.precioSeccion),
      };
    }).filter((section) => section.platillos.length),
    // El modelo suele omitir precio cuando no existe un precio único. El contrato
    // móvil siempre recibe string para que una lectura válida no se descarte.
    precio: text(raw.precio),
    advertencias: Array.isArray(raw.advertencias)
      ? raw.advertencias.filter((warning): warning is string => typeof warning === 'string')
      : [],
  };
}

const REGLAS = `
REGLA FIDELIDAD: Transcribe únicamente lo que realmente aparece en la imagen. No inventes platillos, tiempos, acompañamientos ni precios.

REGLA FLEXIBILIDAD: Un negocio puede vender un único especial ese día. En ese caso crea una sola sección llamada "ESPECIAL DE HOY". No fuerces un menú de tres tiempos.

REGLA SECCIONES: Respeta los encabezados visibles. Si no hay encabezados claros, agrupa con nombres simples como "MENÚ DE HOY", "EXTRAS" o "BEBIDAS".

REGLA ENTIDAD: Un platillo es algo que una persona puede pedir. Un ingrediente, acompañamiento, tamaño, opción o nota nunca es un platillo independiente, salvo que la imagen lo venda por separado.

REGLA AGRUPACIÓN: Ingredientes, acompañamientos, opciones y variantes pertenecen a la descripción del platillo. No repitas el mismo platillo. Si una variante tiene precio propio, conserva ese precio en la descripción del platillo padre.

REGLA PRECIO: Si todo el menú tiene un precio único, ponlo en "precio". Si una sección tiene precio común, usa "precioSeccion". Si un platillo tiene precio propio, ponlo exclusivamente en "platillo.precio". Nunca escondas un precio en la descripción. Cuando exista un precio general o de sección, no marques para revisión un platillo solo porque no tenga precio individual: se entiende incluido. Textos como "Carta" o "a la carta" sí distinguen platillos independientes y deben conservarse en la descripción.

REGLA DUDA: Marca "requiereRevision" cuando no sea claro si un texto es platillo, ingrediente, opción o precio. Explica la duda brevemente en "motivoRevision" y agrega una advertencia general. La confianza va de 0 a 1 y debe ser conservadora.

Mantén vacíos los campos que no aparezcan.`;

const MENU_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    precio: { type: 'string' },
    advertencias: { type: 'array', items: { type: 'string' } },
    secciones: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          nombre: { type: 'string' },
          precioSeccion: { type: 'string' },
          platillos: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                nombre: { type: 'string' },
                descripcion: { type: 'string' },
                precio: { type: 'string' },
                confianza: { type: 'number' },
                requiereRevision: { type: 'boolean' },
                motivoRevision: { type: 'string' },
              },
              required: [
                'nombre',
                'descripcion',
                'precio',
                'confianza',
                'requiereRevision',
                'motivoRevision',
              ],
            },
          },
        },
        required: ['nombre', 'precioSeccion', 'platillos'],
      },
    },
  },
  required: ['precio', 'advertencias', 'secciones'],
} as const;

function buildPrompt(tipo: string | null | undefined) {
  const context: Record<string, string> = {
    fondita: 'Lee un menú real de comida corrida o cocina económica mexicana.',
    taqueria: 'Lee un menú real de una taquería mexicana.',
    reposteria: 'Lee un menú real de repostería o pastelería mexicana.',
    mariscos: 'Lee un menú real de mariscos en México.',
    otro: 'Lee un menú real de un negocio de comida en México y respeta su estructura.',
  };
  return `${context[tipo ?? ''] ?? 'Lee un menú real de un negocio de comida en México.'}\n${REGLAS}`;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada');

    const body = await request.json() as MenuRequest;
    if (!body.imageBase64 || body.imageBase64.length < 100) {
      return Response.json({ error: 'Imagen inválida' }, { status: 400, headers: corsHeaders });
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
        max_tokens: 2200,
        output_config: {
          format: {
            type: 'json_schema',
            schema: MENU_SCHEMA,
          },
        },
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: body.mediaType ?? 'image/jpeg',
                data: body.imageBase64,
              },
            },
            { type: 'text', text: buildPrompt(body.tipo) },
          ],
        }],
      }),
    });

    if (!anthropic.ok) {
      const detail = await anthropic.text();
      console.error('Anthropic error', anthropic.status, detail);
      throw new Error('El servicio de lectura no respondió');
    }

    const payload = await anthropic.json();
    if (payload?.stop_reason === 'max_tokens' || payload?.stop_reason === 'refusal') {
      throw new Error('La lectura no pudo completarse');
    }
    const text = payload?.content?.find((item: { type?: string }) => item.type === 'text')?.text ?? '';
    const parsed = JSON.parse(text);
    const result = normalizeResult(parsed);
    return Response.json(result, { headers: { ...corsHeaders, 'content-type': 'application/json' } });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'No se pudo leer el menú' },
      { status: 500, headers: corsHeaders },
    );
  }
});
