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

// A diferencia de normalizeCollectionTitle (Guardados, lib/collections.ts),
// aquí SÍ se permiten espacios — esa versión los quita a propósito porque
// esos títulos se renderizan como pill compacta en la barra de filtros; una
// lista de menús se renderiza como fila normal de texto, sin esa
// restricción (bug reportado 2026-08-24: forzaba palabras pegadas).
export function normalizeMenuListTitle(title: string) {
  return title.replace(/\s+/g, ' ').trim().slice(0, 32);
}

async function saveAll(list: MenuCollection[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function getMenuCollections(): Promise<MenuCollection[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function createMenuCollection(title: string): Promise<MenuCollection> {
  return withStorageLock(KEY, async () => {
    const current = await getMenuCollections();
    const collection: MenuCollection = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: normalizeMenuListTitle(title),
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
    const next = { ...target, title: normalizeMenuListTitle(title) };
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
