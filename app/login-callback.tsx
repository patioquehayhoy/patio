import { type EmailOtpType, type Session } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { View } from 'react-native';
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

  useEffect(() => {
    let isCancelled = false;

    const safeRedirect = (path: '/' | '/perfil') => {
      if (!isCancelled) router.replace(path);
    };

    async function handle() {
      const rawUrl = await Linking.getInitialURL();
      console.log('[auth] login callback url:', rawUrl);

      if (!rawUrl) {
        safeRedirect('/');
        return;
      }

      const { code, tokenHash, type } = extractAuthParams(rawUrl);
      let session: Session | null = null;

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) console.log('[auth] exchangeCodeForSession error:', error.message);
        session = data.session ?? null;
      } else if (tokenHash) {
        const otpType = normalizeOtpType(type);
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType,
        });
        if (error) console.log('[auth] verifyOtp error:', error.message);
        session = data.session ?? null;
      } else {
        console.log('[auth] callback sin code/token_hash');
      }

      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data.session ?? null;
      }

      if (session) {
        await initializeSignedInUser(session);
        safeRedirect('/perfil');
        return;
      }

      safeRedirect('/');
    }

    handle().catch((err) => {
      console.error('[auth] login callback error:', err);
      safeRedirect('/');
    });

    return () => { isCancelled = true; };
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: '#F5E9D9', justifyContent: 'center', alignItems: 'center' }}>
      <AgentSpinner variant="arc" size={30} color="#1A1A1A" />
    </View>
  );
}
