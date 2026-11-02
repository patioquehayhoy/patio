import { supabase } from '@/lib/supabase';

// Perfil privado, como Instagram: el nombre y la foto se ven, pero las listas
// públicas y a quién sigues solo las ven las personas que apruebas. El
// servidor decide si un «Seguir» queda aceptado o como solicitud.
export type FollowStatus = 'none' | 'pending' | 'accepted';
export type FollowRequest = { followerId: string; name: string; avatarUrl?: string; createdAt: string };

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  return user && !user.is_anonymous ? user.id : null;
}

/** null cuando todavía no hay perfil de Foodie. */
export async function getMyProfilePrivacy(): Promise<boolean | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await supabase.from('user_profiles').select('visibility').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? data.visibility === 'private' : null;
}

export async function setProfilePrivate(isPrivate: boolean): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Inicia sesión para continuar.');
  const { error } = await supabase.from('user_profiles').update({ visibility: isPrivate ? 'private' : 'public' }).eq('user_id', userId);
  if (error) throw error;
}

export async function getFollowStatus(targetId: string): Promise<FollowStatus> {
  const userId = await currentUserId();
  if (!userId || userId === targetId) return 'none';
  const { data, error } = await supabase.from('profile_follows').select('status')
    .eq('follower_id', userId).eq('followed_id', targetId).maybeSingle();
  if (error) throw error;
  return data ? (data.status === 'pending' ? 'pending' : 'accepted') : 'none';
}

/** Sigue o envía solicitud; devuelve en qué quedó. Avisa de mejor esfuerzo. */
export async function followProfile(targetId: string): Promise<FollowStatus> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Inicia sesión para continuar.');
  const { error } = await supabase.from('profile_follows')
    .upsert({ follower_id: userId, followed_id: targetId }, { onConflict: 'follower_id,followed_id', ignoreDuplicates: true });
  if (error) throw error;
  void supabase.functions.invoke('send-community-notification', { body: { kind: 'follow', followedId: targetId } }).catch(() => {});
  return getFollowStatus(targetId);
}

/** Deja de seguir o cancela la solicitud. */
export async function unfollowProfile(targetId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Inicia sesión para continuar.');
  const { error } = await supabase.from('profile_follows').delete().eq('follower_id', userId).eq('followed_id', targetId);
  if (error) throw error;
}

export async function getFollowCounts(targetId: string): Promise<{ followers: number; following: number }> {
  const { data, error } = await supabase.rpc('profile_follow_counts', { target: targetId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { followers: Number(row?.followers ?? 0), following: Number(row?.following ?? 0) };
}

export async function getFollowRequests(): Promise<FollowRequest[]> {
  const userId = await currentUserId();
  if (!userId) return [];
  const { data, error } = await supabase.from('profile_follows').select('follower_id,created_at')
    .eq('followed_id', userId).eq('status', 'pending').order('created_at', { ascending: false });
  if (error) throw error;
  if (!data?.length) return [];
  const { data: profiles } = await supabase.from('user_profiles').select('user_id,display_name,avatar_url')
    .in('user_id', data.map((row: any) => row.follower_id));
  const byId = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
  return data.flatMap((row: any) => {
    const profile: any = byId.get(row.follower_id);
    const name = profile?.display_name?.trim();
    return name ? [{ followerId: row.follower_id, name, avatarUrl: profile?.avatar_url || undefined, createdAt: row.created_at }] : [];
  });
}

export async function acceptFollowRequest(followerId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Inicia sesión para continuar.');
  const { error } = await supabase.from('profile_follows').update({ status: 'accepted' })
    .eq('follower_id', followerId).eq('followed_id', userId);
  if (error) throw error;
}

export async function declineFollowRequest(followerId: string): Promise<void> {
  const userId = await currentUserId();
  if (!userId) throw new Error('Inicia sesión para continuar.');
  const { error } = await supabase.from('profile_follows').delete()
    .eq('follower_id', followerId).eq('followed_id', userId);
  if (error) throw error;
}
