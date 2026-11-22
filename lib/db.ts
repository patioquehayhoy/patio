import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { MenuData } from './menu-store';
import { localMenuDate } from './menu-date';
import { dishKey } from './dish-identity';

export const FONDITA_ID_KEY = '@lafondita_fondita_id';

function debugLog(...args: unknown[]) {
  if (__DEV__) console.log(...args);
}

function hoy(): string {
  return localMenuDate();
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function upsertFondita(_email: string): Promise<string | null> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) throw authError;
  if (!user || user.is_anonymous) throw new Error('Inicia sesión para crear tu Patio.');
  const { data: existing, error: readError } = await supabase
    .from('negocios')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();
  // A failed read is not evidence that the business does not exist.
  if (readError) throw readError;

  if (existing) {
    await AsyncStorage.setItem(FONDITA_ID_KEY, existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('negocios')
    .insert({ owner_id: user.id, nombre: '' })
    .select('id')
    .single();

  if (error) throw error;
  await AsyncStorage.setItem(FONDITA_ID_KEY, data.id);
  return data.id;
}

/**
 * Guarda el menú publicado de un día. Sin `schedule`, es el de hoy y sale ya
 * (`publish_at` vacío). Con `schedule` (2026-11-21), es el de otro día y sale
 * solo a esa hora: hasta entonces solo lo ve su dueño (migración
 * 20261121120000). `keepSchedule` cambia el menú sin tocar su hora («Se acabó»).
 */
export async function saveMenuHoy(
  fonditaId: string,
  data: MenuData,
  options: { schedule?: { fecha: string; publishAt: string }; fecha?: string; keepSchedule?: boolean } = {},
): Promise<void> {
  if (!isUuid(fonditaId)) {
    throw new Error(`fonditaId inválido para UUID: ${fonditaId}`);
  }
  const fecha = options.schedule?.fecha ?? options.fecha ?? hoy();
  debugLog('[db] saveMenuHoy →', { fonditaId, fecha });
  const row: Record<string, unknown> = { negocio_id: fonditaId, secciones: data, fecha };
  if (!options.keepSchedule) row.publish_at = options.schedule?.publishAt ?? null;
  const { error } = await supabase
    .from('menus')
    .upsert(row, { onConflict: 'negocio_id,fecha' });
  if (error) throw error;
  debugLog('[db] saveMenuHoy OK');
}

export async function deleteMenuHoy(fonditaId: string): Promise<void> {
  if (!isUuid(fonditaId)) {
    throw new Error('No se pudo identificar tu Patio para retirar el menú.');
  }
  const fecha = hoy();
  const { error } = await supabase.from('menus').delete().eq('negocio_id', fonditaId).eq('fecha', fecha);
  if (error) throw error;
}

export async function loadMenuHoy(fonditaId: string, fecha = hoy()): Promise<MenuData | null> {
  if (!isUuid(fonditaId)) {
    console.warn('[db] loadMenuHoy skipped: fonditaId inválido para UUID', { fonditaId });
    return null;
  }
  debugLog('[db] loadMenuHoy →', { fonditaId, fecha });
  const { data, error } = await supabase
    .from('menus')
    .select('secciones')
    .eq('negocio_id', fonditaId)
    .eq('fecha', fecha)
    .maybeSingle();

  if (error) { console.error('[db] loadMenuHoy error:', error); return null; }
  debugLog('[db] loadMenuHoy result:', data ? 'encontrado' : 'null');
  return data ? (data.secciones as MenuData) : null;
}

/**
 * Menús publicados en los últimos días (2026-11-15), del más nuevo al más
 * viejo. El editor aprende de aquí qué foto tiene cada platillo, así la foto
 * vuelve sola aunque el negocio cambie de teléfono.
 */
export async function loadRecentMenus(fonditaId: string, days = 60): Promise<MenuData[]> {
  if (!isUuid(fonditaId)) return [];
  const { data, error } = await supabase
    .from('menus')
    .select('secciones')
    .eq('negocio_id', fonditaId)
    .order('fecha', { ascending: false })
    .limit(days);
  if (error || !data) return [];
  return (data as { secciones: MenuData | null }[]).flatMap((row) => (row.secciones ? [row.secciones] : []));
}

export async function deleteCarta(fonditaId: string): Promise<void> {
  if (!isUuid(fonditaId)) {
    throw new Error('No se pudo identificar tu Patio para retirar la carta.');
  }
  const { error } = await supabase.from('cartas').delete().eq('negocio_id', fonditaId);
  if (error) throw error;
}

export async function saveCarta(fonditaId: string, data: MenuData): Promise<void> {
  if (!isUuid(fonditaId)) {
    throw new Error(`fonditaId inválido para UUID: ${fonditaId}`);
  }
  debugLog('[db] saveCarta →', { fonditaId });
  const { error } = await supabase
    .from('cartas')
    .upsert(
      { negocio_id: fonditaId, secciones: data },
      { onConflict: 'negocio_id' }
    );
  if (error) throw error;
  debugLog('[db] saveCarta OK');
}

export async function loadCarta(fonditaId: string): Promise<MenuData | null> {
  if (!isUuid(fonditaId)) {
    console.warn('[db] loadCarta skipped: fonditaId inválido para UUID', { fonditaId });
    return null;
  }
  debugLog('[db] loadCarta →', { fonditaId });
  const { data, error } = await supabase
    .from('cartas')
    .select('secciones')
    .eq('negocio_id', fonditaId)
    .maybeSingle();

  if (error) { console.error('[db] loadCarta error:', error); return null; }
  debugLog('[db] loadCarta result:', data ? 'encontrado' : 'null');
  return data ? (data.secciones as MenuData) : null;
}

/**
 * Cuántas fotos de clientes tiene cada platillo de un lugar, por su llave
 * (lib/dish-identity.ts): el editor del negocio las usa para sugerir unir un
 * nombre nuevo con uno parecido que ya tiene fotos.
 */
export async function getDishPhotoCounts(placeId: string): Promise<Map<string, { name: string; count: number }>> {
  const counts = new Map<string, { name: string; count: number }>();
  if (!/^[0-9a-f-]{36}$/i.test(placeId)) return counts;
  const { data, error } = await supabase
    .from('reviews')
    .select('foto_platillo')
    .eq('negocio_id', placeId)
    .eq('status', 'published')
    .not('foto_url', 'is', null)
    .not('foto_platillo', 'is', null)
    .limit(500);
  if (error || !data) return counts;
  for (const row of data as { foto_platillo: string | null }[]) {
    const name = row.foto_platillo?.trim();
    if (!name) continue;
    const key = dishKey(name);
    const current = counts.get(key);
    counts.set(key, { name: current?.name ?? name, count: (current?.count ?? 0) + 1 });
  }
  return counts;
}
