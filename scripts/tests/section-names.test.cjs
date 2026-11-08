const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function load() {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/section-names.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

test('stored UPPERCASE sections read in sentence case', () => {
  const { sectionDisplayName } = load();
  assert.equal(sectionDisplayName('PLATOS FUERTES'), 'Platos fuertes');
  assert.equal(sectionDisplayName('CAFÉ Y TÉ'), 'Café y té');
  assert.equal(sectionDisplayName('  SOPAS  Y CREMAS '), 'Sopas y cremas');
  assert.equal(sectionDisplayName('Postres'), 'Postres');
  assert.equal(sectionDisplayName(''), 'Menú');
});

test('short acronyms without vowels-in-between stay uppercase', () => {
  const { sectionDisplayName } = load();
  assert.equal(sectionDisplayName('ALITAS BBQ'), 'Alitas BBQ');
  assert.equal(sectionDisplayName('TACOS DE RES'), 'Tacos de res');
});
