// Equipo del negocio (fase 1, docs/SUCURSALES_Y_EQUIPO_2026-11-23.md §3).
// Cada persona entra con su propio correo; el dueño la invita con un rol.
// Todo lo que se publica o cambia queda en el Registro de actividad.
import { supabase } from './supabase';

export type TeamRole = 'propietario' | 'administrador';

export type MyRole = { rol: TeamRole; principal: boolean };

export type TeamEntry =
  | { kind: 'person'; id: string; userId: string; name: string; email: string | null; role: TeamRole; principal: boolean; since: string }
  | { kind: 'invite'; id: string; email: string; role: TeamRole; since: string; expiresAt: string };

export type ActivityEntry = { id: number; action: string; detail: Record<string, unknown>; at: string; userId: string | null; name: string };

export const ROLE_LABEL: Record<TeamRole, string> = { propietario: 'Propietario', administrador: 'Administrador' };

/** Lo que puede hacer cada rol, en una línea (la palabra de Google). */
export const ROLE_HELP: Record<TeamRole, string> = {
  administrador: 'Publica el menú, marca lo que se acabó, avisa y responde reseñas.',
  propietario: 'Todo lo del administrador, y también invita y quita personas.',
};

export const INVITE_DAYS = 7;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string): boolean {
  return EMAIL.test(normalizeEmail(value));
}

function serverCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const { message, details } = error as { message?: unknown; details?: unknown };
  return [message, details].filter((part) => typeof part === 'string').join(' ');
}

/** Frase para la persona según lo que respondió el servidor. */
export function teamErrorMessage(error: unknown, fallback: string): string {
  const code = serverCode(error);
  if (code.includes('ALREADY_IN_TEAM')) return 'Esa persona ya está en tu equipo.';
  if (code.includes('INVALID_EMAIL')) return 'Revisa el correo: le falta algo.';
  if (code.includes('not authorized')) return 'Solo un propietario puede hacer esto.';
  return fallback;
}

/**
 * El negocio de quien entra: el suyo o el del equipo donde está. Entrar al
 * lado del negocio con un correo invitado acepta la invitación. Si el
 * servidor todavía no tiene la función, se usa la forma anterior.
 */
export async function myBusinessId(userId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('mi_negocio');
  if (!error) return typeof data === 'string' ? data : null;
  if (!/mi_negocio|PGRST202|function/i.test(serverCode(error))) throw error;
  const legacy = await supabase.from('negocios').select('id').eq('owner_id', userId).maybeSingle();
  if (legacy.error) throw legacy.error;
  return legacy.data?.id ?? null;
}

export async function getMyRole(negocioId: string): Promise<MyRole | null> {
  const { data, error } = await supabase.rpc('mi_rol', { p_negocio: negocioId });
  if (error) throw error;
  const row = (data as { rol: TeamRole; principal: boolean }[] | null)?.[0];
  return row ? { rol: row.rol, principal: row.principal } : null;
}

type TeamRow = { tipo: 'persona' | 'invitacion'; id: string; user_id: string | null; nombre: string | null; correo: string | null; rol: TeamRole; principal: boolean; desde: string; vence_at: string | null };

export async function getTeam(negocioId: string): Promise<TeamEntry[]> {
  const { data, error } = await supabase.rpc('equipo_del_negocio', { p_negocio: negocioId });
  if (error) throw error;
  return sortTeam(((data as TeamRow[] | null) ?? []).map((row): TeamEntry => row.tipo === 'persona'
    ? { kind: 'person', id: row.id, userId: row.user_id ?? '', name: row.nombre?.trim() || 'Persona del equipo', email: row.correo, role: row.rol, principal: row.principal, since: row.desde }
    : { kind: 'invite', id: row.id, email: row.correo ?? '', role: row.rol, since: row.desde, expiresAt: row.vence_at ?? row.desde }));
}

/** Propietario principal primero, luego propietarios, administradores e invitaciones. */
export function sortTeam(entries: TeamEntry[]): TeamEntry[] {
  const rank = (entry: TeamEntry) => entry.kind === 'invite' ? 3 : entry.principal ? 0 : entry.role === 'propietario' ? 1 : 2;
  return [...entries].sort((a, b) => rank(a) - rank(b) || a.since.localeCompare(b.since));
}

export async function inviteToTeam(negocioId: string, email: string, role: TeamRole): Promise<void> {
  const { error } = await supabase.rpc('invitar_al_equipo', { p_negocio: negocioId, p_correo: normalizeEmail(email), p_rol: role });
  if (error) throw error;
}

export async function cancelInvite(inviteId: string): Promise<void> {
  const { error } = await supabase.rpc('cancelar_invitacion', { p_invitacion: inviteId });
  if (error) throw error;
}

