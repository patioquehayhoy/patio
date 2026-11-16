/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const compile = (file, requireLocal) => {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, requireLocal);
  return mod.exports;
};
const store = compile('lib/menu-store.ts', (name) => (name === './photo-hash' ? compile('lib/photo-hash.ts', () => ({})) : {}));
const { dishKey, dishKeysOf, compareDishNames, cleanAliases } = compile('lib/dish-identity.ts', (name) => {
  if (name === './menu-store') return store;
  throw new Error(`unexpected import ${name}`);
});

test('the same dish written differently joins by itself', () => {
  for (const [a, b] of [
    ['Taco al pastor', 'Tacos de pastor'],
    ['Mole con pollo', 'Pollo con mole'],
    ['Chile relleno', 'Chiles rellenos'],
    ['Frijoles charros', 'frijol charro'],
    ['Agua de horchata', 'AGUAS DE HORCHATA'],
    ['Café de olla', 'cafe de olla'],
    ['Orden de flautas', 'Flautas'],
  ]) {
    assert.equal(compareDishNames(a, b), 'same', `${a} = ${b}`);
    assert.equal(dishKey(a), dishKey(b), `${a} = ${b}`);
  }
});

test('similar names are suggested, never joined alone', () => {
  for (const [a, b] of [
    ['Pozole', 'Pozole rojo'],
    ['Pzole', 'Pozole'],
    ['Sopa', 'Sopa de fideo'],
    ['Enchiladas suizas', 'Enchiladas suisas'],
  ]) {
    assert.equal(compareDishNames(a, b), 'maybe', `${a} ~ ${b}`);
    assert.notEqual(dishKey(a), dishKey(b));
  }
});

test('different dishes stay apart', () => {
  for (const [a, b] of [
    ['Pozole rojo', 'Pozole verde'],
    ['Agua de horchata', 'Agua de jamaica'],
    ['Tacos de suadero', 'Tacos de lengua'],
    ['Café americano', 'Café de olla'],
    ['Mole poblano', 'Mole verde'],
  ]) {
    assert.equal(compareDishNames(a, b), null, `${a} ≠ ${b}`);
  }
});

test('a dish carries its confirmed other names', () => {
  const keys = dishKeysOf({ name: 'Pozole rojo', aliases: ['Pozole', 'pozole'] });
  assert.deepEqual(keys, [dishKey('Pozole rojo'), dishKey('Pozole')]);
  assert.deepEqual(cleanAliases(['Pozole', ' pozole ', 'Pozole rojo', 42, '', 'Pozolito'], 'Pozole rojo'), ['Pozole', 'Pozolito']);
  assert.equal(cleanAliases(Array.from({ length: 20 }, (_, i) => `Platillo ${i}`)).length, 8);
});
