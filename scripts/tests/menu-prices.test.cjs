/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');

// Loads lib/menu-prices.ts with its two real dependencies.
function load() {
  const cache = {};
  const compile = (file) => {
    if (cache[file]) return cache[file].exports;
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    const module = { exports: {} };
    cache[file] = module;
    const requireLocal = (name) => {
      if (name === './prices') return compile('lib/prices.ts');
      if (name === './menu-store') return compile('lib/menu-store.ts');
      if (name === './horario') return {};
      throw new Error(`unexpected import ${name}`);
    };
    new Function('module', 'exports', 'require', code)(module, module.exports, requireLocal);
    return module.exports;
  };
  return { ...compile('lib/menu-prices.ts'), store: compile('lib/menu-store.ts') };
}

const section = (nombre, precio, dishes = [['Sopa', '']]) => ({
  id: nombre, nombre, precio, platillos: dishes.map(([n, p], i) => ({ id: `${nombre}-${i}`, nombre: n, descripcion: '', precio: p })),
});

test('a menu saved before 14 Nov moves its first-section price to the menu prices', () => {
  const { withMenuPrecios } = load();
  const result = withMenuPrecios({ secciones: [section('1ER TIEMPO', '95'), section('2DO TIEMPO', '')] });
  assert.equal(result.precios.length, 1);
  assert.equal(result.precios[0].precio, '95');
  assert.equal(result.secciones[0].precio, '', 'the section no longer repeats it');
});

test('section prices read from a photo are kept as section prices', () => {
  const { withMenuPrecios } = load();
  const data = { secciones: [section('COMIDA CORRIDA', '95'), section('CARTA', '110')] };
  const result = withMenuPrecios(data);
  assert.deepEqual(result.precios, []);
  assert.equal(result.secciones[0].precio, '95');
  assert.equal(result.secciones[1].precio, '110');
});

test('several menu prices survive storage and come out labelled', () => {
  const { publicMenuPrices, menuPricesLine, menuPricesAccessibilityLabel, store } = load();
  const stored = JSON.parse(JSON.stringify({
    precios: [
      { id: 'a', nombre: 'Completo', precio: '95' },
      { id: 'b', nombre: 'Solo guisado', precio: '70' },
      { id: 'c', nombre: 'Vacío', precio: '' },
    ],
    secciones: [section('MENÚ DE HOY', '')],
  }));
  const normalized = store.normalizeMenuData(stored);
  assert.equal(normalized.precios.length, 3);
  const prices = publicMenuPrices(normalized);
  assert.deepEqual(prices, [{ label: 'Completo', price: '$95' }, { label: 'Solo guisado', price: '$70' }]);
  assert.equal(menuPricesLine(prices), 'Completo $95 · Solo guisado $70');
  assert.equal(menuPricesAccessibilityLabel(prices), 'Completo, 95 pesos. Solo guisado, 70 pesos');
});

test('an explicit empty price list is never read as a legacy menu', () => {
  const { withMenuPrecios } = load();
  const result = withMenuPrecios({ precios: [], secciones: [section('CARTA', '110')] });
  assert.deepEqual(result.precios, []);
  assert.equal(result.secciones[0].precio, '110');
});

test('one unnamed price reads as the menu price', () => {
  const { publicMenuPrices, menuPricesLine, menuPricesAccessibilityLabel } = load();
  const prices = publicMenuPrices({ precios: [{ id: 'a', nombre: '', precio: '1250' }], secciones: [] });
  assert.equal(menuPricesLine(prices), '$1250');
  assert.equal(menuPricesAccessibilityLabel(prices), 'Precio del menú, 1250 pesos');
});

test('«Incluye…» reads naturally and survives storage', () => {
  const { menuIncludesLine, store } = load();
  assert.equal(menuIncludesLine('sopa, arroz y agua'), 'Incluye sopa, arroz y agua.');
  assert.equal(menuIncludesLine('Incluye: Sopa del día.'), 'Incluye sopa del día.');
  assert.equal(menuIncludesLine('   '), '');
  const stored = store.normalizeMenuData(JSON.parse(JSON.stringify({ incluye: ' sopa y arroz ', precios: [], secciones: [] })));
  assert.equal(stored.incluye, 'sopa y arroz');
  assert.equal(store.normalizeMenuData({ secciones: [] }).incluye, undefined);
});
