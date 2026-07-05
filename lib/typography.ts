/**
 * Mantiene juntas las últimas palabras de un texto corto para evitar viudas
 * editoriales en títulos, subtítulos y ayudas. No usar en contenido editable.
 */
export function noWidow(text: string, words = 2): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return parts.join('\u00A0');
  return [...parts.slice(0, -words), parts.slice(-words).join('\u00A0')].join(' ');
}
