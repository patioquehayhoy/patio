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

/**
 * Lee con foto solo quien entró a su negocio. Si la sesión no se confirma en
 * 10 s, se intenta igual y el servidor decide (null = no se sabe).
 */
async function signedIn(): Promise<boolean | null> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((resolve) => { timer = setTimeout(() => resolve('timeout'), 10_000); });
  const current = Promise.resolve().then(() => supabase.auth.getSession()).then(({ data }) => data.session).catch(() => null);
  const session = await Promise.race([current, timeout]);
  clearTimeout(timer);
  if (session === 'timeout') return null;
  return !!session && !session.user?.is_anonymous;
}

async function readImage(imageUris: string[], signal: AbortSignal): Promise<MenuVisualResult> {
  // Sin cuenta no se sube nada: el servidor la pide y antes se veía como una espera sin fin.
  if (await signedIn() === false) throw new AIServiceError('Para leer tu menú con foto, entra con el correo de tu negocio.', 401);
  const images = await Promise.all(imageUris.map(async (uri) => ({
    imageBase64: await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 }),
    mediaType: 'image/jpeg',
  })));

  if (signal.aborted) throw new Error('Lectura cancelada');
  const sent = Date.now();
  if (__DEV__) console.info('[foto-menu] enviando', images.length, 'hojas,', Math.round(images.reduce((total, image) => total + image.imageBase64.length, 0) * 0.75 / 1024), 'KB');
  const { data, error } = await supabase.functions.invoke('read-menu', {
    signal,
    body: {
      images,
      tipo: getTipoNegocio(),
    },
  });

  if (__DEV__) {
    // Dónde se tardó: el servidor manda sus tiempos también cuando no termina.
    const context = error && typeof error === 'object' && 'context' in error && error.context instanceof Response ? error.context : null;
    const detail = context ? await context.clone().json().catch(() => null) : null;
    console.info('[foto-menu] respuesta', context ? context.status : error ? 'sin respuesta' : 200, 'en', Date.now() - sent, 'ms',
      detail?.tiempos ? JSON.stringify(detail.tiempos) : error && !context ? String(error) : '');
  }
  if (error) throw await aiFunctionError(error, 'No se pudo leer el menú. Inténtalo de nuevo.');
  if (__DEV__ && data && typeof data === 'object' && 'tiempos' in data) console.info('[foto-menu] servidor', JSON.stringify(data.tiempos));
  if (!isMenuVisualResult(data)) throw new Error('La lectura devolvió un formato inválido');
  return { ...data, precio: data.precio ?? '', precios: Array.isArray(data.precios) ? data.precios : [] };
}
