import { consumeAIRequest, returnAIRequest } from '../_shared/ai-quota.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, readJson } from '../_shared/http.ts';

// El teléfono espera 120 s (READ_DEADLINE_MS en lib/vision.ts). El servidor
// termina antes, aun con reintentos o una subida lenta, para contestar
// siempre algo: el menú o en qué paso se quedó.
const SERVER_BUDGET_MS = 100_000;
// Saturado (429, 529) o caído (5xx): Anthropic pide reintentar con espera.
const RETRY_STATUS = new Set([429, 500, 502, 503, 504, 529]);
const MAX_ATTEMPTS = 3;
// Un reintento solo vale si después queda tiempo para leer.
const MIN_TIME_TO_READ_MS = 20_000;

// Una lectura trabada escribe espacios sin fin hasta el tope: se corta antes.
const STUCK_WHITESPACE = /\s{300}$/;

/** Cómo va la lectura de una hoja, para saber dónde se tarda. Sin datos del menú. */
type Progress = { intentos: number; ms_primer_texto: number; caracteres: number; tokens_salida: number; motivo?: string };

/** La lectura no terminó por el servicio (ocupado, lento o trabado): la lectura se devuelve. */
class ReadUnavailable extends Error {}

function unavailable(progress: Progress, motivo: string) {
  progress.motivo = motivo;
  return new ReadUnavailable(motivo);
}

/** Se rechaza al cortar la espera; la carrera la usa aunque el fetch no haga caso a la señal. */
function whenAborted(signal: AbortSignal) {
  const promise = new Promise<never>((_, reject) => {
    if (signal.aborted) reject(new Error('abort'));
    else signal.addEventListener('abort', () => reject(new Error('abort')), { once: true });
  });
  promise.catch(() => {});
  return promise;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Espera antes de reintentar: la que pide el servicio (hasta 8 s) o 1.5 s, 3 s. */
function retryWait(response: Response, attempt: number): number {
  const asked = Number(response.headers.get('retry-after'));
  if (Number.isFinite(asked) && asked > 0) return Math.min(asked * 1000, 8_000);
  return 1_500 * 2 ** (attempt - 1) + Math.floor(Math.random() * 500);
}

type UnknownRecord = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === 'string'
    ? value
        .replace(/\*{1,3}/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
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
    // Varias formas de cobrar el menú del día (2026-11-14): «Completo $95»,
    // «Solo guisado $70». Solo las que traen cantidad.
    precios: (Array.isArray(raw.precios) ? raw.precios : []).flatMap((entry) => {
      const item = entry && typeof entry === 'object' ? entry as UnknownRecord : {};
      const precio = text(item.precio);
      return /\d/.test(precio) ? [{ nombre: text(item.nombre), precio }] : [];
    }),
    advertencias: Array.isArray(raw.advertencias)
      ? raw.advertencias.filter((warning): warning is string => typeof warning === 'string')
      : [],
  };
}

