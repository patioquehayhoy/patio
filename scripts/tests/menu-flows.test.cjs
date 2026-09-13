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

test('successful remote publication survives optional local-cache and learning failures', async () => {
  const f = publicationFixture({ storageFail: true, correctionError: true });
  const store = f.load('lib/menu-store.ts');
  store.setMenuExtractionSnapshot({ menu: menu(), warnings: [] });
  await f.publish(menu(), { source: 'foto' });
  assert.deepEqual(f.calls, ['remote', 'notification', 'correction']);
  assert.equal(store.getMenuData().secciones[0].platillos[0].nombre, 'Mole con pollo');
  assert.equal(store.getMenuExtractionSnapshot(), null);
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
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: { from: (table) => queryBuilder({ data: table === 'cartas' ? [{ fondita_id: 'one', secciones: menu('Pozole viejo') }] : [] }) } } } });
  const { searchLiveMenus } = f.load('lib/menu.ts');
  assert.deepEqual(await searchLiveMenus('Pozole viejo', [patio]), []);
});

test('public menu loading tolerates malformed sections and falls back to permanent menu', async () => {
  const f = fixture({ overrides: { '@/lib/supabase': { supabase: { from: (table) => queryBuilder({ data: { secciones: table === 'menus' ? { secciones: [null, { nombre: 'Broken' }] } : menu() } }) } } } });
  const { fetchMenuForFondita } = f.load('lib/menu.ts');
  const sections = await fetchMenuForFondita('business-id');
  assert.equal(sections[0].items[0].name, 'Mole con pollo');
  assert.equal(sections[0].price, '$120');
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

function photoFixture({ vision, picker } = {}) {
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
  return { ...f, alerts, runtime, render: () => runtime.render(() => useFotoMenuController()) };
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
