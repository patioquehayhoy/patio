/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function fixture({ daily = [], permanent = [], failDaily = false } = {}) {
  const root = path.resolve(__dirname, '../..');
  const queries = [];
  const rows = ['today', 'permanent', 'empty', 'old'].map((id) => ({ id, nombre: id, categorias: ['Fondita'] }));
  const supabase = { from(table) {
    const request = { table, clauses: [] };
    queries.push(request);
    let single = false;
    const query = {};
    for (const method of ['select', 'not', 'neq', 'eq', 'in']) query[method] = (...args) => {
      request.clauses.push([method, ...args]);
      return query;
    };
    query.maybeSingle = () => { single = true; return query; };
    query.then = (resolve, reject) => {
      if (table === 'menus' && failDaily) return Promise.reject(new Error('Offline')).then(resolve, reject);
      const id = request.clauses.find(([method, field]) => method === 'eq' && field === 'id')?.[2];
      return Promise.resolve({ data: table === 'fonditas' ? (single ? rows.find((row) => row.id === id) : rows) : table === 'menus' ? daily : permanent, error: null }).then(resolve, reject);
    };
    return query;
  } };
  const mocks = {
    react: {},
    '@/lib/supabase': { supabase },
    '@/lib/menu-date': { localMenuDate: () => '2026-09-14' },
    '@/lib/horario': { deserialize: () => null, migrarStringLegacy: () => null, horarioDeHoy: () => null },
  };
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const requireModule = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      const local = id.startsWith('@/') ? path.resolve(root, id.slice(2)) : id.startsWith('.') ? path.resolve(path.dirname(filename), id) : null;
      if (!local) throw new Error(`Unexpected import: ${id}`);
      const canonical = `@/${path.relative(root, local)}`;
      return Object.hasOwn(mocks, canonical) ? mocks[canonical] : load(`${local}.ts`);
    };
    new Function('require', 'module', 'exports', '__DEV__', output)(requireModule, module, module.exports, false);
    return module.exports;
  }
  return { load, queries };
}

const menu = (name) => ({ secciones: [{ nombre: 'Comida', platillos: [{ nombre: name, precio: 75 }] }] });

test('map and saved distinguish today publications from empty, older and permanent menus', async () => {
  const f = fixture({
    daily: [
      { fondita_id: 'today', fecha: '2026-09-14', secciones: menu('Mole de hoy') },
      { fondita_id: 'empty', fecha: '2026-09-14', secciones: { secciones: [null, { nombre: 'Vacío', platillos: [{ nombre: '   ' }] }] } },
      { fondita_id: 'old', fecha: '2026-09-13', secciones: menu('Mole de ayer') },
    ],
    permanent: ['today', 'permanent', 'empty'].map((id) => ({ fondita_id: id, secciones: menu('Tacos de carta') })),
  });
  const { fetchPublicFonditas, fetchFonditaById } = f.load('lib/patios.ts');
  const places = await fetchPublicFonditas();
  assert.deepEqual(places.map((place) => place.hasTodayMenu), [true, false, false, false]);
  assert.equal(places[0].menu[0].items[0].name, 'Mole de hoy');
  assert.equal(places[0].menu[0].items[0].price, '$75');
  assert.equal(places[1].menu[0].items[0].name, 'Tacos de carta');
  assert.equal(places[2].menu[0].items[0].name, 'Tacos de carta');
  assert.deepEqual(places[3].menu, []);
  assert.equal(f.queries.length, 3, 'one place query and two menu batches, never a menu request per map pin');
  const dailyQuery = f.queries.find((query) => query.table === 'menus');
  assert.ok(dailyQuery.clauses.some((clause) => JSON.stringify(clause) === JSON.stringify(['eq', 'fecha', '2026-09-14'])));
  assert.deepEqual(dailyQuery.clauses.find(([method]) => method === 'in')[2], places.map((place) => place.id));
  for (const place of places) {
    const saved = await fetchFonditaById(place.id);
    assert.equal(saved.hasTodayMenu, place.hasTodayMenu);
    assert.deepEqual(saved.menu, place.menu);
  }
});

test('an unavailable today-menu read preserves places and permanent content without a false today claim', async () => {
  const f = fixture({ failDaily: true, permanent: [{ fondita_id: 'permanent', secciones: menu('Tacos de carta') }] });
  const { fetchPublicFonditas, fetchFonditaById } = f.load('lib/patios.ts');
  const places = await fetchPublicFonditas();
  assert.equal(places.length, 4);
  assert.ok(places.every((place) => place.hasTodayMenu === false));
  const saved = await fetchFonditaById('permanent');
  assert.equal(saved.hasTodayMenu, false);
  assert.equal(saved.menu[0].items[0].name, 'Tacos de carta');
});
