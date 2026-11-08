const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function load() {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/dish-split.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

test('long names with «con» suggest moving the rest to the description', () => {
  const { suggestDishSplit } = load();
  assert.deepEqual(suggestDishSplit('Caldo de camarón seco con verduras y chile guajillo'), { name: 'Caldo de camarón seco', description: 'Con verduras y chile guajillo' });
  assert.deepEqual(suggestDishSplit('Milanesa de res empanizada con papas a la francesa'), { name: 'Milanesa de res empanizada', description: 'Con papas a la francesa' });
});

test('short names and names without «con» are left alone', () => {
  const { suggestDishSplit } = load();
  assert.equal(suggestDishSplit('Chilaquiles verdes con pollo y crema'), null, '36 letters: the protein can be part of the name');
  assert.equal(suggestDishSplit('Chile relleno de queso en caldillo de jitomate'), null);
  assert.equal(suggestDishSplit('Consomé con arroz, garbanzo, limón y chile serrano picado'), null, 'one-word name would not stand alone');
});

test('the moved text goes before an existing description', () => {
  const { mergeDescription } = load();
  assert.equal(mergeDescription('Con papas a la francesa', ''), 'Con papas a la francesa');
  assert.equal(mergeDescription('Con papas a la francesa.', 'Incluye ensalada'), 'Con papas a la francesa. Incluye ensalada');
});
