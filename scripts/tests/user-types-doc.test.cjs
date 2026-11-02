/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');

// docs/USER_TYPES.md copia precios y cupos de lib/plans.ts para leerse sin
// código; esta prueba evita que las dos fuentes se desfasen.
const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/plans.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', output)(loaded.exports);
const { PLANS } = loaded.exports;
const doc = fs.readFileSync(path.resolve(__dirname, '../../docs/USER_TYPES.md'), 'utf8');
const mxn = (value) => `$${value.toLocaleString('en-US')}`;

function section(title) {
  const start = doc.indexOf(`### ${title}\n`);
  assert.ok(start >= 0, `USER_TYPES.md needs a "${title}" section`);
  const next = doc.indexOf('\n#', start + 4);
  return doc.slice(start, next < 0 ? undefined : next);
}

test('user types doc matches the plan catalog', () => {
  assert.match(section('Negocio Pro'), new RegExp(`\\${mxn(PLANS.pro.monthly)}/mes · \\${mxn(PLANS.pro.annual)}/año`), 'Pro price');
  // Solo el negocio tiene planes: el Foodie y el Creador nunca pagan en el arranque.
  assert.deepEqual(Object.keys(PLANS), ['free', 'pro']);
  assert.match(section('Negocio Gratis'), new RegExp(`${PLANS.free.photoReads} lecturas con foto`));
  assert.match(section('Negocio Pro'), new RegExp(`${PLANS.pro.photoReads} lecturas con foto`));
  assert.match(section('Negocio Pro'), new RegExp(`${PLANS.pro.specialNotices} avisos especiales`));
});
