// Historial local de menús publicados (AsyncStorage).
// Respaldo cuando no hay sesión con Supabase (p. ej. entrada DEV · Fondero):
// sin esto, "Usa un menú anterior" queda vacío para siempre.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { makePlatilloId, makeSectionId, normalizeMenuData, type MenuData } from './menu-store';

import { localMenuDate } from './menu-date';
import { withStorageLock } from './storage-queue';

const KEY = '@patio_menu_history';


export type LocalMenuEntry = { id: string; fecha: string; secciones: MenuData; nombre?: string; published: boolean };
export function newMenuDraftId(): string { return `draft:${makeSectionId()}`; }


// Las mutaciones leen dentro de la misma cola. Un fallo de lectura nunca
// se convierte en una lista vacía que sobrescriba el historial existente.
async function readLocalMenus(): Promise<LocalMenuEntry[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Historial inválido');
  return parsed.flatMap((entry): LocalMenuEntry[] => {
    if (!entry || typeof entry.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.fecha)) return [];
    const secciones = normalizeMenuData(entry.secciones);
    const nombre = typeof entry.nombre === 'string' ? entry.nombre.trim() : '';
    return secciones ? [{ id: typeof entry.id === 'string' ? entry.id : entry.fecha, fecha: entry.fecha, secciones, published: entry.published === true, ...(nombre ? { nombre } : {}) }] : [];
  }).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

type SaveOptions = { id?: string; published?: boolean; fecha?: string };

async function writeMenu(data: MenuData, nombre: string | undefined, options: SaveOptions): Promise<void> {
  const list = await readLocalMenus();
  const id = options.id ?? newMenuDraftId();
  const current = list.find((menu) => menu.id === id);
  const fecha = options.fecha ?? current?.fecha ?? localMenuDate();
  const published = options.published ?? false;
  const entry: LocalMenuEntry = {
    id, fecha, secciones: data, published,
    nombre: nombre === undefined ? current?.nombre : nombre.trim() || undefined,
  };
  // Una publicación por día en servidor; los otros borradores/versiones
  // permanecen guardados y seleccionables por su identidad propia.
  const other = list.filter((menu) => menu.id !== id).map((menu) =>
    published && menu.fecha === fecha ? { ...menu, published: false } : menu);
  await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...other]));
}

export async function saveLocalMenu(data: MenuData, nombre?: string, options: SaveOptions = {}): Promise<boolean> {
  return withStorageLock(KEY, async () => {
    try { await writeMenu(data, nombre, options); return true; } catch { return false; }
  });
}

// El cambio de cuenta espera toda la publicación, incluida la red. Las
// operaciones internas no vuelven a adquirir el lock y no pueden bloquearse.
export async function saveMenuPublication(data: MenuData, nombre: string | undefined, id: string, publish: (savedLocally: boolean) => Promise<void>): Promise<void> {
  return withStorageLock(KEY, async () => {
    const fecha = localMenuDate();
    let saved = false;
    try { await writeMenu(data, nombre, { id, fecha }); saved = true; } catch {}
    await publish(saved);
    try { await writeMenu(data, nombre, { id, fecha, published: true }); } catch {}
  });
}

export async function renameLocalMenu(id: string, nombre: string, secciones: MenuData, fecha = localMenuDate(), published = false): Promise<void> {
  return withStorageLock(KEY, async () => {
    const list = await readLocalMenus();
    const existing = list.find((menu) => menu.id === id);
    const cleanName = nombre.trim();
    const entry: LocalMenuEntry = {
      id, fecha: existing?.fecha ?? fecha, secciones: existing?.secciones ?? secciones,
      published: existing?.published ?? published, ...(cleanName ? { nombre: cleanName } : {}),
    };
    await AsyncStorage.setItem(KEY, JSON.stringify([entry, ...list.filter((menu) => menu.id !== id)]));
  });
}

export async function deleteLocalMenu(id: string): Promise<void> { return deleteLocalMenus([id]); }

export async function deleteLocalMenus(ids: string[]): Promise<void> {
  return withStorageLock(KEY, async () => {
    const list = await readLocalMenus();
    const toRemove = new Set(ids);
    await AsyncStorage.setItem(KEY, JSON.stringify(list.filter((menu) => !toRemove.has(menu.id))));
  });
}

export async function getLocalMenus(): Promise<LocalMenuEntry[]> {
  try { return await readLocalMenus(); } catch { return []; }
}

export async function getLatestLocalMenu(): Promise<MenuData | null> {
  const menus = await getLocalMenus();
  return menus[0]?.secciones ?? null;
}

// ─── Modo demo (solo DEV) ─────────────────────────────────────────────────────
// Siembra menús de ejemplo en días pasados para poder recorrer historial /
// "usar menú anterior" sin depender de la imaginación. No corre en producción.

function demoMenu(platillos: [string, string][], bebidas: [string, string][]): MenuData {
  const seccion = (nombre: string, items: [string, string][]) => ({
    id: makeSectionId(),
    nombre,
    precio: '',
    platillos: items.map(([n, d]) => ({ id: makePlatilloId(), nombre: n, descripcion: d, precio: '' })),
  });
  return { secciones: [seccion('MENÚ DEL DÍA', platillos), seccion('BEBIDAS', bebidas)] };
}

const DEMO_MENUS: [number, MenuData][] = [
  [1, demoMenu(
    [['Mole con pollo', 'Pierna o muslo, arroz rojo y tortillas'], ['Chiles rellenos', 'De queso, caldillo de jitomate'], ['Sopa de fideo', '']],
    [['Agua de jamaica', ''], ['Agua de horchata', '']],
  )],
  [2, demoMenu(
    [['Milanesa de res', 'Con ensalada y frijoles'], ['Enchiladas verdes', 'Pollo, crema y queso'], ['Consomé de pollo', '']],
    [['Agua de limón con chía', '']],
  )],
  [4, demoMenu(
    [['Pozole rojo', 'Con tostadas, crema y lechuga'], ['Tacos dorados', 'De papa o pollo, 4 piezas'], ['Arroz con huevo', '']],
    [['Agua de tamarindo', ''], ['Café de olla', '']],
  )],
];

export async function seedDemoHistory(): Promise<void> {
  if (!__DEV__) return;
  const existing = await getLocalMenus();
  if (existing.length > 0) return;
  const entries: LocalMenuEntry[] = DEMO_MENUS.map(([daysAgo, secciones]) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return { id: localMenuDate(d), fecha: localMenuDate(d), secciones, published: true };
  });
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {}
}
