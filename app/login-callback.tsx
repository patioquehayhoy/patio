import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function LoginCallback() {
  const router = useRouter();

  async function handleUrl(url: string) {
    console.log('handleUrl:', url);
    const parsed = Linking.parse(url);
    const token = parsed.queryParams?.token as string | undefined;
    const type = parsed.queryParams?.type as string | undefined;

    if (token && type) {
      const { data, error } = await supabase.auth.verifyOtp({ token_hash: token, type: type as any });
      console.log('verifyOtp result:', data, error);
      if (data.session) {
        await supabase.from('fonditas').upsert({
          id: data.session.user.id,
          telefono: data.session.user.email,
          nombre: data.session.user.email,
        }, { onConflict: 'id' });
        router.replace('/perfil');
      }
    }
  }

  useEffect(() => {
    // URL si la app estaba cerrada
    Linking.getInitialURL().then(url => {
      console.log('getInitialURL:', url);
      if (url) handleUrl(url);
    });

    // URL si la app estaba en background
    const sub = Linking.addEventListener('url', ({ url }) => {
      console.log('addEventListener:', url);
      handleUrl(url);
    });

    setTimeout(() => router.replace('/'), 8000);

    return () => sub.remove();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1A1A1A" />
    </View>
  );
}
