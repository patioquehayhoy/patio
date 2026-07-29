import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
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
import { Fonts, useTheme } from '@/lib/theme';

export default function ComunidadAccesoScreen() {
  const { theme } = useTheme();
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
    <View style={[s.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity style={s.back} onPress={() => router.back()} accessibilityLabel="Volver">
        <Ionicons name="chevron-back" size={21} color={theme.text} />
      </TouchableOpacity>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[s.content, { paddingBottom: insets.bottom + 30 }]}>
          <View style={s.mark}>
            <Text style={[s.p, { color: theme.accent }]}>P</Text>
          </View>
          <Text style={[s.eyebrow, { color: theme.accent }]}>TU COMUNIDAD</Text>
          <Text style={[s.title, { color: theme.text }]}>
            {sent ? 'Revisa tu correo.' : 'Guarda lo bueno. Te avisamos cuando vuelva.'}
          </Text>
          <Text style={[s.body, { color: theme.textSecondary }]}>
            {sent
              ? `Mandamos un enlace a ${email}. Al volver podrás seguir este Patio.`
              : 'Tu correo verifica que detrás de cada guardado y reseña haya una persona. Sin contraseña.'}
          </Text>

          {!sent ? (
            <>
              <TextInput
                style={[s.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.surface }]}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@correo.com"
                placeholderTextColor={theme.textMute}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="go"
                onSubmitEditing={send}
              />
              <TouchableOpacity style={[s.button, { backgroundColor: theme.text }]} onPress={send} disabled={busy}>
                {busy
                  ? <AgentSpinner variant="dots" size={18} color={theme.bg} />
                  : <Text style={[s.buttonText, { color: theme.bg }]}>Enviar enlace</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={s.change} onPress={() => setSent(false)}>
              <Text style={[s.changeText, { color: theme.textSecondary }]}>Usar otro correo</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  back: { width: 44, height: 44, marginLeft: 12, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24 },
  mark: { width: 42, height: 42, marginBottom: 26 },
  p: { fontSize: 38, lineHeight: 42, fontWeight: '900', fontFamily: Fonts.brand },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.7, marginBottom: 10 },
  title: { maxWidth: 350, fontSize: 38, lineHeight: 40, letterSpacing: -1.3, fontWeight: '900', fontFamily: Fonts.brand },
  body: { maxWidth: 350, marginTop: 14, fontSize: 15, lineHeight: 22, fontWeight: '400' },
  input: { height: 54, marginTop: 30, borderWidth: StyleSheet.hairlineWidth, borderRadius: 16, paddingHorizontal: 17, fontSize: 16 },
  button: { height: 54, marginTop: 10, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  buttonText: { fontSize: 15, fontWeight: '700' },
  change: { minHeight: 50, marginTop: 16, justifyContent: 'center', alignItems: 'center' },
  changeText: { fontSize: 14, textDecorationLine: 'underline' },
});
