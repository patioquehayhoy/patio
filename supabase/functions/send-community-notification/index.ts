import { requireUser } from '../_shared/auth.ts';
import { pushTargets, sendExpoPush } from '../_shared/expo-push.ts';
import { corsHeaders, errorResponse, json, readJson } from '../_shared/http.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PREFERENCE = 'social_activity';

type Body = { kind?: 'comment' | 'business_reply' | 'follow'; commentId?: string; reviewId?: string; followedId?: string };
type Admin = Awaited<ReturnType<typeof requireUser>>['admin'];

function snippet(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 90 ? `${clean.slice(0, 89)}…` : clean;
}

async function displayName(admin: Admin, userId: string): Promise<string> {
  const { data } = await admin.from('user_profiles').select('display_name').eq('user_id', userId).maybeSingle();
  return data?.display_name?.trim() || 'Alguien';
}

// Avisos de comunidad: comentario en tu reseña, respuesta a tu comentario,
// respuesta del negocio a tu reseña y seguidores o solicitudes. Solo quien
// hizo la acción puede dispararlo, una vez y en los minutos siguientes.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const { admin, user } = await requireUser(req);
    const body = await readJson(req, 1_024) as Body;
    const since = new Date(Date.now() - 10 * 60_000).toISOString();
    const now = new Date().toISOString();

    if (body.kind === 'comment') {
      if (typeof body.commentId !== 'string' || !UUID.test(body.commentId)) return json({ error: 'Valid commentId is required' }, 400);
      const { data: comment, error } = await admin.from('review_comments')
        .update({ notified_at: now })
        .eq('id', body.commentId).eq('user_id', user.id).eq('status', 'published')
        .is('notified_at', null).gte('created_at', since)
        .select('review_id,parent_id,body').maybeSingle();
      if (error) throw error;
      if (!comment) return json({ delivered: 0, deduplicated: true });

      const { data: review, error: reviewError } = await admin.from('reviews')
        .select('user_id,fondita_id').eq('id', comment.review_id).maybeSingle();
      if (reviewError) throw reviewError;
      if (!review) return json({ delivered: 0 });
      const { data: fondita } = await admin.from('fonditas').select('nombre,owner_id').eq('id', review.fondita_id).maybeSingle();
      const author = fondita?.owner_id === user.id ? (fondita.nombre?.trim() || 'El Patio') : await displayName(admin, user.id);

      let parentAuthor: string | null = null;
      if (comment.parent_id) {
        const { data: parent } = await admin.from('review_comments').select('user_id').eq('id', comment.parent_id).maybeSingle();
        parentAuthor = parent?.user_id ?? null;
      }
      let delivered = 0;
      if (parentAuthor && parentAuthor !== user.id) {
        delivered += await sendExpoPush(admin, await pushTargets(admin, [parentAuthor], PREFERENCE, true), {
          title: `${author} te respondió`,
          body: snippet(comment.body),
          data: { type: 'review_comment', patioId: review.fondita_id },
        });
      }
      if (review.user_id !== user.id && review.user_id !== parentAuthor) {
        delivered += await sendExpoPush(admin, await pushTargets(admin, [review.user_id], PREFERENCE, true), {
          title: `${author} comentó tu reseña`,
          body: snippet(comment.body),
          data: { type: 'review_comment', patioId: review.fondita_id },
        });
      }
      return json({ delivered });
    }

    if (body.kind === 'business_reply') {
      if (typeof body.reviewId !== 'string' || !UUID.test(body.reviewId)) return json({ error: 'Valid reviewId is required' }, 400);
      const { data: target, error: targetError } = await admin.from('reviews')
        .select('fondita_id').eq('id', body.reviewId).maybeSingle();
      if (targetError) throw targetError;
      if (!target) return json({ delivered: 0 });
      const { data: fondita, error: fonditaError } = await admin.from('fonditas')
        .select('nombre,owner_id').eq('id', target.fondita_id).maybeSingle();
      if (fonditaError) throw fonditaError;
      if (!fondita || fondita.owner_id !== user.id) return json({ error: 'This Patio does not belong to the current user' }, 403);

      const { data: review, error } = await admin.from('reviews')
        .update({ reply_notified_at: now })
        .eq('id', body.reviewId).not('business_reply', 'is', null)
        .is('reply_notified_at', null).gte('business_replied_at', since)
        .select('user_id,business_reply').maybeSingle();
      if (error) throw error;
      if (!review) return json({ delivered: 0, deduplicated: true });
      if (review.user_id === user.id) return json({ delivered: 0 });
      const delivered = await sendExpoPush(admin, await pushTargets(admin, [review.user_id], PREFERENCE, true), {
        title: `${fondita.nombre?.trim() || 'El Patio'} respondió tu reseña`,
        body: snippet(review.business_reply ?? ''),
        data: { type: 'business_reply', patioId: target.fondita_id },
      });
      return json({ delivered });
    }

    if (body.kind === 'follow') {
      if (typeof body.followedId !== 'string' || !UUID.test(body.followedId)) return json({ error: 'Valid followedId is required' }, 400);
      const { data: follow, error } = await admin.from('profile_follows')
        .update({ notified_at: now })
        .eq('follower_id', user.id).eq('followed_id', body.followedId)
        .is('notified_at', null).gte('created_at', since)
        .select('status').maybeSingle();
      if (error) throw error;
      if (!follow) return json({ delivered: 0, deduplicated: true });
      const name = await displayName(admin, user.id);
      const pending = follow.status === 'pending';
      const delivered = await sendExpoPush(admin, await pushTargets(admin, [body.followedId], PREFERENCE, true), {
        title: pending ? 'Quieren seguirte' : 'Tienes un nuevo seguidor',
        body: pending ? `${name} quiere seguirte. Acepta o rechaza en Actividad.` : `${name} empezó a seguirte.`,
        data: { type: pending ? 'follow_request' : 'new_follower', profileId: user.id },
      });
      return json({ delivered });
    }

    return json({ error: 'Unsupported notification kind' }, 400);
  } catch (error) {
    return errorResponse(error, 'No pudimos enviar el aviso.');
  }
});
