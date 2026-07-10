// Historial local de menús publicados (AsyncStorage).
// Respaldo cuando no hay sesión con Supabase (p. ej. entrada DEV · Fondero):
// sin esto, "Usa un menú anterior" queda vacío para siempre.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { makePlatilloId, makeSectionId, normalizeMenuData, type MenuData } from './menu-store';

const KEY = '@patio_menu_history';
const MAX = 30;

export type LocalMenuEntry = { fecha: string; secciones: MenuData; nombre?: string };

function hoy(): string {
  return new Date().toISOString().split('T')[0];
}

export async function saveLocalMenu(data: MenuData): Promise<void> {
  try {
    const list = await getLocalMenus();
    const current = list.find((m) => m.fecha === hoy());
    const next = [{ fecha: hoy(), secciones: data, nombre: current?.nombre }, ...list.filter((m) => m.fecha !== hoy())].slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Persistencia local es best-effort: nunca debe bloquear la publicación.
  }
}

export async function renameLocalMenu(fecha: string, nombre: string, secciones: MenuData): Promise<void> {
  try {
    const cleanName = nombre.trim();
    const list = await getLocalMenus();
    const existing = list.find((menu) => menu.fecha === fecha);
    const nextEntry: LocalMenuEntry = {
      fecha,
      secciones: existing?.secciones ?? secciones,
      ...(cleanName ? { nombre: cleanName } : {}),
    };
    const next = [nextEntry, ...list.filter((menu) => menu.fecha !== fecha)]
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, MAX);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // El nombre es un nicety local; si falla, el historial sigue funcionando.
  }
}

export async function getLocalMenus(): Promise<LocalMenuEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => {
        if (!entry || typeof entry.fecha !== 'string') return null;
        const secciones = normalizeMenuData(entry.secciones);
        const nombre = typeof entry.nombre === 'string' ? entry.nombre.trim() : '';
        return secciones ? { fecha: entry.fecha, secciones, ...(nombre ? { nombre } : {}) } : null;
      })
      .filter((entry): entry is LocalMenuEntry => entry !== null);
  } catch {
    return [];
  }
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
    return { fecha: d.toISOString().split('T')[0], secciones };
  });
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(entries));
  } catch {}
}
