import AsyncStorage from '@react-native-async-storage/async-storage';
import { resetMenuStore } from './menu-store';
import { setAccountRecoveryRequired, withExclusiveStorageAccess } from './storage-queue';

const OWNER_KEY = '@patio_active_account';
const GUEST_ARCHIVE_KEY = '@patio_guest_archive';
const archiveKey = (userId: string) => `@patio_account_archive:${userId}`;
const listeners = new Set<() => void>();
export function onLocalAccountChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}
function notifyAccountChange() {
  // Rendering failures must not roll back an already completed storage switch.
  for (const listener of listeners) { try { listener(); } catch {} }
}
// Preferences and onboarding are device-wide. Personal data is isolated by user.
export const ACCOUNT_DATA_KEYS = [
  '@lafondita_fondita_id', '@patio_menu_history', '@patio_menu_corrections_v1',
  '@patio_viewed_ids', '@patio_ratings', '@patio_review_likes', '@patio_dish_likes',
  '@patio_activity_seen_at', '@patio_review_likes_seen_at',
  'patio:favorites', 'patio:collections:v1', 'patio:saved-meta:v1',
  'patio:menu-collections:v1', 'patio:saved-map-categories',
] as const;

let pending: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = pending.then(() => withExclusiveStorageAccess(operation));
  pending = next.catch(() => {});
  return next;
}

function parseArchive(stored: string | null): [string, string][] | null {
  if (!stored) return null;
  const entries: unknown = JSON.parse(stored);
  if (!Array.isArray(entries)) throw new Error('No pudimos recuperar tus datos en este dispositivo.');
  return entries.filter((entry): entry is [string, string] =>
    Array.isArray(entry) && entry.length === 2 &&
    ACCOUNT_DATA_KEYS.includes(entry[0]) && typeof entry[1] === 'string');
}

const GUEST_LIBRARY_KEYS = ['patio:favorites', 'patio:collections:v1', 'patio:saved-meta:v1'];
function mergeGuestLibrary(account: [string, string][], guest: readonly [string, string | null][]): [string, string][] {
  const merged = new Map(account);
  for (const [key, raw] of guest) {
    if (!raw || !GUEST_LIBRARY_KEYS.includes(key)) continue;
    const guestValue: unknown = JSON.parse(raw);
    const accountRaw = merged.get(key);
    const accountValue: unknown = accountRaw ? JSON.parse(accountRaw) : [];
    if (!Array.isArray(guestValue) || !Array.isArray(accountValue)) throw new Error('No pudimos recuperar tus guardados.');
    if (key === 'patio:saved-meta:v1') {
      const byPatio = new Map(accountValue.map((item) => [item.patioId, item]));
      for (const item of guestValue) {
        byPatio.set(item.patioId, { ...byPatio.get(item.patioId), ...item });
      }
      merged.set(key, JSON.stringify([...byPatio.values()]));
    } else {
      if (key === 'patio:favorites') {
        merged.set(key, JSON.stringify([...new Set([...guestValue, ...accountValue])]));
      } else {
        // Guest lists have their own IDs. Preserve the account's version on a
        // collision; do not overwrite an already published list's identity.
        const ids = new Set(accountValue.map((item) => item?.id));
        merged.set(key, JSON.stringify([...guestValue.filter((item) => !ids.has(item?.id)), ...accountValue]));
      }
    }
  }
  return [...merged];
}

/** Archive before clearing so signing out never discards unsynced work. */
export function activateLocalAccount(userId: string | null): Promise<void> {
  return serialize(() => switchLocalAccount(userId));
}

/** Hold personal writes until both Auth and local storage share an identity.
 * Use the provided activation function inside the transition; it already owns
 * the storage lock and must not acquire it a second time. */
export function withLocalAccountTransition<T>(operation: (
  activate: (userId: string | null) => Promise<void>,
  erase: (userId: string) => Promise<void>,
) => Promise<T>): Promise<T> {
  return serialize(() => operation(switchLocalAccount, removeLocalAccount));
}

async function switchLocalAccount(userId: string | null): Promise<void> {
  try {
    await restoreLocalAccount(userId);
    setAccountRecoveryRequired(false);
  } catch (error) {
    setAccountRecoveryRequired(true);
    throw error;
  }
}

async function restoreLocalAccount(userId: string | null): Promise<void> {
    const previous = await AsyncStorage.getItem(OWNER_KEY);
    if (previous === userId) return;
    // Validate the destination before changing the current account's data.
    const guestArchive = await AsyncStorage.getItem(GUEST_ARCHIVE_KEY);
    const stored = userId ? await AsyncStorage.getItem(archiveKey(userId)) : guestArchive;
    let restored = parseArchive(stored);
    const current = await AsyncStorage.multiGet([...ACCOUNT_DATA_KEYS]);
    if (!previous && userId && restored) restored = mergeGuestLibrary(restored, current);
    if (previous) {
      await AsyncStorage.setItem(archiveKey(previous), JSON.stringify(current));
    }
    try {
      if (previous || restored) {
        await AsyncStorage.multiRemove([...ACCOUNT_DATA_KEYS]);
      }
      if (restored?.length) await AsyncStorage.multiSet(restored);
      if (!previous && userId) {
        // Keep other guest work available on logout, without carrying personal
        // account data across identities. A first login adopts all guest work.
        const remaining = stored ? current.filter(([key, value]) => value !== null && !GUEST_LIBRARY_KEYS.includes(key)) : [];
        if (remaining.length) await AsyncStorage.setItem(GUEST_ARCHIVE_KEY, JSON.stringify(remaining));
        else await AsyncStorage.removeItem(GUEST_ARCHIVE_KEY);
      }
      if (userId) await AsyncStorage.setItem(OWNER_KEY, userId);
      else await AsyncStorage.removeItem(OWNER_KEY);
      resetMenuStore();
      notifyAccountChange();
    } catch (error) {
      // A failed switch must not archive an empty/partial account on retry.
      await AsyncStorage.multiRemove([...ACCOUNT_DATA_KEYS]);
      const original = current.filter((entry): entry is [string, string] => entry[1] !== null);
      if (original.length) await AsyncStorage.multiSet(original);
      if (previous) await AsyncStorage.setItem(OWNER_KEY, previous);
      else await AsyncStorage.removeItem(OWNER_KEY);
      if (guestArchive) await AsyncStorage.setItem(GUEST_ARCHIVE_KEY, guestArchive);
      else await AsyncStorage.removeItem(GUEST_ARCHIVE_KEY);
      throw error;
    }
}

export function eraseLocalAccount(userId: string): Promise<void> {
  return serialize(() => removeLocalAccount(userId));
}

async function removeLocalAccount(userId: string): Promise<void> {
  try {
    await removeAccountData(userId);
  } catch (error) {
    setAccountRecoveryRequired(true);
    throw error;
  }
}

async function removeAccountData(userId: string): Promise<void> {
    const owner = await AsyncStorage.getItem(OWNER_KEY);
    await AsyncStorage.removeItem(archiveKey(userId));
    if (owner !== userId) return;
    const guest = parseArchive(await AsyncStorage.getItem(GUEST_ARCHIVE_KEY));
    await AsyncStorage.multiRemove([
      ...ACCOUNT_DATA_KEYS, OWNER_KEY,
      '@patio_user_role', '@patio_community_return_to',
    ]);
    if (guest?.length) await AsyncStorage.multiSet(guest);
    resetMenuStore();
    setAccountRecoveryRequired(false);
    notifyAccountChange();
}
