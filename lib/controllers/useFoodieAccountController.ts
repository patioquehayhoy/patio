import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { Alert } from 'react-native';
import { completeOnboarding, saveUserRole } from '@/lib/entry-flow';
import { signOutAccount } from '@/lib/account-session';
import { noWidow } from '@/lib/typography';
import { getFoodieStats, type FoodieStats } from '@/lib/stats';
import { supabase } from '@/lib/supabase';

export function useFoodieAccountController() {
  const [stats, setStats] = useState<FoodieStats>({ viewed: 0, saved: 0 });
  const [hasSession, setHasSession] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getFoodieStats().then((value) => { if (active) setStats(value); }).catch(() => {});
      supabase.auth.getSession().then(({ data }) => { if (active) setHasSession(!!data.session); }).catch(() => {});
      return () => { active = false; };
    }, [])
  );

  const handleSignOut = useCallback(async () => {
    try {
      await signOutAccount();
      router.replace('/');
    } catch {
      Alert.alert(noWidow('No pudimos cerrar sesión'), noWidow('Inténtalo de nuevo. Tus datos siguen guardados.'));
    }
  }, []);

  const handleDevFondero = useCallback(async () => {
    await saveUserRole('fondero').catch(() => {});
    router.replace('/historial');
  }, []);

  // Con sesión abierta no se pide el correo otra vez: la misma cuenta pasa
  // directo a dar de alta su negocio.
  const handleFonderoAccess = useCallback(async () => {
    await saveUserRole('fondero').catch(() => {});
    const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
    if (!data.session) { router.push('/fondero-acceso'); return; }
    router.replace(await completeOnboarding('fondero'));
  }, []);

  return {
    handleDevFondero,
    handleFonderoAccess,
    handleSignOut,
    hasSession,
    stats,
  };
}
