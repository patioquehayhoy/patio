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

REGLA FLEXIBILIDAD: Un negocio puede vender un único especial ese día. En ese caso crea una sola sección apropiada para su perfil. No fuerces tiempos, categorías ni carta.

REGLA SECCIONES: Respeta primero los encabezados visibles. Solo si faltan o son ambiguos, usa la arquitectura del perfil enviada abajo.
Devuelve todos los nombres de sección en MAYÚSCULAS, con acentos correctos.

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

REGLA PRECIO: Si todo el menú tiene un precio único, ponlo en "precio". Si una sección tiene precio común, usa "precioSeccion". Si un platillo tiene precio propio, ponlo exclusivamente en "platillo.precio". Nunca escondas un precio en la descripción. Cuando exista un precio general o de sección, no marques para revisión un platillo solo porque no tenga precio individual: se entiende incluido. Textos como "Carta" o "a la carta" sí distinguen platillos independientes y deben conservarse en la descripción.

REGLA ASOCIACIÓN ESPACIAL DE PRECIO: Lee la posición, no solo el texto. Un precio en el mismo renglón, columna derecha o inmediatamente debajo de un platillo pertenece a ese platillo. Una secuencia de productos con una secuencia de precios debe conservar cada pareja. No promociones un precio individual a "precio" general salvo que la imagen diga explícitamente menú, paquete, precio único, incluye o equivalente.

REGLA VARIANTES CON VARIOS PRECIOS: Si un producto tiene varios tamaños o variantes con precios distintos, deja "platillo.precio" vacío y conserva las parejas en la descripción de forma legible (por ejemplo "Chico $35 · Grande $50"). Nunca concatenes dos cifras como si fueran una.

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
PERFIL ELOTES Y BOTANAS:
- Secciones posibles: ELOTES, ESQUITES, DORILOCOS/BOTANAS, TAMAÑOS, EXTRAS, BEBIDAS.
- Producto + tamaño/presentación distingue; toppings y nivel de chile describen o son extras.`,
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
  const profile = BUSINESS_PROFILES[tipo ?? ''] ?? BUSINESS_PROFILES.otro;
  return `Lee un menú real de un negocio de comida en México.\n${profile}\n${REGLAS}`;
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
