const ALPHABET = 'ABCDEFGHIJKLMNÑOPQRSTUVWXYZ#';
const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });

export function libraryInitial(name: string): string {
  const first = [...name.trim().normalize('NFC').toLocaleUpperCase('es')][0] ?? '';
  if (first === 'Ñ') return first;
  const plain = first.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return /^[A-Z]$/.test(plain) ? plain : '#';
}

export function alphabeticalSections<T extends { name: string }>(items: readonly T[]): { letter: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const letter = libraryInitial(item.name);
    const group = groups.get(letter) ?? [];
    group.push(item);
    groups.set(letter, group);
  }
  return [...groups].sort(([a], [b]) => ALPHABET.indexOf(a) - ALPHABET.indexOf(b))
    .map(([letter, group]) => ({ letter, items: group.sort((a, b) => collator.compare(a.name, b.name)) }));
}

export function indexAtPosition(y: number, height: number, count: number): number {
  if (height <= 0 || count <= 0) return 0;
  return Math.max(0, Math.min(count - 1, Math.floor(y / height * count)));
}
