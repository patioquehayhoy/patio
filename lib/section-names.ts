/**
 * Nombre de sección para leer (barra de secciones y encabezados de la
 * ficha): los menús guardan las secciones en MAYÚSCULAS («PLATOS FUERTES»);
 * en pantalla van con mayúscula inicial («Platos fuertes»), que se lee mejor
 * en tamaño grande y en cápsulas. Las siglas cortas se respetan («BBQ»).
 */
export function sectionDisplayName(name: string): string {
  const clean = name.trim().replace(/\s+/g, ' ');
  if (!clean) return 'Menú';
  const lower = clean
    .split(' ')
    .map((word) => (/^[A-ZÁÉÍÓÚÑ]{2,3}$/.test(word) && !/^(DE|DEL|LA|EL|LOS|LAS|CON|Y|EN|AL|SIN|POR|UN|UNA)$/.test(word) && /[^AEIOUÁÉÍÓÚ]{3}/.test(word) ? word : word.toLocaleLowerCase('es-MX')))
    .join(' ');
  return lower.charAt(0).toLocaleUpperCase('es-MX') + lower.slice(1);
}
