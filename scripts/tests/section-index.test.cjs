const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function load() {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/section-index.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

test('one letter per section when initials are unique, like Contacts', () => {
  const { sectionIndexLabels } = load();
  assert.deepEqual(sectionIndexLabels(['Sopas', 'Guisados', 'Bebidas', 'Extras']), ['S', 'G', 'B', 'E']);
});

test('three letters when initials repeat; numbers for unnamed sections', () => {
  const { sectionIndexLabels } = load();
  assert.deepEqual(sectionIndexLabels(['PRIMER TIEMPO', 'PLATOS FUERTES', 'POSTRES', '']), ['PRI', 'PLA', 'POS', '4']);
  assert.deepEqual(sectionIndexLabels(['¡Ñoquis!', 'Agua']), ['Ñ', 'A']);
});

test('finger position maps to a section and never leaves the range', () => {
  const { sectionIndexAt } = load();
  assert.equal(sectionIndexAt(0, 100, 5), 0);
  assert.equal(sectionIndexAt(55, 100, 5), 2);
  assert.equal(sectionIndexAt(140, 100, 5), 4);
  assert.equal(sectionIndexAt(-20, 100, 5), 0);
});
