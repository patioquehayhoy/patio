/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const timestamp = '2026-09-09T23:30:00.000Z';
class TestDate extends Date {
  constructor(...args) { super(...(args.length ? args : [timestamp])); }
  static now() { return new Date(timestamp).getTime(); }
}

// Execute the real TS modules with isolated storage/network/native boundaries.
// Storage yields deliberately so overlapping UI actions expose lost updates.
function fixture({ dev = false, overrides = {} } = {}) {
  const values = new Map();
  const faults = { read: false, write: false };
  const storage = {
    async getItem(key) {
      await new Promise(setImmediate);
      if (faults.read) throw new Error('Read failed');
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      await new Promise(setImmediate);
      if (faults.write) throw new Error('Disk full');
      values.set(key, value);
    },
  };
  const mocks = {
    '@react-native-async-storage/async-storage': storage,
    react: {},
    'react-native': { Alert: { alert() {} } },
    'expo-router': {},
    'expo-haptics': {},
    '@/lib/demo': { saveDevPublishedMenu: async () => {} },
    '@/lib/community-notifications': { announceMenuPublication: async () => {} },
    '@/lib/typography': { noWidow: (text) => text },
    ...overrides,
  };
  const cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    const requireModule = (id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      const local = id.startsWith('@/') ? path.resolve(root, id.slice(2)) : id.startsWith('.') ? path.resolve(path.dirname(filename), id) : null;
      if (!local) throw new Error(`Missing mock: ${id}`);
      const canonical = `@/${path.relative(root, local).replace(/\.ts$/, '')}`;
      if (Object.hasOwn(mocks, canonical)) return mocks[canonical];
      return load(fs.existsSync(`${local}.ts`) ? `${local}.ts` : local);
    };
    new Function('require', 'module', 'exports', '__DEV__', 'Date', source)(requireModule, module, module.exports, dev, TestDate);
    return module.exports;
  }
  return { load, values, faults };
}

function menu(name = 'Mole con pollo') {
  return { secciones: [{ id: 'section', nombre: 'GUISADOS', precio: '120', platillos: [{ id: 'dish', nombre: name, descripcion: 'Con arroz', precio: '' }] }] };
}

function queryBuilder(result) {
  const query = {};
  for (const method of ['select', 'eq', 'filter', 'order', 'limit', 'delete', 'in']) query[method] = () => query;
  query.maybeSingle = () => Promise.resolve(result);
  query.then = (resolve, reject) => Promise.resolve(result).then(resolve, reject);
  return query;
}

test('menu day follows CDMX midnight, including when the device travels', () => {
  const { localMenuDate } = fixture().load('lib/menu-date.ts');
  assert.equal(localMenuDate(new Date('2026-09-10T00:30:00Z')), '2026-09-09');
  assert.equal(localMenuDate(new Date('2026-09-10T05:59:59Z')), '2026-09-09');
  assert.equal(localMenuDate(new Date('2026-09-10T06:00:00Z')), '2026-09-10');
  assert.equal(localMenuDate(new Date('2027-01-01T01:00:00Z')), '2026-12-31');
});

test('normalizes malformed/mixed menu versions without dropping valid dishes or numeric prices', () => {
  const { normalizeMenuData } = fixture().load('lib/menu-store.ts');
  const result = normalizeMenuData({ secciones: [null, 7, { id: 'same', nombre: 'Sopas', platillos: [null, { id: 'same', nombre: 'Sopa', precio: 40 }] }, { nombre: 'Bebidas', items: ['Agua / De jamaica', 7] }] });
  assert.equal(result.secciones.length, 2);
  assert.equal(result.secciones[0].platillos[0].precio, '40');
  assert.equal(result.secciones[0].platillos[0].descripcion, '');
  assert.notEqual(result.secciones[0].id, result.secciones[0].platillos[0].id);
  assert.equal(result.secciones[1].platillos[0].descripcion, 'De jamaica');
  assert.equal(normalizeMenuData(null), null);
  assert.equal(normalizeMenuData('invalid'), null);
});

test('resetMenuStore clears identity, draft, extraction, and business settings', () => {
  const store = fixture().load('lib/menu-store.ts');
  store.setMenuData(menu());
  store.setCartaData(menu());
  store.setMenuExtractionSnapshot({ menu: menu(), warnings: [] });
  store.setFonditaId('account-a');
  store.setFonditaName('Private name');
  store.setFonditaDescription('Private description');
  store.setFonditaDireccion('Private address');
  store.setFonditaDireccionVisible(true);
  store.setFonditaHorario('08:00');
  store.setPagosTarjeta(true);
  store.resetMenuStore();
  assert.equal(store.getMenuData(), null);
  assert.equal(store.getCartaData(), null);
  assert.equal(store.getMenuExtractionSnapshot(), null);
  assert.equal(store.getFonditaId(), null);
  assert.equal(store.getFonditaName(), '');
  assert.equal(store.getFonditaDescription(), '');
  assert.equal(store.getFonditaDireccion(), '');
  assert.equal(store.getFonditaDireccionVisible(), false);
  assert.equal(store.getFonditaHorario(), '');
  assert.equal(store.getPagosTarjeta(), false);
});

