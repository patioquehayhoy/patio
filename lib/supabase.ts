import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://gjfjsjlrgycrgmcbjrus.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_oByo8H5l6DntBVlw78HoGA_TqeAEt2l';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...(Platform.OS !== 'web' && { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
