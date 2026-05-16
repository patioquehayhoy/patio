import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
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
import { initializeSignedInUser, LOGIN_CALLBACK_URL } from '@/lib/auth';
import {
  setFonditaDescription,
  setFonditaDireccion,
  setFonditaDireccionVisible,
  setFonditaHorario,
  setFonditaName,
  setPagosEfectivo,
  setPagosTarjeta,
  setPagosTrans,
  setTipoNegocio,
} from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';
import { Fonts, useTheme } from '@/lib/theme';
import { setFonditaId } from '@/lib/user-store';

const ROLE_KEY = '@patio_user_role';
const LIGHT_BG = '#F3F3F0';

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

export default function LoginScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ intent?: string }>();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  const [intent, setIntent] = useState<'choice' | 'business'>('choice');

  useEffect(() => {
    if (params.intent === 'business') setIntent('business');
  }, [params.intent]);

  useEffect(() => {
    (async () => {
      try {
        const [{ data }, savedRole] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem(ROLE_KEY),
        ]);
        if (data.session) await initializeSignedInUser(data.session);
        if (savedRole === 'fondero' && data.session) {
          router.replace('/foto-menu');
          return;
        }
        if (savedRole === 'foodie') {
          router.replace('/explorar');
          return;
        }
      } catch {}
      setCheckingSession(false);
    })();
  }, []);

  const handleDevFondero = () => {
    setFonditaId('dev-123');
    setFonditaName('');
    setFonditaDescription('');
    setFonditaDireccion('');
    setFonditaDireccionVisible(true);
    setFonditaHorario('');
    setPagosEfectivo(true);
    setPagosTrans(true);
    setPagosTarjeta(false);
    setTipoNegocio('fondita');
    router.replace('/foto-menu');
  };

  const handleDevFoodie = () => router.replace('/explorar');

  const handleExplore = () => {
    AsyncStorage.setItem(ROLE_KEY, 'foodie').catch(() => {});
    router.replace('/explorar');
  };

  const handlePublishMenu = () => {
    AsyncStorage.setItem(ROLE_KEY, 'fondero').catch(() => {});
    setIntent('business');
  };

  const handleResetRole = async () => {
    await AsyncStorage.removeItem(ROLE_KEY);
    Alert.alert('Rol limpiado', 'Cierra y abre la app para ver el role-picker de cero.');
  };

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { setError('Ingresa tu correo.'); return; }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: LOGIN_CALLBACK_URL, shouldCreateUser: true },
    });
    setLoading(false);
    if (err) { showAuthError(err); return; }
    setSent(true);
  };

  if (checkingSession) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.bg }]}>
        <AgentSpinner variant="arc" size={28} color={theme.text} />
      </View>
    );
  }

  const logo = theme.isDark
    ? require('../assets/images/logo-blanco.png')
    : require('../assets/images/logo-negro.png');

  return (
    <View style={[styles.root, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {intent === 'choice' ? (
        <View style={[styles.choiceRoot, { paddingBottom: insets.bottom + 32 }]}>
          <View style={styles.logoArea}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.taglineBold, { color: theme.text }]}>¿Qué hay hoy?</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Saaaaaaabes.</Text>
          </View>
          <View style={styles.choiceActions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.text }]}
              onPress={handleExplore}
              activeOpacity={0.86}>
              <Text style={[styles.primaryBtnText, { color: theme.bg }]}>Explorar comida</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={handlePublishMenu}
              activeOpacity={0.7}>
              <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>Publicar mi menú</Text>
            </TouchableOpacity>
            {__DEV__ && (
              <View style={styles.devBarInline}>
                <TouchableOpacity style={[styles.devPill, { borderColor: theme.border }]} onPress={handleDevFoodie} activeOpacity={0.7}>
                  <Text style={[styles.devButtonText, { color: theme.textSecondary }]}>Dev Foodie</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.devPill, { borderColor: theme.border }]} onPress={handleDevFondero} activeOpacity={0.7}>
                  <Text style={[styles.devButtonText, { color: theme.textSecondary }]}>Dev Fondero</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.devPill, { borderColor: theme.border }]} onPress={handleResetRole} activeOpacity={0.7}>
                  <Text style={[styles.devButtonText, { color: theme.textSecondary }]}>Reset rol</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <View style={styles.heroCompact}>
            <Image source={logo} style={styles.logo} resizeMode="contain" />
            <Text style={[styles.taglineBold, { color: theme.text }]}>¿Qué hay hoy?</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>Saaaaaaabes.</Text>
          </View>

          {!sent ? (
            <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <TouchableOpacity style={styles.backLink} onPress={() => { setIntent('choice'); setError(''); }}>
                <Text style={[styles.backLinkText, { color: theme.textSecondary }]}>← Explorar comida</Text>
              </TouchableOpacity>
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
                  autoFocus={intent === 'business'}
                  selectionColor={theme.accent}
                />
              </View>
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity
                style={[styles.button, { backgroundColor: theme.text }, loading && styles.buttonDisabled]}
                onPress={handleSend}
                disabled={loading}>
                {loading
                  ? <AgentSpinner variant="dots" size={19} color={theme.surface} style={styles.buttonSpinner} />
                  : <Text style={[styles.buttonText, { color: theme.surface }]} numberOfLines={1}>Entrar</Text>}
              </TouchableOpacity>
              <Text style={[styles.hint, { color: theme.textSecondary }]}>Sin contraseña. Ingresa con un link directo a tu correo.</Text>
            </View>
          ) : (
            <View style={[styles.formCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.text }]}>Revisá tu correo</Text>
              <Text style={[styles.emailHighlight, { color: theme.text }]}>{email}</Text>
              <Text style={[styles.sublabel, { color: theme.textSecondary }]}>
                Te mandamos un link. Ábrelo para entrar a Patio.
              </Text>
              <TouchableOpacity style={styles.backLink} onPress={() => { setSent(false); setError(''); }}>
                <Text style={[styles.backLinkText, { color: theme.text }]}>Cambiar correo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.backLink} onPress={handleExplore}>
                <Text style={[styles.backLinkText, { color: theme.textSecondary }]}>Explorar comida</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  root: { flex: 1, paddingHorizontal: 24 },

  // Choice layout
  choiceRoot: { flex: 1, justifyContent: 'center' },
  logoArea: { alignItems: 'center', marginBottom: 48 },
  logo: { width: 300, height: 112, marginLeft: -7, marginBottom: 10 },
  taglineBold: { fontSize: 15, fontWeight: '900', fontFamily: Fonts.brand, textAlign: 'center' },
  tagline: { fontSize: 15, fontWeight: '300', fontFamily: Fonts.brand, textAlign: 'center' },
  choiceActions: { gap: 14 },
  primaryBtn: { minHeight: 60, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { fontSize: 18, fontWeight: '900' },
  secondaryBtn: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { fontSize: 14, fontWeight: '300' },

  // Form layout
  keyboardView: { flex: 1, justifyContent: 'center' },
  heroCompact: { alignItems: 'center', marginBottom: 32 },
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
  label: { fontSize: 24, fontWeight: '900', marginBottom: 2, textAlign: 'center' },
  sublabel: { fontSize: 15, lineHeight: 22, textAlign: 'center' },
  emailHighlight: { fontSize: 16, fontWeight: '900', textAlign: 'center' },
  inputWrapper: { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingVertical: 12 },
  inputWrapperLight: { backgroundColor: LIGHT_BG, borderColor: 'transparent' },
  inputWrapperDark: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.08)' },
  input: { minHeight: 24, fontSize: 16, lineHeight: 22, fontWeight: '300', paddingVertical: 0 },
  error: { color: '#CC0000', fontSize: 13 },
  button: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  buttonDisabled: { opacity: 0.4 },
  buttonSpinner: { height: 22 },
  buttonText: { fontSize: 16, fontWeight: '900' },
  hint: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  backLink: { alignItems: 'center', paddingTop: 4, paddingBottom: 2 },
  backLinkText: { fontSize: 14, fontWeight: '300', textDecorationLine: 'underline' },

  // Dev
  devBarInline: { flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' },
  devPill: { minHeight: 36, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  devButtonText: { fontSize: 13, fontWeight: '300' },
});
