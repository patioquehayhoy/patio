import { nombreDisponible } from '@/lib/fondita-name';
import { deserialize, type HorarioSemanal } from '@/lib/horario';
import { supabase } from '@/lib/supabase';
import { getFonditaId } from '@/lib/user-store';

export class NombreDuplicadoError extends Error {
  constructor() {
    super('Ya hay un negocio con ese nombre en Patio.');
    this.name = 'NombreDuplicadoError';
  }
}

export type SmartSetupResult = {
  nombre: string;
  descripcion: string;
  direccion: string;
  latitude?: number | null;
  longitude?: number | null;
  tipo: BusinessType;
  especialidades: string[];
  pagos: { efectivo: boolean; transferencia: boolean; tarjeta: boolean };
  horario: (HorarioSemanal[number] & { confirmado: boolean })[];
  faltantes: string[];
};

export type BusinessType =
  | 'fondita'
  | 'taqueria'
  | 'reposteria'
  | 'mariscos'
  | 'antojitos'
  | 'elotes'
  | 'bebidas'
  | 'restaurante'
  | 'otro';

export async function prepareSmartSetup(relato: string): Promise<SmartSetupResult> {
  const { data, error } = await supabase.functions.invoke('smart-setup', {
    body: { relato: relato.trim() },
  });
  if (error) throw new Error(error.message || 'No pudimos preparar tu Patio');
  if (!data || typeof data !== 'object' || !Array.isArray(data.horario)) {
    throw new Error('Patio recibió una respuesta incompleta');
  }
  return data as SmartSetupResult;
}

export function confirmedSchedule(result: SmartSetupResult): HorarioSemanal | null {
  // No completar días desconocidos con suposiciones. El editor conserva su
  // horario actual hasta que los siete días queden explícitamente confirmados.
  if (!result.horario.every((day) => day.confirmado)) return null;
  return deserialize(result.horario);
}

export async function saveSmartSetup(result: SmartSetupResult): Promise<void> {
  const id = getFonditaId();
  if (!id) return;
  if (!(await nombreDisponible(result.nombre, id))) throw new NombreDuplicadoError();
  const schedule = confirmedSchedule(result);
  const payload: Record<string, unknown> = {
    nombre: result.nombre.trim(),
    tipo_negocio: result.tipo,
  };
  if (result.direccion.trim()) payload.direccion = result.direccion.trim();
  if (Number.isFinite(result.latitude) && Number.isFinite(result.longitude)) {
    payload.latitude = result.latitude;
    payload.longitude = result.longitude;
  }
  if (schedule) payload.horario_semanal = schedule;
  payload.pagos_efectivo = result.pagos.efectivo;
  payload.pagos_transferencia = result.pagos.transferencia;
  payload.pagos_tarjeta = result.pagos.tarjeta;
  const { error } = await supabase.from('fonditas').update(payload).eq('id', id);
  if (error) throw error;
}
