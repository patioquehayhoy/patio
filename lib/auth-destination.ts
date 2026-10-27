import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';
import { initializeSignedInUser } from './auth';
import { safeReturnTo } from './auth-links';
import { COMMUNITY_RETURN_TO_KEY } from './community-auth';
import { saveUserRole } from './entry-flow';
import { syncLocalLibraryToCloud } from './collections';

/** Both email entry methods finish the same profile and library setup. */
export async function signedInDestination(session: Session, role: string | null): Promise<string> {
  if (role === 'foodie') {
    await syncLocalLibraryToCloud().catch(() => {});
    const pending = safeReturnTo(await AsyncStorage.getItem(COMMUNITY_RETURN_TO_KEY));
    if (!session.user.user_metadata?.profile_complete) {
      return `/perfil-comunidad?returnTo=${encodeURIComponent(pending)}`;
    }
    await AsyncStorage.removeItem(COMMUNITY_RETURN_TO_KEY);
    return pending;
  }
  await saveUserRole('fondero');
  const { needsSetup } = await initializeSignedInUser(session);
  return needsSetup ? '/patio-smart' : '/historial';
}
