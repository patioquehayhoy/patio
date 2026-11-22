import AsyncStorage from '@react-native-async-storage/async-storage';

// Ritmo del menú (2026-11-21, migración 20261121140000): 'diario' si cambia
// cada día (fondas, comida corrida, venta en casa) o 'carta' si casi siempre
// es el mismo (tacos, postres, café…). Con 'diario' el aviso es «¿Ya
// publicaste lo de hoy?»; con 'carta', uno al mes «¿Siguen igual tus precios?».

export type Ritmo = 'diario' | 'carta';

const KEY = '@patio_ritmo';
// Giros que casi siempre venden lo mismo (lib/smart-setup.ts, BUSINESS_TYPE_LABELS).
const CARTA_GIROS = new Set(['taqueria', 'reposteria', 'mariscos', 'antojitos', 'elotes', 'botanas', 'bebidas', 'jugos', 'cafeteria', 'restaurante']);

export function isRitmo(value: unknown): value is Ritmo {
  return value === 'diario' || value === 'carta';
}

/** Sin elegir todavía: según el giro (lo que no se sabe, diario: el lado difícil). */
export function defaultRitmo(tipo: string | null | undefined): Ritmo {
  return tipo && CARTA_GIROS.has(tipo) ? 'carta' : 'diario';
}

export async function getCachedRitmo(): Promise<Ritmo | null> {
  const value = await AsyncStorage.getItem(KEY).catch(() => null);
  return isRitmo(value) ? value : null;
}

export async function setCachedRitmo(ritmo: Ritmo): Promise<void> {
  await AsyncStorage.setItem(KEY, ritmo).catch(() => {});
}
