import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://gjfjsjlrgycrgmcbjrus.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_oByo8H5l6DntBVlw78HoGA_TqeAEt2l';
export const SUPABASE_AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storageKey: SUPABASE_AUTH_STORAGE_KEY,
    ...(Platform.OS !== 'web' && { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

/** Only after Auth confirms account deletion: remove a stale token if logout's
 * network request fails. Supabase reads its session from this same storage. */
export async function clearDeletedAccountSession(): Promise<void> {
  const keys = [SUPABASE_AUTH_STORAGE_KEY, `${SUPABASE_AUTH_STORAGE_KEY}-code-verifier`, `${SUPABASE_AUTH_STORAGE_KEY}-user`];
  if (Platform.OS === 'web') {
    for (const key of keys) globalThis.localStorage?.removeItem(key);
  } else {
    await AsyncStorage.multiRemove(keys);
  }
}