const REGLAS = `
REGLA FIDELIDAD: Transcribe únicamente lo que realmente aparece en la imagen. No inventes platillos, acompañamientos ni precios. Los tiempos solo salen de grupos que se ven en la imagen (REGLA TIEMPOS).

REGLA FLEXIBILIDAD: Un negocio puede vender un único especial ese día. En ese caso crea una sola sección apropiada para su perfil. No fuerces tiempos, categorías ni carta.

REGLA TIEMPOS: En un menú del día o comida corrida (por ejemplo "MENÚ $100", "COMIDA CORRIDA", "MENÚ DEL DÍA") que no escribe encabezados por tiempo, una llave, corchete, color o espacio que junta varios platillos distintos (dos sopas, tres guisados) marca un tiempo. Una llave que abre las opciones de un mismo platillo ("Enchiladas < verdes / rojas", "Tacos de: bistec, pastor") o que junta platillos con un mismo precio no es un tiempo: sigue la REGLA AGRUPACIÓN o la de precios. Cada tiempo que se ve es una sección, en el orden en que aparece: "1ER TIEMPO", "2DO TIEMPO", "3ER TIEMPO" (y "4TO TIEMPO" si hay más); un grupo solo de bebidas o solo de postres se llama "BEBIDAS" o "POSTRES". Si la imagen escribe sus propios encabezados (SOPAS, GUISADOS…), usa esos. Sin agrupación visible, el menú del día va en una sola sección. Aplica a cualquier giro: casi todas las fondas se registran como restaurante.

REGLA SECCIONES: Respeta primero los encabezados visibles. Solo si faltan o son ambiguos, usa la arquitectura del perfil enviada abajo.
Devuelve todos los nombres de sección en MAYÚSCULAS, con acentos correctos.

REGLA PIZARRA: En pizarras manuscritas, la cercanía vertical y las flechas indican pertenencia. Un encabezado subrayado seguido de un precio (por ejemplo "CARTA $110") significa precio común de esa sección. El texto que aparece antes del encabezado no pertenece a esa sección. Conserva todos los renglones legibles anteriores como menú del día, agrupándolos por su relación visual; no los descartes porque carezcan de encabezado.

REGLA ENTIDAD: Un platillo es algo que una persona puede pedir. Un ingrediente, acompañamiento, tamaño, opción o nota nunca es un platillo independiente, salvo que la imagen lo venda por separado.

REGLA AGRUPACIÓN: Ingredientes, acompañamientos, opciones y variantes pertenecen a la descripción del platillo. No repitas el mismo platillo. Si una variante tiene precio propio, conserva ese precio en la descripción del platillo padre.

REGLA ONTOLOGÍA DE PLATILLO: Analiza cada renglón en estos componentes antes de escribir: (1) familia o identidad pedible, (2) variante/sabor, (3) proteína o relleno, (4) técnica o preparación, (5) presentación/tamaño/cantidad, (6) ingredientes y toppings, (7) acompañamientos, (8) disponibilidad, (9) precio. No todos aparecen y nunca debes inventarlos.

REGLA NOMBRE CANÓNICO: "nombre" = familia/identidad pedible + los modificadores sin los cuales dejaría de distinguirse en búsqueda o en la carta. Incluye variante principal, sabor, proteína o tamaño solo cuando forman parte de cómo se pide o distinguen el producto. "descripcion" = preparación, ingredientes, toppings, acompañamientos, presentación y opciones secundarias. No repitas en la descripción ninguna información ya expresada en el nombre. Usa mayúscula inicial normal, no Title Case.

EJEMPLOS DE LA REGLA GENERAL (no son una lista cerrada):
- "Sopa de fideo" / "Con jitomate".
- "Enchiladas verdes o rojas" / "De pollo, con crema, queso y aguacate".
- "Taco de pastor" / "Con cebolla, cilantro y piña".
- "Esquite grande" / "Con mayonesa, queso, limón y chile".
- "Pastel de chocolate" / "Rebanada con ganache".
- "Agua de jamaica, 1 L" / "".
Aplica el mismo análisis a cualquier platillo, no copies estos ejemplos si no aparecen.

REGLA PRECIOS DEL MENÚ: En fondas y cocinas económicas el menú del día suele cobrarse de varias formas (por ejemplo "Completo $95", "Sin sopa $85", "Solo guisado $70", "Ejecutivo $120", "Para llevar $100"). Pon cada forma en "precios" con su nombre tal como aparece y su cantidad. Si hay una sola forma, ponla también en "precio". Nunca inventes formas que no estén escritas. El precio de la carta ("CARTA $110") no es una forma de cobrar el menú del día: va solo en "precioSeccion" de la sección de la carta.
REGLA PRECIO: Si todo el menú tiene un precio único, ponlo en "precio". Si una sección tiene precio común, usa "precioSeccion". Si un platillo tiene precio propio, ponlo exclusivamente en "platillo.precio". Nunca escondas un precio en la descripción. Cuando exista un precio general o de sección, no marques para revisión un platillo solo porque no tenga precio individual: se entiende incluido. Textos como "Carta" o "a la carta" sí distinguen platillos independientes y deben conservarse en la descripción.

REGLA ASOCIACIÓN ESPACIAL DE PRECIO: Lee la posición, no solo el texto. Un precio en el mismo renglón, columna derecha o inmediatamente debajo de un platillo pertenece a ese platillo. Una secuencia de productos con una secuencia de precios debe conservar cada pareja. No promociones un precio individual a "precio" general salvo que la imagen diga explícitamente menú, paquete, precio único, incluye o equivalente.

REGLA VARIANTES CON VARIOS PRECIOS: Si un producto tiene varios tamaños o variantes con precios distintos, deja "platillo.precio" vacío y conserva las parejas en la descripción de forma legible (por ejemplo "Chico $35 · Grande $50"). Escribe texto plano: nunca uses Markdown, asteriscos ni símbolos de énfasis. Nunca concatenes dos cifras como si fueran una.

REGLA PRECIO IMPROBABLE: Transcribe el número visible, pero aplica contexto mexicano. Para una fondita, una sopa, bebida o tiempo individual por encima de $500 MXN, o un menú del día por encima de $800 MXN, es probablemente una lectura errónea (por ejemplo 1020 en vez de 120). No inventes la corrección: conserva el valor, marca "requiereRevision" y explica "Precio inusual; confirma la foto". Agrega también una advertencia general.

REGLA DUDA: Marca "requiereRevision" solo cuando quien cocina tenga que mirar ese platillo: una palabra que no se lee, o no saber si un texto es platillo, ingrediente, opción o precio. En "motivoRevision" escribe la duda en 2 a 5 palabras, sin explicar ni dar instrucciones (por ejemplo "No se lee bien", "¿Va con el de arriba?", "¿Platillo o ingrediente?"); sin duda, déjalo vacío. Agrega una advertencia general. La confianza va de 0 a 1 y debe ser conservadora.

Mantén vacíos los campos que no aparezcan.`;

