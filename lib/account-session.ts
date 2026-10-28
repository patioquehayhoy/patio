import AsyncStorage from '@react-native-async-storage/async-storage';
import { withLocalAccountTransition } from './account-storage';
import { clearDeletedAccountSession, supabase } from './supabase';
import { withSessionLock } from './session-queue';
import { detachPushDevice } from './push-device-session';

export async function signOutAccount(): Promise<void> {
  return withSessionLock(() => withLocalAccountTransition(async (activate) => {
    // Archive before auth is removed, including upgrades without an owner marker.
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (data.session) await activate(data.session.user.id);
    if (data.session) await detachPushDevice(data.session.user.id);
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
    await activate(null);
    await AsyncStorage.multiRemove(['@patio_user_role', '@patio_community_return_to']);
  }));
}

export async function deleteAccount(expectedUserId: string): Promise<void> {
  return withSessionLock(() => withLocalAccountTransition(async (activate, erase) => {
    const { data: current, error: sessionError } = await supabase.auth.getSession();
    const session = current.session;
    if (sessionError || !session || session.user.id !== expectedUserId) {
      throw new Error('La cuenta cambió. Revisa el perfil antes de eliminarlo.');
    }
    const { data: auth, error: authError } = await supabase.auth.getUser(session.access_token);
    if (authError || auth.user?.id !== expectedUserId) throw new Error('Inicia sesión de nuevo para eliminar tu cuenta.');
    const { data: verifiedSession } = await supabase.auth.getSession();
    if (verifiedSession.session?.user.id !== expectedUserId) throw new Error('La cuenta cambió. Revisa el perfil antes de eliminarlo.');
    await activate(expectedUserId);
    const { data, error } = await supabase.functions.invoke('delete-account', {
      body: {}, headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error || data?.deleted !== true) {
      throw new Error('No pudimos eliminar tu cuenta. Revisa tu conexión e inténtalo de nuevo.');
    }
    const { data: afterDeletion } = await supabase.auth.getSession();
    const { error: signOutError } = afterDeletion.session?.user.id === expectedUserId
      ? await supabase.auth.signOut({ scope: 'local' }) : { error: null };
    if (signOutError) await clearDeletedAccountSession();
    await erase(expectedUserId);
  }));
}
