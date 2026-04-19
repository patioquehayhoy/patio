import { type Session } from '@supabase/supabase-js';
import { upsertFondita } from './db';
import { setFonditaId } from './user-store';

export const LOGIN_CALLBACK_URL = 'patio://login-callback';

export async function initializeSignedInUser(session: Session): Promise<void> {
  const email = session.user.email;
  if (!email) return;
  const id = await upsertFondita(email);
  if (id) setFonditaId(id);
}