const BUSINESS_PROFILES: Record<string, string> = {
  fondita: `
PERFIL FONDITA:
- Puede coexistir "MENÚ DEL DÍA" con "A LA CARTA".
- Los tiempos siguen la REGLA TIEMPOS: uno por grupo que se ve; no fuerces tres si la foto no los ofrece.
- Distingue precio general del menú, opciones incluidas y platillos a la carta.`,
  taqueria: `
PERFIL TAQUERÍA:
- Secciones posibles: TACOS, ESPECIALIDADES, GRINGAS/QUESADILLAS, COMPLEMENTOS, BEBIDAS.
- Tipo de carne, tortilla, pieza/orden y tamaño distinguen productos.
- Cebolla, cilantro, salsa y limón suelen ser descripción, no platillos.`,
  reposteria: `
PERFIL POSTRES Y PAN:
- Secciones posibles: PASTELES, REBANADAS, PAN, POSTRES, TEMPORADA, BEBIDAS.
- Sabor, tamaño, porción y presentación suelen distinguir el producto.
- Relleno, cobertura, decoración e ingredientes viven en descripción salvo que definan el nombre comercial.
- No uses tiempos ni "menú del día" salvo que estén escritos.`,
  mariscos: `
PERFIL MARISCOS:
- Secciones posibles: ENTRADAS, CEVICHES, TOSTADAS, TACOS, CALDOS, PLATOS FUERTES, BEBIDAS.
- Especie, preparación, tamaño y pieza/orden pueden distinguir el producto.`,
  antojitos: `
PERFIL ANTOJITOS:
- Secciones posibles: QUESADILLAS, GORDITAS, TLACOYOS, PAMBAZOS, EXTRAS, BEBIDAS.
- Antojito + relleno principal suele formar el nombre; salsa, crema, queso y guarnición suelen describir.`,
  elotes: `
PERFIL ELOTES Y ESQUITES:
- Secciones posibles: ELOTES, ESQUITES, TAMAÑOS, EXTRAS, BEBIDAS.
- Producto + tamaño/presentación distingue; toppings y nivel de chile describen o son extras.`,
  botanas: `
PERFIL BOTANAS:
- Puesto de botanas tipo doriloco/tostiloco: base (Doritos, Takis, papas, Cheetos, tostitos) + preparación con producto empacado, mariscos, verduras y salsas.
- Secciones posibles: DORILOCOS/BOTANAS, TOSTILOCOS, TAMAÑOS, EXTRAS, BEBIDAS.
- Producto base + tamaño/presentación distingue; chamoy, salsa, limón, chicharrón y nivel de chile suelen ser descripción o extras.`,
  bebidas: `
PERFIL BEBIDAS:
- Secciones posibles: AGUAS, JUGOS, CAFÉ, TÉS, FRÍAS, CALIENTES, TAMAÑOS, EXTRAS.
- Sabor, volumen y temperatura pueden distinguir el nombre; leche, endulzante y toppings describen.`,
  restaurante: `
PERFIL RESTAURANTE:
- Respeta la carta: ENTRADAS, SOPAS/ENSALADAS, PLATOS FUERTES, POSTRES, BEBIDAS u otros encabezados visibles.
- No conviertas una carta en menú del día.`,
  otro: `
PERFIL GENERAL:
- Respeta encabezados visibles y crea categorías descriptivas solo cuando hagan falta.
- No presupongas tiempos, carta ni estructura de restaurante.`,
};

