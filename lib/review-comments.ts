import { supabase } from '@/lib/supabase';

// Comentarios en reseñas, guardados en Supabase (`review_comments`). Modelo
// Instagram: respuestas de un solo nivel, «me gusta» por comentario y el
// negocio comenta con su nombre en las reseñas de su Patio.
export type ReviewComment = {
  id: string;
  reviewId: string;
  parentId?: string;
  userId: string;
  author: string;
  avatarUrl?: string;
  body: string;
  createdAt: string;
  likes: number;
  liked: boolean;
  mine: boolean;
  byPatio: boolean;
};

export class CommentSignInRequiredError extends Error {
  constructor() {
    super('COMMENT_SIGN_IN_REQUIRED');
    this.name = 'CommentSignInRequiredError';
  }
}

export function isRealReviewId(id?: string): id is string {
  return !!id && /^[0-9a-f-]{36}$/i.test(id);
}

/** Comentarios publicados de estas reseñas, del más viejo al más nuevo. */
export async function getReviewComments(reviewIds: string[], patio: { id: string; name: string }): Promise<ReviewComment[]> {
  const ids = reviewIds.filter(isRealReviewId);
  if (!ids.length) return [];
  const [{ data: session }, { data: owner }, { data: rows, error }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.from('negocios').select('owner_id').eq('id', patio.id).maybeSingle(),
    supabase.from('review_comments')
      .select('id,review_id,parent_id,user_id,body,created_at')
      .in('review_id', ids)
      .order('created_at', { ascending: true }),
  ]);
  if (error) throw error;
  if (!rows?.length) return [];
  const me = session.session?.user.id;
  const commentIds = rows.map((row: any) => row.id);
  const authorIds = [...new Set(rows.map((row: any) => row.user_id))];
  const [{ data: profiles }, { data: likes }] = await Promise.all([
    supabase.from('user_profiles').select('user_id,display_name,avatar_url').in('user_id', authorIds),
    supabase.from('review_comment_likes').select('comment_id,user_id').in('comment_id', commentIds),
  ]);
  const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
  const likeCount = new Map<string, number>();
  const likedByMe = new Set<string>();
  for (const like of (likes ?? []) as any[]) {
    likeCount.set(like.comment_id, (likeCount.get(like.comment_id) ?? 0) + 1);
    if (like.user_id === me) likedByMe.add(like.comment_id);
  }
  return rows.flatMap((row: any) => {
    const byPatio = !!owner?.owner_id && row.user_id === owner.owner_id;
    const profile: any = profilesById.get(row.user_id);
    const mine = row.user_id === me;
    const author = byPatio ? patio.name : mine ? 'Tú' : profile?.display_name?.trim();
    if (!author) return [];
    return [{
      id: row.id,
      reviewId: row.review_id,
      parentId: row.parent_id ?? undefined,
      userId: row.user_id,
      author,
      avatarUrl: byPatio ? undefined : profile?.avatar_url || undefined,
      body: row.body,
      createdAt: row.created_at,
      likes: likeCount.get(row.id) ?? 0,
      liked: likedByMe.has(row.id),
      mine,
      byPatio,
    }];
  });
}

/** Publica y avisa (de mejor esfuerzo) a quien escribió la reseña o el comentario. */
export async function postReviewComment(reviewId: string, body: string, parentId?: string): Promise<{ id: string; createdAt: string; parentId?: string }> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId || session.session?.user.is_anonymous) throw new CommentSignInRequiredError();
  const { data, error } = await supabase.from('review_comments')
    .insert({ review_id: reviewId, user_id: userId, body: body.trim(), parent_id: parentId ?? null })
    .select('id,created_at,parent_id')
    .single();
  if (error) throw error;
  void supabase.functions.invoke('send-community-notification', { body: { kind: 'comment', commentId: data.id } }).catch(() => {});
  return { id: data.id, createdAt: data.created_at, parentId: data.parent_id ?? undefined };
}

export async function deleteReviewComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('review_comments').delete().eq('id', commentId);
  if (error) throw error;
}

export async function setCommentLike(commentId: string, liked: boolean): Promise<void> {
  const { data: session } = await supabase.auth.getSession();
  const userId = session.session?.user.id;
  if (!userId) throw new CommentSignInRequiredError();
  const { error } = liked
    ? await supabase.from('review_comment_likes').upsert({ comment_id: commentId, user_id: userId }, { onConflict: 'comment_id,user_id', ignoreDuplicates: true })
    : await supabase.from('review_comment_likes').delete().eq('comment_id', commentId).eq('user_id', userId);
  if (error) throw error;
}

export function commentTimeLabel(createdAt: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(createdAt).getTime()) / 60_000));
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} d`;
  return new Date(createdAt).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

export type MyCommentEvent = {
  id: string;
  kind: 'comment' | 'reply';
  author: string;
  avatarUrl?: string;
  body: string;
  fonditaId: string;
  fonditaName: string;
  createdAt: string;
};

/** Comentarios en mis reseñas y respuestas a mis comentarios, más nuevos primero. */
export async function getMyCommentEvents(): Promise<MyCommentEvent[]> {
  const { data: session } = await supabase.auth.getSession();
  const me = session.session?.user.id;
  if (!me) return [];
  const [{ data: myReviews }, { data: myComments }] = await Promise.all([
    supabase.from('reviews').select('id').eq('user_id', me),
    supabase.from('review_comments').select('id').eq('user_id', me),
  ]);
  const reviewIds = (myReviews ?? []).map((row: any) => row.id);
  const commentIds = (myComments ?? []).map((row: any) => row.id);
  const [onReviews, replies] = await Promise.all([
    reviewIds.length
      ? supabase.from('review_comments').select('id,review_id,parent_id,user_id,body,created_at').in('review_id', reviewIds).neq('user_id', me).order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] as any[] }),
    commentIds.length
      ? supabase.from('review_comments').select('id,review_id,parent_id,user_id,body,created_at').in('parent_id', commentIds).neq('user_id', me).order('created_at', { ascending: false }).limit(50)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const seen = new Set<string>();
  const rows = [
    ...((replies.data ?? []) as any[]).map((row) => ({ ...row, kind: 'reply' as const })),
    ...((onReviews.data ?? []) as any[]).map((row) => ({ ...row, kind: 'comment' as const })),
  ].filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)));
  if (!rows.length) return [];
  const [{ data: reviews }, { data: profiles }] = await Promise.all([
    supabase.from('reviews').select('id,negocio_id,negocios(nombre,owner_id)').in('id', [...new Set(rows.map((row) => row.review_id))]),
    supabase.from('user_profiles').select('user_id,display_name,avatar_url').in('user_id', [...new Set(rows.map((row) => row.user_id))]),
  ]);
  const reviewsById = new Map((reviews ?? []).map((review: any) => [review.id, review]));
  const profilesById = new Map((profiles ?? []).map((profile: any) => [profile.user_id, profile]));
  return rows.flatMap((row) => {
    const review: any = reviewsById.get(row.review_id);
    if (!review) return [];
    const byPatio = review.negocios?.owner_id === row.user_id;
    const profile: any = profilesById.get(row.user_id);
    const author = byPatio ? review.negocios?.nombre?.trim() : profile?.display_name?.trim();
    if (!author) return [];
    return [{
      id: row.id,
      kind: row.kind,
      author,
      avatarUrl: byPatio ? undefined : profile?.avatar_url || undefined,
      body: row.body,
      fonditaId: review.negocio_id,
      fonditaName: review.negocios?.nombre ?? 'un Patio',
      createdAt: row.created_at,
    }];
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
