import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginCallback() {
  const router = useRouter();

  useEffect(() => {
    let redirected = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (redirected) return;
      if (event === 'SIGNED_IN' && session) {
        redirected = true;
        await supabase.from('fonditas').upsert({
          id: session.user.id,
          telefono: session.user.email,
          nombre: session.user.email,
        }, { onConflict: 'id' });
        router.replace('/perfil');
      }
    });

    const timeout = setTimeout(() => {
      if (!redirected) {
        redirected = true;
        router.replace('/');
      }
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1A1A1A" />
    </View>
  );
}
