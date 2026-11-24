import { withLocalAccountTransition } from './account-storage';
import { isValidEmail } from './auth-links';
import { supabase } from './supabase';

export const EMAIL_CODE_LENGTH = 8;

/** Correo de la cuenta de revisión (no es secreto; el código sí, y vive en el servidor). */
export const REVIEW_EMAIL = 'quehayhoy.patio+revision@gmail.com';

export async function verifyEmailCode(email: string, token: string) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail) || !/^\d{8}$/.test(token)) {
    throw new Error('Escribe el código de 8 dígitos que recibiste por correo.');
  }
  return withLocalAccountTransition(async (activate) => {
    let { data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token, type: 'email' });
    // Cuenta de la revisión de Apple y Google: su código fijo lo revisa el
    // servidor (función review-login); para cualquier otro correo no aplica.
    if ((error || !data.session) && normalizedEmail === REVIEW_EMAIL) {
      const review = await supabase.functions.invoke('review-login', { body: { email: normalizedEmail, code: token } });
      const reviewToken = (review.data as { token?: unknown } | null)?.token;
      if (!review.error && typeof reviewToken === 'string') {
        ({ data, error } = await supabase.auth.verifyOtp({ email: normalizedEmail, token: reviewToken, type: 'email' }));
      }
    }
    if (error || !data.session) {
      throw new Error('No pudimos verificar el código. Revisa tu conexión y el código, o solicita uno nuevo.');
    }
    await activate(data.session.user.id);
    return data.session;
  });
}
