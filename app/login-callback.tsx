import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginCallback() {
  const router = useRouter();

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      await new Promise(r => setTimeout(r, 1000));
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('fonditas').upsert({
          id: session.user.id,
          telefono: session.user.email,
          nombre: session.user.email,
        }, { onConflict: 'id' });
        router.replace('/perfil');
      } else {
        router.replace('/');
      }
    } catch (e) {
      router.replace('/');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1A1A1A" />
    </View>
  );
}
