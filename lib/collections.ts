import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { getFavoritePatioIds } from '@/lib/favorites';

export type CollectionVisibility = 'private' | 'unlisted' | 'public';

export type PatioCollection = {
  id: string;
  title: string;
  description: string;
  visibility: CollectionVisibility;
  patioIds: string[];
  createdAt: string;
  remoteId?: string;
};

export type SavedPatioMeta = {
  patioId: string;
  note?: string;
  status?: 'want_to_go' | 'visited';
  rating?: number;
};

const KEY = 'patio:collections:v1';
const META_KEY = 'patio:saved-meta:v1';

export async function getCollections(): Promise<PatioCollection[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function createCollection(title: string, visibility: CollectionVisibility = 'private') {
  const current = await getCollections();
  const collection: PatioCollection = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    description: '',
    visibility,
    patioIds: [],
    createdAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify([collection, ...current]));
  return collection;
}

export async function updateCollection(next: PatioCollection) {
  const current = await getCollections();
  await AsyncStorage.setItem(KEY, JSON.stringify(current.map((item) => item.id === next.id ? next : item)));
}

export async function getCollection(id: string) {
  return (await getCollections()).find((item) => item.id === id) ?? null;
}

export async function togglePatioInCollection(collectionId: string, patioId: string) {
  const collection = await getCollection(collectionId);
  if (!collection) return null;
  const patioIds = collection.patioIds.includes(patioId)
    ? collection.patioIds.filter((id) => id !== patioId)
    : [...collection.patioIds, patioId];
  const next = { ...collection, patioIds };
  await updateCollection(next);
  return next;
}

export async function getSavedPatioMeta(patioId: string): Promise<SavedPatioMeta> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return { patioId };
  try {
    const all = JSON.parse(raw) as SavedPatioMeta[];
    return all.find((item) => item.patioId === patioId) ?? { patioId };
  } catch {
    return { patioId };
  }
}

export async function saveSavedPatioMeta(meta: SavedPatioMeta) {
  const raw = await AsyncStorage.getItem(META_KEY);
  let all: SavedPatioMeta[] = [];
  try { all = raw ? JSON.parse(raw) : []; } catch {}
  const next = [...all.filter((item) => item.patioId !== meta.patioId), meta];
  await AsyncStorage.setItem(META_KEY, JSON.stringify(next));
  if (/^[0-9a-f-]{36}$/i.test(meta.patioId)) {
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await supabase.from('saved_patios').upsert({
        user_id: user.user.id,
        fondita_id: meta.patioId,
        note: meta.note?.trim() || null,
        status: meta.status ?? null,
        personal_rating: meta.rating ?? null,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

export async function publishCollection(collection: PatioCollection) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return collection;
  const payload = { owner_id: user.user.id, title: collection.title, description: collection.description, visibility: collection.visibility };
  const query = collection.remoteId
    ? supabase.from('collections').update(payload).eq('id', collection.remoteId).select('id').single()
    : supabase.from('collections').insert(payload).select('id').single();
  const { data, error } = await query;
  if (error || !data) return collection;
  const next = { ...collection, remoteId: data.id };
  await updateCollection(next);
  const uuidIds = collection.patioIds.filter((id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
  await supabase.from('collection_places').delete().eq('collection_id', data.id);
  if (uuidIds.length) {
    await supabase.from('collection_places').insert(uuidIds.map((fondita_id, index) => ({
      collection_id: data.id,
      fondita_id,
      sort_order: index,
    })));
  }
  return next;
}

export async function syncLocalLibraryToCloud() {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;
  const ids = (await getFavoritePatioIds()).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (ids.length) {
    await supabase.from('saved_patios').upsert(ids.map((fondita_id) => ({ user_id: user.user!.id, fondita_id })));
  }
  const collections = await getCollections();
  for (const collection of collections) {
    if (collection.visibility !== 'private' || collection.remoteId) await publishCollection(collection);
  }
}
