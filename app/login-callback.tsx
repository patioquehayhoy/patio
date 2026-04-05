import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function LoginCallback() {
  const router = useRouter();

  useEffect(() => {
    async function handle() {
      const url = await Linking.getInitialURL();
      console.log('URL:', url);

      if (!url) { router.replace('/'); return; }

      const parsed = new URL(url);
      const token = parsed.searchParams.get('token');
      console.log('token:', token);

      if (!token) { router.replace('/'); return; }

      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'magiclink',
      });

      console.log('verifyOtp data:', JSON.stringify(data));
      console.log('verifyOtp error:', JSON.stringify(error));

      if (data?.session) {
        await supabase.from('fonditas').upsert({
          id: data.session.user.id,
          telefono: data.session.user.email,
          nombre: data.session.user.email,
        }, { onConflict: 'id' });
        router.replace('/perfil');
      } else {
        router.replace('/');
      }
    }

    handle();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1A1A1A" />
    </View>
  );
}
