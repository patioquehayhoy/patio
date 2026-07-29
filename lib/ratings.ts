import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const KEY = '@patio_ratings';

export type PatioRating = {
  stars: number;
  reasons?: string[];
  note?: string;
  photoUri?: string;
  timestamp: number;
};

export type PublicPatioReview = PatioRating & {
  userId: string;
  author: string;
  avatarUrl?: string;
  businessReply?: string;
  businessRepliedAt?: string;
  isMine: boolean;
};

type RatingsMap = Record<string, PatioRating>;

async function getMap(): Promise<RatingsMap> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as RatingsMap) : {};
}

export async function getPatioRating(patioId: string): Promise<PatioRating | null> {
  const map = await getMap();
  return map[patioId] ?? null;
}

export async function getPublicPatioReviews(patioId: string): Promise<PublicPatioReview[]> {
  if (!/^[0-9a-f-]{36}$/i.test(patioId)) {
    const mine = await getPatioRating(patioId);
    return mine ? [{ ...mine, userId: 'local', author: 'Tú', isMine: true }] : [];
  }
  const [{ data: session }, { data, error }] = await Promise.all([
    supabase.auth.getSession(),
    supabase
      .from('reviews')
      .select('user_id,stars,reasons,note,created_at,updated_at,business_reply,business_replied_at')
      .eq('fondita_id', patioId)
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
  ]);
  if (error) return [];
  const userIds = [...new Set((data ?? []).map((row: any) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('user_profiles').select('user_id,display_name,avatar_url').in('user_id', userIds)
    : { data: [] };
  const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
  const currentUserId = session.session?.user.id;
  return (data ?? []).map((row: any) => {
    const profile: any = profilesById.get(row.user_id);
    return {
      userId: row.user_id,
      author: row.user_id === currentUserId ? 'Tú' : (profile?.display_name || 'Foodie de Patio'),
      avatarUrl: profile?.avatar_url || undefined,
      stars: row.stars,
      reasons: row.reasons ?? [],
      note: row.note || undefined,
      timestamp: new Date(row.created_at || row.updated_at).getTime(),
      businessReply: row.business_reply || undefined,
      businessRepliedAt: row.business_replied_at || undefined,
      isMine: row.user_id === currentUserId,
    };
  });
}

export async function replyToReview(fonditaId: string, userId: string, reply: string): Promise<void> {
  const { error } = await supabase.rpc('reply_to_review', {
    target_fondita_id: fonditaId,
    target_user_id: userId,
    reply_text: reply.trim(),
  });
  if (error) throw error;
}

export type SaveRatingInput = {
  stars: number;
  reasons?: string[];
  note?: string;
  photoUri?: string;
};

// Acepta la firma corta (stars, reasons) por compatibilidad, o un objeto completo.
export async function savePatioRating(
  patioId: string,
  starsOrInput: number | SaveRatingInput,
  reasons?: string[],
): Promise<void> {
  const map = await getMap();
  const data: SaveRatingInput =
    typeof starsOrInput === 'number'
      ? { stars: starsOrInput, reasons }
      : starsOrInput;
  map[patioId] = {
    stars: data.stars,
    reasons: data.reasons,
    note: data.note?.trim() || undefined,
    photoUri: data.photoUri || undefined,
    timestamp: Date.now(),
  };
  await AsyncStorage.setItem(KEY, JSON.stringify(map));
  if (/^[0-9a-f-]{36}$/i.test(patioId)) {
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await supabase.from('reviews').upsert({
        user_id: user.user.id,
        fondita_id: patioId,
        stars: data.stars,
        reasons: data.reasons ?? [],
        note: data.note?.trim() || null,
        updated_at: new Date().toISOString(),
      });
    }
  }
}
