/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/dish-photos-order.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, () => ({}));
const { orderDishPhotos, photoDate } = mod.exports;

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;
const photo = (url, userId, daysAgo) => ({ url, userId, by: userId, at: NOW - daysAgo * DAY });

test('the business photo goes first, then recent customer photos newest first', () => {
  const order = orderDishPhotos({ url: 'negocio.jpg', hash: 'ab'.repeat(12) }, [photo('a', 'ana', 10), photo('b', 'beto', 2)], NOW);
  assert.deepEqual(order.map((p) => p.url), ['negocio.jpg', 'b', 'a']);
  assert.equal(order[0].hash, 'ab'.repeat(12), 'the business photo keeps its instant preview');
  assert.equal(order[0].by, undefined, 'the business photo has no customer credit');
});

test('one photo per person before repeating anyone', () => {
  const order = orderDishPhotos(undefined, [photo('a1', 'ana', 1), photo('a2', 'ana', 2), photo('a3', 'ana', 3), photo('b1', 'beto', 5)], NOW);
  assert.deepEqual(order.map((p) => p.url), ['a1', 'b1', 'a2', 'a3']);
});

test('photos older than 90 days go after the recent ones, even if they are many', () => {
  const order = orderDishPhotos(undefined, [photo('old', 'ana', 400), photo('new', 'beto', 89)], NOW);
  assert.deepEqual(order.map((p) => p.url), ['new', 'old']);
});

test('40 photos keep every one, without duplicates', () => {
  const many = Array.from({ length: 40 }, (_, i) => photo(`p${i}`, `u${i % 7}`, i * 5));
  const order = orderDishPhotos({ url: 'negocio.jpg' }, [...many, many[0]], NOW);
  assert.equal(order.length, 41);
  assert.equal(new Set(order.map((p) => p.url)).size, 41);
});

test('a photo is dated like its review', () => {
  const at = new Date(2026, 10, 15, 13, 0).getTime();
  assert.equal(photoDate(at), new Date(at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }));
  assert.equal(photoDate(undefined), undefined);
});
