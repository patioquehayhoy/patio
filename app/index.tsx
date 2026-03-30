import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Image,
} from 'react-native';

import { supabase } from '@/lib/supabase';
import { upsertFondita } from '@/lib/db';
import { setFonditaId } from '@/lib/user-store';

function showAuthError(err: { message?: string; code?: string } | null) {
  if (!err) return;
  const code = err.code ?? '';
  const msg  = (err.message ?? '').toLowerCase();
  let texto: string;
  if (code === 'over_email_send_rate_limit' || msg.includes('rate limit')) {
    texto = 'Demasiados intentos. Tómate un respiro e inténtalo en unos minutos.';
  } else if (code === 'invalid_email' || msg.includes('invalid email')) {
    texto = 'Algo raro tiene ese correo. ¿Lo revisas?';
  } else if (code === 'network_error' || msg.includes('fetch failed') || msg.includes('network')) {
    texto = 'Sin conexión. Revisa tu internet e intenta de nuevo.';
  } else {
    texto = 'Algo salió mal. Inténtalo de nuevo.';
  }
  Alert.alert('Oops', texto, [{ text: 'Entendido' }]);
}

const BG = '#F5E9D9';
const BLACK = '#1A1A1A';
const BLACK60 = '#8C7B6B';
const WHITE = '#FFFFFF';
const ACCENT = '#D31D0F';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  async function initFondita(email: string) {
    const id = await upsertFondita(email);
    if (id) setFonditaId(id);
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (data.session?.user?.email) {
          initFondita(data.session.user.email);
          router.replace('/menu');
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        initFondita(session.user.email);
        router.replace('/menu');
      }
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Ingresa tu correo.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: 'patio://login-callback',
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (err) { showAuthError(err); return; }
    setSent(true);
  };

  if (checkingSession) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={BLACK} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>

        <View style={styles.hero}>
          <Image
            source={require('../assets/images/logo-negro.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>¿Qué hay hoy?</Text>
          <Text style={styles.tagline}>Saaaaaaabes.</Text>
        </View>

        {!sent ? (
          <View style={styles.form}>
            <Text style={styles.label}>Tu correo para entrar</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={BLACK60}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                autoFocus
                selectionColor={BLACK}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color={WHITE} />
                : <Text style={styles.buttonText}>Enviar link</Text>}
            </TouchableOpacity>
            <Text style={styles.hint}>Sin contraseña — te mandamos un link directo</Text>
            <TouchableOpacity onPress={() => router.replace('/menu')} style={styles.devButton}>
              <Text style={styles.devButtonText}>Entrar sin cuenta (dev)</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/onboarding')} style={styles.devButton}>
              <Text style={styles.devButtonText}>Ver onboarding (dev)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>
              Revisá tu correo
            </Text>
            <Text style={styles.emailHighlight}>{email}</Text>
            <Text style={styles.sublabel}>
              Te mandamos un link. Ábrelo para entrar a Patio.
            </Text>
            <TouchableOpacity style={styles.backLink} onPress={() => { setSent(false); setError(''); }}>
              <Text style={styles.backLinkText}>Cambiar correo</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: BG,
    padding: 32,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: 56,
    alignItems: 'center',
  },
  logo: {
    width: 320,
    height: 120,
    marginBottom: 16,
    marginLeft: -7,
  },
  tagline: {
    color: BLACK60,
    fontSize: 16,
    fontWeight: '400',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 22,
    fontWeight: '600',
    color: BLACK,
    marginBottom: 4,
    textAlign: 'center',
  },
  sublabel: {
    fontSize: 15,
    color: BLACK60,
    lineHeight: 22,
  },
  emailHighlight: {
    fontSize: 16,
    fontWeight: '600',
    color: BLACK,
  },
  inputWrapper: {
    backgroundColor: WHITE,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  input: {
    color: BLACK,
    fontSize: 16,
    fontWeight: '400',
  },
  error: {
    color: '#CC0000',
    fontSize: 13,
  },
  button: {
    backgroundColor: BLACK,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    color: BLACK60,
    fontSize: 13,
    textAlign: 'center',
  },
  devButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  devButtonText: {
    color: BLACK60,
    fontSize: 12,
    fontWeight: '300',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    color: BLACK,
    fontSize: 14,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
});
