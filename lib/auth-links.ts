import type { EmailOtpType } from '@supabase/supabase-js';

const OTP_TYPES: EmailOtpType[] = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'];

export function safeReturnTo(value: unknown, fallback = '/explorar'): string {
  const path = Array.isArray(value) ? value[0] : value;
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//') ||
      path.length > 2048 || /[\\\r\n]/.test(path)) return fallback;
  try {
    const pathname = decodeURIComponent(path.split(/[?#]/)[0]);
    if (!/^\/(explorar|cuenta|privacidad|favoritos|resena|patio|foodie|coleccion|coleccion-publica|guardar|avisos|notificaciones|perfil-comunidad)(\/[a-zA-Z0-9_-]+)?$/.test(pathname)) return fallback;
  } catch { return fallback; }
  return path;
}

export function extractAuthParams(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== 'patio:' || url.hostname !== 'login-callback') {
    throw new Error('El enlace no corresponde a un acceso de Patio.');
  }
  const hash = new URLSearchParams(url.hash.slice(1));
  const read = (key: string) => url.searchParams.get(key) || hash.get(key);
  const type = read('type') || 'magiclink';
  return {
    code: read('code'),
    tokenHash: read('token_hash') || read('token'),
    type: OTP_TYPES.includes(type as EmailOtpType) ? type as EmailOtpType : 'magiclink' as EmailOtpType,
    hasError: !!(read('error') || read('error_code') || read('error_description')),
  };
}

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
