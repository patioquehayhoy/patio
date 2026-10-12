export class AIServiceError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'AIServiceError'; }
}

/** Surface only expected actionable service errors, never internal details. */
export async function aiFunctionError(error: unknown, fallback: string): Promise<AIServiceError> {
  const context = error && typeof error === 'object' && 'context' in error ? error.context : null;
  if (context instanceof Response && [401, 429, 503].includes(context.status)) {
    try {
      const body = await context.clone().json();
      if (typeof body.error === 'string' && body.error.trim()) return new AIServiceError(body.error.slice(0, 240), context.status);
    } catch { /* Preserve an actionable fallback for unreadable bodies. */ }
    return new AIServiceError(context.status === 429 ? 'Alcanzaste el límite de lecturas. Inténtalo más tarde o continúa manualmente.' : fallback, context.status);
  }
  return new AIServiceError(fallback, 0);
}
