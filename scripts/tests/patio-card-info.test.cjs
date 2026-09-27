/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
function load(relative) {
  const filename = path.resolve(root, relative);
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  new Function('require', 'module', 'exports', output)(
    (id) => load(path.resolve(path.dirname(filename), `${id}.ts`)), module, module.exports,
  );
  return module.exports;
}
const { getPatioCardInfo, patioCardPrice, patioCardOpenState } = load('lib/patio-card-info.ts');
const { crearHorarioBase } = load('lib/horario.ts');

function patio(overrides = {}) {
  return {
    name: 'Patio del barrio', categories: ['Fondita'], area: 'Centro',
    price: '$', menu: [], weeklyHours: null, rating: 'Nuevo', ...overrides,
  };
}

test('every card has a price slot; incomplete and textual amounts do not invent a range', () => {
  for (const price of ['', '$', '$$', 'Consultar', 'Desde $80', '$0']) {
    assert.equal(patioCardPrice(patio({ price })).source, 'missing');
    assert.equal(patioCardPrice(patio({ price })).label, 'Sin precio');
  }
});

test('an explicit published price wins; otherwise only exact menu amounts form the range', () => {
  const menu = [{ section: 'Comida', price: '$150', items: [
    { name: 'Mole', price: '$90' }, { name: 'Agua', price: '$25.50' },
    { name: 'Especial', price: 'Desde $10' }, { name: 'Sabores', price: '$20 / $30' },
  ] }];
  assert.deepEqual(patioCardPrice(patio({ menu })), {
    label: '$25.5–150', source: 'menu', accessibilityLabel: 'Precios publicados, de 25.5 a 150 pesos',
  });
  assert.equal(patioCardPrice(patio({ price: '$100–$120', menu })).label, '$100–120');
  assert.equal(patioCardPrice(patio({ price: '$1,250.50 MXN', menu })).label, '$1,250.5');
  assert.equal(patioCardPrice(patio({ price: '$95', menu })).label, '$95');
});

test('a permanent menu and unknown publication state never become a claim of a menu today', () => {
  const withMenu = patio({ menu: [{ section: 'Carta', items: [{ name: 'Mole', price: '$90' }] }] });
  assert.equal(getPatioCardInfo(withMenu).menuLabel, 'Menú sin datos');
  assert.equal(getPatioCardInfo({ ...withMenu, hasTodayMenu: false }).menuLabel, 'Sin menú hoy');
  assert.equal(getPatioCardInfo({ ...withMenu, hasTodayMenu: true }).menuLabel, 'Menú de hoy');
});

test('public and personal ratings are independent, with honest placeholders for invalid data', () => {
  const info = getPatioCardInfo(patio({ rating: '4.7', ratingCount: 213 }), { personalRating: 2 });
  assert.equal(info.publicRating, '4.7 (213)');
  assert.equal(info.personalRating, 'Tu calificación: 2.0');
  assert.match(info.publicRatingAccessibilityLabel, /pública.*213 reseñas/);
  assert.equal(getPatioCardInfo(patio(), { personalRating: 0 }).personalRating, 'Tu calificación: —');
  assert.equal(getPatioCardInfo(patio({ rating: '6' })).publicRating, '—');
  assert.equal(getPatioCardInfo(patio()).distanceAccessibilityLabel, 'Distancia no disponible');
});

test('missing and incomplete schedules stay unknown; overnight and closed schedules stay distinct', () => {
  const early = new Date('2026-09-19T08:00:00Z'); // Saturday, 02:00 CDMX.
  assert.equal(patioCardOpenState(patio(), early), null);
  assert.equal(patioCardOpenState(patio({ weeklyHours: [] }), early), null);
  const overnight = crearHorarioBase('20:00', '03:00');
  assert.equal(patioCardOpenState(patio({ weeklyHours: overnight, soldOut: true }), early), true);
  assert.equal(patioCardOpenState(patio({ weeklyHours: overnight }), new Date('2026-09-19T16:00:00Z')), false);
  const incomplete = crearHorarioBase('08:00', '16:00');
  incomplete[6].abre = null;
  assert.equal(patioCardOpenState(patio({ weeklyHours: incomplete }), early), null);
});
