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
      // Obtener la URL que abrió la app
      const url = await Linking.getInitialURL();
      if (!url) {
        router.replace('/');
        return;
      }

      // Extraer los query params
      const parsed = Linking.parse(url);
      const token = parsed.queryParams?.token as string;
      const type = parsed.queryParams?.type as string;

      if (!token || type !== 'magiclink') {
        router.replace('/');
        return;
      }

      // Intercambiar el token por una sesión real
      const { error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'magiclink',
      });

      if (error) {
        console.error('Error verificando OTP:', error.message);
        router.replace('/');
        return;
      }

      // Sesión creada — upsert fondita y navegar
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await upsertFondita(session.user);
        router.replace('/perfil');
      } else {
        router.replace('/');
      }
    } catch (e) {
      console.error('Error en login-callback:', e);
      router.replace('/');
    }
  }

  async function upsertFondita(user: any) {
    await supabase.from('fonditas').upsert({
      id: user.id,
      telefono: user.email,
      nombre: user.email,
    }, { onConflict: 'id' });
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#EFEFEF', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#292929" />
    </View>
  );
}
