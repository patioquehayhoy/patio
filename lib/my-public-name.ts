import { supabase } from './supabase';

// Tu nombre público («Alejandro P.», igual que como te ven los demás), en
// memoria (2026-11-15): lo tuyo sale con tu nombre desde la primera pintada
// de la ficha, sin esperar a leer la sesión (que a veces renueva el acceso
// por internet y tarda).
type Me = { id: string; name: string };
let memory: Me | null | undefined;

/** Mismo formato que el nombre público del perfil: nombre e inicial del apellido. */
export function publicNameFrom(metadata: Record<string, unknown> | null | undefined): string | undefined {
  const first = String(metadata?.first_name ?? '').trim();
  const last = String(metadata?.last_name ?? '').trim();
  if (!first) return undefined;
  return last ? `${first} ${last.charAt(0)}.` : first;
}

function remember(user: { id: string; user_metadata?: Record<string, unknown> } | null | undefined): Me | null {
  const name = publicNameFrom(user?.user_metadata);
  memory = user && name ? { id: user.id, name } : null;
  return memory;
}

/** Lo que ya se sabe; null si no hay sesión o aún no se lee. */
export function peekMyPublicName(): Me | null {
  return memory ?? null;
}

export async function loadMyPublicName(): Promise<Me | null> {
  const { data } = await supabase.auth.getSession();
  return remember(data.session?.user);
}

// Se lee al abrir la app y se pone al día si cambias de cuenta o de nombre.
void loadMyPublicName().catch(() => {});
supabase.auth.onAuthStateChange((_event, session) => { remember(session?.user); });
