const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function load() {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/recommendations.ts'), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('module', 'exports', 'require', code)(module, module.exports, () => ({}));
  return module.exports;
}
const place = (id, categories, dishes, latitude = 19.396, longitude = -99.155) => ({
  id, name: id, categories, latitude, longitude, menu: [{ section: 'MENÚ', items: dishes.map((name) => ({ name })) }],
});

test('similar places share giros or dishes, never repeat the base or reviewed places', () => {
  const { similarPlaces } = load();
  const base = place('base', ['Tacos'], ['Al pastor', 'Suadero']);
  const all = [
    base,
    place('tacos-cerca', ['Tacos'], ['Pastor', 'Campechanos'], 19.397, -99.155),
    place('tacos-lejos', ['Tacos'], ['Suadero'], 19.5, -99.3),
    place('mismo-platillo', ['Fondita'], ['Tacos al pastor'], 19.396, -99.156),
    place('nada-que-ver', ['Postres'], ['Pastel de tres leches'], 19.396, -99.155),
    place('ya-reseñado', ['Tacos'], ['Al pastor'], 19.396, -99.155),
  ];
  const result = similarPlaces(base, all, new Set(['ya-reseñado'])).map((p) => p.id);
  assert.ok(!result.includes('base'));
  assert.ok(!result.includes('ya-reseñado'));
  assert.ok(!result.includes('nada-que-ver'), 'nothing in common');
  assert.equal(result[0], 'tacos-cerca', 'same giro and close wins');
  assert.ok(result.length <= 3);
});
