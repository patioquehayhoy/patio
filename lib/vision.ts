import { AIServiceError, aiFunctionError } from '@/lib/edge-function-error';
import * as FileSystem from 'expo-file-system/legacy';

import { getTipoNegocio } from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';

export interface MenuSeccion {
  nombre: string;
  platillos: {
    nombre: string;
    descripcion: string;
    precio?: string;
    confianza?: number;
    requiereRevision?: boolean;
    motivoRevision?: string;
  }[];
  precioSeccion?: string;
}

export interface MenuVisualResult {
  secciones: MenuSeccion[];
  precio: string;
  /** Formas de cobrar el menú del día («Completo $95», «Solo guisado $70»). */
  precios?: { nombre: string; precio: string }[];
  advertencias?: string[];
  error?: string;
}

function isMenuVisualResult(value: unknown): value is MenuVisualResult {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<MenuVisualResult>;
  return Array.isArray(result.secciones)
    && result.secciones.every((section) =>
      !!section
      && typeof section.nombre === 'string'
      && Array.isArray(section.platillos)
      && section.platillos.every((dish) => !!dish && typeof dish.nombre === 'string')
    )
    && (typeof result.precio === 'string' || typeof result.precio === 'undefined')
    && (typeof result.advertencias === 'undefined' || Array.isArray(result.advertencias));
}

/** Límite del teléfono para una lectura con foto (2026-11-23). */
export const READ_DEADLINE_MS = 120_000;

/** Lee una o varias hojas del mismo menú (una carta de cuatro hojas viaja junta). */
export async function leerMenuDeFoto(imageUris: string | string[], signal?: AbortSignal): Promise<MenuVisualResult> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new Error('Lectura cancelada');
  signal?.addEventListener('abort', abort);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const interrupted = new Promise<never>((_, reject) => {
    controller.signal.addEventListener('abort', () => reject(new AIServiceError(
      signal?.aborted ? 'Lectura cancelada' : 'La lectura tardó demasiado. Intenta con otra foto o continúa a mano.', 0
    )), { once: true });
    // Mayor que la espera del servidor (110 s en read-menu más subida y acceso):
    // con 60 s, un menú largo que el servidor sí terminaba fallaba siempre en el
    // teléfono y gastaba la lectura. Cancelar sigue disponible todo el tiempo.
    timer = setTimeout(abort, READ_DEADLINE_MS);
  });
  const started = Date.now();
  try {
    return await Promise.race([interrupted, readImage(Array.isArray(imageUris) ? imageUris : [imageUris], controller.signal)]);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
    if (__DEV__) console.info('[foto-menu] lectura ms:', Date.now() - started);
  }
}

async function readImage(imageUris: string[], signal: AbortSignal): Promise<MenuVisualResult> {
  const images = await Promise.all(imageUris.map(async (uri) => ({
    imageBase64: await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
    mediaType: 'image/jpeg',
  })));

  if (signal.aborted) throw new Error('Lectura cancelada');
  const { data, error } = await supabase.functions.invoke('read-menu', {
    signal,
    body: {
      images,
      tipo: getTipoNegocio(),
    },
  });

  if (error) throw await aiFunctionError(error, 'No se pudo leer el menú. Inténtalo de nuevo.');
  if (!isMenuVisualResult(data)) throw new Error('La lectura devolvió un formato inválido');
  return { ...data, precio: data.precio ?? '', precios: Array.isArray(data.precios) ? data.precios : [] };
}
