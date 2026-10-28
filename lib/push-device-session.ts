import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Device-scoped, not part of the saved library of any account.
const DEVICE_TOKEN_KEY = '@patio_push_device_token';

export async function rememberPushDevice(token: string): Promise<void> {
  await AsyncStorage.setItem(DEVICE_TOKEN_KEY, token);
}

/** Remove only this installation before its authenticated session is closed. */
export async function detachPushDevice(userId: string): Promise<void> {
  const token = await AsyncStorage.getItem(DEVICE_TOKEN_KEY);
  if (!token) return;
  const { error } = await supabase.from('push_devices').delete()
    .eq('user_id', userId).eq('expo_push_token', token);
  if (error) throw new Error('No pudimos desconectar los avisos. Revisa tu conexión e inténtalo de nuevo.');
  await AsyncStorage.removeItem(DEVICE_TOKEN_KEY);
}
