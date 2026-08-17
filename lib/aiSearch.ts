import { supabase } from '@/lib/supabase';

export type AiSearchIntent = {
  terminos: string[];
  abiertoAhora: boolean;
  menuDeHoy: boolean;
  nota: string;
};

function isAiSearchIntent(value: unknown): value is AiSearchIntent {
  if (!value || typeof value !== 'object') return false;
  const result = value as Partial<AiSearchIntent>;
  return Array.isArray(result.terminos)
    && result.terminos.every((term) => typeof term === 'string')
    && typeof result.abiertoAhora === 'boolean'
    && typeof result.menuDeHoy === 'boolean'
    && typeof result.nota === 'string';
}

// Traduce un antojo en lenguaje natural (escrito o dictado por voz — el
// teclado de iOS ya trae micrófono nativo en el campo de búsqueda) a
// términos reales de búsqueda. Nunca decide resultados por sí sola: solo
// alimenta la misma búsqueda determinística (lib/menu.ts::searchLiveMenus)
// que ya corre contra el inventario real de Patio.
export async function fetchAiSearchIntent(query: string, timeoutMs = 6000): Promise<AiSearchIntent | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const { data, error } = await supabase.functions.invoke('search-intent', {
      body: { query: trimmed },
      signal: controller.signal,
    });
    if (error || !isAiSearchIntent(data)) return null;
    return data;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
