import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { withStorageLock } from '@/lib/storage-queue';
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

// Una palabra, sin espacios — así la pill de la barra de filtros nunca se
// desborda. Aplica tanto a listas nuevas como a la normalización de las
// que ya existían con nombres largos (ver getCollections).
export function normalizeCollectionTitle(title: string) {
  return title.replace(/\s+/g, '').slice(0, 18);
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function newRemoteId(): string {
  // Identificador de recurso, nunca credencial. Persistirlo antes del RPC
  // hace idempotente un reintento incluso si se perdió la respuesta de red.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    return (char === 'x' ? random : (random & 3) | 8).toString(16);
  });
}

async function readCollections(): Promise<PatioCollection[]> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('No se pudieron recuperar tus listas.');
  return parsed.flatMap((item): PatioCollection[] => {
    if (!item || typeof item.id !== 'string' || typeof item.title !== 'string' || !Array.isArray(item.patioIds)) return [];
    return [{
      ...item,
      title: normalizeCollectionTitle(item.title),
      description: typeof item.description === 'string' ? item.description : '',
      visibility: ['public', 'unlisted'].includes(item.visibility) ? item.visibility : 'private',
      patioIds: [...new Set(item.patioIds.filter((id: unknown): id is string => typeof id === 'string'))] as string[],
    }];
  });
}

async function writeCollections(collections: PatioCollection[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(collections));
}

export async function getCollections(): Promise<PatioCollection[]> {
  try { return await readCollections(); } catch { return []; }
}

export async function getCollection(id: string) {
  return (await getCollections()).find((item) => item.id === id) ?? null;
}

export async function createCollection(title: string, visibility: CollectionVisibility = 'private') {
  return withStorageLock(KEY, async () => {
    const current = await readCollections();
    const collection: PatioCollection = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title: normalizeCollectionTitle(title), description: '', visibility, patioIds: [], createdAt: new Date().toISOString(),
    };
    await writeCollections([collection, ...current]);
    return collection;
  });
}

export async function updateCollection(next: PatioCollection) {
  return withStorageLock(KEY, async () => {
    const current = await readCollections();
    await writeCollections(current.map((item) => item.id === next.id ? { ...next, remoteId: item.remoteId ?? next.remoteId } : item));
  });
}

export async function deleteCollection(id: string) {
  return withStorageLock(KEY, async () => {
    const current = await readCollections();
    const target = current.find((item) => item.id === id);
    if (target?.remoteId) {
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError || !auth.user || auth.user.is_anonymous) throw new Error('Inicia sesión para eliminar esta lista.');
      // FK ON DELETE CASCADE retira los lugares en la misma transacción.
      const { error } = await supabase.from('collections').delete().eq('id', target.remoteId).eq('owner_id', auth.user.id);
      if (error) throw error;
    }
    await writeCollections(current.filter((item) => item.id !== id));
  });
}

async function mutateCollection(id: string, change: (item: PatioCollection) => PatioCollection) {
  return withStorageLock(KEY, async () => {
    const current = await readCollections();
    const target = current.find((item) => item.id === id);
    if (!target) return null;
    const next = change(target);
    await writeCollections(current.map((item) => item.id === id ? next : item));
    return next;
  });
}

export async function renameCollection(id: string, title: string) {
  return mutateCollection(id, (item) => ({ ...item, title: normalizeCollectionTitle(title) }));
}

export async function togglePatioInCollection(collectionId: string, patioId: string) {
  return mutateCollection(collectionId, (item) => ({
    ...item,
    patioIds: item.patioIds.includes(patioId) ? item.patioIds.filter((id) => id !== patioId) : [...item.patioIds, patioId],
  }));
}

export async function setPatiosInCollection(collectionId: string, patioIds: string[], present: boolean) {
  return mutateCollection(collectionId, (item) => ({
    ...item,
    patioIds: present ? [...new Set([...item.patioIds, ...patioIds])] : item.patioIds.filter((id) => !patioIds.includes(id)),
  }));
}

async function readSavedMeta(): Promise<SavedPatioMeta[]> {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('No se pudieron recuperar tus lugares guardados.');
  return parsed.filter((item): item is SavedPatioMeta => item && typeof item.patioId === 'string');
}

export async function getSavedPatioMeta(patioId: string): Promise<SavedPatioMeta> {
  try { return (await readSavedMeta()).find((item) => item.patioId === patioId) ?? { patioId }; } catch { return { patioId }; }
}

export async function getAllSavedPatioMeta(): Promise<Record<string, SavedPatioMeta>> {
  try { return Object.fromEntries((await readSavedMeta()).map((item) => [item.patioId, item])); } catch { return {}; }
}

export async function saveSavedPatioMeta(meta: SavedPatioMeta) {
  return withStorageLock(META_KEY, async () => {
    const all = await readSavedMeta();
    await AsyncStorage.setItem(META_KEY, JSON.stringify([...all.filter((item) => item.patioId !== meta.patioId), meta]));
    if (!uuidPattern.test(meta.patioId)) return;
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user || auth.user.is_anonymous) return;
    const { error } = await supabase.from('saved_patios').upsert({
      user_id: auth.user.id, fondita_id: meta.patioId, note: meta.note?.trim() || null,
      status: meta.status ?? null, personal_rating: meta.rating ?? null, updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  });
}

// Privado: solo se llama dentro del lock. No anidar locks de la misma clave.
async function publishCollectionUnlocked(collection: PatioCollection): Promise<PatioCollection> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user || auth.user.is_anonymous) throw new Error('Inicia sesión para compartir esta lista.');
  const current = await readCollections();
  const target = current.find((item) => item.id === collection.id);
  if (!target) throw new Error('Esta lista ya no está disponible.');
  const pending = { ...target, remoteId: target.remoteId ?? newRemoteId() };
  // Solo se reserva el ID. La visibilidad nueva se confirma tras el RPC.
  await writeCollections(current.map((item) => item.id === target.id ? pending : item));
  const { data, error } = await supabase.rpc('publish_collection', {
    p_collection_id: pending.remoteId, p_title: pending.title,
    p_description: pending.description, p_visibility: collection.visibility,
    p_fondita_ids: [...new Set(pending.patioIds.filter((id) => uuidPattern.test(id)))],
  });
  if (error) throw error;
  if (data !== pending.remoteId) throw new Error('No se pudo confirmar la publicación de la lista.');
  const published = { ...pending, visibility: collection.visibility };
  await writeCollections(current.map((item) => item.id === target.id ? published : item));
  return published;
}

export async function publishCollection(collection: PatioCollection) {
  return withStorageLock(KEY, () => publishCollectionUnlocked(collection));
}

export async function syncLocalLibraryToCloud() {
  return withStorageLock(KEY, async () => {
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user || auth.user.is_anonymous) return;
    const ids = (await getFavoritePatioIds()).filter((id) => uuidPattern.test(id));
    if (ids.length) {
      const { error } = await supabase.from('saved_patios').upsert(ids.map((fondita_id) => ({ user_id: auth.user!.id, fondita_id })));
      if (error) throw error;
    }
    for (const collection of await readCollections()) {
      if (collection.visibility !== 'private' || collection.remoteId) await publishCollectionUnlocked(collection);
    }
  });
}
