import { consumeAIRequest } from '../_shared/ai-quota.ts';
import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, readJson } from '../_shared/http.ts';

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
REGLA FIDELIDAD: Transcribe únicamente lo que realmente aparece en la imagen. No inventes platillos, tiempos, acompañamientos ni precios.

REGLA FLEXIBILIDAD: Un negocio puede vender un único especial ese día. En ese caso crea una sola sección apropiada para su perfil. No fuerces tiempos, categorías ni carta.

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

REGLA PRECIOS DEL MENÚ: En fondas y cocinas económicas el menú del día suele cobrarse de varias formas (por ejemplo "Completo $95", "Sin sopa $85", "Solo guisado $70", "Ejecutivo $120", "Para llevar $100"). Pon cada forma en "precios" con su nombre tal como aparece y su cantidad. Si hay una sola forma, ponla también en "precio". Nunca inventes formas que no estén escritas.
REGLA PRECIO: Si todo el menú tiene un precio único, ponlo en "precio". Si una sección tiene precio común, usa "precioSeccion". Si un platillo tiene precio propio, ponlo exclusivamente en "platillo.precio". Nunca escondas un precio en la descripción. Cuando exista un precio general o de sección, no marques para revisión un platillo solo porque no tenga precio individual: se entiende incluido. Textos como "Carta" o "a la carta" sí distinguen platillos independientes y deben conservarse en la descripción.

REGLA ASOCIACIÓN ESPACIAL DE PRECIO: Lee la posición, no solo el texto. Un precio en el mismo renglón, columna derecha o inmediatamente debajo de un platillo pertenece a ese platillo. Una secuencia de productos con una secuencia de precios debe conservar cada pareja. No promociones un precio individual a "precio" general salvo que la imagen diga explícitamente menú, paquete, precio único, incluye o equivalente.

REGLA VARIANTES CON VARIOS PRECIOS: Si un producto tiene varios tamaños o variantes con precios distintos, deja "platillo.precio" vacío y conserva las parejas en la descripción de forma legible (por ejemplo "Chico $35 · Grande $50"). Escribe texto plano: nunca uses Markdown, asteriscos ni símbolos de énfasis. Nunca concatenes dos cifras como si fueran una.

REGLA PRECIO IMPROBABLE: Transcribe el número visible, pero aplica contexto mexicano. Para una fondita, una sopa, bebida o tiempo individual por encima de $500 MXN, o un menú del día por encima de $800 MXN, es probablemente una lectura errónea (por ejemplo 1020 en vez de 120). No inventes la corrección: conserva el valor, marca "requiereRevision" y explica "Precio inusual; confirma la foto". Agrega también una advertencia general.

REGLA DUDA: Marca "requiereRevision" cuando no sea claro si un texto es platillo, ingrediente, opción o precio. Explica la duda brevemente en "motivoRevision" y agrega una advertencia general. La confianza va de 0 a 1 y debe ser conservadora.

Mantén vacíos los campos que no aparezcan.`;

const BUSINESS_PROFILES: Record<string, string> = {
  fondita: `
PERFIL FONDITA:
- Puede coexistir "MENÚ DEL DÍA" con "A LA CARTA".
- Si la foto muestra secuencia, normaliza a "1ER TIEMPO", "2DO TIEMPO", "3ER TIEMPO" y "BEBIDAS".
- No fuerces tres tiempos si la foto no los ofrece.
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

async function readPage(apiKey: string, page: Page, tipo: string | null) {
  const anthropic = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal: AbortSignal.timeout(110_000),
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 12000,
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
  if (!anthropic.ok) {
    const detail = await anthropic.text();
    console.error('Anthropic error', anthropic.status, detail);
    throw new Error('El servicio de lectura no respondió');
  }
  const payload = await anthropic.json();
  if (payload?.stop_reason === 'max_tokens' || payload?.stop_reason === 'refusal') {
    console.error('Lectura incompleta', payload?.stop_reason, payload?.usage);
    throw new Error('La lectura no pudo completarse');
  }
  const text = payload?.content?.find((item: { type?: string }) => item.type === 'text')?.text ?? '';
  return { result: normalizeResult(JSON.parse(text)), usage: payload?.usage ?? null };
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
  try {
    const auth = await requireUser(request);
    const body = await readJson(request, 7_000_000);
    const pages = pagesFrom(body);
    if (!pages) return Response.json({ error: 'Imagen inválida' }, { status: 400, headers: corsHeaders });
    if (pages.length > MAX_PAGES) {
      return Response.json({ error: `Elige hasta ${MAX_PAGES} hojas por vez.` }, { status: 400, headers: corsHeaders });
    }
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY no está configurada');

    await consumeAIRequest(auth, 'read-menu', pages.length);
    // Medición de la lectura lenta (2026-11-23): cuánto tarda cada parte y
    // cuántos tokens escribe el modelo. Sin datos de la persona ni del menú.
    const modelStarted = Date.now();
    const tipo = typeof body.tipo === 'string' ? body.tipo : null;
    const read = await Promise.all(pages.map((page) => readPage(apiKey, page, tipo)));
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
    }));
    return Response.json(result, { headers: { ...corsHeaders, 'content-type': 'application/json' } });
  } catch (error) {
    console.error(JSON.stringify({
      lectura: 'read-menu',
      fallo: error instanceof Error ? error.name : 'desconocido',
      ms_total: Date.now() - started,
    }));
    return errorResponse(error, 'No se pudo leer el menú');
  }
});
