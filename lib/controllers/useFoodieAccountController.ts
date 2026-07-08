import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { getFoodieStats, type FoodieStats } from '@/lib/stats';
import { supabase } from '@/lib/supabase';

const ROLE_KEY = '@patio_user_role';

export function useFoodieAccountController() {
  const [stats, setStats] = useState<FoodieStats>({ viewed: 0, saved: 0 });
  const [hasSession, setHasSession] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getFoodieStats().then(setStats);
      supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
    }, [])
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut().catch(() => {});
    await AsyncStorage.removeItem(ROLE_KEY).catch(() => {});
    router.replace('/');
  }, []);

  const handleDevFondero = useCallback(async () => {
    await AsyncStorage.setItem(ROLE_KEY, 'fondero').catch(() => {});
    router.replace('/menu');
  }, []);

  return {
    handleDevFondero,
    handleSignOut,
    hasSession,
    stats,
  };
}
