/**
 * Etiquetas del índice lateral de secciones (como las letras de Contactos).
 * Si cada sección empieza con una letra distinta, basta la letra; si se
 * repiten («PLATOS FUERTES», «POSTRES»), se usan tres letras. Sin nombre: el
 * número de la sección.
 */
export function sectionIndexLabels(names: string[]): string[] {
  const clean = names.map((name, index) => {
    const word = name.trim().toLocaleUpperCase('es-MX').replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/)[0] ?? '';
    return word || String(index + 1);
  });
  const initials = clean.map((word) => [...word][0]);
  if (new Set(initials).size === initials.length) return initials;
  return clean.map((word) => [...word].slice(0, 3).join(''));
}

/** Índice de la sección según dónde está el dedo sobre la tira. */
export function sectionIndexAt(offsetY: number, height: number, count: number): number {
  if (count <= 0 || height <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.floor((offsetY / height) * count)));
}
