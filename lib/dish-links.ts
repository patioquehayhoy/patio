import AsyncStorage from '@react-native-async-storage/async-storage';

import { dishKey } from './dish-identity';

// Pares de nombres que el negocio dijo que NO son el mismo platillo
// (2026-11-15): la sugerencia no vuelve a salir para ese par.
const KEY = '@patio_dish_not_same';

function pairOf(a: string, b: string): string {
  return [dishKey(a), dishKey(b)].sort().join('|');
}

export async function getDeclinedDishPairs(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []);
  } catch {
    return new Set();
  }
}

export function isDeclinedPair(declined: Set<string>, a: string, b: string): boolean {
  return declined.has(pairOf(a, b));
}

export async function declineDishPair(a: string, b: string): Promise<Set<string>> {
  const declined = await getDeclinedDishPairs();
  declined.add(pairOf(a, b));
  try { await AsyncStorage.setItem(KEY, JSON.stringify([...declined].slice(-300))); } catch {}
  return declined;
}
