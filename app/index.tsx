import { router, Stack } from 'expo-router';
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

<<<<<<< Updated upstream
import { initializeSignedInUser, LOGIN_CALLBACK_URL } from '@/lib/auth';
=======
import { initializeSignedInUser, LOGIN_CALLBACK_URL } from '../lib/auth';
import { setFonditaName } from '@/lib/menu-store';
>>>>>>> Stashed changes
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
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

const LIGHT_BG = '#F3F3F0';

export default function LoginScreen() {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (data.session) {
          await initializeSignedInUser(data.session);
          router.replace('/perfil');
          return;
        }
        setCheckingSession(false);
      })
      .catch(() => setCheckingSession(false));

  }, []);

  const handleDevLogin = () => {
    setFonditaId('dev-123');
    setFonditaName('La Fondita');
    router.replace('/menu');
  };

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Ingresa tu correo.'); return; }
    setError('');
    setLoading(true);
    console.log('[auth] sending magic link', { emailRedirectTo: LOGIN_CALLBACK_URL });
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: LOGIN_CALLBACK_URL,
        shouldCreateUser: true,
      },
    });
    setLoading(false);
    if (err) { showAuthError(err); return; }
    setSent(true);
  };

  if (checkingSession) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.text} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>

        <View style={styles.hero}>
          <Image
            source={theme.isDark ? require('../assets/images/logo-blanco.png') : require('../assets/images/logo-negro.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>¿Qué hay hoy?</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>Saaaaaaabes.</Text>
        </View>

        {!sent ? (
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.inputWrapper, theme.isDark ? styles.inputWrapperDark : styles.inputWrapperLight]}>
              <TextInput
                style={[styles.input, { color: theme.text }]}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={theme.textSecondary}
                value={email}
                onChangeText={(v) => { setEmail(v); setError(''); }}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                autoFocus
                selectionColor={theme.accent}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.text }, loading && styles.buttonDisabled]}
              onPress={handleSend}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color={theme.surface} />
                : <Text style={[styles.buttonText, { color: theme.surface }]} numberOfLines={1}>Entrar</Text>}
            </TouchableOpacity>
            <Text style={[styles.hint, { color: theme.textSecondary }]}>Sin contraseña. Ingresa con un link directo a tu correo.</Text>
          </View>
        ) : (
          <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.label, { color: theme.text }]}>
              Revisá tu correo
            </Text>
            <Text style={[styles.emailHighlight, { color: theme.text }]}>{email}</Text>
            <Text style={[styles.sublabel, { color: theme.textSecondary }]}>
              Te mandamos un link. Ábrelo para entrar a Patio.
            </Text>
            <TouchableOpacity style={styles.backLink} onPress={() => { setSent(false); setError(''); }}>
              <Text style={[styles.backLinkText, { color: theme.text }]}>Cambiar correo</Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
      {__DEV__ && (
        <TouchableOpacity style={styles.devButton} onPress={handleDevLogin}>
          <Text style={[styles.devButtonText, { color: theme.textSecondary }]}>Entrar como dev</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    padding: 32,
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  hero: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 320,
    height: 120,
    marginBottom: 20,
    marginLeft: -7,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '300',
    textAlign: 'center',
  },
  formCard: {
    gap: 16,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingVertical: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 3,
  },
  label: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  sublabel: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  emailHighlight: {
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  inputWrapper: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapperLight: {
    backgroundColor: LIGHT_BG,
    borderColor: 'transparent',
  },
  inputWrapperDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    minHeight: 24,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '300',
    paddingVertical: 0,
  },
  error: {
    color: '#CC0000',
    fontSize: 13,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '900',
  },
  hint: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  backLink: {
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: '300',
    textDecorationLine: 'underline',
  },
  devButton: {
    position: 'absolute',
    bottom: 32,
    alignSelf: 'center',
  },
  devButtonText: {
    fontSize: 13,
    fontWeight: '300',
  },
});
