import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFavoritePatioIds } from './favorites';

const VIEWED_KEY = '@patio_viewed_ids';
const MAX_VIEWED = 100; // tope sano para no crecer sin límite

// Ids de fonditas que el foodie ha abierto, ORDENADOS del más reciente al más
// viejo. Antes se guardaba un Set (sin orden); seguimos leyendo ese formato por
// compatibilidad, pero al escribir usamos un arreglo ordenado para poder mostrar
// "lo que viste" en orden y entrar a cada ficha.
async function getViewedIds(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(VIEWED_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

// Lista pública de ids vistos (más reciente primero).
export async function getViewedPatioIds(): Promise<string[]> {
  return getViewedIds();
}

// Registra que se abrió una ficha. Se llama al entrar al detalle.
// Si ya estaba, lo mueve al frente (vista más reciente).
export async function registerPatioView(patioId: string): Promise<void> {
  if (!patioId) return;
  const current = await getViewedIds();
  const withoutId = current.filter((id) => id !== patioId);
  const next = [patioId, ...withoutId].slice(0, MAX_VIEWED);
  await AsyncStorage.setItem(VIEWED_KEY, JSON.stringify(next));
}

export type FoodieStats = {
  viewed: number;
  saved: number;
};

export async function getFoodieStats(): Promise<FoodieStats> {
  const [viewedIds, savedIds] = await Promise.all([getViewedIds(), getFavoritePatioIds()]);
  return { viewed: viewedIds.length, saved: savedIds.length };
}
