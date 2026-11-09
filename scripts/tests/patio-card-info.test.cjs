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
const { getPatioCardInfo, patioCardPrice, patioCardOpenState, patioCardAccessibilityLabel } = load('lib/patio-card-info.ts');
const { crearHorarioBase } = load('lib/horario.ts');

function patio(overrides = {}) {
  return {
    name: 'Patio del barrio', categories: ['Fondita'], area: 'Centro',
    price: '$', menu: [], weeklyHours: null, rating: 'Nuevo', ...overrides,
  };
}

test('a grouped card speaks the full identity, availability and independent ratings without missing-data clutter', () => {
  const name = 'Un lugar con un nombre que supera ampliamente las dos líneas de una tarjeta';
  const label = patioCardAccessibilityLabel(patio({ name, rating: '4.7', ratingCount: 12 }), { personalRating: 3, distanceLabel: '450 m' });
  assert.match(label, new RegExp(name));
  assert.match(label, /Sin horario/);
  assert.match(label, /Calificación pública, 4.7 de 5, 12 reseñas/);
  assert.match(label, /Tu calificación, 3.0 de 5/);
  assert.match(label, /Distancia, 450 m/);
  const unknown = patioCardAccessibilityLabel(patio({ area: '', categories: ['Elotes'] }));
  assert.doesNotMatch(unknown, /Elotes|CDMX|Distancia|calificación propia|Menú/);
});

test('every card has a price slot; incomplete and textual amounts do not invent a range', () => {
  for (const price of ['', '$', '$$', 'Consultar', 'Desde $80', '$0']) {
    assert.equal(patioCardPrice(patio({ price })).source, 'missing');
    assert.equal(patioCardPrice(patio({ price })).label, 'Sin precio');
  }
});

// Auditoría 2026-11-08: el rango del más barato al más caro suele ir de un
// agua a un platillo para compartir; la tarjeta muestra un precio típico.
test('the menu price (comida corrida) is the place price', () => {
  const menu = [
    { section: 'Comida corrida', price: '$95', items: [{ name: 'Sopa' }, { name: 'Guisado' }] },
    { section: 'Bebidas', items: [{ name: 'Agua', price: '$20' }] },
  ];
  assert.deepEqual(patioCardPrice(patio({ price: '$150–$1,250', menu })), {
    label: '$95', source: 'menu-day', value: 95, accessibilityLabel: 'Precio del menú, 95 pesos',
  });
});

test('without a menu price the card shows the middle dish price, never a menu extreme', () => {
  const menu = [
    { section: 'Tacos', items: [{ name: 'Frijol', price: '$12' }, { name: 'Pastor', price: '$24' }, { name: 'Suadero', price: '$26' }, { name: 'Bistec', price: '$38' }] },
    { section: 'Para compartir', items: [{ name: 'Parrillada para cuatro', price: '$420' }] },
    { section: 'BEBIDAS', items: [{ name: 'Refresco', price: '$25' }, { name: 'Agua', price: '$20' }] },
    { section: 'Especiales', items: [{ name: 'Especial', price: 'Desde $10' }, { name: 'Sabores', price: '$20 / $30' }] },
  ];
  assert.deepEqual(patioCardPrice(patio({ menu })), {
    label: '$26', source: 'menu', value: 26,
    accessibilityLabel: 'Precio típico, 26 pesos. En el menú, de 12 a 420 pesos',
  });
  // Even counts take the upper middle price: always a real price from the menu.
  const even = [{ section: 'Comida', items: [{ name: 'Mole', price: '$90' }, { name: 'Agua', price: '$25.50' }] }];
  assert.equal(patioCardPrice(patio({ menu: even })).label, '$90');
});

test('drinks count when they are most of the menu, as in a café', () => {
  const menu = [
    { section: 'Bebidas calientes', items: [{ name: 'Americano', price: '$45' }, { name: 'Latte', price: '$55' }, { name: 'Moka', price: '$60' }] },
    { section: 'Pan', items: [{ name: 'Concha', price: '$25' }] },
  ];
  assert.equal(patioCardPrice(patio({ menu })).label, '$55');
});

test('several section prices are per-section prices, not a menu price', () => {
  const menu = [
    { section: 'Desayunos', price: '$75', items: [{ name: 'Chilaquiles' }] },
    { section: 'Comida', price: '$95', items: [{ name: 'Guisado' }] },
    { section: 'Cena', price: '$120', items: [{ name: 'Tacos' }] },
  ];
  assert.equal(patioCardPrice(patio({ menu })).source, 'menu');
  assert.equal(patioCardPrice(patio({ menu })).label, '$95');
});

