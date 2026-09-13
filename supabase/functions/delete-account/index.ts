import { requireUser } from '../_shared/auth.ts';
import { corsHeaders, errorResponse, json } from '../_shared/http.ts';

type StorageBucket = Awaited<ReturnType<typeof requireUser>>['admin']['storage'] extends {
  from(name: string): infer Bucket;
} ? Bucket : never;

/** Only visit the authenticated user's folder; names supplied by callers are ignored. */
async function removeFolder(bucket: StorageBucket, prefix: string): Promise<void> {
  // Always list offset zero because each successful batch is removed.
  while (true) {
    const { data, error } = await bucket.list(prefix, { limit: 100, offset: 0 });
    if (error) throw error;
    if (!data?.length) return;
    const files: string[] = [];
    for (const item of data) {
      const path = `${prefix}/${item.name}`;
      if (item.id) files.push(path);
      else await removeFolder(bucket, path);
    }
    if (files.length) {
      const { error: removeError } = await bucket.remove(files);
      if (removeError) throw removeError;
    }
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  try {
    const { admin, user } = await requireUser(request);
    // Fail closed if the endpoint was deployed before its cleanup migration.
    const { data: ready, error: migrationError } = await admin.rpc('account_deletion_ready');
    if (migrationError || ready !== true) throw migrationError ?? new Error('Account cleanup is not installed');
    // Storage objects must be removed through its API before auth deletion.
    // Cleanup is retryable: a partial failure keeps the account signed in.
    for (const name of ['avatars', 'business-logos']) {
      await removeFolder(admin.storage.from(name), user.id);
    }
    // The accompanying DB trigger removes owned Patios within this transaction.
    // All personal community rows, including immutable reviews, cascade by user id.
    const { error } = await admin.auth.admin.deleteUser(user.id, false);
    if (error) throw error;
    return json({ deleted: true });
  } catch (error) {
    return errorResponse(error, 'No pudimos eliminar tu cuenta. Intenta de nuevo.');
  }
});
