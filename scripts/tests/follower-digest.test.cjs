/* global __dirname */
// Resumen de los lugares que sigues (2026-11-21): un aviso con quién publicó,
// quién tiene promoción y quién no abre hoy.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
function load(relative) {
  const file = path.join(root, relative);
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const requireLocal = (id) => load(path.relative(root, path.resolve(path.dirname(file), id)));
  new Function('require', 'module', 'exports', output)(requireLocal, module, module.exports);
  return module.exports;
}
const { buildFollowerDigests, namesTitle } = load('supabase/functions/_shared/follower-digest.ts');
const { routeForNotification } = load('lib/notification-routes.ts');

const NOON = new Date('2026-11-23T17:30:00Z'); // lunes 11:30 CDMX
const week = Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: false, abre: '13:00', cierra: '18:00' }));
let n = 0;
const row = (over) => ({ user_id: 'u1', negocio_id: `p${++n}`, nombre: 'Lugar', kind: 'menu', at: `2026-11-23T1${n % 10}:00:00Z`, horario_semanal: week, body: null, ...over });
const all = () => ({ menus: true, promos: true });

test('names fit one line: two names, then «y N más»', () => {
  assert.equal(namesTitle(['Fonda Lupita']), 'Fonda Lupita');
  assert.equal(namesTitle(['Fonda Lupita', 'Tacos El Güero']), 'Fonda Lupita y Tacos El Güero');
  assert.equal(namesTitle(['Fonda Lupita', 'Tacos El Güero', 'A', 'B', 'C', 'D', 'E']), 'Fonda Lupita, Tacos El Güero y 5 más');
  assert.equal(namesTitle(['Cocina Económica Doña Mary de la Narvarte', 'Tacos El Güero', 'Pozolería']), 'Cocina Económica Doña Mary de la Narvarte y 2 más');
});

test('menus and promotions arrive as two short notifications', () => {
  const rows = [
    row({ nombre: 'Fonda Lupita', at: '2026-11-23T14:00:00Z' }),
    row({ nombre: 'Tacos El Güero', at: '2026-11-23T15:00:00Z' }),
    row({ nombre: 'Pozolería Rosy', at: '2026-11-23T16:00:00Z' }),
    row({ nombre: 'Postres Ana', kind: 'promo', body: '2×1 en flan.' }),
    row({ nombre: 'Fonda Doña Mary', kind: 'closed', body: 'Hoy no abrimos.' }),
  ];
  const [menus, promos, ...others] = buildFollowerDigests(rows, NOON, all);
  assert.equal(others.length, 0);
  assert.equal(menus.title, 'Fonda Lupita, Tacos El Güero y 1 más');
  assert.equal(menus.body, 'Publicaron su menú de hoy. Fonda Doña Mary no abre hoy.');
  assert.deepEqual(routeForNotification(menus.data), { pathname: '/favoritos' });
  assert.equal(menus.items.length, 4);
  assert.equal(promos.title, 'Postres Ana');
  assert.equal(promos.body, '2×1 en flan.');
  assert.equal(promos.items.length, 1);
});

test('a single place opens its page; promos respect the promotions switch', () => {
  const onlyMenus = buildFollowerDigests([row({ negocio_id: 'lupita', nombre: 'Fonda Lupita' }), row({ nombre: 'Postres Ana', kind: 'promo', body: '2×1' })], NOON, () => ({ menus: true, promos: false }));
  assert.equal(onlyMenus.length, 1);
  const [only] = onlyMenus;
  assert.equal(only.title, 'Fonda Lupita');
  assert.equal(only.body, 'Publicó su menú de hoy.');
  assert.deepEqual(routeForNotification(only.data), { pathname: '/patio/[id]', params: { id: 'lupita' } });
  const [promo] = buildFollowerDigests([row({ nombre: 'Postres Ana', kind: 'promo', body: '2×1 en flan.' })], NOON, all);
  assert.equal(promo.title, 'Postres Ana');
  assert.equal(promo.body, '2×1 en flan.');
});

test('places that already closed are left out; nothing to say means no digest', () => {
  const evening = new Date('2026-11-24T00:30:00Z'); // 18:30 CDMX, todos cierran a las 18
  assert.deepEqual(buildFollowerDigests([row({ nombre: 'Fonda Lupita' })], evening, all), []);
  assert.deepEqual(buildFollowerDigests([row({ nombre: 'Fonda Lupita' })], NOON, () => ({ menus: false, promos: false })), []);
});

test('the 8:00 digest only carries places that open before 10; the rest wait for 11:30', () => {
  const breakfast = Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: false, abre: '07:00', cierra: '12:00' }));
  const morning = new Date('2026-11-23T14:00:00Z'); // lunes 8:00 CDMX
  const rows = [
    row({ nombre: 'Jugos Don Beto', horario_semanal: breakfast }),
    row({ nombre: 'Fonda Lupita' }), // abre a la 1
  ];
  const [digest] = buildFollowerDigests(rows, morning, all, 'manana');
  assert.equal(digest.title, 'Jugos Don Beto');
  assert.equal(digest.items.length, 1);
  const [noon] = buildFollowerDigests(rows, NOON, all, 'mediodia');
  assert.equal(noon.title, 'Jugos Don Beto y Fonda Lupita');
});
