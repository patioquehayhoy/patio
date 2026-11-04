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

export type ProfileStats = { reviews: number; likes: number; followers: number; following: number };

/** Números del perfil, públicos como en Instagram aunque la cuenta sea privada. */
export async function getProfileStats(targetId: string): Promise<ProfileStats> {
  const { data, error } = await supabase.rpc('profile_stats', { target: targetId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    reviews: Number(row?.reviews ?? 0),
    likes: Number(row?.likes ?? 0),
    followers: Number(row?.followers ?? 0),
    following: Number(row?.following ?? 0),
  };
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

export type FollowListPerson = { userId: string; name: string; handle?: string; avatarUrl?: string };

/** Seguidores o seguidos aceptados; la base no entrega la lista de un perfil privado ajeno. */
export async function getFollowList(targetId: string, kind: 'seguidores' | 'siguiendo'): Promise<FollowListPerson[]> {
  if (!/^[0-9a-f-]{36}$/i.test(targetId)) return [];
  const mine = kind === 'seguidores' ? 'followed_id' : 'follower_id';
  const theirs = kind === 'seguidores' ? 'follower_id' : 'followed_id';
  const { data, error } = await supabase.from('profile_follows').select(`${theirs},created_at`)
    .eq(mine, targetId).eq('status', 'accepted').order('created_at', { ascending: false });
  if (error) throw error;
  const ids = (data ?? []).map((row: any) => row[theirs] as string);
  if (!ids.length) return [];
  const { data: profiles, error: profileError } = await supabase.from('user_profiles')
    .select('user_id,display_name,handle,avatar_url').in('user_id', ids);
  if (profileError) throw profileError;
  const byId = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
  return ids.flatMap((id) => {
    const profile: any = byId.get(id);
    const name = profile?.display_name?.trim();
    return name ? [{ userId: id, name, handle: profile.handle || undefined, avatarUrl: profile.avatar_url || undefined }] : [];
  });
}

export type FollowedPlace = { id: string; name: string };

/** Lugares que sigue un perfil; vacío si es privado y no lo sigues. */
export async function getFollowedPlaces(targetId: string): Promise<FollowedPlace[]> {
  if (!/^[0-9a-f-]{36}$/i.test(targetId)) return [];
  const { data, error } = await supabase.rpc('profile_followed_places', { target: targetId });
  if (error) throw error;
  return ((data ?? []) as any[]).map((row) => ({ id: row.negocio_id, name: row.nombre }));
}

export type TopPlace = { id: string; name: string; stars?: number };

/**
 * Sus lugares: los que mejor calificó (más estrellas, luego lo más reciente) y
 * después los que sigue sin reseñar, hasta 10. Respeta el perfil privado: los
 * lugares que sigue solo llegan si puedes ver su contenido.
 */
export async function getTopPlaces(targetId: string): Promise<TopPlace[]> {
  if (!/^[0-9a-f-]{36}$/i.test(targetId)) return [];
  const [reviews, followed] = await Promise.all([
    supabase.from('reviews').select('negocio_id,stars,created_at,negocios(nombre)')
      .eq('user_id', targetId).eq('status', 'published').order('created_at', { ascending: false }).limit(200),
    getFollowedPlaces(targetId).catch(() => [] as FollowedPlace[]),
  ]);
  if (reviews.error) throw reviews.error;
  const best = new Map<string, { name: string; stars: number; at: number }>();
  for (const row of (reviews.data ?? []) as any[]) {
    const place = Array.isArray(row.negocios) ? row.negocios[0] : row.negocios;
    const name = place?.nombre?.trim();
    if (!name) continue;
    const at = new Date(row.created_at).getTime();
    const current = best.get(row.negocio_id);
    if (!current || row.stars > current.stars) best.set(row.negocio_id, { name, stars: row.stars, at: current ? Math.max(current.at, at) : at });
  }
  const reviewed = [...best.entries()]
    .sort((a, b) => b[1].stars - a[1].stars || b[1].at - a[1].at)
    .map(([id, place]): TopPlace => ({ id, name: place.name, stars: place.stars }));
  const onlyFollowed = followed.filter((place) => !best.has(place.id)).map((place): TopPlace => ({ id: place.id, name: place.name }));
  return [...reviewed, ...onlyFollowed].slice(0, 10);
}

export type FollowingActivity = {
  key: string;
  kind: 'follow' | 'list' | 'review';
  actorId: string;
  actorName: string;
  avatarUrl?: string;
  placeId?: string;
  placeName?: string;
  listId?: string;
  listTitle?: string;
  stars?: number;
  at: string;
};

/** «De quienes sigues»: lo reciente de las personas que sigues (14 días). */
export async function getFollowingActivity(): Promise<FollowingActivity[]> {
  if (!(await currentUserId())) return [];
  const { data, error } = await supabase.rpc('following_activity');
  if (error) throw error;
  return ((data ?? []) as any[]).map((row): FollowingActivity => ({
    key: `${row.kind}-${row.actor_id}-${row.negocio_id ?? row.collection_id}-${row.happened_at}`,
    kind: row.kind,
    actorId: row.actor_id,
    actorName: row.display_name,
    avatarUrl: row.avatar_url || undefined,
    placeId: row.negocio_id || undefined,
    placeName: row.negocio_nombre || undefined,
    listId: row.collection_id || undefined,
    listTitle: row.collection_title || undefined,
    stars: row.stars ?? undefined,
    at: row.happened_at,
  }));
}