test('overlapping menu rename and save preserve both title and latest dish', async () => {
  const f = fixture();
  const history = f.load('lib/menu-history.ts');
  const id = history.newMenuDraftId();
  await history.saveLocalMenu(menu('Original'), undefined, { id });
  await Promise.all([
    history.renameLocalMenu(id, 'Comida casera', menu('Original')),
    history.saveLocalMenu(menu('Nuevo platillo'), undefined, { id }),
  ]);
  const entries = await history.getLocalMenus();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].nombre, 'Comida casera');
  assert.equal(entries[0].secciones.secciones[0].platillos[0].nombre, 'Nuevo platillo');
});

test('history read failure cannot replace existing dishes with an empty history', async () => {
  const f = fixture();
  const history = f.load('lib/menu-history.ts');
  await history.saveLocalMenu(menu('Original'));
  const before = f.values.get('@patio_menu_history');
  f.faults.read = true;
  assert.equal(await history.saveLocalMenu(menu('Replacement')), false);
  await assert.rejects(history.renameLocalMenu('2026-09-09', 'Title', menu()), /Read failed/);
  assert.equal(f.values.get('@patio_menu_history'), before);
});

test('rename/delete report storage failure and the queue recovers for a retry', async () => {
  const f = fixture();
  const history = f.load('lib/menu-history.ts');
  const id = history.newMenuDraftId();
  await history.saveLocalMenu(menu(), undefined, { id });
  f.faults.write = true;
  await assert.rejects(history.deleteLocalMenu(id), /Disk full/);
  await assert.rejects(history.renameLocalMenu(id, 'New title', menu()), /Disk full/);
  f.faults.write = false;
  await history.deleteLocalMenu(id);
  assert.deepEqual(await history.getLocalMenus(), []);
});

test('autosave never writes over a published menu, but still saves drafts', async () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: {} } } });
  const history = f.load('lib/menu-history.ts');
  const published = history.newMenuDraftId();
  const draft = history.newMenuDraftId();
  await history.saveMenuPublication(menu('Publicado'), 'Comida', published, async () => {});
  assert.equal(await history.saveLocalMenu(menu('Encima'), 'Comida', { id: published, onlyDraft: true }), true);
  await history.saveLocalMenu(menu('Borrador'), 'Cena', { id: draft, onlyDraft: true });
  const entries = await history.getLocalMenus();
  const byId = (id) => entries.find((entry) => entry.id === id);
  assert.equal(byId(published).published, true);
  assert.equal(byId(published).secciones.secciones[0].platillos[0].nombre, 'Publicado');
  assert.equal(byId(draft).secciones.secciones[0].platillos[0].nombre, 'Borrador');
});

test('same-day drafts keep independent identities and only a confirmed publication counts', async () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: {} } } });
  const history = f.load('lib/menu-history.ts');
  const { mergeMenuHistory } = f.load('lib/controllers/useMenuHistoryController.ts');
  const first = history.newMenuDraftId();
  const second = history.newMenuDraftId();
  await history.saveLocalMenu(menu('Primero'), 'Comida', { id: first });
  await history.saveLocalMenu(menu('Segundo'), 'Cena', { id: second });
  assert.equal((await history.getLocalMenus()).length, 2);
  assert.equal((await history.getLocalMenus()).some((entry) => entry.published), false);
  await assert.rejects(history.saveMenuPublication(menu('Segundo'), 'Cena', second, async () => { throw new Error('Offline'); }), /Offline/);
  assert.equal((await history.getLocalMenus()).some((entry) => entry.published), false);
  await history.saveMenuPublication(menu('Segundo'), 'Cena', second, async () => {});
  const merged = mergeMenuHistory(await history.getLocalMenus(), [{ fecha: '2026-09-09', secciones: menu('Segundo') }]);
  assert.equal(merged.length, 2);
  assert.deepEqual(merged.filter((entry) => entry.published).map((entry) => entry.id), [second]);
  await history.deleteLocalMenu(first);
  assert.deepEqual((await history.getLocalMenus()).map((entry) => entry.id), [second]);
});

test('concurrent favorite actions retain every selected place', async () => {
  const favorites = fixture().load('lib/favorites.ts');
  await Promise.all(['one', 'two', 'three'].map(favorites.toggleFavoritePatio));
  assert.deepEqual(await favorites.getFavoritePatioIds(), ['three', 'two', 'one']);
  await Promise.all([favorites.removeFavoritePatio('two'), favorites.toggleFavoritePatio('four')]);
  assert.deepEqual(await favorites.getFavoritePatioIds(), ['four', 'three', 'one']);
});

test('concurrent menu-list edits and deletion cleanup retain unrelated dates', async () => {
  const collections = fixture().load('lib/menu-collections.ts');
  const list = await collections.createMenuCollection('Para la semana');
  await Promise.all([
    collections.setMenusInCollection(list.id, ['2026-09-08'], true),
    collections.setMenusInCollection(list.id, ['2026-09-09'], true),
  ]);
  await collections.removeFechasFromAllCollections(['2026-09-08']);
  const [saved] = await collections.getMenuCollections();
  assert.equal(saved.title, 'Para la semana');
  assert.deepEqual(saved.fechas, ['2026-09-09']);
});

function publicationFixture({ fonditaId = 'business-id', remoteError, storageFail = false, correctionError = false } = {}) {
  const calls = [];
  const f = fixture({ overrides: {
    '@/lib/user-store': { getFonditaId: () => fonditaId },
    '@/lib/db': { saveMenuHoy: async () => { calls.push('remote'); if (remoteError) throw remoteError; } },
    '@/lib/community-notifications': { announceMenuPublication: async () => { calls.push('notification'); } },
    '@/lib/menu-learning': { recordMenuCorrection: async () => { calls.push('correction'); if (correctionError) throw new Error('Learning unavailable'); } },
  } });
  f.faults.write = storageFail;
  return { ...f, calls, publish: f.load('lib/controllers/useFonderoMenuDraftController.ts').publishMenuNow };
}

