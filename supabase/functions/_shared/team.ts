import type { requireUser } from './auth.ts';

type Admin = Awaited<ReturnType<typeof requireUser>>['admin'];
export type TeamAction = 'operar' | 'marca' | 'carta' | 'equipo' | 'pago';

/**
 * ¿Esta persona puede hacer esto en ese negocio? El dueño siempre; las demás
 * personas según su rol y alcance en el equipo (`puede_persona`, migración
 * 20261124090000). Si la consulta falla, la respuesta es no.
 */
export async function canAct(admin: Admin, userId: string, negocio: { id: string; owner_id?: string | null }, action: TeamAction = 'operar'): Promise<boolean> {
  if (negocio.owner_id && negocio.owner_id === userId) return true;
  try {
    const { data, error } = await admin.rpc('puede_persona', { p_user: userId, p_negocio: negocio.id, p_accion: action });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** Dueño y equipo del negocio: a quién le llegan los avisos del negocio. */
export async function teamUserIds(admin: Admin, negocio: { id: string; owner_id?: string | null }): Promise<string[]> {
  const ids = new Set<string>(negocio.owner_id ? [negocio.owner_id] : []);
  try {
    const { data: row } = await admin.from('negocios').select('marca_id').eq('id', negocio.id).maybeSingle();
    const marca = (row as { marca_id?: string | null } | null)?.marca_id;
    if (marca) {
      const { data: people } = await admin.from('equipo').select('user_id').eq('marca_id', marca);
      for (const person of (people as { user_id: string }[] | null) ?? []) ids.add(person.user_id);
    }
  } catch {
    // Sin equipo legible, al menos le llega al dueño.
  }
  return [...ids];
}
