import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@patio_ratings';

export type PatioRating = {
  stars: number;
  reasons?: string[];
  note?: string;
  photoUri?: string;
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

export type SaveRatingInput = {
  stars: number;
  reasons?: string[];
  note?: string;
  photoUri?: string;
};

// Acepta la firma corta (stars, reasons) por compatibilidad, o un objeto completo.
export async function savePatioRating(
  patioId: string,
  starsOrInput: number | SaveRatingInput,
  reasons?: string[],
): Promise<void> {
  const map = await getMap();
  const data: SaveRatingInput =
    typeof starsOrInput === 'number'
      ? { stars: starsOrInput, reasons }
      : starsOrInput;
  map[patioId] = {
    stars: data.stars,
    reasons: data.reasons,
    note: data.note?.trim() || undefined,
    photoUri: data.photoUri || undefined,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
}
