import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import type { MenuData } from './menu-store';

export const FONDITA_ID_KEY = '@lafondita_fondita_id';

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function upsertFondita(email: string): Promise<string | null> {
  const { data: existing } = await supabase
    .from('fonditas')
    .select('id')
    .eq('telefono', email)
    .maybeSingle();

  if (existing) {
    await AsyncStorage.setItem(FONDITA_ID_KEY, existing.id);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('fonditas')
    .insert({ telefono: email, nombre: 'Mi Fondita' })
    .select('id')
    .single();

  if (error) { console.error('upsertFondita:', error); return null; }
  await AsyncStorage.setItem(FONDITA_ID_KEY, data.id);
  return data.id;
}

export async function saveMenuHoy(fonditaId: string, data: MenuData): Promise<void> {
  if (!isUuid(fonditaId)) {
    console.warn('[db] saveMenuHoy skipped: fonditaId inválido para UUID', { fonditaId });
    return;
  }
  const fecha = hoy();
  console.log('[db] saveMenuHoy →', { fonditaId, fecha });
  const { error } = await supabase
    .from('menus')
    .upsert(
      { fondita_id: fonditaId, secciones: data, fecha },
      { onConflict: 'fondita_id,fecha' }
    );
  if (error) console.error('[db] saveMenuHoy error:', error);
  else console.log('[db] saveMenuHoy OK');
}

export async function deleteMenuHoy(fonditaId: string): Promise<void> {
  if (!isUuid(fonditaId)) {
    console.warn('[db] deleteMenuHoy skipped: fonditaId inválido para UUID', { fonditaId });
    return;
  }
  const fecha = hoy();
  const { error } = await supabase.from('menus').delete().eq('fondita_id', fonditaId).eq('fecha', fecha);
  if (error) console.error('[db] deleteMenuHoy error:', error);
}

export async function loadMenuHoy(fonditaId: string): Promise<MenuData | null> {
  if (!isUuid(fonditaId)) {
    console.warn('[db] loadMenuHoy skipped: fonditaId inválido para UUID', { fonditaId });
    return null;
  }
  const fecha = hoy();
  console.log('[db] loadMenuHoy →', { fonditaId, fecha });
  const { data, error } = await supabase
    .from('menus')
    .select('secciones')
    .eq('fondita_id', fonditaId)
    .eq('fecha', fecha)
    .maybeSingle();

  if (error) { console.error('[db] loadMenuHoy error:', error); return null; }
  console.log('[db] loadMenuHoy result:', data ? 'encontrado' : 'null');
  return data ? (data.secciones as MenuData) : null;
}

export async function deleteCarta(fonditaId: string): Promise<void> {
  if (!isUuid(fonditaId)) {
    console.warn('[db] deleteCarta skipped: fonditaId inválido para UUID', { fonditaId });
    return;
  }
  const { error } = await supabase.from('cartas').delete().eq('fondita_id', fonditaId);
  if (error) console.error('[db] deleteCarta error:', error);
}

export async function saveCarta(fonditaId: string, data: MenuData): Promise<void> {
  if (!isUuid(fonditaId)) {
    console.warn('[db] saveCarta skipped: fonditaId inválido para UUID', { fonditaId });
    return;
  }
  console.log('[db] saveCarta →', { fonditaId });
  const { error } = await supabase
    .from('cartas')
    .upsert(
      { fondita_id: fonditaId, secciones: data },
      { onConflict: 'fondita_id' }
    );
  if (error) console.error('[db] saveCarta error:', error);
  else console.log('[db] saveCarta OK');
}

export async function loadCarta(fonditaId: string): Promise<MenuData | null> {
  if (!isUuid(fonditaId)) {
    console.warn('[db] loadCarta skipped: fonditaId inválido para UUID', { fonditaId });
    return null;
  }
  console.log('[db] loadCarta →', { fonditaId });
  const { data, error } = await supabase
    .from('cartas')
    .select('secciones')
    .eq('fondita_id', fonditaId)
    .maybeSingle();

  if (error) { console.error('[db] loadCarta error:', error); return null; }
  console.log('[db] loadCarta result:', data ? 'encontrado' : 'null');
  return data ? (data.secciones as MenuData) : null;
}
