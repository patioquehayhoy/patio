import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function LoginCallback() {
  const router = useRouter();

  useEffect(() => {
    Linking.getInitialURL().then(url => console.log('URL en callback:', url));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await supabase.from('fonditas').upsert({
          id: session.user.id,
          telefono: session.user.email,
          nombre: session.user.email,
        }, { onConflict: 'id' });
        router.replace('/perfil');
      }
    });

    setTimeout(() => router.replace('/'), 8000);

    return () => subscription.unsubscribe();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1A1A1A" />
    </View>
  );
}