const MENU_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    precio: { type: 'string' },
    precios: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: { nombre: { type: 'string' }, precio: { type: 'string' } },
        required: ['nombre', 'precio'],
      },
    },
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
  required: ['precio', 'precios', 'advertencias', 'secciones'],
} as const;

function buildPrompt(tipo: string | null | undefined) {
  const profile = BUSINESS_PROFILES[tipo ?? ''] ?? BUSINESS_PROFILES.otro;
  return `Lee un menú real de un negocio de comida en México.\n${profile}\n${REGLAS}`;
}

// Varias hojas de una vez (Parco, 24 nov): una fonda manda su pizarrón; un
// restaurante, su carta de cuatro hojas. Cada hoja se lee aparte y en
// paralelo (la espera es la de la hoja más larga) y se juntan en orden.
// Cada hoja es una lectura de la cuota (Gratis 3 al día, Pro 30).
const MAX_PAGES = 6;
const MEDIA = ['image/jpeg', 'image/png', 'image/webp'];
type Page = { imageBase64: string; mediaType: string };

function pagesFrom(body: Record<string, unknown>): Page[] | null {
  const raw = Array.isArray(body.images) ? body.images : [{ imageBase64: body.imageBase64, mediaType: body.mediaType }];
  const pages: Page[] = [];
  for (const entry of raw) {
    const item = entry && typeof entry === 'object' ? entry as Record<string, unknown> : {};
    const data = item.imageBase64;
    const mediaType = item.mediaType === undefined ? 'image/jpeg' : String(item.mediaType);
    if (typeof data !== 'string' || data.length < 100 || !/^[A-Za-z0-9+/]+={0,2}$/.test(data) || !MEDIA.includes(mediaType)) return null;
    pages.push({ imageBase64: data, mediaType });
  }
  return pages.length ? pages : null;
}

