import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function LoginCallback() {
  const router = useRouter();

  useEffect(() => {
    handleDeepLink();
  }, []);

  async function handleDeepLink() {
    try {
      const url = await Linking.getInitialURL();
      if (!url) { router.replace('/'); return; }

      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token as string;
      const type = parsed.queryParams?.type as string;

      console.log('token:', token);
      console.log('type:', type);

      if (!token) { router.replace('/'); return; }

      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'magiclink',
      });

      if (error) {
        console.log('verifyOtp error:', error.message);
        router.replace('/');
        return;
      }

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
      console.log('Error:', e);
      router.replace('/');
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1A1A1A" />
    </View>
  );
}