test('production publication rejects missing business and empty menus before saving or announcing', async () => {
  const withoutAccount = publicationFixture({ fonditaId: null });
  await assert.rejects(withoutAccount.publish(menu()), /cuenta de negocio/);
  assert.deepEqual(withoutAccount.calls, []);
  assert.equal(withoutAccount.values.size, 0);
  const empty = publicationFixture();
  await assert.rejects(empty.publish({ secciones: [] }), /platillo/);
  assert.deepEqual(empty.calls, []);
});

test('failed remote publication retains draft but never announces or confirms it in memory', async () => {
  const f = publicationFixture({ remoteError: new Error('Offline') });
  await assert.rejects(f.publish(menu(), { nombre: 'Menú planeado' }), /Offline/);
  assert.deepEqual(f.calls, ['remote']);
  assert.equal(f.load('lib/menu-store.ts').getMenuData(), null);
  assert.equal((await f.load('lib/menu-history.ts').getLocalMenus())[0].nombre, 'Menú planeado');
});

test('failed update keeps the previously published content and identity, then permits retry', async () => {
  const f = publicationFixture({ remoteError: new Error('Offline') });
  const history = f.load('lib/menu-history.ts');
  const id = 'draft:published';
  await history.saveMenuPublication(menu('Publicado'), 'Comida', id, async () => {});
  await assert.rejects(f.publish(menu('Cambio pendiente'), { draftId: id }), /Offline/);
  const [entry] = await history.getLocalMenus();
  assert.equal(entry.id, id);
  assert.equal(entry.published, true);
  assert.equal(entry.secciones.secciones[0].platillos[0].nombre, 'Publicado');
  await history.saveMenuPublication(menu('Cambio pendiente'), 'Comida', id, async () => {});
  const [updated] = await history.getLocalMenus();
  assert.equal(updated.id, id);
  assert.equal(updated.published, true);
  assert.equal(updated.secciones.secciones[0].platillos[0].nombre, 'Cambio pendiente');
});

test('declining vegetarian is a saved edit and does not become an unanswered question on reopening', async () => {
  const runtime = hookRuntime();
  const f = fixture({ overrides: { react: runtime.react, '@/lib/db': {} } });
  const history = f.load('lib/menu-history.ts');
  const { useFonderoMenuDraftController } = f.load('lib/controllers/useFonderoMenuDraftController.ts');
  const id = 'draft:salad';
  const initial = { ...menu('Ensalada'), localDraftId: id };
  await history.saveLocalMenu(initial, undefined, { id });
  const render = () => runtime.render(() => useFonderoMenuDraftController(initial));
  assert.equal(render().hasUnsavedChanges(), false);
  render().patchDish('section', 'dish', { vegetariano: false });
  assert.equal(render().hasUnsavedChanges(), true);
  await render().flushDraft();
  assert.equal((await history.getLocalMenus())[0].secciones.secciones[0].platillos[0].vegetariano, false);
  assert.equal(render().draftSaveState, 'saved');
  runtime.unmount();
});

test('the visible publication is chosen by date and release time, never by list position', () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: {} } } });
  const { menuPublicationState } = f.load('lib/controllers/useMenuHistoryController.ts');
  const now = new Date('2026-11-22T15:00:00Z');
  const today = '2026-11-22';
  const entries = [
    { id: 'first', fecha: today, published: false },
    { id: 'second', fecha: '2026-11-23', published: true },
    { id: 'third', fecha: today, published: true },
  ];
  assert.equal(entries.find((entry) => menuPublicationState(entry, today, now) === 'live').id, 'third');
  assert.equal(menuPublicationState({ ...entries[2], publishAt: '2026-11-22T17:00:00Z' }, today, now), 'scheduled');
  assert.equal(menuPublicationState({ ...entries[2], publishAt: '2026-11-22T14:00:00Z' }, today, now), 'live');
  assert.equal(menuPublicationState({ ...entries[2], fecha: '2026-11-21' }, today, now), 'previous');
});

test('DEV sold-out survives reopening without publishing other pending edits', async () => {
  const runtime = hookRuntime();
  let visible;
  const f = fixture({ dev: true, overrides: {
    react: runtime.react,
    'expo-haptics': { selectionAsync: async () => {} },
    '@/lib/user-store': { getFonditaId: () => null },
    '@/lib/db': {},
    '@/lib/demo': { saveDevPublishedMenu: async (data) => { visible = data; } },
  } });
  const history = f.load('lib/menu-history.ts');
  const { useFonderoMenuDraftController } = f.load('lib/controllers/useFonderoMenuDraftController.ts');
  const id = 'draft:dev-publication';
  await history.saveMenuPublication(menu('Mole'), 'Comida', id, async () => {});
  const initial = { ...menu('Mole'), localDraftId: id, localLive: true };
  const render = () => runtime.render(() => useFonderoMenuDraftController(initial));
  render().patchDish('section', 'dish', { precio: '95' });
  await render().setSoldOut('section', 'dish', true);
  const saved = (await history.getLocalMenus())[0];
  assert.equal(saved.published, true);
  assert.equal(saved.secciones.secciones[0].platillos[0].agotado, true);
  assert.equal(visible.secciones[0].platillos[0].agotado, true);
  assert.equal(visible.secciones[0].platillos[0].precio, '');
  assert.equal(render().data.secciones[0].platillos[0].precio, '95');
  runtime.unmount();
});

