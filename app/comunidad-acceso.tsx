import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmailCodeForm } from '@/components/email-code-form';
import { AgentSpinner } from '@/components/agent-spinner';
import { LOGIN_CALLBACK_URL } from '@/lib/auth';
import { isValidEmail, safeReturnTo } from '@/lib/auth-links';
import { COMMUNITY_RETURN_TO_KEY } from '@/lib/community-auth';
import { saveUserRole } from '@/lib/entry-flow';
import { supabase } from '@/lib/supabase';
import { Type } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

const HERO = require('../assets/hero/botanica-5.jpg');
const MARK = require('../assets/images/p-icon-transparent-blanco.png');

export default function ComunidadAccesoScreen() {
  const insets = useSafeAreaInsets();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const sending = useRef(false);

  useEffect(() => {
    saveUserRole('foodie').catch(() => {});
    AsyncStorage.setItem(COMMUNITY_RETURN_TO_KEY, safeReturnTo(returnTo)).catch(() => {});
  }, [returnTo]);

  const send = async () => {
    if (sending.current) return false;
    const value = email.trim().toLowerCase();
    if (!isValidEmail(value)) {
      Alert.alert(noWidow('Revisa tu correo'), noWidow('Escribe un correo válido.'));
      return false;
    }
    sending.current = true;
    setBusy(true);
    try {
      await saveUserRole('foodie');
      const { error } = await supabase.auth.signInWithOtp({
        email: value,
        options: { emailRedirectTo: LOGIN_CALLBACK_URL, shouldCreateUser: true },
      });
      if (error) throw error;
      setEmail(value);
      setSent(true);
      return true;
    } catch {
      Alert.alert(noWidow('No pudimos enviar el enlace'), noWidow('Revisa tu conexión e inténtalo de nuevo.'));
      return false;
    } finally {
      sending.current = false;
      setBusy(false);
    }
  };

  return (
    <ImageBackground source={HERO} style={s.root} resizeMode="cover">
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['rgba(0,0,0,0.18)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.82)']} locations={[0, 0.46, 1]} style={StyleSheet.absoluteFillObject} />
      <TouchableOpacity style={[s.back, { top: insets.top + 8 }]} onPress={() => router.canGoBack() ? router.back() : router.replace('/cuenta')} accessibilityRole="button" accessibilityLabel="Volver">
        <Ionicons name="chevron-back" size={21} color="#fff" />
      </TouchableOpacity>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[s.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 30 }]}>
          <Image source={MARK} style={s.mark} resizeMode="contain" />
          <Text style={s.eyebrow}>{noWidow('TU COMUNIDAD')}</Text>
          <Text style={s.title}>
            {noWidow(sent ? 'Revisa tu correo.' : 'Guarda lo bueno. Te avisamos cuando vuelva.')}
          </Text>
          <Text style={s.body}>
            {noWidow(sent
              ? `Mandamos un código y un enlace a ${email}. Escribe el código para entrar.`
              : 'Tu correo sincroniza guardados y reseñas. Sin contraseña.')}
          </Text>

          {!sent ? (
            <>
              <Text style={s.label}>Correo</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor="rgba(255,255,255,0.55)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                accessibilityLabel="Correo"
                returnKeyType="go"
                onSubmitEditing={send}
              />
              <TouchableOpacity style={[s.button, busy && { opacity: 0.6 }]} onPress={send} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} accessibilityLabel={busy ? 'Enviando enlace' : 'Enviar enlace'}>
                {busy
                  ? <AgentSpinner variant="dots" size={18} color="#FFFFFF" />
                  : <Text style={s.buttonText}>{noWidow('Enviar enlace')}</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
            <EmailCodeForm email={email} role="foodie" onResend={send} />
            <TouchableOpacity style={s.change} onPress={() => setSent(false)} accessibilityRole="button" accessibilityLabel="Usar otro correo">
              <Text style={s.changeText}>{noWidow('Usar otro correo')}</Text>
            </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111214' },
  flex: { flex: 1, zIndex: 1 },
  back: { position: 'absolute', zIndex: 5, width: 44, height: 44, left: 12, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.22)', alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 24 },
  mark: { width: 48, height: 48, marginBottom: 22 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 10, color: '#FF8A5F' },
  title: { ...Type.screen, maxWidth: 350, color: '#fff' },
  body: { maxWidth: 350, marginTop: 12, fontSize: 15, lineHeight: 22, fontWeight: '400', color: 'rgba(255,255,255,0.76)' },
  label: { marginTop: 26, fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.76)' },
  input: { minHeight: 54, marginTop: 8, paddingVertical: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.30)', backgroundColor: 'rgba(0,0,0,0.28)', borderRadius: 16, paddingHorizontal: 17, fontSize: 16, color: '#fff' },
  // Única acción prominente de esta pantalla (regla homologada 2026-08-16
  // en CLAUDE.md: cualquier verbo cuenta si es la única acción destacada).
  button: { minHeight: 54, paddingVertical: 12, marginTop: 10, borderRadius: 27, backgroundColor: '#F2612F', alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  change: { minHeight: 50, marginTop: 16, justifyContent: 'center', alignItems: 'center' },
  changeText: { fontSize: 14, textDecorationLine: 'underline', color: 'rgba(255,255,255,0.76)' },
});
