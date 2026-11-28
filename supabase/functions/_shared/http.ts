export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders });
}

/**
 * Bound the stream too: Content-Length is optional and cannot be trusted.
 *
 * Read it to the end even when it is too large. Measured on 27 Nov 2026:
 * when a function answers before consuming an upload of ~70 KB or more,
 * Supabase hangs about half of those responses (a 401 never arrived and the
 * phone waited 2 minutes). Callers read the body before any early answer.
 */
export async function readJson(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  if (!request.body) throw new HttpError(400, 'Falta la solicitud');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      // Too large: keep draining without keeping it, then refuse.
      if (length <= maxBytes) chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  if (length > maxBytes) throw new HttpError(413, 'La solicitud es demasiado grande');
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new HttpError(400, 'La solicitud no contiene JSON válido');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError(400, 'Solicitud inválida');
  }
  return parsed as Record<string, unknown>;
}

export function errorResponse(error: unknown, fallback: string): Response {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error(fallback, error);
  return json({ error: fallback }, 500);
}
