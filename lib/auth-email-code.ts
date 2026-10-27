import { withLocalAccountTransition } from './account-storage';
import { isValidEmail } from './auth-links';
import { supabase } from './supabase';

export async function verifyEmailCode(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail) || !/^\d{6}$/.test(token)) {
    throw new Error('Escribe el código de 6 dígitos que recibiste por correo.');
  }
  return withLocalAccountTransition(async (activate) => {
    const { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: 'email' });
    if (error || !data.session) {
      throw new Error('No pudimos verificar el código. Revisa tu conexión y el código, o solicita uno nuevo.');
    }
    await activate(data.session.user.id);
    return data.session;
  });
}
