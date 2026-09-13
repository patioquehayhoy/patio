// AsyncStorage no ofrece transacciones: dos gestos que leen/escriben el
// mismo blob pueden perder cambios. Serializar por clave conserva ambos.
const pending = new Map<string, Promise<void>>();
let exclusive = false;
let accountRecoveryRequired = false;

/** Auth can finish changing before a disk error prevents local activation.
 * Keep personal writes paused between retries so old data cannot sync as the
 * newly authenticated account. Account transitions remain available. */
export function setAccountRecoveryRequired(required: boolean): void {
  accountRecoveryRequired = required;
}

/** Finish writes already running and reject new gestures during account switches. */
export async function withExclusiveStorageAccess<T>(operation: () => Promise<T>): Promise<T> {
  if (exclusive) throw new Error('Espera a que termine el cambio de cuenta.');
  exclusive = true;
  try {
    await Promise.all([...pending.values()]);
    return await operation();
  } finally {
    exclusive = false;
  }
}

export function withStorageLock<T>(key: string, operation: () => Promise<T>): Promise<T> {
  if (accountRecoveryRequired) return Promise.reject(new Error('No se pudo recuperar la cuenta. Vuelve a abrir Patio e inténtalo de nuevo.'));
  if (exclusive) return Promise.reject(new Error('La cuenta está cambiando. Inténtalo de nuevo.'));
  const result = (pending.get(key) ?? Promise.resolve()).then(operation);
  const settled = result.then(() => {}, () => {});
  pending.set(key, settled);
  void settled.then(() => {
    if (pending.get(key) === settled) pending.delete(key);
  });
  return result;
}
