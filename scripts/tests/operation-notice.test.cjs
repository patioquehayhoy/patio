/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
function load(relative) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(() => ({ supabase: {} }), module, module.exports);
  return module.exports;
}
const app = load('lib/operation-notice.ts');
const server = load('supabase/functions/_shared/operation-notice.ts');

test('the app preview and the server write exactly the same notice', () => {
  const cases = [['late', '20:00'], ['late', '13:00'], ['late', '13:30'], ['early', '16:00'], ['early', '00:15'], ['early', '12:00'],
    ['closed', null], ['soldout', null], ['late', null], ['late', '25:00'], ['late', '8:00']];
  for (const [kind, time] of cases) {
    assert.equal(app.operationNoticeText(kind, time), server.operationNoticeText(kind, time), `${kind} ${time}`);
  }
  assert.deepEqual(app.OPERATION_OPTIONS.map((option) => option.kind), [...server.OPERATION_KINDS]);
});

test('notice copy: short, in Spanish hours, «a la 1»', () => {
  assert.equal(server.operationNoticeText('late', '20:00'), 'Hoy abrimos a las 8 pm.');
  assert.equal(server.operationNoticeText('late', '13:00'), 'Hoy abrimos a la 1 pm.');
  assert.equal(server.operationNoticeText('early', '16:30'), 'Hoy cerramos a las 4:30 pm.');
  assert.equal(server.operationNoticeText('early', '00:00'), 'Hoy cerramos a las 12 am.');
  assert.equal(server.operationNoticeText('closed'), 'Hoy no abrimos.');
  assert.equal(server.operationNoticeText('soldout'), 'Se acabó lo de hoy.');
  assert.equal(server.operationNoticeText('late', null), null);
  assert.equal(server.operationNoticeText('late', '24:00'), null);
});
