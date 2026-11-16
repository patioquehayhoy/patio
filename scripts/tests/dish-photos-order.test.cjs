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
const { orderDishPhotos, photoAge } = mod.exports;

const DAY = 24 * 60 * 60 * 1000;
const NOW = 1_800_000_000_000;
const photo = (url, userId, daysAgo) => ({ url, userId, by: userId, at: NOW - daysAgo * DAY });

test('the business photo goes first, then recent customer photos newest first', () => {
  const order = orderDishPhotos('negocio.jpg', [photo('a', 'ana', 10), photo('b', 'beto', 2)], NOW);
  assert.deepEqual(order.map((p) => p.url), ['negocio.jpg', 'b', 'a']);
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
  const order = orderDishPhotos('negocio.jpg', [...many, many[0]], NOW);
  assert.equal(order.length, 41);
  assert.equal(new Set(order.map((p) => p.url)).size, 41);
});

test('photo age reads like people talk', () => {
  assert.equal(photoAge(NOW - 2 * 60 * 60 * 1000, NOW), 'hoy');
  assert.equal(photoAge(NOW - DAY, NOW), 'ayer');
  assert.equal(photoAge(NOW - 3 * DAY, NOW), 'hace 3 días');
  assert.equal(photoAge(NOW - 40 * DAY, NOW), 'hace un mes');
  assert.equal(photoAge(NOW - 800 * DAY, NOW), 'hace 2 años');
  assert.equal(photoAge(undefined, NOW), undefined);
});