test('DEV public profile and menu fetch preserve Se acabó, Ya hay and vegetarian flags', async () => {
  let current = menu('Ensalada');
  current.secciones[0].platillos[0].agotado = true;
  current.secciones[0].platillos[0].vegetariano = true;
  const f = fixture({ dev: true, overrides: {
    '@/lib/supabase': { supabase: {} },
    '@/lib/demo': { DEV_MY_PATIO_ID: 'demo-mi-patio', getDevPublishedMenu: async () => current },
    '@/lib/stats': {},
  } });
  const { makeDevPublishedPatio } = f.load('lib/demo.ts');
  const { fetchMenuForFondita } = f.load('lib/menu.ts');
  const check = async (soldOut) => {
    const profileDish = makeDevPublishedPatio(current).menu[0].items[0];
    const refreshedDish = (await fetchMenuForFondita('demo-mi-patio')).sections[0].items[0];
    for (const dish of [profileDish, refreshedDish]) {
      assert.equal(dish.soldOut === true, soldOut);
      assert.equal(dish.vegetarian, true);
      assert.equal(dish.name, 'Ensalada');
    }
  };
  await check(true);
  current = { ...current, secciones: current.secciones.map((section) => ({ ...section, platillos: section.platillos.map(({ agotado, ...dish }) => dish) })) };
  await check(false);
});

test('past menus discard stale live context and get a date title instead of a string of dishes', () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: {} } } });
  const { editorSeed, defaultHistoryTitle } = f.load('lib/controllers/useMenuHistoryController.ts');
  const past = { id: 'old', fecha: '2026-11-21', published: true,
    secciones: { ...menu('Mole'), localLive: true, localFecha: '2026-11-22', localPublishAt: '2026-11-22T17:00:00Z' } };
  const copy = editorSeed(past, '2026-11-22');
  assert.equal(copy.localLive, undefined);
  assert.equal(copy.localFecha, undefined);
  assert.equal(copy.localPublishAt, undefined);
  assert.equal(copy.localDraftId, undefined);
  assert.equal(defaultHistoryTitle(past), 'Menú del 21 de noviembre');
});

test('business demo has consistent followers and totals, and is unavailable in production or for real accounts', () => {
  const demo = fixture({ dev: true }).load('lib/business-demo.ts');
  const snapshot = demo.getDemoBusinessSnapshot(demo.DEMO_BUSINESS_ID, '2026-11-22');
  assert.equal(snapshot.stats.saves, snapshot.followers.length);
  assert.equal(snapshot.insights.saves, snapshot.followers.length);
  assert.equal(snapshot.stats.dishLikes, snapshot.dishes.reduce((sum, dish) => sum + dish.likes, 0));
  assert.equal(snapshot.today.week.length, 7);
  assert.deepEqual(snapshot.today.week.at(-1), { day: '2026-11-22', views: snapshot.today.viewsToday });
  assert.equal(demo.getDemoBusinessSnapshot('11111111-1111-4111-8111-111111111111'), null);
  const production = fixture().load('lib/business-demo.ts');
  assert.equal(production.getDemoBusinessSnapshot(production.DEMO_BUSINESS_ID), null);
});

test('successful remote publication survives optional local-cache and learning failures', async () => {
  const f = publicationFixture({ storageFail: true, correctionError: true });
  const store = f.load('lib/menu-store.ts');
  store.setMenuExtractionSnapshot({ menu: menu(), warnings: [] });
  await f.publish(menu(), { source: 'foto' });
  assert.deepEqual(f.calls, ['remote', 'notification', 'correction']);
  assert.equal(store.getMenuData().secciones[0].platillos[0].nombre, 'Mole con pollo');
  assert.equal(store.getMenuExtractionSnapshot(), null);
});

test('after publishing, «Editar» reopens that same menu to update it in place', async () => {
  const f = publicationFixture();
  await f.publish(menu(), { draftId: 'draft:abc' });
  const current = f.load('lib/menu-store.ts').getMenuData();
  assert.equal(current.localDraftId, 'draft:abc');
  assert.equal(current.localLive, true);
  const [entry] = await f.load('lib/menu-history.ts').getLocalMenus();
  assert.equal(entry.id, 'draft:abc');
  assert.equal(entry.published, true);
});

test('publication streak ignores future/invalid dates and stops at a missed day', () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: {} } } });
  const { computeStreak } = f.load('lib/controllers/useMenuHistoryController.ts');
  assert.equal(computeStreak(['2026-09-09', '2026-09-08', '2026-09-08', '2026-09-07', '2099-01-01', 'invalid']), 3);
  assert.equal(computeStreak(['2026-09-08', '2026-09-07']), 2);
  assert.equal(computeStreak(['2026-09-07']), 0);
  assert.equal(computeStreak(['2099-01-01']), 0);
});

const patio = {
  id: 'one', name: 'Café del barrio', categories: ['Café'], reason: '', area: 'Polanco',
  menu: [{ section: 'Bebidas', items: [{ name: 'Café de olla', description: 'Con canela', price: '$40' }] }],
};

