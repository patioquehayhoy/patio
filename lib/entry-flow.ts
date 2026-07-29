import AsyncStorage from '@react-native-async-storage/async-storage';

import { initializeSignedInUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export const USER_ROLE_KEY = '@patio_user_role';
export const ONBOARDING_DONE_KEY = 'onboarding_done';

export type UserRole = 'foodie' | 'fondero';
export type PostOnboardingRoute = '/explorar' | '/fondero-acceso' | '/patio-smart' | '/menu';

function parseRole(value: unknown): UserRole | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  return candidate === 'foodie' || candidate === 'fondero' ? candidate : null;
}

export async function saveUserRole(role: UserRole): Promise<void> {
  await AsyncStorage.setItem(USER_ROLE_KEY, role);
}

export async function getUserRole(): Promise<UserRole | null> {
  return parseRole(await AsyncStorage.getItem(USER_ROLE_KEY).catch(() => null));
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDING_DONE_KEY).catch(() => null)) === '1';
}

/**
 * Closes the shared introduction without losing the user's original intent.
 * An explicit route param wins; persisted role is the safe fallback for old
 * deep links and older persisted sessions.
 */
export async function completeOnboarding(intent?: unknown): Promise<PostOnboardingRoute> {
  const explicitRole = parseRole(intent);
  const role = explicitRole ?? await getUserRole() ?? 'foodie';

  await Promise.all([
    AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1').catch(() => {}),
    saveUserRole(role).catch(() => {}),
  ]);

  if (role !== 'fondero') return '/explorar';

  const sessionResult = await supabase.auth.getSession().catch(() => null);
  const session = sessionResult?.data.session;
  if (!session) return '/fondero-acceso';

  try {
    const { needsSetup } = await initializeSignedInUser(session);
    return needsSetup ? '/patio-smart' : '/menu';
  } catch {
    // A signed-in business must never fall through to the Foodie map because
    // profile hydration failed. Patio Smart can recover once connectivity is back.
    return '/patio-smart';
  }
}
