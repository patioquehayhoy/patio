import { type Session } from '@supabase/supabase-js';
import { upsertFondita } from './db';
import { supabase } from './supabase';
import { setFonditaId } from './user-store';
import { activateLocalAccount } from './account-storage';

export const LOGIN_CALLBACK_URL = 'patio://login-callback';

export async function initializeSignedInUser(session: Session): Promise<{ needsSetup: boolean }> {
  await activateLocalAccount(session.user.id);
  const email = session.user.email;
  if (!email) throw new Error('Inicia sesión con el correo de tu negocio.');
  const id = await upsertFondita(email);
  if (!id) throw new Error('No pudimos recuperar tu negocio. Inténtalo de nuevo.');
  setFonditaId(id);
  const { data, error } = await supabase.from('fonditas').select('nombre').eq('id', id).maybeSingle();
  if (error) throw error;
  return { needsSetup: !data?.nombre?.trim() };
}
