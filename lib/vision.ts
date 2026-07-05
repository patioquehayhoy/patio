import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system/legacy';
import { getTipoNegocio } from '@/lib/menu-store';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface MenuSeccion {
  nombre: string;
  platillos: { nombre: string; descripcion: string }[];
  precioSeccion?: string;
}

export interface MenuVisualResult {
  secciones: MenuSeccion[];
  precio: string;
  error?: string;
}

const REGLAS = `
REGLA FIDELIDAD: Transcribe únicamente lo que realmente aparece en la imagen. No inventes platillos, tiempos, acompañamientos ni precios.

REGLA FLEXIBILIDAD: Un negocio puede vender un único especial ese día (por ejemplo, solo pozole martes y jueves). En ese caso crea una sola sección llamada "ESPECIAL DE HOY". No fuerces un menú de tres tiempos.

REGLA SECCIONES: Respeta los encabezados visibles. Si la imagen no tiene encabezados claros, agrupa con nombres simples como "MENÚ DE HOY", "EXTRAS" o "BEBIDAS".

REGLA AGRUPACIÓN: Variantes del mismo platillo van en UN solo item. nombre='Enchiladas' descripcion='Verdes, rojas o enmoladas'. NUNCA repitas el mismo platillo.

REGLA PRECIO: Si hay precio único del menú ponlo en 'precio'. Si cada sección o platillo tiene precio propio ponlo en la descripción del platillo entre paréntesis. Ejemplo: descripcion='De chocolate o zanahoria ($180 entera / $45 porción)'.

Responde SOLO con JSON válido sin texto ni markdown:
{"secciones":[{"nombre":"1ER TIEMPO","platillos":[{"nombre":"Sopa","descripcion":"De fideo o verduras"}]}],"precio":"$95"}`;

function buildPrompt(tipo: string | null): string {
  if (tipo === 'fondita') {
    return `Eres un experto en leer menús reales de fonditas y cocinas económicas mexicanas. Transcribe la imagen respetando su estructura. Puede ser comida corrida, carta, un especial de un solo platillo o una combinación.
${REGLAS}`;
  }

  if (tipo === 'taqueria') {
    return `Eres un experto en taquerías mexicanas. Analiza la imagen y estructura el menú con estas secciones:

- TACOS: todos los tipos de tacos con variantes en descripción.
- COMPLEMENTOS: quesadillas, gringas, tortas, alambres, volcanes, etc.
- BEBIDAS: aguas, refrescos, etc.
${REGLAS}`;
  }

  if (tipo === 'reposteria') {
    return `Eres un experto en repostería y pastelería mexicana. Analiza la imagen y estructura el menú con estas secciones:

- PASTELES: pasteles con sabores, tamaños y precios por pieza o porción en la descripción.
- PIEZAS: galletas, pays, polvorones, pan, conchas, etc. con precio por pieza si hay.
- BEBIDAS: café, té, chocolate, etc.
${REGLAS}`;
  }

  if (tipo === 'mariscos') {
    return `Eres un experto en marisquerías mexicanas. Analiza la imagen y estructura el menú con estas secciones:

- ENTRADAS: cocteles, tostadas, aguachile, ceviche, ostiones.
- CALDOS: caldo de camarón, de pescado, siete mares, etc.
- PLATOS FUERTES: filete, camarones, pulpo, mojarra, brochetas, etc.
- BEBIDAS: aguas, cervezas, micheladas, etc.
${REGLAS}`;
  }

  if (tipo === 'otro') {
    return `Eres un experto en menús de negocios de comida en México. Analiza la imagen, detecta el tipo de negocio y crea secciones con sentido para ese negocio específico.
${REGLAS}`;
  }

  // null / undefined — lectura flexible, sin asumir un formato de comida corrida.
  return `Eres un experto en leer menús reales de negocios de comida en México. Transcribe la imagen respetando su estructura, incluso si solo contiene un especial del día.
${REGLAS}`;
}

export async function leerMenuDeFoto(imageUri: string): Promise<MenuVisualResult> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const tipo = getTipoNegocio();
  const prompt = buildPrompt(tipo);

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: base64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
  } catch {
    return { secciones: [], precio: '' };
  }
}
