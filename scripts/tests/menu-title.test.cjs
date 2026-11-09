const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function load() {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/menu-title.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(() => ({}), module, module.exports);
  return module.exports;
}
const menu = (...names) => ({ secciones: [{ platillos: names.map((nombre) => ({ nombre })) }] });

test('untitled menus read like Notes: first dishes and how many more', () => {
  const { summary } = load();
  assert.equal(summary(menu('Chilaquiles', 'Molletes', 'Sopa', 'Agua')), 'Chilaquiles, Molletes y 2 más');
  assert.equal(summary(menu('Chilaquiles', 'Molletes')), 'Chilaquiles y Molletes');
  assert.equal(summary(menu('Mole')), 'Mole');
  assert.equal(summary(menu()), '');
});

test('long dish names fall back to one name so the title never gets cut', () => {
  const { summary } = load();
  assert.equal(
    summary(menu('Milanesa de res empanizada con papas a la francesa', 'Chile relleno de queso en caldillo', 'Agua')),
    'Milanesa de res empanizada con papas a la francesa y 2 más',
  );
});