test('a published price is the fallback when the menu has no amounts', () => {
  assert.equal(patioCardPrice(patio({ price: '$100–$120' })).label, '$100–120');
  assert.equal(patioCardPrice(patio({ price: '$100–$120' })).value, 110);
  assert.equal(patioCardPrice(patio({ price: '$1,250.50 MXN' })).label, '$1,250.5');
  assert.equal(patioCardPrice(patio({ price: '$95', menu: [{ section: 'Carta', items: [{ name: 'Mole' }] }] })).label, '$95');
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

test('a personal star never replaces the aggregate; large counts remain exact in accessibility', () => {
  const place = patio({ rating: '4.5', ratingCount: 12543 });
  const rated = getPatioCardInfo(place, { personalRating: 2 });
  assert.equal(rated.publicRating, '4.5 (12.5k)');
  assert.equal(rated.personalRatingValue, 2);
  assert.match(rated.publicRatingAccessibilityLabel, /12543 reseñas/);
  for (const personalRating of [undefined, null, 0, 6, NaN]) {
    const unrated = getPatioCardInfo(place, { personalRating });
    assert.equal(unrated.publicRating, rated.publicRating);
    assert.equal(unrated.personalRatingValue, null);
    assert.match(patioCardAccessibilityLabel(place, { personalRating, includePersonalRating: true }), /Sin calificación propia/);
  }
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

test('closing-soon status follows the actual closing time, including overnight hours', () => {
  const overnight = patio({ weeklyHours: crearHorarioBase('20:00', '03:00') });
  assert.equal(getPatioCardInfo(overnight, { now: new Date('2026-09-19T08:29:00Z') }).closingSoon, false);
  const soon = getPatioCardInfo(overnight, { now: new Date('2026-09-19T08:30:00Z') });
  assert.equal(soon.closingSoon, true);
  assert.equal(soon.openLabel, 'Cierra pronto');
  assert.equal(getPatioCardInfo(overnight, { now: new Date('2026-09-19T09:00:00Z') }).closingSoon, false);
  assert.equal(getPatioCardInfo(patio()).closingSoon, false);
});

test('closing labels use published hours, including midnight, and omit unknown or closed places', () => {
  const day = patio({ weeklyHours: crearHorarioBase('08:00', '18:00') });
  const afternoon = new Date('2026-10-10T21:00:00Z'); // 15:00 CDMX.
  assert.equal(getPatioCardInfo(day, { now: afternoon }).closingLabel, 'Cierra 18:00');
  assert.match(patioCardAccessibilityLabel(day, { now: afternoon }), /Horario publicado, cierra a las 18:00/);
  assert.equal(getPatioCardInfo(day, { now: new Date('2026-10-11T01:00:00Z') }).closingLabel, null);
  assert.equal(getPatioCardInfo(patio(), { now: afternoon }).closingLabel, null);
  const overnight = patio({ weeklyHours: crearHorarioBase('20:00', '03:00') });
  assert.equal(getPatioCardInfo(overnight, { now: new Date('2026-10-11T08:00:00Z') }).closingLabel, 'Cierra 03:00');
  const allDay = patio({ weeklyHours: crearHorarioBase('00:00', '00:00') });
  assert.equal(getPatioCardInfo(allDay, { now: afternoon }).closingLabel, 'Abierto 24 h');
  const overlapping = crearHorarioBase('08:00', '18:00');
  overlapping[5] = { dia: 5, cerrado: false, abre: '12:00', cierra: '12:00' };
  assert.equal(getPatioCardInfo(patio({ weeklyHours: overlapping }), { now: new Date('2026-10-10T16:00:00Z') }).closingLabel, 'Cierra 18:00');
});


test('price and distance ordering keep missing data last and ties stable', () => {
  const { patioTypicalPrice, patioDistance, sortPatiosByMetric } = load('lib/patio-sort.ts');
  const expensive = patio({ id: 'expensive', price: '$120–180' });
  // A $12 taco no longer makes a $420-platter place sort as the cheapest.
  const tacos = patio({ id: 'tacos', menu: [{ section: 'Tacos', items: [{ name: 'Frijol', price: '$12' }, { name: 'Pastor', price: '$95' }, { name: 'Parrillada', price: '$420' }] }] });
  const same = patio({ id: 'same', price: '$45' });
  const unknown = patio({ id: 'unknown' });
  const entries = [unknown, expensive, tacos, same];
  assert.equal(patioTypicalPrice(expensive), 150);
  assert.equal(patioTypicalPrice(tacos), 95);
  assert.equal(patioTypicalPrice(unknown), null);
  assert.deepEqual(sortPatiosByMetric(entries, patioTypicalPrice).map(x => x.id), ['same', 'tacos', 'expensive', 'unknown']);
  assert.deepEqual(entries.map(x => x.id), ['unknown', 'expensive', 'tacos', 'same']);
  const origin = { latitude: 19.4, longitude: -99.1 };
  assert.equal(patioDistance(null, origin), null);
  assert.equal(patioDistance(origin, { latitude: 0, longitude: 0 }), null);
  assert.equal(patioDistance(origin, { latitude: 91, longitude: -99 }), null);
  assert.equal(patioDistance(origin, origin), 0);
  const nearby = patio({ id: 'nearby', ...origin });
  const farther = patio({ id: 'farther', latitude: 19.5, longitude: -99.1 });
  const absent = patio({ id: 'absent', latitude: 0, longitude: 0 });
  assert.deepEqual(sortPatiosByMetric([absent, farther, nearby], x => patioDistance(origin, x)).map(x => x.id), ['nearby', 'farther', 'absent']);
});