async function readPage(apiKey: string, page: Page, tipo: string | null, deadline: number, progress: Progress, started: number) {
  for (let attempt = 1; ; attempt++) {
    progress.intentos = attempt;
    const left = deadline - Date.now();
    if (left < MIN_TIME_TO_READ_MS) throw unavailable(progress, 'sin tiempo para otro intento');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), left);
    const aborted = whenAborted(controller.signal);
    try {
      let response: Response;
      try {
        response = await Promise.race([callModel(apiKey, page, tipo, controller.signal), aborted]);
      } catch {
        throw unavailable(progress, controller.signal.aborted ? 'no empezó a tiempo' : 'sin conexión con el servicio');
      }
      if (RETRY_STATUS.has(response.status)) {
        const wait = retryWait(response, attempt);
        console.error('Anthropic ocupado', response.status, `intento ${attempt}`);
        await response.body?.cancel().catch(() => {});
        if (attempt >= MAX_ATTEMPTS || deadline - Date.now() - wait < MIN_TIME_TO_READ_MS) {
          throw unavailable(progress, `ocupado (${response.status})`);
        }
        await sleep(wait);
        continue;
      }
      if (!response.ok) {
        console.error('Anthropic error', response.status, await response.text().catch(() => ''));
        throw new Error('El servicio de lectura no respondió');
      }
      const streamed = await readStream(response, progress, started, controller.signal, aborted);
      if (streamed.stop === 'max_tokens' || streamed.stop === 'refusal') {
        console.error('Lectura incompleta', streamed.stop, streamed.usage);
        throw new Error('La lectura no pudo completarse');
      }
      return { result: normalizeResult(JSON.parse(streamed.text)), usage: streamed.usage };
    } finally {
      clearTimeout(timer);
    }
  }
}

function callModel(apiKey: string, page: Page, tipo: string | null, signal: AbortSignal) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 12000,
      // Conforme escribe (27 nov): se mide cuándo empieza y cuánto lleva, y
      // una lectura trabada se corta sin esperar al tope.
      stream: true,
      output_config: { format: { type: 'json_schema', schema: MENU_SCHEMA } },
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: page.mediaType, data: page.imageBase64 } },
          { type: 'text', text: buildPrompt(tipo) },
        ],
      }],
    }),
  });
}

/** Lee la respuesta conforme llega: cuándo empezó a escribir, cuánto lleva y si se trabó. */
async function readStream(response: Response, progress: Progress, started: number, signal: AbortSignal, aborted: Promise<never>) {
  if (!response.body) throw new Error('El servicio de lectura no respondió');
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  const usage = { input_tokens: 0, output_tokens: 0 };
  let buffer = '';
  let text = '';
  let stop: string | null = null;
  try {
    while (true) {
      const { value, done } = await Promise.race([reader.read(), aborted]);
      if (done) break;
      buffer += value.replace(/\r\n/g, '\n');
      let index: number;
      while ((index = buffer.indexOf('\n\n')) >= 0) {
        const chunk = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        const data = chunk.split('\n').find((line) => line.startsWith('data:'));
        if (!data) continue;
        const event = JSON.parse(data.slice(5).trim());
        if (event.type === 'message_start') {
          usage.input_tokens = event.message?.usage?.input_tokens ?? 0;
        } else if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
          if (!progress.ms_primer_texto) progress.ms_primer_texto = Date.now() - started;
          text += event.delta.text;
          progress.caracteres = text.length;
        } else if (event.type === 'message_delta') {
          usage.output_tokens = event.usage?.output_tokens ?? usage.output_tokens;
          progress.tokens_salida = usage.output_tokens;
          stop = event.delta?.stop_reason ?? stop;
        } else if (event.type === 'error') {
          throw unavailable(progress, `error del servicio (${event.error?.type ?? 'desconocido'})`);
        }
      }
      if (STUCK_WHITESPACE.test(text)) throw unavailable(progress, 'se trabó escribiendo espacios');
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error instanceof ReadUnavailable) throw error;
    throw unavailable(progress, signal.aborted ? 'escribía demasiado lento' : 'se cortó la conexión');
  }
  return { text, usage, stop };
}

