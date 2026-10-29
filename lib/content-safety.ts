import { supabase } from './supabase';

export type ReportTarget = 'review' | 'profile' | 'patio' | 'collection';
export type ReportReason = 'spam' | 'abuse' | 'inaccurate' | 'other';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) throw new Error('Inicia sesión para continuar.');
  return data.user.id;
}

export async function reportContent(targetType: ReportTarget, targetId: string, reason: ReportReason, details = '') {
  if (!UUID.test(targetId) || !['review', 'profile', 'patio', 'collection'].includes(targetType) ||
      !['spam', 'abuse', 'inaccurate', 'other'].includes(reason)) throw new Error('Este contenido no está disponible.');
  const reporterId = await requireUserId();
  const { data, error } = await supabase.from('content_reports').insert({
    reporter_id: reporterId, target_type: targetType, target_id: targetId, reason, details: details.trim().slice(0, 500),
  }).select('id').single();
  if (error) throw new Error('No pudimos enviar el reporte. Inténtalo de nuevo.');
  // Aviso a soporte de mejor esfuerzo: el reporte ya quedó guardado.
  void supabase.functions.invoke('notify-content-report', { body: { reportId: data.id } }).catch(() => {});
}

export async function blockUser(userId: string) {
  if (!UUID.test(userId)) throw new Error('Este perfil no está disponible.');
  const blockerId = await requireUserId();
  if (blockerId === userId) throw new Error('No puedes bloquear tu propia cuenta.');
  const { error } = await supabase.from('blocked_users').insert({ blocker_id: blockerId, blocked_user_id: userId });
  if (error && error.code !== '23505') throw new Error('No pudimos bloquear esta cuenta. Inténtalo de nuevo.');
}

export type BlockedProfile = { user_id: string; display_name: string | null };

export async function getBlockedUsers(): Promise<BlockedProfile[]> {
  await requireUserId();
  const { data, error } = await supabase.rpc('get_blocked_profiles');
  if (error) throw new Error('No pudimos cargar las cuentas bloqueadas.');
  return data ?? [];
}

export async function unblockUser(userId: string) {
  const blockerId = await requireUserId();
  const { error } = await supabase.from('blocked_users').delete().eq('blocker_id', blockerId).eq('blocked_user_id', userId);
  if (error) throw new Error('No pudimos desbloquear esta cuenta. Inténtalo de nuevo.');
}