/** Quitar a alguien, o salirse (con la fila propia). */
export async function removeFromTeam(memberId: string): Promise<void> {
  const { error } = await supabase.rpc('quitar_del_equipo', { p_equipo: memberId });
  if (error) throw error;
}

/** Mensaje que manda quien invita (WhatsApp, SMS…): qué hacer y con qué correo. */
export function inviteMessage(businessName: string, email: string): string {
  const name = businessName.trim() || 'mi negocio';
  return `Te invité al equipo de ${name} en Patio para publicar lo que hay hoy. `
    + `Descarga Patio, toca «Publicar lo que preparo» y entra con este correo: ${normalizeEmail(email)}. `
    + `La invitación dura ${INVITE_DAYS} días.`;
}

type ActivityRow = { id: number; accion: string; detalle: Record<string, unknown> | null; created_at: string; user_id: string | null; nombre: string };

export async function getActivity(negocioId: string, before?: string): Promise<ActivityEntry[]> {
  const { data, error } = await supabase.rpc('registro_del_negocio', { p_negocio: negocioId, p_antes: before ?? null, p_limite: 60 });
  if (error) throw error;
  return ((data as ActivityRow[] | null) ?? []).map((row) => ({
    id: row.id, action: row.accion, detail: row.detalle ?? {}, at: row.created_at, userId: row.user_id, name: row.nombre,
  }));
}

const FIELD_LABEL: Record<string, string> = {
  nombre: 'el nombre', descripcion: 'la descripción', direccion: 'la dirección', direccion_visible: 'la dirección',
  latitude: 'la ubicación', longitude: 'la ubicación', horario: 'el horario', horario_semanal: 'el horario',
  logo_url: 'el logo', foto_url: 'la foto del lugar', pagos_efectivo: 'los pagos', pagos_tarjeta: 'los pagos',
  pagos_transferencia: 'los pagos', tipo_negocio: 'el giro', categorias: 'el giro', featured_dish: 'el platillo destacado',
  contacto_telefono: 'el teléfono', contacto_whatsapp: 'el teléfono', modalidad: 'cómo vende', pedidos_hasta: 'los pedidos',
  ritmo: 'cada cuánto cambia el menú',
};

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function list(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`;
}

/** Lo que hizo la persona, sin su nombre: «publicó el menú», «marcó Se acabó: Pozole». */
export function describeActivity(entry: Pick<ActivityEntry, 'action' | 'detail'>): string {
  const d = entry.detail;
  switch (entry.action) {
    case 'publico_menu': return 'publicó el menú';
    case 'actualizo_menu': return 'actualizó el menú';
    case 'programo_menu': return 'programó un menú';
    case 'retiro_menu': return 'retiró el menú';
    case 'se_acabo': return text(d.platillo) ? `marcó Se acabó: ${text(d.platillo)}` : 'marcó Se acabó';
    case 'hay_otra_vez': return text(d.platillo) ? `volvió a ofrecer ${text(d.platillo)}` : 'volvió a ofrecer un platillo';
    case 'cambio_carta': return 'cambió la carta';
    case 'confirmo_precios': return 'confirmó los precios de la carta';
    case 'aviso': return 'mandó un aviso';
    case 'aviso_especial': return 'mandó un aviso especial';
    case 'respondio_resena': return 'respondió una reseña';
    case 'invito': return text(d.correo) ? `invitó a ${text(d.correo)}` : 'invitó a alguien';
    case 'cancelo_invitacion': return text(d.correo) ? `canceló la invitación de ${text(d.correo)}` : 'canceló una invitación';
    case 'entro_al_equipo': return 'entró al equipo';
    case 'salio_del_equipo': return 'salió del equipo';
    case 'quito_del_equipo': return text(d.persona) ? `quitó del equipo a ${text(d.persona)}` : 'quitó a alguien del equipo';
    case 'edito_negocio': {
      const fields = Array.isArray(d.campos) ? [...new Set((d.campos as unknown[]).map((field) => FIELD_LABEL[String(field)]).filter(Boolean))] : [];
      return fields.length ? `cambió ${list(fields)}` : 'editó el negocio';
    }
    default: return 'hizo un cambio';
  }
}

/** «1:05 p. m.» en la hora de la Ciudad de México. */
export function activityTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Mexico_City', hour: 'numeric', minute: '2-digit', hour12: true }).formatToParts(date);
  const hour = parts.find((part) => part.type === 'hour')?.value ?? '';
  const minute = parts.find((part) => part.type === 'minute')?.value ?? '';
  const pm = (parts.find((part) => part.type === 'dayPeriod')?.value ?? '').toUpperCase() === 'PM';
  return `${hour}:${minute} ${pm ? 'p. m.' : 'a. m.'}`;
}

/** Día de la Ciudad de México en formato AAAA-MM-DD, para agrupar. */
export function activityDay(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}
