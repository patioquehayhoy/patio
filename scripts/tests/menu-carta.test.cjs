/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const code = ts.transpileModule(fs.readFileSync(path.join(root, 'lib/menu-carta.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function('module', 'exports', 'require', code)(mod, mod.exports, () => ({}));
const { isCartaName, splitCarta, joinCarta, cartaSignature, markCartaSections } = mod.exports;

const section = (nombre, precio = '', dishes = ['Sopa'], carta) => ({
  id: nombre, nombre, precio, platillos: dishes.map((n, i) => ({ id: `${nombre}-${i}`, nombre: n, descripcion: '', precio: '' })),
  ...(carta ? { carta: true } : {}),
});

test('the board headings that start the carta', () => {
  for (const name of ['CARTA', 'A LA CARTA', 'La carta', 'Carta $110']) assert.ok(isCartaName(name), name);
  for (const name of ['MENÚ DEL DÍA', 'CARTAGENA', 'SOPAS']) assert.ok(!isCartaName(name), name);
});

test('a board photo: from CARTA down is the carta, above it is today', () => {
  const marked = markCartaSections([section('SOPAS'), section('GUISADOS'), section('CARTA', '110'), section('POSTRES')]);
  assert.deepEqual(marked.map((s) => !!s.carta), [false, false, true, true]);
  assert.equal(marked[2].precio, '110');
});

test('a photo that is only the carta stays as the menu', () => {
  const marked = markCartaSections([section('CARTA', '110'), section('BEBIDAS')]);
  assert.ok(marked.every((s) => !s.carta));
});

test('saving splits today from the carta and the carta loses the flag', () => {
  const { hoy, carta } = splitCarta({ precios: [{ id: 'a', nombre: '', precio: '100' }], secciones: [section('SOPAS'), section('CARTA', '110', ['Arrachera'], true)] });
  assert.deepEqual(hoy.secciones.map((s) => s.nombre), ['SOPAS']);
  assert.equal(hoy.precios[0].precio, '100');
  assert.deepEqual(carta.secciones.map((s) => s.nombre), ['CARTA']);
  assert.equal(carta.secciones[0].carta, undefined);
});

test('the saved carta comes back below today, and an untouched carta is not saved again', () => {
  const saved = { secciones: [section('CARTA', '110', ['Pechuga', 'Arrachera'])] };
  const before = cartaSignature(saved);
  const joined = joinCarta({ secciones: [section('SOPAS')] }, saved);
  assert.deepEqual(joined.secciones.map((s) => [s.nombre, !!s.carta]), [['SOPAS', false], ['CARTA', true]]);
  assert.equal(cartaSignature(splitCarta(joined).carta), before);
  joined.secciones[1] = { ...joined.secciones[1], platillos: [joined.secciones[1].platillos[0], { ...joined.secciones[1].platillos[1], precio: '150' }] };
  assert.notEqual(cartaSignature(splitCarta(joined).carta), before);
});
