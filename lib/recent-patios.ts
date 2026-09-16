import AsyncStorage from '@react-native-async-storage/async-storage';
import { withStorageLock } from '@/lib/storage-queue';

export type RecentPatio = { patioId: string; kind: 'opened' | 'searched' | 'visited'; at: string; name?: string; area?: string };
const KEY = 'patio:recent-patios:v1';

export async function getRecentPatios(): Promise<RecentPatio[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const entries: unknown = raw ? JSON.parse(raw) : [];
  if (!Array.isArray(entries)) return [];
  return entries.filter((entry): entry is RecentPatio => entry && typeof entry.patioId === 'string' && ['opened', 'searched', 'visited'].includes(entry.kind) && Number.isFinite(Date.parse(entry.at))).slice(0, 40);
}

export async function recordRecentPatio(patio: string | { id: string; name: string; area: string }, kind: RecentPatio['kind']) {
  const patioId = typeof patio === 'string' ? patio : patio.id;
  if (!patioId) return;
  return withStorageLock(KEY, async () => {
    const entries = await getRecentPatios();
    const previous = entries.find((entry) => entry.patioId === patioId);
    // Opening the destination immediately after a search/visit keeps its context.
    const keepContext = kind === 'opened' && previous && Date.now() - Date.parse(previous.at) < 10_000;
    const next: RecentPatio = {
      patioId, kind: keepContext && previous ? previous.kind : kind, at: new Date().toISOString(),
      name: typeof patio === 'string' ? previous?.name : patio.name,
      area: typeof patio === 'string' ? previous?.area : patio.area,
    };
    await AsyncStorage.setItem(KEY, JSON.stringify([next, ...entries.filter((entry) => entry.patioId !== patioId)].slice(0, 40)));
  });
}

export function clearRecentPatios() {
  return withStorageLock(KEY, () => AsyncStorage.removeItem(KEY));
}
