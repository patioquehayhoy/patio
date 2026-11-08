/**
 * Mantiene juntas las últimas palabras de un texto corto para evitar viudas
 * editoriales en títulos, subtítulos y ayudas. No usar en contenido editable.
 */
export function noWidow(text: string, words = 2): string {
  const parts = text.trim().split(/\s+/);
  if (parts.length <= words) return parts.join('\u00A0');
  return [...parts.slice(0, -words), parts.slice(-words).join('\u00A0')].join(' ');
}

/** Texto con palabras clave en negrita: `{ b }` es un tramo en negrita. */
export type RichSegment = string | { b: string };

/**
 * noWidow() para texto con tramos en negrita: une las dos últimas palabras
 * aunque caigan en tramos distintos («su **horario**.»).
 * En títulos grandes (marca, flyers) no basta: si las dos palabras juntas no
 * caben en un renglón, se baja el tamaño en pasos en lugar de unirlas.
 */
export function noWidowSegments(segments: RichSegment[]): RichSegment[] {
  const out = segments.map((segment) => (typeof segment === 'string' ? segment : { b: segment.b }));
  for (let i = out.length - 1; i >= 0; i--) {
    const segment = out[i];
    const text = typeof segment === 'string' ? segment : segment.b;
    const index = text.lastIndexOf(' ');
    if (index < 0) continue;
    const joined = `${text.slice(0, index)} ${text.slice(index + 1)}`;
    out[i] = typeof segment === 'string' ? joined : { b: joined };
    break;
  }
  return out;
}
