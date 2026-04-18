import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';

import { upsertFondita } from '@/lib/db';
import { setFonditaName } from '@/lib/menu-store';
import { setFonditaId } from '@/lib/user-store';

export const LOGIN_CALLBACK_URL = Linking.createURL('/login-callback');

export async function initializeSignedInUser(session: Session): Promise<void> {
  const email = session.user.email?.trim().toLowerCase();
  if (!email) return;

  const fonditaId = await upsertFondita(email);
  if (!fonditaId) return;

  setFonditaId(fonditaId);
  setFonditaName(email);
}