test('production search supports accents, exact place names, and cached dishes during network failure', async () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: { from: () => {
    const query = queryBuilder(null);
    query.then = (resolve, reject) => Promise.reject(new Error('Offline')).then(resolve, reject);
    return query;
  } } } } });
  const { searchLiveMenus } = f.load('lib/menu.ts');
  const dishes = await searchLiveMenus('cafe de olla', [patio]);
  assert.equal(dishes[0].item.name, 'Café de olla');
  const names = await searchLiveMenus('Café del barrio', [patio]);
  assert.equal(names[0].section, 'LUGAR');
  assert.equal(names[0].score, 150);
});

test('search does not revive an old permanent-menu dish when a current menu is loaded', async () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: { from: (table) => queryBuilder({ data: table === 'cartas' ? [{ negocio_id: 'one', secciones: menu('Pozole viejo') }] : [] }) } } } });
  const { searchLiveMenus } = f.load('lib/menu.ts');
  assert.deepEqual(await searchLiveMenus('Pozole viejo', [patio]), []);
});

test('public menu loading tolerates malformed sections and falls back to permanent menu', async () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: { from: (table) => queryBuilder({ data: { secciones: table === 'menus' ? { secciones: [null, { nombre: 'Broken' }] } : menu() } }) } } } });
  const { fetchMenuForFondita } = f.load('lib/menu.ts');
  const { sections, prices, carta } = await fetchMenuForFondita('business-id');
  assert.equal(sections[0].items[0].name, 'Mole con pollo');
  assert.equal(sections[0].price, '$120', 'a permanent menu keeps its section price');
  assert.deepEqual(prices, []);
  assert.deepEqual(carta, [], 'the permanent menu is already the main list');
});

function hookRuntime() {
  const slots = [];
  const cleanups = [];
  let cursor = 0;
  return {
    react: {
      useState(initial) {
        const slot = cursor++;
        if (!(slot in slots)) slots[slot] = typeof initial === 'function' ? initial() : initial;
        return [slots[slot], (next) => { slots[slot] = typeof next === 'function' ? next(slots[slot]) : next; }];
      },
      useRef(initial) {
        const slot = cursor++;
        if (!(slot in slots)) slots[slot] = { current: initial };
        return slots[slot];
      },
      useCallback: (fn) => fn,
      useMemo: (fn) => fn(),
      useEffect(effect) {
        const slot = cursor++;
        if (!(slot in slots)) { slots[slot] = true; cleanups.push(effect()); }
      },
    },
    render(fn) { cursor = 0; return fn(); },
    unmount() { cleanups.forEach((cleanup) => cleanup?.()); },
  };
}

test('viewed places show a retryable failure and retain loaded places when refreshing fails', async () => {
  const runtime = hookRuntime();
  let fail = true;
  const f = fixture({ overrides: {
    react: runtime.react,
    '@react-navigation/native': { useFocusEffect: runtime.react.useEffect },
    '@/lib/stats': { getViewedPatioIds: async () => ['one'] },
    '@/lib/patios': { fetchFonditaById: async (_id, options) => {
      assert.equal(options.throwOnError, true);
      if (fail) throw new Error('Offline');
      return patio;
    } },
  } });
  const { useViewedPatiosController } = f.load('lib/controllers/useViewedPatiosController.ts');
  const render = () => runtime.render(useViewedPatiosController);
  assert.equal(render().loading, true);
  await new Promise(setImmediate);
  assert.equal(render().loadError, true);
  assert.equal(render().loading, false);
  fail = false;
  await render().reload();
  assert.deepEqual(render().patios, [patio]);
  assert.equal(render().loadError, false);
  fail = true;
  await render().reload();
  assert.deepEqual(render().patios, [patio]);
  assert.equal(render().loadError, true);
  runtime.unmount();
});

test('a late viewed-places request cannot replace a newer refresh', async () => {
  const runtime = hookRuntime();
  let finishOld;
  let calls = 0;
  const newest = { ...patio, id: 'newest' };
  const f = fixture({ overrides: {
    react: runtime.react,
    '@react-navigation/native': { useFocusEffect: runtime.react.useEffect },
    '@/lib/stats': { getViewedPatioIds: async () => ['one'] },
    '@/lib/patios': { fetchFonditaById: async () => ++calls === 1 ? new Promise((resolve) => { finishOld = resolve; }) : newest },
  } });
  const { useViewedPatiosController } = f.load('lib/controllers/useViewedPatiosController.ts');
  const render = () => runtime.render(useViewedPatiosController);
  render();
  await new Promise(setImmediate);
  await render().reload();
  finishOld(patio);
  await new Promise(setImmediate);
  assert.deepEqual(render().patios, [newest]);
  assert.equal(render().loading, false);
  runtime.unmount();
});

test('a late title blur cannot overwrite newly saved dishes or erase publication confirmation', async () => {
  const runtime = hookRuntime();
  const f = fixture({ overrides: { react: runtime.react, '@/lib/db': {} } });
  const history = f.load('lib/menu-history.ts');
  const { useFonderoMenuDraftController } = f.load('lib/controllers/useFonderoMenuDraftController.ts');
  const id = history.newMenuDraftId();
  const initial = { ...menu('Original'), localDraftId: id };
  const render = () => runtime.render(() => useFonderoMenuDraftController(initial));
  render().setNombre('Comida casera');
  const oldEditor = render();
  await history.saveMenuPublication(menu('Nuevo platillo'), undefined, id, async () => {});
  assert.equal(await oldEditor.saveNombre(), true);
  const [saved] = await history.getLocalMenus();
  assert.equal(saved.id, id);
  assert.equal(saved.nombre, 'Comida casera');
  assert.equal(saved.published, true);
  assert.equal(saved.secciones.secciones[0].platillos[0].nombre, 'Nuevo platillo');
  runtime.unmount();
});

