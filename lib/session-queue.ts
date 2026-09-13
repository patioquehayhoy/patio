let pending: Promise<unknown> = Promise.resolve();

/** Login, logout and deletion must finish before another account can take over. */
export function withSessionLock<T>(operation: () => Promise<T>): Promise<T> {
  const result = pending.then(operation);
  pending = result.catch(() => {});
  return result;
}
