import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'patio:favorites';

export async function getFavoritePatioIds() {
  const raw = await AsyncStorage.getItem(FAVORITES_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export async function setFavoritePatioIds(ids: string[]) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export async function toggleFavoritePatio(id: string) {
  const current = await getFavoritePatioIds();
  const next = current.includes(id) ? current.filter((favoriteId) => favoriteId !== id) : [...current, id];
  await setFavoritePatioIds(next);
  return next;
}

export async function removeFavoritePatio(id: string) {
  const current = await getFavoritePatioIds();
  const next = current.filter((favoriteId) => favoriteId !== id);
  await setFavoritePatioIds(next);
  return next;
}
