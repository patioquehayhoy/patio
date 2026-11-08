const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function load() {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/typography.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', code)(module, module.exports);
  return module.exports;
}

const NBSP = ' ';

test('noWidow joins the last two words and keeps two-word texts together', () => {
  const { noWidow } = load();
  assert.equal(noWidow('Patio necesita un par de cosas'), `Patio necesita un par de${NBSP}cosas`);
  assert.equal(noWidow('me gusta'), `me${NBSP}gusta`);
});

test('noWidowSegments joins across a bold segment boundary', () => {
  const { noWidowSegments } = load();
  const out = noWidowSegments(['Cada punto, con sus ', { b: 'precios' }, ' y su ', { b: 'horario' }, '.']);
  assert.deepEqual(out, ['Cada punto, con sus ', { b: 'precios' }, ` y su${NBSP}`, { b: 'horario' }, '.']);
});

test('noWidowSegments joins inside the last segment that has a space', () => {
  const { noWidowSegments } = load();
  const out = noWidowSegments(['Te avisamos cuando ', { b: 'publican' }, '. Tú decides de quién.']);
  assert.equal(out[2], `. Tú decides de${NBSP}quién.`);
});

test('noWidowSegments leaves the input untouched', () => {
  const { noWidowSegments } = load();
  const input = ['Arma ', { b: 'tus listas' }];
  noWidowSegments(input);
  assert.deepEqual(input, ['Arma ', { b: 'tus listas' }]);
});
