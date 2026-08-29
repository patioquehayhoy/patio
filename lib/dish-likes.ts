import AsyncStorage from '@react-native-async-storage/async-storage';

import { canonicalDishName } from '@/lib/menu-store';
import { supabase } from '@/lib/supabase';

const KEY = '@patio_dish_likes';

// Conjunto local de "fonditaId::platilloCanónico" que este dispositivo ya
// likeó — funciona sin cuenta, igual que Guardados (lib/favorites.ts), para
// que el corazón responda de inmediato aunque el Foodie no tenga sesión.
async function getLocalLiked(): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

async function setLocalLiked(liked: Set<string>): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(Array.from(liked)));
}

function localKey(fonditaId: string, dishName: string): string {
  return `${fonditaId}::${canonicalDishName(dishName)}`;
}

export async function isDishLiked(fonditaId: string, dishName: string): Promise<boolean> {
  const liked = await getLocalLiked();
  return liked.has(localKey(fonditaId, dishName));
}

// Una sola lectura para pintar todos los corazones de una ficha a la vez —
// evita N llamadas a AsyncStorage, una por platillo.
export async function getLikedDishNames(fonditaId: string): Promise<Set<string>> {
  const liked = await getLocalLiked();
  const prefix = `${fonditaId}::`;
  const names = new Set<string>();
  for (const key of liked) {
    if (key.startsWith(prefix)) names.add(key.slice(prefix.length));
  }
  return names;
}

// Alterna el like. Siempre optimista/local; si hay sesión real además
// sincroniza a Supabase para que cuente en el agregado que ve el Fondero —
// mismo patrón de degradación que savePatioRating en lib/ratings.ts (remoto
// solo si hay sesión, local siempre).
export async function toggleDishLike(fonditaId: string, dishName: string): Promise<boolean> {
  const key = localKey(fonditaId, dishName);
  const liked = await getLocalLiked();
  const wasLiked = liked.has(key);
  if (wasLiked) liked.delete(key); else liked.add(key);
  await setLocalLiked(liked);

  if (/^[0-9a-f-]{36}$/i.test(fonditaId)) {
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      const canonical = canonicalDishName(dishName);
      if (wasLiked) {
        await supabase.from('dish_likes').delete()
          .eq('fondita_id', fonditaId).eq('user_id', user.user.id).eq('dish_name', canonical);
      } else {
        await supabase.from('dish_likes').upsert({
          fondita_id: fonditaId,
          user_id: user.user.id,
          dish_name: canonical,
          dish_name_display: dishName.trim(),
        });
      }
    }
  }
  return !wasLiked;
}

export type DishLikeEvent = {
  dishName: string;
  count: number;
  authors: { name: string; avatarUrl?: string }[];
  daysAgo: number;
};

// Para el Fondero (Actividad): a diferencia de una reseña, un like no trae
// contenido propio, así que SÍ se fusiona por platillo+día — mismo criterio
// que usa Instagram para likes (se agrupan) vs. comentarios (no se agrupan,
// ver app/resenas.tsx).
export async function getDishLikeEvents(fonditaId: string): Promise<DishLikeEvent[]> {
  if (!/^[0-9a-f-]{36}$/i.test(fonditaId)) return [];
  const { data, error } = await supabase
    .from('dish_likes')
    .select('user_id,dish_name,dish_name_display,created_at')
    .eq('fondita_id', fonditaId)
    .order('created_at', { ascending: false });
  if (error || !data?.length) return [];

  const userIds = [...new Set(data.map((row: any) => row.user_id))];
  const { data: profiles } = await supabase.from('user_profiles').select('user_id,display_name,avatar_url').in('user_id', userIds);
  const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));

  const groups = new Map<string, { dishName: string; latest: number; authors: { name: string; avatarUrl?: string }[] }>();
  for (const row of data as any[]) {
    const profile: any = profilesById.get(row.user_id);
    const name = profile?.display_name?.trim();
    if (!name) continue;
    const ts = new Date(row.created_at).getTime();
    const groupKey = `${row.dish_name}::${new Date(row.created_at).toDateString()}`;
    const existing = groups.get(groupKey);
    if (existing) {
      existing.authors.push({ name, avatarUrl: profile?.avatar_url || undefined });
      existing.latest = Math.max(existing.latest, ts);
    } else {
      groups.set(groupKey, { dishName: row.dish_name_display || row.dish_name, latest: ts, authors: [{ name, avatarUrl: profile?.avatar_url || undefined }] });
    }
  }
  const now = Date.now();
  return Array.from(groups.values()).map((group) => ({
    dishName: group.dishName,
    count: group.authors.length,
    authors: group.authors,
    daysAgo: Math.max(0, Math.floor((now - group.latest) / 86400000)),
  }));
}
