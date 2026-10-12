// Listas propias para organizar menús publicados — mismo patrón de
// colecciones que ya existe para Guardados (lib/collections.ts), pero
// puramente local: son una herramienta de organización personal del
// Fondero sobre su propio historial, sin visibilidad ni publicación.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { withStorageLock } from './storage-queue';

export type MenuCollection = {
  id: string;
  title: string;
  fechas: string[];
  createdAt: string;
};

const KEY = 'patio:menu-collections:v1';

// Los títulos de listas conservan espacios; las filas manejan su longitud.
export function normalizeMenuListTitle(title: string) {
  return title.replace(/\s+/g, ' ').trim().slice(0, 32);
}

async function saveAll(list: MenuCollection[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getMenuCollections(): Promise<MenuCollection[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  let parsed: unknown;
  try { parsed = JSON.parse(raw); }
  catch { throw new Error('No pudimos leer tus listas. Tus datos se conservan.'); }
  if (!Array.isArray(parsed) || parsed.some((item) => !item || typeof item.id !== 'string' || typeof item.title !== 'string' || !Array.isArray(item.fechas) || item.fechas.some((id: unknown) => typeof id !== 'string'))) {
    throw new Error('No pudimos leer tus listas. Tus datos se conservan.');
  }
  return parsed as MenuCollection[];
}

export async function createMenuCollection(title: string): Promise<MenuCollection> {
  return withStorageLock(KEY, async () => {
    const normalized = normalizeMenuListTitle(title);
    if (!normalized) throw new Error('Escribe un nombre para la lista.');
    const current = await getMenuCollections();
    const collection: MenuCollection = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: normalized,
      fechas: [],
      createdAt: new Date().toISOString(),
    };
    await saveAll([collection, ...current]);
    return collection;
  });
}

export async function renameMenuCollection(id: string, title: string): Promise<MenuCollection | null> {
  return withStorageLock(KEY, async () => {
    const current = await getMenuCollections();
    const target = current.find((item) => item.id === id);
    if (!target) return null;
    const normalized = normalizeMenuListTitle(title);
    if (!normalized) throw new Error('Escribe un nombre para la lista.');
    const next = { ...target, title: normalized };
    await saveAll(current.map((item) => (item.id === id ? next : item)));
    return next;
  });
}

export async function deleteMenuCollection(id: string): Promise<void> {
  return withStorageLock(KEY, async () => {
    const current = await getMenuCollections();
    await saveAll(current.filter((item) => item.id !== id));
  });
}

// Une varias fechas a la vez en una sola lectura/escritura — el mismo
// problema de condición de carrera que setPatiosInCollection/deleteLocalMenus
// (llamadas individuales en Promise.all pierden fechas).
export async function setMenusInCollection(collectionId: string, fechas: string[], present: boolean): Promise<MenuCollection | null> {
  return withStorageLock(KEY, async () => {
    const current = await getMenuCollections();
    const target = current.find((item) => item.id === collectionId);
    if (!target) return null;
    const nextFechas = present
      ? [...new Set([...target.fechas, ...fechas])]
      : target.fechas.filter((fecha) => !fechas.includes(fecha));
    const next = { ...target, fechas: nextFechas };
    await saveAll(current.map((item) => (item.id === collectionId ? next : item)));
    return next;
  });
}

// Al borrar un menú del historial, limpia su fecha de todas las listas para
// no dejar referencias muertas apuntando a un menú que ya no existe.
export async function removeFechasFromAllCollections(fechas: string[]): Promise<void> {
  return withStorageLock(KEY, async () => {
    const current = await getMenuCollections();
    const toRemove = new Set(fechas);
    await saveAll(current.map((item) => ({ ...item, fechas: item.fechas.filter((fecha) => !toRemove.has(fecha)) })));
  });
}

/** Atomically move only the explicitly selected source memberships. */
export async function moveMenusToCollection(menuIds: string[], sourceIds: string[], destinationId: string): Promise<MenuCollection[]> {
  return withStorageLock(KEY, async () => {
    const current = await getMenuCollections();
    const selected = new Set(menuIds);
    const sources = new Set(sourceIds);
    if (!selected.size || !sources.size || sources.has(destinationId)) throw new Error('Elige el origen y una lista de destino distinta.');
    const destination = current.find((item) => item.id === destinationId);
    if (!destination || [...sources].some((id) => !current.some((item) => item.id === id))) throw new Error('La lista ya no existe.');
    if ([...selected].some((id) => !current.some((item) => sources.has(item.id) && item.fechas.includes(id)))) throw new Error('El origen no contiene todos los menús seleccionados.');
    const next = current.map((item) => item.id === destinationId
      ? { ...item, fechas: [...new Set([...item.fechas, ...selected])] }
      : sources.has(item.id) ? { ...item, fechas: item.fechas.filter((id) => !selected.has(id)) } : item);
    await saveAll(next);
    return next.filter((item) => sources.has(item.id) || item.id === destinationId);
  });
}
