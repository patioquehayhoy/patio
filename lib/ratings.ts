import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@patio_ratings';

export type PatioRating = {
  stars: number;
  reasons?: string[];
  timestamp: number;
};

type RatingsMap = Record<string, PatioRating>;

async function getMap(): Promise<RatingsMap> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as RatingsMap) : {};
}

export async function getPatioRating(patioId: string): Promise<PatioRating | null> {
  const map = await getMap();
  return map[patioId] ?? null;
}

export async function savePatioRating(patioId: string, stars: number, reasons?: string[]): Promise<void> {
  const map = await getMap();
  map[patioId] = { stars, reasons, timestamp: Date.now() };
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}
