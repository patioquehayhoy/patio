import { canonicalDishName } from './menu-store';

// Identidad del platillo (2026-11-15). Un platillo se reconoce por su nombre,
// pero el mismo platillo se escribe de muchas formas: «Taco al pastor» y
// «Tacos de pastor», «Mole con pollo» y «Pollo con mole». Todo lo que se
// cuelga de un platillo (su foto, las de clientes, sus «me gusta», si es el
// recomendado, la búsqueda) usa esta identidad, no el texto exacto.
//
// Tres niveles, de menos a más fricción:
// 1. Misma llave (`dishKey`): solo cambian plurales, acentos, mayúsculas,
//    palabras de relleno («de», «con», «orden de»…) o el orden. Se juntan
//    solos, sin preguntar.
// 2. Parecidos (`compareDishNames` → 'maybe'): uno agrega palabras («Pozole»
//    y «Pozole rojo») o hay una errata («Pzole»). La app sugiere y el negocio
//    confirma con un toque: quien cocina sabe si es el mismo platillo.
// 3. Confirmados: el platillo guarda sus otros nombres (`antes`) y viajan
//    con el menú; la ficha junta todo lo de esos nombres.
// «Pozole rojo» y «Pozole verde» nunca se juntan solos ni se sugieren: cada
// uno tiene una palabra que el otro no.

const FILLER = new Set(['DE', 'DEL', 'LA', 'LAS', 'EL', 'LOS', 'CON', 'EN', 'Y', 'E', 'A', 'AL', 'ORDEN', 'ORDENES', 'UN', 'UNA']);

/** Raíz de una palabra para comparar: sin plural y sin la «e» final (chile/chiles, frijol/frijoles). */
function stem(word: string): string {
  const singular = word.length > 3 ? word.replace(/(ES|S)$/, '') : word;
  return singular.length > 3 ? singular.replace(/E$/, '') : singular;
}

/** Palabras que cuentan, en su raíz, en el orden en que se escribieron. */
export function dishWords(name: string): string[] {
  return canonicalDishName(name)
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .split(' ')
    .filter((word) => word && !FILLER.has(word))
    .map(stem);
}

/** Llave del platillo: mismas palabras (en raíz, sin relleno), en cualquier orden. */
export function dishKey(name: string): string {
  const words = [...new Set(dishWords(name))].sort();
  return words.length ? words.join(' ') : canonicalDishName(name);
}

/** Todas las llaves de un platillo: su nombre y los otros nombres que confirmó el negocio. */
export function dishKeysOf(item: { name: string; aliases?: string[] }): string[] {
  return [...new Set([item.name, ...(item.aliases ?? [])].map(dishKey).filter(Boolean))];
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

/**
 * 'same': es el mismo platillo escrito distinto (se junta solo).
 * 'maybe': se parece; hay que preguntarle al negocio.
 * null: son platillos distintos.
 */
export function compareDishNames(a: string, b: string): 'same' | 'maybe' | null {
  if (!a.trim() || !b.trim()) return null;
  if (dishKey(a) === dishKey(b)) return 'same';
  const wordsA = [...new Set(dishWords(a))];
  const wordsB = [...new Set(dishWords(b))];
  if (!wordsA.length || !wordsB.length) return null;
  // Uno agrega palabras al otro: «Pozole» → «Pozole rojo».
  const inside = (x: string[], y: string[]) => x.every((word) => y.includes(word));
  if (inside(wordsA, wordsB) || inside(wordsB, wordsA)) return 'maybe';
  // Errata: mismas palabras salvo una, que cambia una o dos letras.
  if (wordsA.length === wordsB.length) {
    const onlyA = wordsA.filter((word) => !wordsB.includes(word));
    const onlyB = wordsB.filter((word) => !wordsA.includes(word));
    if (onlyA.length === 1 && onlyB.length === 1) {
      const [x, y] = [onlyA[0], onlyB[0]];
      const longest = Math.max(x.length, y.length);
      if (Math.min(x.length, y.length) >= 4 && editDistance(x, y) <= (longest >= 7 ? 2 : 1)) return 'maybe';
    }
  }
  return null;
}

/** Otros nombres guardados en un platillo: texto limpio, sin repetir, máximo 8. */
export function cleanAliases(value: unknown, name?: string): string[] {
  if (!Array.isArray(value)) return [];
  const own = name ? dishKey(name) : '';
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (typeof item !== 'string') return [];
    const text = item.trim().replace(/\s+/g, ' ').slice(0, 60);
    const key = dishKey(text);
    if (!text || key === own || seen.has(key)) return [];
    seen.add(key);
    return [text];
  }).slice(0, 8);
}
