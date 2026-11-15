import AsyncStorage from '@react-native-async-storage/async-storage';

import { withStorageLock } from './storage-queue';

const FAVORITES_KEY = 'patio:favorites';

// Copia en memoria (2026-11-15): la ficha sabe al instante si ya sigues el
// lugar y el botón sale completo con todo lo demás, sin esperar al disco.
let memory: string[] | null = null;

/** Lo último que se leyó o escribió; null si aún no se ha leído en esta sesión. */
export function peekFavoritePatioIds(): string[] | null {
  return memory;
}

export async function getFavoritePatioIds() {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) { memory = []; return []; }

  try {
    const parsed = JSON.parse(raw);
    memory = Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    memory = [];
  }
  return memory;
}

async function writeFavorites(ids: string[]) {
  memory = Array.from(new Set(ids));
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(memory));
}

// Se lee una vez al abrir la app: al entrar a la primera ficha ya se sabe.
void getFavoritePatioIds().catch(() => {});

export async function setFavoritePatioIds(ids: string[]) {
  return withStorageLock(FAVORITES_KEY, () => writeFavorites(ids));
}

// El nuevo id va AL FRENTE (no al final): Guardados se lee más-reciente-
// primero, igual que Guardado de Instagram o Marcadores de Safari — antes
// se agregaba al final y lo que acababas de guardar quedaba hasta abajo
// (pedido de Alejandro 2026-08-30).
export async function toggleFavoritePatio(id: string) {
  return withStorageLock(FAVORITES_KEY, async () => {
    const current = await getFavoritePatioIds();
    const next = current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [id, ...current];
    await writeFavorites(next);
    return next;
  });
}

export async function removeFavoritePatio(id: string) {
  return withStorageLock(FAVORITES_KEY, async () => {
    const current = await getFavoritePatioIds();
    const next = current.filter((favoriteId) => favoriteId !== id);
    await writeFavorites(next);
    return next;
  });
}

// Una sola lectura/escritura para varios ids a la vez — llamar
// removeFavoritePatio en un Promise.all pierde ids (cada llamada lee el
// storage antes de que la anterior termine de escribir).
export async function removeFavoritePatios(ids: string[]) {
  return withStorageLock(FAVORITES_KEY, async () => {
    const current = await getFavoritePatioIds();
    const toRemove = new Set(ids);
    const next = current.filter((favoriteId) => !toRemove.has(favoriteId));
    await writeFavorites(next);
    return next;
  });
}
