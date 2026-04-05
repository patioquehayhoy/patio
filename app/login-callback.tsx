import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';

export default function LoginCallback() {
  const router = useRouter();

  async function handleUrl(url: string) {
    const parsed = Linking.parse(url);
    const token = parsed.queryParams?.token as string;
    if (!token) { router.replace('/'); return; }

    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'magiclink',
    });

    if (error) { router.replace('/'); return; }

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
  }

  useEffect(() => {
    const timer = setTimeout(async () => {
      const url = await Linking.getInitialURL();
      if (url) { handleUrl(url); return; }
      router.replace('/');
    }, 500);

    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));

    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#1A1A1A" />
    </View>
  );
}
