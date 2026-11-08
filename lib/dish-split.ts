/**
 * Guía al capturar el menú: si el nombre de un platillo trae la descripción
 * pegada («Caldo de camarón seco con verduras y chile guajillo»), sugiere
 * separar lo que sigue de «con» como descripción. Solo con nombres largos
 * (más de 40 letras) y una primera parte que ya se entiende sola, como pide
 * la regla del lector de menús: el nombre es lo que se pide; acompañamientos
 * y preparación van en la descripción.
 */
export function suggestDishSplit(name: string): { name: string; description: string } | null {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (clean.length <= 40) return null;
  const index = clean.toLocaleLowerCase('es-MX').indexOf(' con ');
  if (index < 0) return null;
  const head = clean.slice(0, index).trim();
  const tail = clean.slice(index + 1).trim();
  if (head.split(' ').length < 2 || tail.split(' ').length < 2) return null;
  return { name: head, description: tail.charAt(0).toLocaleUpperCase('es-MX') + tail.slice(1) };
}

/** La descripción nueva va antes de la que ya hubiera. */
export function mergeDescription(fromName: string, existing: string): string {
  const current = existing.trim();
  if (!current) return fromName;
  return `${fromName.replace(/[.\s]+$/, '')}. ${current}`;
}
