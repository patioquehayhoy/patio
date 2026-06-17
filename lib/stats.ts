import AsyncStorage from '@react-native-async-storage/async-storage';

import { getFavoritePatioIds } from './favorites';

const VIEWED_KEY = '@patio_viewed_ids';

// Conjunto de ids de fonditas que el foodie ha abierto (vistas únicas).
async function getViewedSet(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(VIEWED_KEY);
  return new Set<string>(raw ? (JSON.parse(raw) as string[]) : []);
}

// Registra que se abrió una ficha. Se llama al entrar al detalle.
export async function registerPatioView(patioId: string): Promise<void> {
  if (!patioId) return;
  const set = await getViewedSet();
  if (set.has(patioId)) return;
  set.add(patioId);
  await AsyncStorage.setItem(VIEWED_KEY, JSON.stringify([...set]));
}

export type FoodieStats = {
  viewed: number;
  saved: number;
};

export async function getFoodieStats(): Promise<FoodieStats> {
  const [viewedSet, savedIds] = await Promise.all([getViewedSet(), getFavoritePatioIds()]);
  return { viewed: viewedSet.size, saved: savedIds.length };
}