test('editor with cards: next opens a line right below, a new section starts without lines, and closing knows what changed', async () => {
  const runtime = hookRuntime();
  const f = fixture({ overrides: { react: runtime.react, '@/lib/db': {} } });
  const { useFonderoMenuDraftController } = f.load('lib/controllers/useFonderoMenuDraftController.ts');
  const initial = { secciones: [
    { id: 'a', nombre: 'SOPAS', precio: '', platillos: [{ id: 'd1', nombre: 'Fideo', descripcion: '', precio: '' }, { id: 'd2', nombre: 'Consomé', descripcion: '', precio: '' }] },
    { id: 'b', nombre: 'GUISADOS', precio: '', platillos: [{ id: 'd3', nombre: 'Mole', descripcion: '', precio: '' }] },
  ] };
  const render = () => runtime.render(() => useFonderoMenuDraftController(initial));
  const ids = (index) => render().data.secciones[index].platillos.map((dish) => dish.id);
  assert.equal(render().hasUnsavedChanges(), false);
  // «siguiente» en Fideo: el renglón nuevo queda entre Fideo y Consomé.
  const middle = render().insertDishAfter('a', 'd1');
  assert.deepEqual(ids(0), ['d1', middle, 'd2']);
  // «Platillo» de GUISADOS (brincar de la sopa al guisado): al final de esa tarjeta.
  const end = render().insertDishAfter('b', null);
  assert.deepEqual(ids(1), ['d3', end]);
  render().patchDish('b', end, { nombre: 'Tinga' });
  assert.equal(render().hasUnsavedChanges(), true);
  // Una sección nueva nace sin renglones: primero se escribe su título.
  const added = render().addSection('', false);
  assert.deepEqual(render().data.secciones.find((section) => section.id === added).platillos, []);
  runtime.unmount();
});

test('drafts save themselves: opening without touching saves nothing, typing saves, and an emptied draft goes away on leaving', async () => {
  const runtime = hookRuntime();
  const f = fixture({ overrides: { react: runtime.react, '@/lib/db': {} } });
  const history = f.load('lib/menu-history.ts');
  const { useFonderoMenuDraftController } = f.load('lib/controllers/useFonderoMenuDraftController.ts');
  const id = history.newMenuDraftId();
  const initial = { ...menu('Mole con pollo'), localDraftId: id };
  const render = () => runtime.render(() => useFonderoMenuDraftController(initial));
  assert.equal(render().live, false);
  // Abrir un menú y salir sin tocar nada no crea otro en Menús.
  assert.equal(await render().flushDraft(true), true);
  assert.deepEqual(await history.getLocalMenus(), []);
  // Escribir: se guarda solo, sin botón.
  render().patchDish('section', 'dish', { nombre: 'Mole poblano' });
  assert.equal(await render().flushDraft(), true);
  const [saved] = await history.getLocalMenus();
  assert.equal(saved.id, id);
  assert.equal(saved.published, false);
  assert.equal(saved.secciones.secciones[0].platillos[0].nombre, 'Mole poblano');
  assert.equal(render().hasUnsavedChanges(), false);
  // Sin platillos al salir: el borrador se va, como una nota vacía.
  render().removeDish('section', 'dish');
  await render().flushDraft(true);
  assert.deepEqual(await history.getLocalMenus(), []);
  runtime.unmount();
});

test('the menu published today changes in place: it never saves itself and knows when «Actualizar» has something to send', async () => {
  const runtime = hookRuntime();
  const f = fixture({ overrides: { react: runtime.react, '@/lib/db': {} } });
  const history = f.load('lib/menu-history.ts');
  const { useFonderoMenuDraftController } = f.load('lib/controllers/useFonderoMenuDraftController.ts');
  const id = history.newMenuDraftId();
  await history.saveMenuPublication(menu('Mole con pollo'), 'Comida', id, async () => {});
  const initial = { ...menu('Mole con pollo'), localDraftId: id, localLive: true };
  const render = () => runtime.render(() => useFonderoMenuDraftController(initial));
  assert.equal(render().live, true);
  assert.equal(render().hasUnsavedChanges(), false);
  render().patchDish('section', 'dish', { precio: '95' });
  assert.equal(render().hasUnsavedChanges(), true);
  await render().flushDraft(true);
  const [stored] = await history.getLocalMenus();
  assert.equal(stored.published, true);
  assert.equal(stored.secciones.secciones[0].platillos[0].precio, '');
  runtime.unmount();
});

test('an autosave never writes over a menu that is already published', async () => {
  const runtime = hookRuntime();
  const f = fixture({ overrides: { react: runtime.react, '@/lib/db': {} } });
  const history = f.load('lib/menu-history.ts');
  const { useFonderoMenuDraftController } = f.load('lib/controllers/useFonderoMenuDraftController.ts');
  const id = history.newMenuDraftId();
  const render = () => runtime.render(() => useFonderoMenuDraftController({ ...menu('Original'), localDraftId: id }));
  render().patchDish('section', 'dish', { nombre: 'Cambio sin publicar' });
  await history.saveMenuPublication(menu('Publicado'), undefined, id, async () => {});
  await render().flushDraft(true);
  const [stored] = await history.getLocalMenus();
  assert.equal(stored.published, true);
  assert.equal(stored.secciones.secciones[0].platillos[0].nombre, 'Publicado');
  runtime.unmount();
});

