import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
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
import { LOGIN_CALLBACK_URL } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Fonts } from '@/lib/theme';

// FonderoMagicLink exacto a Figma: captura de correo oscura + botánica.
// Flujo Fondero siempre oscuro. Lógica de auth portada de index.tsx (magic link).
const HERO = require('../assets/hero/botanica-3.png');

const DARK = {
  bg: '#111214',
  surface: 'rgba(255,255,255,0.06)',
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.55)',
  textMute: 'rgba(248,248,245,0.4)',
  accent: '#FF6A3D',
};

const BENEFITS = [
  'Tomas foto y Patio lee tu menú',
  'Repite el de ayer con un toque',
  'Se oculta solo cuando cierras',
];

function showAuthError(err: { message?: string; code?: string } | null) {
  if (!err) return;
  const code = err.code ?? '';
  const msg = (err.message ?? '').toLowerCase();
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

function Benefit({ text }: { text: string }) {
  return (
    <View style={s.benefitRow}>
      <View style={s.benefitCheck}>
        <Ionicons name="checkmark" size={11} color={DARK.accent} />
      </View>
      <Text style={s.benefitText} allowFontScaling={true}>{text}</Text>
    </View>
  );
}

export default function FonderoAccesoScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

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

  const handleBack = () => {
    if (sent) { setSent(false); return; }
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Backdrop botánico + glow naranja — el gradiente funde la imagen a negro
          ANTES de donde termina, para que no se vea la línea de corte. */}
      <Image source={HERO} style={s.bg} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(17,18,20,0.15)', 'rgba(17,18,20,0.55)', DARK.bg, DARK.bg]}
        locations={[0, 0.38, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={s.glow} />

      {/* Back */}
      <TouchableOpacity
        style={[s.backBtn, { top: insets.top + 10 }]}
        onPress={handleBack}
        activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={20} color={DARK.text} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View style={[s.content, { paddingTop: insets.top + 96, paddingBottom: insets.bottom + 28 }]}>
          <Text style={s.eyebrow} allowFontScaling={true}>Patio · si tienes una cocina</Text>

          {!sent ? (
            <>
              <Text style={s.title} allowFontScaling={true}>Tu menú,{'\n'}en un correo.</Text>
              <Text style={s.sub} allowFontScaling={true}>
                Sin contraseñas. Te mandamos un enlace y publicas el menú del día en 30 segundos.
              </Text>

              {/* Campo de correo */}
              <View style={[s.field, error ? s.fieldError : null]}>
                <Ionicons name="mail-outline" size={18} color={DARK.textSecondary} />
                <TextInput
                  style={s.input}
                  placeholder="tu@correo.com"
                  placeholderTextColor={DARK.textMute}
                  value={email}
                  onChangeText={(v) => { setEmail(v); setError(''); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  returnKeyType="go"
                  onSubmitEditing={handleSend}
                  selectionColor={DARK.accent}
                  allowFontScaling={true}
                />
                <TouchableOpacity
                  style={[s.sendBtn, loading && s.sendBtnDisabled]}
                  onPress={handleSend}
                  disabled={loading}
                  activeOpacity={0.86}>
                  {loading
                    ? <AgentSpinner variant="dots" size={18} color="#fff" />
                    : <Ionicons name="arrow-forward" size={18} color="#fff" />}
                </TouchableOpacity>
              </View>
              {error ? <Text style={s.errorText} allowFontScaling={true}>{error}</Text> : null}

              {/* Beneficios */}
              <View style={s.benefits}>
                {BENEFITS.map((b) => <Benefit key={b} text={b} />)}
              </View>
            </>
          ) : (
            <>
              <Text style={s.title} allowFontScaling={true}>Revisa tu correo.</Text>
              <Text style={s.sub} allowFontScaling={true}>
                Te mandamos un enlace a <Text style={s.emailHi}>{email}</Text>. Ábrelo para entrar a Patio.
              </Text>

              <View style={s.sentCard}>
                <View style={s.sentIcon}>
                  <Ionicons name="mail-unread-outline" size={22} color={DARK.accent} />
                </View>
                <Text style={s.sentHint} allowFontScaling={true}>
                  El enlace es válido 15 minutos. Si no llega, revisa spam.
                </Text>
              </View>

              <TouchableOpacity style={s.changeLink} onPress={() => setSent(false)} activeOpacity={0.7}>
                <Text style={s.changeText} allowFontScaling={true}>Cambiar correo</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ flex: 1 }} />

          {/* Pie: cambiar a foodie */}
          <TouchableOpacity style={s.footer} onPress={() => router.replace('/explorar')} activeOpacity={0.7}>
            <Text style={s.footerText} allowFontScaling={true}>
              ¿Solo buscas comida? <Text style={s.footerAccent}>Explorar cocinas →</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: DARK.bg },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '70%', opacity: 0.5 },
  glow: { position: 'absolute', top: -200, left: -100, right: -100, height: 600, backgroundColor: 'rgba(255,106,61,0.10)', borderRadius: 300 },

  backBtn: { position: 'absolute', left: 16, zIndex: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1, paddingHorizontal: 28 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, textTransform: 'uppercase', color: DARK.accent, marginBottom: 12 },
  title: { fontSize: 38, fontWeight: '900', letterSpacing: -1.3, lineHeight: 38, color: DARK.text, marginBottom: 14, fontFamily: Fonts.brand },
  sub: { fontSize: 15, fontWeight: '300', lineHeight: 22, color: DARK.textSecondary, marginBottom: 28 },
  emailHi: { fontWeight: '700', color: DARK.text },

  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 16, paddingRight: 4, paddingVertical: 4, borderRadius: 18, backgroundColor: DARK.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,106,61,0.4)' },
  fieldError: { borderColor: '#E5484D' },
  input: { flex: 1, minHeight: 48, fontSize: 16, fontWeight: '300', color: DARK.text, paddingVertical: 0 },
  sendBtn: { width: 48, height: 48, borderRadius: 14, backgroundColor: DARK.accent, alignItems: 'center', justifyContent: 'center', shadowColor: DARK.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.5, shadowRadius: 14, elevation: 5 },
  sendBtnDisabled: { opacity: 0.5 },
  errorText: { marginTop: 10, fontSize: 13, fontWeight: '300', color: '#FF8A8E' },

  benefits: { marginTop: 36, gap: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitCheck: { width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,106,61,0.15)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,106,61,0.3)', alignItems: 'center', justifyContent: 'center' },
  benefitText: { fontSize: 14, fontWeight: '300', color: 'rgba(248,248,245,0.75)' },

  sentCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 18, backgroundColor: DARK.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.08)' },
  sentIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(255,106,61,0.12)', alignItems: 'center', justifyContent: 'center' },
  sentHint: { flex: 1, fontSize: 13, fontWeight: '300', lineHeight: 18, color: 'rgba(248,248,245,0.65)' },
  changeLink: { marginTop: 18, alignSelf: 'flex-start' },
  changeText: { fontSize: 14, fontWeight: '300', color: DARK.text, textDecorationLine: 'underline' },

  footer: { alignItems: 'center', paddingTop: 12 },
  footerText: { fontSize: 13, fontWeight: '300', color: DARK.textMute },
  footerAccent: { color: DARK.accent, fontWeight: '700' },
});
