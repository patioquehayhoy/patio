import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

type NotificationsModule = typeof import('expo-notifications');

export type NotificationPreferences = {
  patioPublications: boolean;
  businessActivity: boolean;
  productUpdates: boolean;
};

export class CommunitySignInRequiredError extends Error {
  constructor() {
    super('COMMUNITY_SIGN_IN_REQUIRED');
    this.name = 'CommunitySignInRequiredError';
  }
}

function notificationsModule(): NotificationsModule | null {
  try {
    return require('expo-notifications') as NotificationsModule;
  } catch {
    return null;
  }
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function requestSystemNotificationPermission(): Promise<boolean> {
  const Notifications = notificationsModule();
  if (!Notifications || Platform.OS === 'web') return false;
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain) {
    permission = await Notifications.requestPermissionsAsync();
  }
  return permission.granted;
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.user.id) throw new CommunitySignInRequiredError();
  return data.session.user.id;
}

export async function getSystemNotificationStatus(): Promise<'granted' | 'denied' | 'undetermined' | 'unavailable'> {
  const Notifications = notificationsModule();
  if (!Notifications) return 'unavailable';
  const permission = await Notifications.getPermissionsAsync();
  if (permission.granted) return 'granted';
  if (!permission.canAskAgain) return 'denied';
  return 'undetermined';
}

/**
 * Called only after an explicit high-value action (enabling an alert category),
 * never from saving a Patio or during app launch.
 */
export async function registerCurrentDeviceForPush(): Promise<boolean> {
  const userId = await currentUserId();
  const Notifications = notificationsModule();
  if (!Notifications || Platform.OS === 'web') return false;

  if (!await requestSystemNotificationPermission()) return false;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('Falta extra.eas.projectId para registrar push.');
  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  const { error } = await supabase.from('push_devices').upsert(
    {
      user_id: userId,
      expo_push_token: token.data,
      platform: Platform.OS,
      active: true,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' },
  );
  if (error) throw error;
  return true;
}

export async function getRemoteNotificationPreferences(): Promise<NotificationPreferences> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('patio_publications,business_activity,product_updates')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return {
    patioPublications: data?.patio_publications ?? false,
    businessActivity: data?.business_activity ?? true,
    productUpdates: data?.product_updates ?? false,
  };
}

export async function updateRemoteNotificationPreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const userId = await currentUserId();
  const payload: Record<string, boolean | string> = {
    user_id: userId,
    updated_at: new Date().toISOString(),
  };
  if (patch.patioPublications !== undefined) payload.patio_publications = patch.patioPublications;
  if (patch.businessActivity !== undefined) payload.business_activity = patch.businessActivity;
  if (patch.productUpdates !== undefined) payload.product_updates = patch.productUpdates;
  const { error } = await supabase.from('notification_preferences').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
  if (Object.values(patch).some(Boolean)) await registerCurrentDeviceForPush().catch(() => false);
  return getRemoteNotificationPreferences();
}

// Guardar un lugar y recibir sus avisos son conceptos distintos.
// patio_follows is only the server-side delivery projection when the person
// explicitly enables "Menús nuevos" for their saved places.
export async function syncSavedPatioNotificationSubscriptions(savedPatioIds: string[]): Promise<void> {
  const userId = await currentUserId();
  const prefs = await getRemoteNotificationPreferences();
  const desired = prefs.patioPublications
    ? [...new Set(savedPatioIds.filter(isUuid))]
    : [];
  const { data: current, error: readError } = await supabase
    .from('patio_follows')
    .select('fondita_id')
    .eq('user_id', userId);
  if (readError) throw readError;

  const currentIds = (current ?? []).map((row) => row.fondita_id as string);
  const toRemove = currentIds.filter((id) => !desired.includes(id));
  const toAdd = desired.filter((id) => !currentIds.includes(id));

  if (toRemove.length) {
    const { error } = await supabase
      .from('patio_follows')
      .delete()
      .eq('user_id', userId)
      .in('fondita_id', toRemove);
    if (error) throw error;
  }
  if (toAdd.length) {
    const { error } = await supabase.from('patio_follows').upsert(
      toAdd.map((fonditaId) => ({
        user_id: userId,
        fondita_id: fonditaId,
        notifications_enabled: true,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'user_id,fondita_id' },
    );
    if (error) throw error;
  }
}

export async function announceMenuPublication(fonditaId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('send-publication-notifications', {
    body: { fonditaId, kind: 'menu_published' },
  });
  if (error) throw error;
}