test('opening from Menús: today\'s publication is edited in place, another day is copied, a draft keeps going', () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: {} } } });
  const { editorSeed } = f.load('lib/controllers/useMenuHistoryController.ts');
  const entry = (id, fecha, published) => ({ id, fecha, published, secciones: menu() });
  const today = editorSeed(entry('hoy', '2026-09-09', true), '2026-09-09');
  assert.equal(today.localDraftId, 'hoy');
  assert.equal(today.localLive, true);
  const yesterday = editorSeed(entry('ayer', '2026-09-08', true), '2026-09-09');
  assert.equal(yesterday.localDraftId, undefined);
  assert.equal(yesterday.localLive, undefined);
  const draft = editorSeed(entry('draft:x', '2026-09-08', false), '2026-09-09');
  assert.equal(draft.localDraftId, 'draft:x');
  assert.equal(draft.localLive, undefined);
  assert.equal(today.secciones[0].platillos[0].nombre, 'Mole con pollo');
});

function photoFixture({ vision, picker, handlers } = {}) {
  const runtime = hookRuntime();
  const alerts = [];
  const f = fixture({ overrides: {
    react: runtime.react,
    'react-native': { Alert: { alert: (...args) => alerts.push(args) }, Linking: { openSettings: async () => {} } },
    'expo-image-picker': {
      requestCameraPermissionsAsync: async () => ({ granted: true }),
      launchImageLibraryAsync: picker ?? (async () => ({ canceled: false, assets: [{ uri: 'photo.jpg', width: 1200, height: 1600 }] })),
    },
    'expo-image-manipulator': { SaveFormat: { JPEG: 'jpeg' }, manipulateAsync: async () => ({ uri: 'normalized.jpg' }) },
    '@/lib/vision': { leerMenuDeFoto: vision ?? (async () => ({ error: 'No dishes', secciones: [] })) },
  } });
  const { useFotoMenuController } = f.load('lib/controllers/useFotoMenuController.ts');
  return { ...f, alerts, runtime, render: () => runtime.render(() => useFotoMenuController(handlers)) };
}

test('photo-library reading failure can retry with an enabled camera', async () => {
  const f = photoFixture();
  await f.render().choosePhoto();
  assert.equal(f.render().state, 'idle');
  const retry = f.alerts.at(-1)[2].find((button) => button.text === 'Otra foto');
  retry.onPress();
  await new Promise(setImmediate);
  assert.equal(f.render().cameraAllowed, true);
});

test('a failed library read retries Photos without requesting or enabling the camera', async () => {
  let picks = 0;
  const f = photoFixture({ handlers: { photoSource: 'library' }, picker: async () => {
    picks++;
    return { canceled: false, assets: [{ uri: 'photo.jpg' }] };
  } });
  await f.render().choosePhoto();
  const retry = f.alerts.at(-1)[2].find((button) => button.text === 'Otra foto');
  retry.onPress();
  await new Promise(setImmediate);
  assert.equal(picks, 2);
  assert.equal(f.render().cameraAllowed, false);
});

test('leaving the photo flow prevents a late picker response from starting analysis', async () => {
  let resolvePicker;
  let reads = 0;
  const f = photoFixture({
    picker: () => new Promise((resolve) => { resolvePicker = resolve; }),
    vision: async () => { reads++; return { secciones: [] }; },
  });
  const pending = f.render().choosePhoto();
  f.runtime.unmount();
  resolvePicker({ canceled: false, assets: [{ uri: 'late.jpg' }] });
  await pending;
  assert.equal(reads, 0);
  assert.equal(f.alerts.length, 0);
});

test('cancelled photo reading cannot restore a private extraction snapshot', async () => {
  let resolveVision;
  const f = photoFixture({ vision: () => new Promise((resolve) => { resolveVision = resolve; }) });
  const controller = f.render();
  const pending = controller.analyzePhoto('photo.jpg', 1200, 1600);
  await new Promise(setImmediate);
  controller.cancelRead();
  resolveVision({ precio: '', secciones: [{ nombre: 'Sopas', platillos: [{ nombre: 'Sopa de fideo', descripcion: '', precio: '' }] }] });
  await pending;
  assert.equal(f.load('lib/menu-store.ts').getMenuExtractionSnapshot(), null);
  assert.equal(f.render().state, 'idle');
});

test('AI response errors expose quota/auth messages and keep internal errors private', async () => {
  const { aiFunctionError, AIServiceError } = fixture().load('lib/edge-function-error.ts');
  const quota = await aiFunctionError({ context: Response.json({ error: 'Límite de lecturas alcanzado.' }, { status: 429 }) }, 'Fallback');
  assert.equal(quota instanceof AIServiceError, true); assert.equal(quota.status, 429); assert.equal(quota.message, 'Límite de lecturas alcanzado.');
  const internal = await aiFunctionError({ context: Response.json({ error: 'Provider secret detail' }, { status: 500 }) }, 'Inténtalo de nuevo.');
  assert.equal(internal.message, 'Inténtalo de nuevo.');
  const malformed = await aiFunctionError({ context: new Response('not json', { status: 429 }) }, 'Fallback');
  assert.match(malformed.message, /límite/);
});

