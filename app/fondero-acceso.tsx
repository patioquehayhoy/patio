import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Keyboard,
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
import { completeOnboarding, saveUserRole } from '@/lib/entry-flow';
import { supabase } from '@/lib/supabase';
import { Fonts } from '@/lib/theme';
import { noWidow } from '@/lib/typography';

// Acceso de quien publica — decisión 2026-07-18 (Alejandro): mix A+B.
// Botánica full-bleed (idioma del onboarding), logo + par de marca al centro
// de la pantalla, texto y campo en glass abajo. Siempre oscura.
// Lógica de auth intacta (magic link vía Supabase).
const HERO = require('../assets/hero/botanica-3.jpg');
const LOGO_BLANCO = require('../assets/images/logo-blanco.png');

const DARK = {
  text: '#F8F8F5',
  textSecondary: 'rgba(248,248,245,0.7)',
  textMute: 'rgba(248,248,245,0.45)',
};

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
  Alert.alert('Oops', noWidow(texto), [{ text: 'Entendido' }]);
}

export default function FonderoAccesoScreen() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const brandFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Invariante de navegación: cualquier entrada —incluido un deep link— a
    // este acceso pertenece al recorrido de quien publica.
    saveUserRole('fondero').catch(() => {});
  }, []);

  // El logo vive en el centro exacto; al subir el teclado se desvanece
  // para no chocar con el campo.
  useEffect(() => {
    const show = Keyboard.addListener('keyboardWillShow', () => {
      Animated.timing(brandFade, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener('keyboardWillHide', () => {
      Animated.timing(brandFade, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    });
    return () => { show.remove(); hide.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const exploreInstead = async () => {
    await saveUserRole('foodie').catch(() => {});
    const destination = await completeOnboarding('foodie');
    router.replace(destination);
  };

  return (
    <View style={s.root}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Botánica full-bleed + velo para legibilidad */}
      <Image source={HERO} style={s.bg} resizeMode="cover" />
      <LinearGradient
        colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back */}
      <TouchableOpacity
        style={[s.backBtn, { top: insets.top + 10 }]}
        onPress={handleBack}
        activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={20} color={DARK.text} />
      </TouchableOpacity>

      {/* Logo en el centro EXACTO de la pantalla (overlay fuera del teclado);
          el par de marca cuelga debajo sin mover el ancla */}
      <Animated.View style={[s.brandOverlay, { opacity: brandFade }]} pointerEvents="none">
        <View>
          <Image source={LOGO_BLANCO} style={s.logo} resizeMode="contain" />
          <View style={s.pairBelow}>
            <Text style={s.claim} allowFontScaling={true} maxFontSizeMultiplier={1.4}>{noWidow('¿Qué hay hoy?')}</Text>
            <Text style={s.tagline} allowFontScaling={true}>Saaaaaaabes.</Text>
          </View>
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        <View style={[s.content, { paddingBottom: insets.bottom + 28 }]}>

          <View style={{ flex: 1 }} />

          {!sent ? (
            <View style={s.actionArea}>
              <Text style={s.title} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.4}>{noWidow('Tu menú, en un correo.')}</Text>
              <Text style={s.sub} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.7}>
                {noWidow('Sin contraseñas. Te mandamos un enlace y publicas el menú del día en 30 segundos.')}
              </Text>
              <View style={[s.field, error ? { borderColor: '#E5484D' } : null]}>
                <BlurView intensity={16} tint="dark" style={s.fieldInner}>
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
                    selectionColor={DARK.text}
                    allowFontScaling={true}
                  />
                  <TouchableOpacity
                    style={[s.sendBtn, loading && s.sendBtnOff]}
                    onPress={handleSend}
                    disabled={loading}
                    accessibilityLabel="Enviar enlace"
                    activeOpacity={0.86}>
                    {loading
                      ? <AgentSpinner variant="dots" size={18} color="#0B0B0C" />
                      : <Ionicons name="arrow-forward" size={18} color="#0B0B0C" />}
                  </TouchableOpacity>
                </BlurView>
              </View>
              {error ? <Text style={s.errorText} allowFontScaling={true}>{error}</Text> : null}
            </View>
          ) : (
            <View style={s.actionArea}>
              <Text style={s.title} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.4}>{noWidow('Revisa tu correo.')}</Text>
              <Text style={[s.sub, s.sentLead]} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.7}>{noWidow('Te mandamos un enlace a')}</Text>
              <Text style={s.emailHi} allowFontScaling={true} numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.4}>{email}</Text>
              <Text style={s.sentHint} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.7}>{noWidow('El enlace dura 15 minutos. Revisa spam si no aparece.')}</Text>
              <TouchableOpacity style={s.changeLink} onPress={() => setSent(false)} activeOpacity={0.7}>
                <Text style={s.changeText} allowFontScaling={true} numberOfLines={1} maxFontSizeMultiplier={1.3}>{noWidow('Cambiar correo')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Pie: lado Foodie */}
          <TouchableOpacity style={s.footer} onPress={exploreInstead} activeOpacity={0.7}>
            <Text style={s.footerText} allowFontScaling={true} lineBreakStrategyIOS="push-out" maxFontSizeMultiplier={1.5}>
              {noWidow('¿Solo buscas algo rico?')} <Text style={s.footerAccent}>{noWidow('Ver lo de hoy →')}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0B0B0C' },
  bg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },

  backBtn: { position: 'absolute', left: 16, zIndex: 20, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)', alignItems: 'center', justifyContent: 'center' },

  content: { flex: 1, paddingHorizontal: 28 },

  // flex 1 arriba y abajo del bloque de marca lo dejan al centro óptico;
  // el bloque de acción vive abajo (ley: todo accionable abajo).
  brandOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  // Idéntico a la entrada (index.tsx): mismo tamaño y misma ancla de centro.
  logo: { width: 230, height: 86 },
  pairBelow: { position: 'absolute', top: '100%', left: 0, right: 0, alignItems: 'center', marginTop: 14 },
  claim: { fontSize: 15, fontWeight: '900', fontFamily: Fonts.brand, textAlign: 'center', color: '#F8F8F5' },
  tagline: { fontSize: 15, fontWeight: '400', fontFamily: Fonts.brand, textAlign: 'center', color: 'rgba(248,248,245,0.7)' },

  actionArea: { alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.8, lineHeight: 30, color: '#F8F8F5', textAlign: 'center', marginBottom: 8, fontFamily: Fonts.brand },
  sub: { fontSize: 14, fontWeight: '400', lineHeight: 20, color: 'rgba(248,248,245,0.7)', textAlign: 'center', marginBottom: 18, maxWidth: 320 },
  sentLead: { marginBottom: 4 },
  emailHi: { maxWidth: 320, fontSize: 14, fontWeight: '900', color: '#F8F8F5', textAlign: 'center' },
  sentHint: { marginTop: 8, maxWidth: 320, fontSize: 14, fontWeight: '400', lineHeight: 20, color: 'rgba(248,248,245,0.7)', textAlign: 'center' },

  field: { alignSelf: 'stretch', borderRadius: 14, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.18)' },
  fieldInner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 18, paddingRight: 5, paddingVertical: 5 },
  input: { flex: 1, minHeight: 46, fontSize: 16, fontWeight: '400', color: '#F8F8F5', paddingVertical: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  sendBtnOff: { opacity: 0.5 },
  errorText: { marginTop: 10, fontSize: 13, fontWeight: '400', color: '#FF8A8E', textAlign: 'center' },

  changeLink: { marginTop: 6 },
  changeText: { fontSize: 14, fontWeight: '400', color: '#F8F8F5', textDecorationLine: 'underline' },

  footer: { alignItems: 'center', paddingTop: 22 },
  footerText: { fontSize: 13, fontWeight: '400', color: 'rgba(248,248,245,0.45)' },
  footerAccent: { fontWeight: '900', color: 'rgba(248,248,245,0.7)' },
});
