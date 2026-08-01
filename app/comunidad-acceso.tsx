import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AgentSpinner } from '@/components/agent-spinner';
import { LOGIN_CALLBACK_URL } from '@/lib/auth';
import { COMMUNITY_RETURN_TO_KEY } from '@/lib/community-auth';
import { saveUserRole } from '@/lib/entry-flow';
import { supabase } from '@/lib/supabase';
import { Fonts } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const HERO = require('../assets/hero/botanica-5.jpg');
const MARK = require('../assets/images/p-icon-transparent-blanco.png');

export default function ComunidadAccesoScreen() {
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    saveUserRole('foodie').catch(() => {});
    if (returnTo?.startsWith('/')) AsyncStorage.setItem(COMMUNITY_RETURN_TO_KEY, returnTo).catch(() => {});
  }, [returnTo]);

  const send = async () => {
    const value = email.trim().toLowerCase();
    if (!value || !value.includes('@')) {
      Alert.alert('Revisa tu correo', 'Escribe un correo válido.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: LOGIN_CALLBACK_URL, shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      Alert.alert('No pudimos enviar el enlace', 'Revisa tu conexión e inténtalo de nuevo.');
      return;
    }
    setSent(true);
  };

  return (
    <ImageBackground source={HERO} style={s.root} resizeMode="cover">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.82)']} locations={[0, 0.46, 1]} style={StyleSheet.absoluteFillObject} />
      <TouchableOpacity style={[s.back, { top: insets.top + 8 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/cuenta')} accessibilityLabel="Volver">
        <Ionicons name="chevron-back" size={21} color="#fff" />
      </TouchableOpacity>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.content, { paddingBottom: insets.bottom + 30 }]}>
          <Image source={MARK} style={s.mark} resizeMode="contain" />
          <Text style={s.eyebrow}>TU COMUNIDAD</Text>
          <Text style={s.title}>
            {noWidow(sent ? 'Revisa tu correo.' : 'Guarda lo bueno. Te avisamos cuando vuelva.')}
          </Text>
          <Text style={s.body}>
            {noWidow(sent
              ? `Mandamos un enlace a ${email}. Al volver podrás seguir este Patio.`
              : 'Tu correo sincroniza guardados y reseñas. Sin contraseña.')}
          </Text>

          {!sent ? (
            <>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor="rgba(255,255,255,0.55)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="go"
                onSubmitEditing={send}
              />
              <TouchableOpacity style={s.button} onPress={send} disabled={busy}>
                {busy
                  ? <AgentSpinner variant="dots" size={18} color="#111214" />
                  : <Text style={s.buttonText}>Enviar enlace</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.change} onPress={() => setSent(false)}>
              <Text style={s.changeText}>Usar otro correo</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111214' },
  flex: { flex: 1, zIndex: 1 },
  back: { position: 'absolute', zIndex: 5, width: 44, height: 44, left: 12, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24 },
  mark: { width: 48, height: 48, marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.7, marginBottom: 10, color: '#FF8A5F' },
  title: { maxWidth: 350, fontSize: 38, lineHeight: 42, letterSpacing: -1.3, fontWeight: '900', fontFamily: Fonts.brand, color: '#fff' },
  body: { maxWidth: 350, marginTop: 12, fontSize: 15, lineHeight: 22, fontWeight: '400', color: 'rgba(255,255,255,0.76)' },
  input: { height: 54, marginTop: 26, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.30)', backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 16, paddingHorizontal: 17, fontSize: 16, color: '#fff' },
  button: { height: 54, marginTop: 10, borderRadius: 27, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#111214' },
  change: { minHeight: 50, marginTop: 16, justifyContent: 'center', alignItems: 'center' },
  changeText: { fontSize: 14, textDecorationLine: 'underline', color: 'rgba(255,255,255,0.76)' },
});
