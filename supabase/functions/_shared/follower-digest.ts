// Resumen de los lugares que sigues (2026-11-21), sin dependencias de Deno
// para probarlo en Node (scripts/tests/follower-digest.test.cjs). Hasta dos
// notificaciones por resumen: quién publicó (y quién no abre hoy) y, aparte,
// quién tiene promoción. Formato de siempre: título = quién; cuerpo = el hecho.
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
    const names = (list: DigestCandidate[]) => list.map((row) => row.nombre.trim());
    const push = (list: DigestCandidate[], title: string, body: string) => {
      const places = new Set(list.map((row) => row.negocio_id));
      digests.push({
        userId,
        title,
        body,
        // Un solo lugar: su ficha. Varios: tus lugares.
        data: places.size === 1 ? { type: 'follow_digest', patioId: [...places][0] } : { type: 'follow_digest', route: '/favoritos' },
        items: list.map((row) => ({ negocioId: row.negocio_id, kind: row.kind })),
      });
    };
    // Dos notificaciones, no una larga (Parco, 2026-11-21): publicar y
    // promocionar son cosas distintas.
    // 1. Lo de hoy: quién publicó y, si alguno no abre, una frase corta.
    if (menus.length) {
      const sentences = [menus.length === 1 ? 'Publicó su menú de hoy.' : 'Publicaron su menú de hoy.'];
      if (closed.length) sentences.push(more(names(closed), 'no abre hoy.', 'no abren hoy.'));
      push([...menus, ...closed], namesTitle(names(menus)), sentences.join(' '));
    } else if (closed.length) {
      push(closed, namesTitle(names(closed)), closed.length === 1 ? 'No abre hoy.' : 'No abren hoy.');
    }
    // 2. Las promociones, aparte: una sola con su texto; varias, quiénes.
    if (promos.length) {
      push(promos, namesTitle(names(promos)), promos.length === 1 ? (promos[0].body?.trim() || 'Tiene promoción hoy.') : 'Tienen promoción hoy.');
    }
  }
  return digests;
}
