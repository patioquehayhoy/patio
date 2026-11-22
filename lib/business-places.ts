import { isModalidad, type Modalidad, type Punto } from './puntos';
import { isRitmo, type Ritmo } from './ritmo';
import { supabase } from './supabase';

// Dónde vende el negocio, del lado del dueño (2026-11-21, migración
// 20261121130000). Se guarda en cuanto se elige, como la foto del lugar.

export type WhereTheySell = { modalidad: Modalidad; pedidosHasta: string | null; puntos: Punto[] };

const rowToPunto = (row: { id: string; nombre: string; direccion: string | null; latitude: number; longitude: number; dias: number[] | null }): Punto => ({
  id: row.id,
  nombre: row.nombre,
  ...(row.direccion ? { direccion: row.direccion } : {}),
  latitude: Number(row.latitude),
  longitude: Number(row.longitude),
  ...(Array.isArray(row.dias) && row.dias.length ? { dias: row.dias.map(Number) } : {}),
});

export async function loadWhereTheySell(negocioId: string): Promise<WhereTheySell> {
  const [mode, places] = await Promise.all([
    supabase.from('negocios').select('modalidad, pedidos_hasta').eq('id', negocioId).maybeSingle(),
    supabase.from('negocio_puntos').select('id, nombre, direccion, latitude, longitude, dias').eq('negocio_id', negocioId).order('orden').order('created_at'),
  ]);
  if (mode.error) throw mode.error;
  if (places.error) throw places.error;
  const row = mode.data as { modalidad?: unknown; pedidos_hasta?: unknown } | null;
  return {
    modalidad: isModalidad(row?.modalidad) ? row.modalidad : 'local',
    pedidosHasta: typeof row?.pedidos_hasta === 'string' ? row.pedidos_hasta : null,
    puntos: ((places.data ?? []) as Parameters<typeof rowToPunto>[0][]).map(rowToPunto),
  };
}

export async function saveModalidad(negocioId: string, modalidad: Modalidad): Promise<void> {
  const { error } = await supabase.from('negocios').update({ modalidad }).eq('id', negocioId);
  if (error) throw error;
}

/** «11:00» o null para quitarla. */
export async function savePedidosHasta(negocioId: string, hhmm: string | null): Promise<void> {
  const { error } = await supabase.from('negocios').update({ pedidos_hasta: hhmm }).eq('id', negocioId);
  if (error) throw error;
}

export type PuntoDraft = Omit<Punto, 'id'> & { id?: string };

export async function savePunto(negocioId: string, punto: PuntoDraft): Promise<Punto> {
  const row = {
    negocio_id: negocioId,
    nombre: punto.nombre.trim(),
    direccion: punto.direccion?.trim() || null,
    latitude: punto.latitude,
    longitude: punto.longitude,
    dias: punto.dias?.length ? [...new Set(punto.dias)].sort() : null,
  };
  const query = punto.id
    ? supabase.from('negocio_puntos').update(row).eq('id', punto.id).select('id, nombre, direccion, latitude, longitude, dias').single()
    : supabase.from('negocio_puntos').insert(row).select('id, nombre, direccion, latitude, longitude, dias').single();
  const { data, error } = await query;
  if (error) throw error;
  return rowToPunto(data as Parameters<typeof rowToPunto>[0]);
}

export async function deletePunto(id: string): Promise<void> {
  const { error } = await supabase.from('negocio_puntos').delete().eq('id', id);
  if (error) throw error;
}

/** Ritmo guardado del negocio (vacío si nunca lo eligió). */
export async function loadRitmo(negocioId: string): Promise<Ritmo | null> {
  const { data, error } = await supabase.from('negocios').select('ritmo').eq('id', negocioId).maybeSingle();
  if (error) throw error;
  const value = (data as { ritmo?: unknown } | null)?.ritmo;
  return isRitmo(value) ? value : null;
}

export async function saveRitmo(negocioId: string, ritmo: Ritmo): Promise<void> {
  const { error } = await supabase.from('negocios').update({ ritmo }).eq('id', negocioId);
  if (error) throw error;
}

/** «Siguen igual»: los precios de la carta se dan por revisados hoy. */
export async function confirmCartaPrices(): Promise<void> {
  const { error } = await supabase.rpc('confirm_carta_prices');
  if (error) throw error;
}
