/* global __dirname */
// Dónde vende cada negocio (2026-11-21): local y sucursales, tianguis o sobre
// ruedas (un lugar por día) y solo a domicilio (su zona).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function load(relative, mocks = {}) {
  const file = path.join(root, relative);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)((id) => mocks[id] ?? {}, module, module.exports);
  return module.exports;
}
const puntos = load('lib/puntos.ts');
const timing = load('lib/publish-timing.ts', { './menu-date': { localMenuDate: localDate } });

const ROMA = { latitude: 19.4170, longitude: -99.1620 };
const NARVARTE = { latitude: 19.3960, longitude: -99.1550 };
const PORTALES = { latitude: 19.3700, longitude: -99.1450 };

test('local: its address first, then other branches', () => {
  const place = { ...ROMA, modalidad: 'local', puntos: [{ id: 'b', nombre: 'Sucursal Narvarte', ...NARVARTE }] };
  assert.deepEqual(puntos.positionsFor(place, 2), [ROMA, NARVARTE]);
  assert.deepEqual(puntos.extraPositionsFor(place, 2), [NARVARTE]);
});

test('market stall: only where it is today; nowhere on days it does not go out', () => {
  const place = {
    ...ROMA, modalidad: 'itinerante',
    puntos: [
      { id: 't', nombre: 'Tianguis de la Portales', ...PORTALES, dias: [2, 6] },
      { id: 'm', nombre: 'Mercado sobre ruedas', ...NARVARTE, dias: [4] },
    ],
  };
  assert.deepEqual(puntos.positionsFor(place, 2), [PORTALES]); // martes
  assert.deepEqual(puntos.positionsFor(place, 4), [NARVARTE]); // jueves
  assert.deepEqual(puntos.positionsFor(place, 1), []); // lunes
});

test('delivery only: its zone, never other places', () => {
  const place = { ...ROMA, modalidad: 'domicilio', puntos: [{ id: 'x', nombre: 'Otra', ...NARVARTE }] };
  assert.deepEqual(puntos.positionsFor(place, 3), [ROMA]);
});

test('days read like people say them', () => {
  assert.equal(puntos.diasLabel([2, 6]), 'Martes y sábado');
  assert.equal(puntos.diasLabel([1, 2, 3, 4, 5]), 'Lunes a viernes');
  assert.equal(puntos.diasLabel([6, 0]), 'Sábado y domingo');
  assert.equal(puntos.diasLabel([1, 3, 5]), 'Lunes, miércoles y viernes');
  assert.equal(puntos.diasLabel(undefined), 'Todos los días');
  assert.equal(puntos.diasLabel([0, 1, 2, 3, 4, 5, 6]), 'Todos los días');
});

test('distance uses the closest branch', () => {
  const { patioDistance } = load('lib/patio-sort.ts', {
    './geo': { distanceKm: (a, b) => Math.hypot(a.latitude - b.latitude, a.longitude - b.longitude) * 111 },
    './patio-card-info': { patioCardPrice: () => ({ value: null }) },
  });
  const me = { latitude: 19.3705, longitude: -99.1452 };
  const near = patioDistance(me, { ...ROMA, extraPositions: [PORTALES] });
  const far = patioDistance(me, ROMA);
  assert.ok(near < 1 && far > 4);
});

test('the week ahead: next open days at the reminder hour', () => {
  const week = Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: dia === 0, abre: dia === 0 ? null : '13:00', cierra: dia === 0 ? null : '18:00' }));
  // Viernes 27 nov 2026 en la noche: sábado, (domingo cierra), lunes, martes…
  const slots = timing.nextPublishSlots(week, new Date(2026, 10, 27, 21, 0), 3);
  assert.deepEqual(slots.map((slot) => slot.label), ['Mañana a las 12 pm', 'El lunes a las 12 pm', 'El martes a las 12 pm']);
  assert.deepEqual(slots.map((slot) => slot.fecha), ['2026-11-28', '2026-11-30', '2026-12-01']);
});

test('menu rhythm: daily for fondas and home cooking, carta for places that sell the same', () => {
  const { defaultRitmo } = load('lib/ritmo.ts');
  assert.equal(defaultRitmo('fondita'), 'diario');
  assert.equal(defaultRitmo('casa'), 'diario');
  assert.equal(defaultRitmo(null), 'diario');
  assert.equal(defaultRitmo('taqueria'), 'carta');
  assert.equal(defaultRitmo('reposteria'), 'carta');
  const { routeForNotification } = load('lib/notification-routes.ts');
  assert.deepEqual(routeForNotification({ type: 'prices_check' }), { pathname: '/menu-editar', params: { desde: 'ultimo' } });
});
