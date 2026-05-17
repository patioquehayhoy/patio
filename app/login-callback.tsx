import { type EmailOtpType, type Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';

import { AgentSpinner } from '@/components/agent-spinner';
import { initializeSignedInUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

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

    const safeRedirect = (path: '/' | '/perfil' | '/foto-menu', delayMs = 0) => {
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
      console.log('[auth] login callback url:', rawUrl);

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
        if (error) { errMsg = `code: ${error.message}`; console.log('[auth] exchangeCodeForSession error:', error.message); }
        session = data.session ?? null;
      } else if (tokenHash) {
        setDiag('Verificando OTP…');
        const otpType = normalizeOtpType(type);
        const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
        if (error) { errMsg = `otp: ${error.message}`; console.log('[auth] verifyOtp error:', error.message); }
        session = data.session ?? null;
      } else {
        errMsg = 'sin code ni token_hash en URL';
        console.log('[auth] callback sin code/token_hash');
      }

      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data.session ?? null;
      }

      if (session) {
        setDiag('¡Listo! Entrando…');
        await initializeSignedInUser(session);
        safeRedirect('/foto-menu');
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
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
      <AgentSpinner variant="arc" size={30} color="#1A1A1A" />
      <Text style={{ marginTop: 18, fontSize: 14, color: '#1A1A1A', textAlign: 'center', fontWeight: '300' }}>{diag}</Text>
    </View>
  );
}