/** Las hojas se juntan en orden; una sección que sigue en la hoja siguiente se une. */
function mergePages(results: ReturnType<typeof normalizeResult>[]) {
  const merged = results[0];
  for (const next of results.slice(1)) {
    for (const section of next.secciones) {
      const last = merged.secciones[merged.secciones.length - 1];
      if (last && last.nombre.trim().toLowerCase() === section.nombre.trim().toLowerCase()) last.platillos.push(...section.platillos);
      else merged.secciones.push(section);
    }
    if (!merged.precio && next.precio) merged.precio = next.precio;
    merged.precios.push(...next.precios.filter((price) => !merged.precios.some((known) => known.precio === price.precio && known.nombre === price.nombre)));
    merged.advertencias.push(...next.advertencias);
  }
  return merged;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') {
    return Response.json({ error: 'Método no permitido' }, { status: 405, headers: corsHeaders });
  }

  const started = Date.now();
  let charged: { auth: Awaited<ReturnType<typeof requireUser>>; count: number } | null = null;
  let modelStarted = 0;
  let progress: Progress[] = [];
  try {
    // Primero lo que subió el teléfono, luego la sesión (ver readJson).
    const body = await readJson(request, 7_000_000);
    const auth = await requireUser(request);
    const pages = pagesFrom(body);
    if (!pages) return Response.json({ error: 'Imagen inválida' }, { status: 400, headers: corsHeaders });
    if (pages.length > MAX_PAGES) {
      return Response.json({ error: `Elige hasta ${MAX_PAGES} hojas por vez.` }, { status: 400, headers: corsHeaders });
    }
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada');

    await consumeAIRequest(auth, 'read-menu', pages.length);
    charged = { auth, count: pages.length };
    // Medición de la lectura lenta (2026-11-23): cuánto tarda cada parte y
    // cuántos tokens escribe el modelo. Sin datos de la persona ni del menú.
    modelStarted = Date.now();
    const tipo = typeof body.tipo === 'string' ? body.tipo : null;
    const deadline = started + SERVER_BUDGET_MS;
    progress = pages.map(() => ({ intentos: 0, ms_primer_texto: 0, caracteres: 0, tokens_salida: 0 }));
    const read = await Promise.all(pages.map((page, index) => readPage(apiKey, page, tipo, deadline, progress[index], modelStarted)));
    const modelMs = Date.now() - modelStarted;
    const result = mergePages(read.map((page) => page.result));
    console.info(JSON.stringify({
      lectura: 'read-menu',
      hojas: pages.length,
      ms_total: Date.now() - started,
      ms_antes_del_modelo: modelStarted - started,
      ms_modelo: modelMs,
      kb_imagen: Math.round(pages.reduce((total, page) => total + page.imageBase64.length, 0) * 0.75 / 1024),
      tokens_entrada: read.reduce((total, page) => total + (page.usage?.input_tokens ?? 0), 0),
      tokens_salida: read.reduce((total, page) => total + (page.usage?.output_tokens ?? 0), 0),
      secciones: result.secciones.length,
      platillos: result.secciones.reduce((total, section) => total + section.platillos.length, 0),
      hojas_detalle: progress,
    }));
    // Sin datos de la persona ni del menú: la app de desarrollo lo muestra para medir.
    const tiempos = { ms_total: Date.now() - started, ms_antes_del_modelo: modelStarted - started, ms_modelo: modelMs, hojas: progress };
    return Response.json({ ...result, tiempos }, { headers: { ...corsHeaders, 'content-type': 'application/json' } });
  } catch (error) {
    const tiempos = { ms_total: Date.now() - started, ms_antes_del_modelo: modelStarted ? modelStarted - started : 0, hojas: progress };
    console.error(JSON.stringify({
      lectura: 'read-menu',
      fallo: error instanceof Error ? error.name : 'desconocido',
      devuelta: !!(charged && error instanceof ReadUnavailable),
      ...tiempos,
    }));
    if (error instanceof ReadUnavailable) {
      if (charged) await returnAIRequest(charged.auth, 'read-menu', charged.count).catch(() => {});
      return Response.json({ error: 'No pudimos terminar de leerlo. No se descontó de tus lecturas; inténtalo otra vez en un momento.', tiempos }, { status: 503, headers: corsHeaders });
    }
    return errorResponse(error, 'No se pudo leer el menú');
  }
});
