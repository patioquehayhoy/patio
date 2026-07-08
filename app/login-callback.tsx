import { type EmailOtpType, type Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { AgentSpinner } from '@/components/agent-spinner';
import { initializeSignedInUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

function debugLog(...args: unknown[]) {
  if (__DEV__) console.log(...args);
}

function normalizeOtpType(rawType: string | null): EmailOtpType {
  if (!rawType) return 'magiclink';
  return OTP_TYPES.includes(rawType as EmailOtpType) ? (rawType as EmailOtpType) : 'magiclink';
}

function extractAuthParams(rawUrl: string): {
  code: string | null;
  tokenHash: string | null;
  type: string | null;
} {
  const parsedUrl = new URL(rawUrl);
  const search = parsedUrl.searchParams;
  const hash = new URLSearchParams(parsedUrl.hash.startsWith('#') ? parsedUrl.hash.slice(1) : parsedUrl.hash);

  const read = (...keys: string[]) => {
    for (const key of keys) {
      const value = search.get(key) ?? hash.get(key);
      if (value) return value;
    }
    return null;
  };

  return {
    code: read('code'),
    tokenHash: read('token_hash', 'token'),
    type: read('type'),
  };
}

export default function LoginCallback() {
  const router = useRouter();
  const [diag, setDiag] = useState<string>('Verificando link...');

  useEffect(() => {
    let isCancelled = false;

    const safeRedirect = (path: '/' | '/perfil' | '/menu', delayMs = 0) => {
      setTimeout(() => { if (!isCancelled) router.replace(path); }, delayMs);
    };

    async function handle() {
      // Si la app ya estaba abierta y tapeas el link, getInitialURL es null.
      // Hay que esperar el evento de Linking durante un tick.
      let rawUrl: string | null = await Linking.getInitialURL();
      if (!rawUrl) {
        rawUrl = await new Promise<string | null>((resolve) => {
          const sub = Linking.addEventListener('url', ({ url }) => { sub.remove(); resolve(url); });
          setTimeout(() => { sub.remove(); resolve(null); }, 800);
        });
      }
      debugLog('[auth] login callback url:', rawUrl);

      if (!rawUrl) {
        setDiag('Link vacío — regresando a inicio');
        safeRedirect('/', 1500);
        return;
      }

      const { code, tokenHash, type } = extractAuthParams(rawUrl);
      let session: Session | null = null;
      let errMsg = '';

      if (code) {
        setDiag('Intercambiando code…');
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { errMsg = `code: ${error.message}`; debugLog('[auth] exchangeCodeForSession error:', error.message); }
        session = data.session ?? null;
      } else if (tokenHash) {
        setDiag('Verificando OTP…');
        const otpType = normalizeOtpType(type);
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
        if (error) { errMsg = `otp: ${error.message}`; debugLog('[auth] verifyOtp error:', error.message); }
        session = data.session ?? null;
      } else {
        errMsg = 'sin code ni token_hash en URL';
        debugLog('[auth] callback sin code/token_hash');
      }

      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data.session ?? null;
      }

      if (session) {
        setDiag('¡Listo! Entrando…');
        await initializeSignedInUser(session);
        safeRedirect('/menu');
        return;
      }

      setDiag(`Sin sesión. ${errMsg || 'Causa desconocida'}\nRegresando al inicio…`);
      safeRedirect('/', 3500);
    }

    handle().catch((err) => {
      const msg = err?.message ?? String(err);
      setDiag(`Error: ${msg}`);
      console.error('[auth] login callback error:', err);
      safeRedirect('/', 3500);
    });

    return () => { isCancelled = true; };
  }, [router]);

  return (
    <View style={s.root}>
      <View style={s.glow} />
      <AgentSpinner variant="arc" size={30} color="#FF6A3D" />
      <Text style={s.diag} allowFontScaling={true}>{diag}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#111214', justifyContent: 'center', alignItems: 'center', padding: 28 },
  glow: { position: 'absolute', top: -150, left: -100, right: -100, height: 600, backgroundColor: 'rgba(255,106,61,0.10)', borderRadius: 300 },
  diag: { marginTop: 20, fontSize: 14, color: 'rgba(248,248,245,0.7)', textAlign: 'center', fontWeight: '300', lineHeight: 20 },
});
