import type { Session } from '@supabase/supabase-js';
import { extractAuthParams } from './auth-links';
import { supabase } from './supabase';
import { withLocalAccountTransition } from './account-storage';

const inFlight = new Map<string, Promise<Session>>();
let lastCompleted: { key: string; userId: string } | null = null;

// Magic links are single-use. A remount must share the ongoing exchange.
export function resolveLoginSession(rawUrl: string): Promise<Session> {
  const params = extractAuthParams(rawUrl);
  if (params.hasError || (!params.code && !params.tokenHash)) {
    return Promise.reject(new Error('El enlace venció o ya fue usado. Solicita uno nuevo.'));
  }
  const key = params.code ? `code:${params.code}` : `otp:${params.type}:${params.tokenHash}`;
  const current = inFlight.get(key);
  if (current) return current;
  const operation = withLocalAccountTransition(async (activate) => {
    const completed = lastCompleted;
    if (completed?.key === key) {
      // The screen serializes mounts with other session transitions. A remount
      // can reach us after the first exchange has already consumed the link.
      // Reuse only the currently authenticated account, never a cached session
      // that could restore an identity after logout or an account switch.
      const { data, error } = await supabase.auth.getSession();
      if (error || data.session?.user.id !== completed.userId) {
        throw new Error('El enlace venció o ya fue usado. Solicita uno nuevo.');
      }
      await activate(data.session.user.id);
      return data.session;
    }
    const { data, error } = params.code
      ? await supabase.auth.exchangeCodeForSession(params.code)
      : await supabase.auth.verifyOtp({ token_hash: params.tokenHash!, type: params.type });
    if (error || !data.session) throw new Error('No pudimos abrir el enlace. Revisa tu conexión o solicita uno nuevo.');
    lastCompleted = { key, userId: data.session.user.id };
    await activate(data.session.user.id);
    return data.session;
  });
  inFlight.set(key, operation);
  void operation.then(() => inFlight.delete(key), () => inFlight.delete(key));
  return operation;
}
