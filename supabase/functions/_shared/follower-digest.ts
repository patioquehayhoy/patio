// Resumen de los lugares que sigues (2026-11-21), sin dependencias de Deno
// para probarlo en Node (scripts/tests/follower-digest.test.cjs). Un solo
// aviso con quién publicó, quién tiene promoción y quién no abre hoy, con el
// formato de siempre: título = quién; cuerpo = el hecho.
import { cdmxNow, followersShouldHear } from './publication-window.ts';

export type DigestCandidate = {
  user_id: string;
  negocio_id: string;
  nombre: string;
  kind: 'menu' | 'promo' | 'closed';
  at: string;
  horario_semanal: unknown;
  body: string | null;
};
export type DigestPrefs = { menus: boolean; promos: boolean };
/** 8:00 (desayunos), 11:30 (comida) y 17:30 (solo si hubo algo nuevo). */
export type DigestSlot = 'manana' | 'mediodia' | 'tarde';

// El de las 8:00 es para los lugares que abren antes de las 10: un desayuno
// que sale en el resumen de las 11:30 ya no le sirve a nadie.
const BREAKFAST_OPENS_BEFORE = 10 * 60;
function opensEarly(horario: unknown, weekday: number): boolean {
  if (!Array.isArray(horario)) return false;
  const day = horario.find((entry) => entry && typeof entry === 'object' && (entry as { dia?: unknown }).dia === weekday) as { cerrado?: unknown; abre?: unknown } | undefined;
  if (!day || day.cerrado === true || typeof day.abre !== 'string') return false;
  const match = /^(\d{1,2}):(\d{2})$/.exec(day.abre);
  return !!match && Number(match[1]) * 60 + Number(match[2]) < BREAKFAST_OPENS_BEFORE;
}
export type FollowerDigest = {
  userId: string;
  title: string;
  body: string;
  data: Record<string, string>;
  items: { negocioId: string; kind: DigestCandidate['kind'] }[];
};

// Lo que cabe en el título de un aviso sin que el sistema lo corte (Patio).
const TITLE_FIT = 38;

/** «Fonda Lupita» · «Fonda Lupita y Tacos El Güero» · «Fonda Lupita, Tacos El Güero y 5 más». */
export function namesTitle(names: string[]): string {
  if (names.length <= 1) return names[0] ?? '';
  const [first, second] = names;
  if (names.length === 2) {
    const both = `${first} y ${second}`;
    return both.length <= TITLE_FIT ? both : `${first} y 1 más`;
  }
  const two = `${first}, ${second} y ${names.length - 2} más`;
  return two.length <= TITLE_FIT ? two : `${first} y ${names.length - 1} más`;
}

const unique = (rows: DigestCandidate[]) => {
  const seen = new Set<string>();
  return [...rows]
    .sort((a, b) => a.at.localeCompare(b.at))
    .filter((row) => (seen.has(row.negocio_id) ? false : (seen.add(row.negocio_id), true)));
};
const more = (names: string[], one: string, many: string) => (names.length === 1 ? `${names[0]} ${one}` : `${names[0]} y ${names.length - 1} más ${many}`);

export function buildFollowerDigests(rows: DigestCandidate[], now: Date, prefsFor: (userId: string) => DigestPrefs, slot: DigestSlot = 'mediodia'): FollowerDigest[] {
  const weekday = cdmxNow(now).weekday;
  const inSlot = slot === 'manana' ? rows.filter((row) => opensEarly(row.horario_semanal, weekday)) : rows;
  const byUser = new Map<string, DigestCandidate[]>();
  for (const row of inSlot) byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row]);
  const digests: FollowerDigest[] = [];
  for (const [userId, items] of byUser) {
    const prefs = prefsFor(userId);
    // Un menú solo cuenta si el lugar sigue abierto (nadie llega a un lugar cerrado).
    const menus = prefs.menus ? unique(items.filter((row) => row.kind === 'menu' && followersShouldHear(row.horario_semanal, now))) : [];
    const promos = prefs.promos ? unique(items.filter((row) => row.kind === 'promo')) : [];
    const menuIds = new Set(menus.map((row) => row.negocio_id));
    const closed = prefs.menus ? unique(items.filter((row) => row.kind === 'closed' && !menuIds.has(row.negocio_id))) : [];
    if (!menus.length && !promos.length && !closed.length) continue;
    const names = (list: DigestCandidate[]) => list.map((row) => row.nombre.trim());
    let title: string;
    const sentences: string[] = [];
    if (menus.length) {
      title = namesTitle(names(menus));
      sentences.push(menus.length === 1 ? 'Publicó su menú de hoy.' : 'Publicaron su menú de hoy.');
      if (promos.length) sentences.push(more(names(promos), 'tiene promoción hoy.', 'tienen promoción hoy.'));
    } else if (promos.length) {
      title = namesTitle(names(promos));
      sentences.push(promos.length === 1 ? (promos[0].body?.trim() || 'Tiene promoción hoy.') : 'Tienen promoción hoy.');
    } else {
      title = namesTitle(names(closed));
      sentences.push(closed.length === 1 ? 'No abre hoy.' : 'No abren hoy.');
    }
    if (closed.length && (menus.length || promos.length)) sentences.push(more(names(closed), 'no abre hoy.', 'no abren hoy.'));
    const included = [...menus, ...promos, ...closed];
    const places = new Set(included.map((row) => row.negocio_id));
    digests.push({
      userId,
      title,
      body: sentences.join(' '),
      // Un solo lugar: su ficha. Varios: tus lugares.
      data: places.size === 1 ? { type: 'follow_digest', patioId: [...places][0] } : { type: 'follow_digest', route: '/favoritos' },
      items: included.map((row) => ({ negocioId: row.negocio_id, kind: row.kind })),
    });
  }
  return digests;
}
