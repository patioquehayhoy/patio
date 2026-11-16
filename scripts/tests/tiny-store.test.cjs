/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/tiny-store.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, () => ({ useSyncExternalStore: () => undefined }));
const { createStore } = mod.exports;

test('only real changes reach the listeners (opening the same dish twice repaints nothing)', () => {
  const store = createStore(null);
  let calls = 0;
  const stop = store.subscribe(() => { calls += 1; });
  store.set('0-Al pastor');
  store.set('0-Al pastor');
  store.set((current) => (current === '0-Al pastor' ? null : '0-Al pastor'));
  assert.equal(store.get(), null);
  assert.equal(calls, 2);
  stop();
  store.set('1-Suadero');
  assert.equal(calls, 2, 'after unsubscribing nothing is called');
  assert.equal(store.get(), '1-Suadero');
});