test('dish photos: only Patio dish-photos URLs reach the ficha, outside links are dropped', async () => {
  const ours = 'https://gjfjsjlrgycrgmcbjrus.supabase.co/storage/v1/object/public/dish-photos/owner/tacos-dorados-abc.jpg';
  const today = { precios: [], secciones: [{ id: 's', nombre: 'GUISADOS', precio: '', platillos: [
    { id: 'a', nombre: 'Tacos dorados', descripcion: '', precio: '', foto: ours, fotoHash: 'da590a16025f78c865863ab6878c576bc6962f77b1c30b' },
    { id: 'b', nombre: 'Pozole', descripcion: '', precio: '', foto: 'https://evil.example/x.jpg' },
    { id: 'c', nombre: 'Agua', descripcion: '', precio: '', foto: `${ours.replace('tacos-dorados-abc.jpg', '')}../place-photos/x.jpg` },
  ] }] };
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: { from: (table) => queryBuilder({ data: table === 'menus' ? { secciones: today } : null }) } } } });
  const { fetchMenuForFondita } = f.load('lib/menu.ts');
  const { sections } = await fetchMenuForFondita('business-id');
  assert.equal(sections[0].items[0].photo, ours);
  assert.equal(sections[0].items[0].photoHash, 'da590a16025f78c865863ab6878c576bc6962f77b1c30b', 'the instant preview travels with the photo');
  assert.equal(sections[0].items[1].photo, undefined, 'an outside URL is never shown');
  assert.equal(sections[0].items[2].photo, undefined, 'a path that climbs out of the bucket is never shown');
});

test('editor board: menu prices become headings, «Incluye» goes away and a priced heading survives cleaning', () => {
  const f = publicationFixture();
  const { boardFromMenu, cleanMenu } = f.load('lib/controllers/useFonderoMenuDraftController.ts');
  // Un solo precio y la primera sección sin nombre propio: «MENÚ DEL DÍA $100».
  const single = boardFromMenu({ precios: [{ id: 'p', nombre: '', precio: '100' }], incluye: 'sopa y agua', secciones: [{ id: 's', nombre: 'MENÚ DE HOY', precio: '', platillos: [{ id: 'd', nombre: 'Mole', descripcion: '', precio: '' }] }] });
  assert.deepEqual(single.secciones.map((x) => [x.nombre, x.precio]), [['MENÚ DEL DÍA', '100']]);
  assert.deepEqual(single.precios, []);
  assert.equal(single.incluye, undefined);
  // Varios precios con nombre: cada uno es su encabezado, arriba de lo de hoy.
  const several = boardFromMenu({ precios: [{ id: 'a', nombre: 'Comida corrida', precio: '95' }, { id: 'b', nombre: 'Solo guisado', precio: '70' }], secciones: [{ id: 's', nombre: 'GUISADOS', precio: '', platillos: [] }] });
  assert.deepEqual(several.secciones.map((x) => [x.nombre, x.precio]), [['COMIDA CORRIDA', '95'], ['SOLO GUISADO', '70'], ['GUISADOS', '']]);
  // Un encabezado con precio se guarda aunque no tenga platillos; uno vacío, no.
  const clean = cleanMenu({ secciones: [
    { id: 'h', nombre: 'MENÚ DEL DÍA', precio: '100', platillos: [] },
    { id: 'e', nombre: 'VACÍA', precio: '', platillos: [] },
    { id: 'g', nombre: 'GUISADOS', precio: '', platillos: [{ id: 'd', nombre: 'Mole', descripcion: '', precio: '' }] },
  ] });
  assert.deepEqual(clean.secciones.map((x) => x.nombre), ['MENÚ DEL DÍA', 'GUISADOS']);
  assert.deepEqual(clean.precios, []);
});

test('a menu left ready for another day reopens in place; copies drop «Se acabó»; the reminder never opens tomorrow\'s menu', () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: {} } } });
  const { editorSeed, latestMenuSeed, withoutSoldOut } = f.load('lib/controllers/useMenuHistoryController.ts');
  const soldOut = { secciones: [{ id: 's', nombre: 'GUISADOS', precio: '', platillos: [{ id: 'd', nombre: 'Mole', descripcion: '', precio: '', agotado: true }] }] };
  const today = '2026-11-21';
  const scheduled = { id: 'm2', fecha: '2026-11-22', secciones: soldOut, published: true, publishAt: '2026-11-22T15:00:00.000Z' };
  const yesterday = { id: 'm1', fecha: '2026-11-20', secciones: soldOut, published: true };
  const seed = editorSeed(scheduled, today);
  assert.equal(seed.localLive, true);
  assert.equal(seed.localFecha, '2026-11-22');
  assert.equal(seed.localPublishAt, '2026-11-22T15:00:00.000Z');
  const copy = editorSeed(yesterday, today);
  assert.equal(copy.localLive, undefined);
  assert.equal(copy.secciones[0].platillos[0].agotado, undefined);
  assert.equal(withoutSoldOut(soldOut).secciones[0].platillos[0].agotado, undefined);
  // «¿Ya publicaste lo de hoy?» abre lo último publicado hasta hoy, nunca el de mañana.
  const fromReminder = latestMenuSeed([scheduled, yesterday], today);
  assert.equal(fromReminder.localFecha, undefined);
  assert.equal(fromReminder.localLive, undefined);
});
