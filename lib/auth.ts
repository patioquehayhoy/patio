import { type Session } from '@supabase/supabase-js';
import { upsertFondita } from './db';
import { supabase } from './supabase';
import { setFonditaId } from './user-store';

export const LOGIN_CALLBACK_URL = 'patio://login-callback';

export async function initializeSignedInUser(session: Session): Promise<{ needsSetup: boolean }> {
  const email = session.user.email;
  if (!email) return { needsSetup: false };
  const id = await upsertFondita(email);
  if (id) setFonditaId(id);
  if (!id) return { needsSetup: false };
  const { data } = await supabase.from('fonditas').select('nombre').eq('id', id).maybeSingle();
  return { needsSetup: !data?.nombre?.trim() };
}
