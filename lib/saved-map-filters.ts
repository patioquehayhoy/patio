import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'patio:saved-map-categories';

export async function getSavedMapCategories(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const value = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  } catch {
    return [];
  }
}

export async function setSavedMapCategories(categories: string[]) {
  const unique = Array.from(new Set(categories));
  await AsyncStorage.setItem(KEY, JSON.stringify(unique));
  return unique;
}

