import { aiFunctionError } from '@/lib/edge-function-error';
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
  // `tipo` es el tag PRIMARIO (el primero elegido) — se conserva por
  // compatibilidad: sigue siendo lo que persiste en `tipo_negocio` y lo que
  // decide el perfil de lectura de menú (visión) y las secciones sugeridas.
  tipo: BusinessType;
  // Multi-tag real: hasta 3 etiquetas elegidas en el alta (modelo Google
  // Places/Yelp). `tipo` siempre es `tipos[0]`. Vacío hasta que la persona
  // elige al menos una.
  tipos: BusinessType[];
  especialidades: string[];
  /** Texto libre cuando eligen «Otro»: alimenta los giros nuevos. */
  otroGiro?: string;
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
  | 'botanas'
  | 'bebidas'
  | 'jugos'
  | 'cafeteria'
  | 'restaurante'
  | 'otro';

// Etiqueta atómica pública por tag (columna `categorias`, chips de filtro).
// 'elotes' aquí es SOLO "Elotes" (ya no compuesto) — Botanas es su propio tag.
export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  fondita: 'Fondita',
  taqueria: 'Taquería',
  reposteria: 'Repostería',
  mariscos: 'Mariscos',
  antojitos: 'Antojitos',
  elotes: 'Elotes',
  botanas: 'Botanas',
  bebidas: 'Bebidas',
  jugos: 'Jugos y fruta',
  cafeteria: 'Cafetería',
  restaurante: 'Restaurante',
  otro: 'Otro',
};

// «Otro» guarda lo que la persona escribió (p. ej. «Tamales») en lugar de
// perderlo; ese texto es la fuente del recopilado de giros nuevos.
export function categoryLabel(id: BusinessType, otroGiro?: string): string {
  const custom = id === 'otro' ? otroGiro?.trim().replace(/\s+/g, ' ') : '';
  return custom ? custom.charAt(0).toLocaleUpperCase('es-MX') + custom.slice(1) : BUSINESS_TYPE_LABELS[id];
}

export async function prepareSmartSetup(relato: string): Promise<SmartSetupResult> {
  const { data, error } = await supabase.functions.invoke('smart-setup', {
    body: { relato: relato.trim() },
  });
  if (error) throw await aiFunctionError(error, 'No pudimos preparar tu Patio. Inténtalo de nuevo.');
  if (!data || typeof data !== 'object' || !Array.isArray(data.horario)) {
    throw new Error('Patio recibió una respuesta incompleta');
  }
  const result = data as SmartSetupResult;
  // La función smart-setup (alta conversacional) todavía solo extrae un tipo
  // primario; lo tratamos como el primer tag hasta que ese backend también
  // hable multi-tag.
  if (!Array.isArray(result.tipos) || result.tipos.length === 0) {
    result.tipos = result.tipo ? [result.tipo] : [];
  }
  return result;
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
  const tipos = result.tipos.length ? result.tipos : [result.tipo];
  const payload: Record<string, unknown> = {
    nombre: result.nombre.trim(),
    // Tag primario, por compatibilidad (perfil de visión, secciones sugeridas).
    tipo_negocio: tipos[0],
    // Multi-tag real (migración 20260816). Si el proyecto de Supabase todavía
    // no tiene la columna, Postgres rechaza el update completo por esa clave
    // desconocida — por eso se intenta aparte y se degrada sin bloquear el alta.
    categorias: tipos.map((id) => categoryLabel(id, result.otroGiro)),
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
  if (error) {
    // Si el proyecto de Supabase todavía no tiene la columna `categorias`
    // (migración 20260816 sin aplicar), reintenta sin ella para no bloquear
    // el alta completa por un solo campo nuevo.
    if (/categorias/i.test(error.message ?? '')) {
      const { categorias: _categorias, ...fallbackPayload } = payload;
      const retry = await supabase.from('fonditas').update(fallbackPayload).eq('id', id);
      if (retry.error) throw retry.error;
      return;
    }
    throw error;
  }
}
