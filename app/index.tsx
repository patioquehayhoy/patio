import { router } from 'expo-router';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { supabase } from '@/lib/supabase';
import { upsertFondita } from '@/lib/db';
import { setFonditaId } from '@/lib/user-store';

// ─── Auth error handler ───────────────────────────────────────────────────────
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

// ─── Design System ────────────────────────────────────────────────────────────
const ORANGE = '#FF5E00';
const WHITE = '#FFFFFF';
const WHITE60 = 'rgba(255,255,255,0.6)';

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

    const handleDeepLink = async (url: string) => {
      console.log('=== DEEP LINK URL:', url);
      if (!url || (!url.startsWith('lafondita://') && !url.includes('login-callback'))) return;
      const { data, error } = await supabase.auth.getSessionFromUrl({ url } as any);
      if (!error && data?.session?.user?.email) {
        initFondita(data.session.user.email);
        router.replace('/menu');
      }
    };

    Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
    const linkingSub = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));

    return () => {
      listener.subscription.unsubscribe();
      linkingSub.remove();
    };
  }, []);

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Ingresa tu correo.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: 'lafondita://login-callback',
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
        <ActivityIndicator size="large" color={WHITE} />
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
          <Text style={styles.logo}>Patio</Text>
          <Text style={styles.tagline}>¿Qué hay hoy? Saaaaaaabes.</Text>
        </View>

        {!sent ? (
          <View style={styles.form}>
            <ThemedText style={styles.label}>Ingresa tu correo para continuar</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor={WHITE60}
              value={email}
              onChangeText={(v) => { setEmail(v); setError(''); }}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              autoFocus
              selectionColor={WHITE}
            />
            {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color={WHITE} />
                : <ThemedText style={styles.buttonText}>Entrar</ThemedText>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <ThemedText style={styles.label}>
              Te enviamos un link a{'\n'}
              <ThemedText style={styles.emailHighlight}>{email}</ThemedText>
            </ThemedText>
            <ThemedText style={styles.sublabel}>
              Ábrelo para entrar a Patio.
            </ThemedText>
            <TouchableOpacity style={styles.backLink} onPress={() => { setSent(false); setError(''); }}>
              <ThemedText style={styles.backLinkText}>Cambiar correo</ThemedText>
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
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: ORANGE,
    padding: 28,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: 48,
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    textAlign: 'center',
    color: WHITE,
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
  },
  tagline: {
    textAlign: 'center',
    color: WHITE60,
    fontSize: 14,
    fontWeight: '300',
    lineHeight: 20,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '300',
    lineHeight: 22,
    color: WHITE,
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 15,
    fontWeight: '300',
    lineHeight: 22,
    color: WHITE60,
  },
  emailHighlight: {
    fontWeight: '900',
    fontSize: 15,
    color: WHITE,
  },
  input: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0,
    borderBottomWidth: 0.5,
    borderBottomColor: WHITE60,
    paddingVertical: 10,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  error: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '300',
    opacity: 0.85,
  },
  button: {
    borderWidth: 1.5,
    borderColor: WHITE,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    backgroundColor: 'transparent',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '900',
  },
  backLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  backLinkText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '300',
    opacity: 0.75,
  },
});
