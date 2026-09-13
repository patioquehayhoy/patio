/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Run the screen's real event handlers with isolated native and network APIs.
// Assertions inspect user-visible state, returned routes and failed mutations.
function screenFixture(kind, { signedIn = true, failRead = false, missing = false, failWrite = false } = {}) {
  const id = 'target-id';
  const slots = [];
  let cursor = 0;
  let focus;
  let subject;
  const routes = [];
  const alerts = [];
  const writes = [];
  const currentUser = signedIn ? { id: 'current-user', is_anonymous: false } : null;
  const react = {
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
  };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const theme = { bg: 'white', text: 'black', textSecondary: 'gray', textMute: 'gray', accent: 'orange', surface: 'white', border: 'gray' };
  const supabase = {
    auth: { getUser: async () => ({ data: { user: currentUser }, error: null }) },
    from(table) {
      let mode = 'read';
      const query = {};
      for (const method of ['select', 'eq', 'order', 'maybeSingle']) query[method] = () => query;
      query.upsert = (payload) => { mode = 'write'; writes.push([table, payload]); return query; };
      query.delete = () => { mode = 'write'; writes.push([table, 'delete']); return query; };
      query.then = (resolve, reject) => {
        if (mode === 'write') return Promise.resolve({ error: failWrite ? new Error('Offline') : null }).then(resolve, reject);
        let data = null;
        if (table === 'user_profiles' && !missing) data = { user_id: id, display_name: 'Vecino', bio: '' };
        if (table === 'collections') data = kind === 'profile' ? [] : missing ? null : { id, owner_id: 'author-id', title: 'Lista local', description: '' };
        if (table === 'collection_places') data = [];
        return Promise.resolve({ data, count: 0, error: failRead ? new Error('Network failed') : null }).then(resolve, reject);
      };
      return query;
    },
  };
  const native = Object.fromEntries(['ActivityIndicator', 'Image', 'ScrollView', 'Text', 'TouchableOpacity', 'View'].map((name) => [name, name]));
  const mocks = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': { ...native, Alert: { alert: (...args) => alerts.push(args) }, Share: { share: async () => {} }, StyleSheet: { create: (style) => style, hairlineWidth: 0.5 } },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0, bottom: 0 }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-router': { useLocalSearchParams: () => ({ id }), useFocusEffect: (callback) => { focus = callback; }, Stack: { Screen: 'Screen' }, router: { push: (route) => routes.push(route), canGoBack: () => false, replace: (route) => routes.push(route) } },
    '@/lib/supabase': { supabase },
    '@/lib/theme': { Fonts: {}, useTheme: () => ({ theme }) },
    '@/lib/typography': { noWidow: (value) => value },
    '@/components/content-safety-menu': { ContentSafetyMenu: 'ContentSafetyMenu' },
  };
  const filename = path.resolve(__dirname, '../../app', kind === 'profile' ? 'foodie/[id].tsx' : 'coleccion-publica/[id].tsx');
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)((id) => {
    if (!Object.hasOwn(mocks, id)) throw new Error(`Unexpected import ${id}`);
    return mocks[id];
  }, module, module.exports);
  const render = () => { cursor = 0; subject = module.exports.default(); return subject; };
  const nodes = (node = subject) => {
    if (Array.isArray(node)) return node.flatMap((child) => nodes(child));
    if (!node || typeof node !== 'object') return [];
    return [node, ...nodes(node.props?.children ?? null)];
  };
  const text = (node = subject) => {
    if (Array.isArray(node)) return node.map((child) => text(child)).join(' ');
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    return node?.props ? text(node.props.children ?? null) : '';
  };
  return {
    alerts, routes, writes, render, nodes, text,
    async mount() { render(); focus(); await new Promise(setImmediate); render(); },
    action() { return nodes().find((node) => node.type === 'TouchableOpacity' && node.props.accessibilityState?.selected !== undefined); },
  };
}

for (const kind of ['profile', 'collection']) {
  test(`${kind}: failed reads expose retry and hide follow/save controls`, async () => {
    const screen = screenFixture(kind, { failRead: true });
    await screen.mount();
    assert.match(screen.text(), /No pudimos cargar/);
    assert.match(screen.text(), /Intentar de nuevo/);
    assert.equal(screen.action(), undefined);
  });

  test(`${kind}: unavailable content has a useful empty state and no safety/save controls`, async () => {
    const screen = screenFixture(kind, { missing: true });
    await screen.mount();
    assert.match(screen.text(), /no está disponible/);
    assert.equal(screen.action(), undefined);
    assert.ok(!screen.nodes().some((node) => node.type === 'ContentSafetyMenu'));
  });

  test(`${kind}: failed follow/save never displays success`, async () => {
    const screen = screenFixture(kind, { failWrite: true });
    await screen.mount();
    await screen.action().props.onPress();
    screen.render();
    assert.equal(screen.writes.length, 1);
    assert.equal(screen.action().props.accessibilityState.selected, false);
    assert.equal(screen.alerts.length, 1);
  });

  test(`${kind}: signed-out action opens login with the exact return route`, async () => {
    const screen = screenFixture(kind, { signedIn: false });
    await screen.mount();
    await screen.action().props.onPress();
    assert.equal(screen.writes.length, 0);
    assert.deepEqual(screen.routes[0], { pathname: '/comunidad-acceso', params: { returnTo: `/${kind === 'profile' ? 'foodie' : 'coleccion-publica'}/target-id` } });
  });

  test(`${kind}: confirmed blocking immediately clears displayed content`, async () => {
    const screen = screenFixture(kind);
    await screen.mount();
    const control = screen.nodes().find((node) => node.type === 'ContentSafetyMenu');
    assert.equal(control.props.targetType, kind);
    control.props.onBlocked();
    screen.render();
    assert.match(screen.text(), /no está disponible/);
    assert.equal(screen.action(), undefined);
  });
}
