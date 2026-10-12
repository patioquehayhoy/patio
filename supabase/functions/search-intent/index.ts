import { consumeAIRequest } from '../_shared/ai-quota.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, readJson } from '../_shared/http.ts';

type UnknownRecord = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function normalizeResult(value: unknown) {
  const raw = value && typeof value === 'object' ? value as UnknownRecord : {};
  const rawTerms = Array.isArray(raw.terminos) ? raw.terminos : [];
  return {
    terminos: rawTerms.map((term) => text(term)).filter(Boolean).slice(0, 8),
    abiertoAhora: raw.abiertoAhora === true,
    menuDeHoy: raw.menuDeHoy === true,
    nota: text(raw.nota),
  };
}

// La búsqueda determinística de Patio (lib/menu.ts::searchLiveMenus) ya sabe
// buscar términos contra nombre/descripción/sección/tags de platillos reales
// publicados. Este endpoint SOLO traduce una frase de antojo en español a esos
// términos — nunca inventa disponibilidad, calificación ni evidencia; eso lo
// aporta después el propio inventario de Patio (ver docs/DISCOVERY_SEARCH_ARCHITECTURE.md).
const REGLAS = `
Traduce un antojo escrito o dictado por voz, en español mexicano, a una intención de
búsqueda estructurada sobre un directorio real de fonditas y menús del día.

REGLA VOCABULARIO: Expande a platillos y preparaciones reales de la cocina mexicana que
coincidan con la textura/sabor/tipo descrito (ej. "algo caldoso" → caldo, consomé, birria,
pancita, menudo, pozole). No inventes platillos que no existan en la cocina mexicana real.
Máximo 8 términos, los más específicos primero.

REGLA PREFERENCIAS SUAVES: Si la persona pide algo "ligero", "que no esté tan pesado" o
similar, PRIORIZA en el orden de términos preparaciones caldosas/claras sobre guisados con
mucha grasa o fritos, pero no inventes una categoría de "ligero" — sigue siendo búsqueda por
término real. Refleja lo que entendiste en "nota", en una frase corta y natural.

REGLA TIEMPO: "abiertoAhora" es true solo si la persona pidió explícitamente que el lugar
esté abierto en este momento. "menuDeHoy" es true si pidió comida del día/de hoy o no
especificó (el menú del día es el caso por defecto en Patio). Si pidió carta/antojo sin
relación al día, deja "menuDeHoy" en false.

REGLA HONESTIDAD: No afirmes que un platillo existe hoy en algún lugar — eso lo decide la
búsqueda real contra el inventario, no tú. Tu única salida son términos de búsqueda y dos
banderas de tiempo.

REGLA NOTA: "nota" es una frase breve (máximo 12 palabras), en español natural, que resume
lo que entendiste del antojo — se le muestra a la persona como confirmación, no como
resultado. Ejemplo: "Algo caldoso tipo birria, ligero".`;

const INTENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    terminos: { type: 'array', items: { type: 'string' } },
    abiertoAhora: { type: 'boolean' },
    menuDeHoy: { type: 'boolean' },
    nota: { type: 'string' },
  },
  required: ['terminos', 'abiertoAhora', 'menuDeHoy', 'nota'],
} as const;

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405, headers: corsHeaders });
  }

  try {
    const auth = await requireUser(request);
    const body = await readJson(request, 8_192);
    const query = text(body.query);
    if (!query || query.length > 500) {
      return Response.json({ error: 'Escribe una búsqueda de hasta 500 caracteres' }, { status: 400, headers: corsHeaders });
    }
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada');

    await consumeAIRequest(auth, 'search-intent');
    const anthropic = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: AbortSignal.timeout(10_000),
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 400,
        output_config: {
          format: {
            type: 'json_schema',
            schema: INTENT_SCHEMA,
          },
        },
        messages: [{
          role: 'user',
          content: [{ type: 'text', text: `${REGLAS}\n\nAntojo: "${query}"` }],
        }],
      }),
    });

    if (!anthropic.ok) {
      const detail = await anthropic.text();
      console.error('Anthropic error', anthropic.status, detail);
      throw new Error('El servicio de búsqueda no respondió');
    }

    const payload = await anthropic.json();
    if (payload?.stop_reason === 'max_tokens' || payload?.stop_reason === 'refusal') {
      throw new Error('La búsqueda no pudo completarse');
    }
    const textOut = payload?.content?.find((item: { type?: string }) => item.type === 'text')?.text ?? '';
    const parsed = JSON.parse(textOut);
    const result = normalizeResult(parsed);
    return Response.json(result, { headers: { ...corsHeaders, 'content-type': 'application/json' } });
  } catch (error) {
    return errorResponse(error, 'No se pudo interpretar la búsqueda');
  }
});
