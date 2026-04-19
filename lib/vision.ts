import Anthropic from '@anthropic-ai/sdk';
import * as FileSystem from 'expo-file-system/legacy';

const client = new Anthropic({
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

export interface MenuSeccion {
  nombre: string;
  platillos: { nombre: string; descripcion: string }[];
}

export interface MenuVisualResult {
  secciones: MenuSeccion[];
  precio: string;
  error?: string;
}

export async function leerMenuDeFoto(imageUri: string): Promise<MenuVisualResult> {
  const base64 = await FileSystem.readAsStringAsync(imageUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

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
            text: `Eres un asistente para negocios de comida en México. Lee esta imagen de un menú escrito a mano, en pizarrón, o impreso.

Extrae toda la información del menú y responde SOLO con un JSON válido, sin texto adicional, sin markdown, sin explicaciones.

Estructura requerida:
{
  "secciones": [
    {
      "nombre": "1ER TIEMPO",
      "platillos": [
        { "nombre": "Sopa de fideo", "descripcion": "Con verduras" }
      ]
    }
  ],
  "precio": "$75"
}

Nombres de secciones comunes: 1ER TIEMPO, 2DO TIEMPO, 3ER TIEMPO, BEBIDAS, POSTRES, ENTRADAS.
Si no hay descripción para un platillo, usa descripcion: "".
Si no hay precio visible, usa precio: "".
Si la imagen no es un menú, devuelve: {"secciones":[],"precio":"","error":"No se detectó un menú en la imagen"}`,
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
