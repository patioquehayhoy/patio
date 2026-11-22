// Vegetariano (2026-11-21): el editor pregunta «¿Es vegetariano?» solo cuando
// el nombre o la descripción lo parecen y no nombran carne; quien cocina
// decide, nunca se marca solo. Sin dependencias para probarlo en Node.

const normalize = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Carnes, pescados y caldos que casi siempre llevan carne. Palabras completas
// («res» no es «fresas»), en singular o plural.
const MEAT = [
  'pollo', 'res', 'cerdo', 'puerco', 'carne', 'pastor', 'suadero', 'carnitas', 'chorizo', 'longaniza', 'bistec', 'bistek',
  'cecina', 'tasajo', 'barbacoa', 'birria', 'chicharron', 'jamon', 'tocino', 'salchicha', 'pescado', 'camaron', 'atun',
  'marisco', 'pulpo', 'tinga', 'milanesa', 'costilla', 'arrachera', 'lengua', 'tripa', 'cabeza', 'buche', 'machaca',
  'albondiga', 'higado', 'pavo', 'pato', 'conejo', 'borrego', 'chivo', 'cabrito', 'pancita', 'menudo', 'pozole',
  'consome', 'cochinita', 'carnero', 'chamorro', 'pechuga', 'alambre', 'campechano', 'surtida', 'surtido', 'nuggets',
];
// Lo que sí suele ser vegetariano (solo cuenta si no nombra carne).
const VEGGIE = [
  'vegetariano', 'vegetariana', 'vegano', 'vegana', 'verdura', 'vegetal', 'champinon', 'hongo', 'flor de calabaza',
  'huitlacoche', 'nopal', 'rajas', 'calabacita', 'espinaca', 'ensalada', 'queso', 'frijol', 'lenteja', 'garbanzo',
  'elote', 'esquite', 'papa', 'quesadilla', 'enfrijolada', 'mollete', 'tlacoyo',
];

const word = (term: string) => new RegExp(`\\b${term.replace(/ /g, '\\s+')}(s|es)?\\b`);
const MEAT_RE = MEAT.map(word);
const VEGGIE_RE = VEGGIE.map(word);

/** ¿El platillo parece vegetariano por su nombre y descripción? Solo para sugerir. */
export function looksVegetarian(nombre: string, descripcion = ''): boolean {
  const text = normalize(`${nombre} ${descripcion}`);
  if (MEAT_RE.some((re) => re.test(text))) return false;
  return VEGGIE_RE.some((re) => re.test(text));
}

/** ¿Tiene algún platillo marcado vegetariano hoy o en su carta? (filtro del mapa) */
export function hasVegetarian(place: { menu?: { items: { vegetarian?: boolean }[] }[]; carta?: { items: { vegetarian?: boolean }[] }[] }): boolean {
  return [...(place.menu ?? []), ...(place.carta ?? [])].some((section) => section.items.some((item) => item.vegetarian === true));
}
