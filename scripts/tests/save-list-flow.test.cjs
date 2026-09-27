/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const COLLECTIONS_KEY = 'patio:collections:v1';
const initialCollections = [
  { id: 'a', title: 'Cerca', patioIds: ['shared', 'only-a'] },
  { id: 'b', title: 'Comida', patioIds: ['shared', 'only-b'] },
  { id: 'c', title: 'Fin de semana', patioIds: ['shared'] },
].map((item) => ({ ...item, description: '', visibility: 'private', createdAt: '2026-09-19' }));

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}

// Native drawing/animation is a boundary. Handlers, move-scope validation,
// storage serialization and membership updates run from the actual modules.
function fixture({ patioIds = ['shared'], sourceCollectionIds = [] } = {}) {
  const slots = [];
  const effects = [];
  const layoutEffects = [];
  let cursor = 0;
  let dirty = false;
  const changed = (before, after) => !before || !after || before.length !== after.length || after.some((item, i) => !Object.is(item, before[i]));
  const effectHook = (queue) => (effect, deps) => {
    const index = cursor++;
    if (!slots[index] || changed(slots[index].deps, deps)) {
      const previous = slots[index];
      slots[index] = { deps, cleanup: previous?.cleanup };
      queue.push(() => { previous?.cleanup?.(); slots[index].cleanup = effect(); });
    }
  };
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) {
        const slot = { value: typeof initial === 'function' ? initial() : initial };
        slot.set = (next) => {
          const value = typeof next === 'function' ? next(slot.value) : next;
          if (!Object.is(value, slot.value)) { slot.value = value; dirty = true; }
        };
        slots[index] = slot;
      }
      return [slots[index].value, slots[index].set];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback(callback, deps) {
      const index = cursor++;
      if (!slots[index] || changed(slots[index].deps, deps)) slots[index] = { deps, callback };
      return slots[index].callback;
    },
    useEffect: effectHook(effects),
    useLayoutEffect: effectHook(layoutEffects),
  };
  const storage = new Map([[COLLECTIONS_KEY, JSON.stringify(initialCollections)], ['favorites-sentinel', '["shared"]']]);
  const events = [];
  const alerts = [];
  let writeAttempts = 0;
  let committedWrites = 0;
  let failNextWrite = false;
  let writeGate = null;
  const animate = () => ({ start: (done) => done?.({ finished: true }) });
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const mocks = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': {
      ...Object.fromEntries(['Modal', 'View', 'Text', 'TextInput', 'ScrollView', 'TouchableOpacity', 'TouchableWithoutFeedback'].map((name) => [name, name])),
      Dimensions: { get: () => ({ width: 390, height: 844 }) },
      useWindowDimensions: () => ({ width: 390, height: 844, fontScale: 1 }),
      StyleSheet: { create: (styles) => styles, hairlineWidth: 0.5, absoluteFillObject: {} },
      Keyboard: { dismiss() {} },
      Alert: { alert: (...args) => alerts.push(args) },
      PanResponder: { create: () => ({ panHandlers: {} }) },
      Animated: {
        Value: class { setValue() {} stopAnimation() {} interpolate() { return 1; } },
        View: 'Animated.View', spring: animate, timing: animate,
      },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-blur': { BlurView: 'BlurView' },
    'expo-haptics': {
      selectionAsync: async () => {}, impactAsync: async () => {}, notificationAsync: async () => {},
      ImpactFeedbackStyle: { Light: 'light' }, NotificationFeedbackType: { Success: 'success' },
    },
    '@react-native-async-storage/async-storage': {
      getItem: async (key) => storage.get(key) ?? null,
      setItem: async (key, value) => {
        writeAttempts++;
        if (writeGate) await writeGate;
        if (failNextWrite) { failNextWrite = false; throw new Error('Storage unavailable'); }
        storage.set(key, value);
        committedWrites++;
      },
    },
    '@/lib/supabase': {},
    '@/lib/favorites': {},
    '@/lib/recent-patios': {},
    '@/lib/use-sheet-keyboard': { useSheetKeyboard: () => ({ viewportHeight: 844, keyboardInset: 0, keyboardVisible: false }) },
    '@/lib/theme': { useTheme: () => ({ theme: { isDark: false, text: '#111', accent: '#f60', border: '#eee' } }) },
    '@/lib/typography': { noWidow: (value) => value },
    '@/components/scroll-edge-fade': { ScrollEdgeFade: 'ScrollEdgeFade' },
    '@/lib/use-scroll-edges': { useScrollEdges: () => ({ top: false, bottom: false, onScroll() {}, onLayout() {}, onContentSizeChange() {} }) },
  };
  const cache = new Map();
  const load = (file) => {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const output = ts.transpileModule(fs.readFileSync(path.resolve(root, file), 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', output)((id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith('@/lib/')) return load(`${id.slice(2)}.ts`);
      throw new Error(`Unexpected import: ${id}`);
    }, module, module.exports);
    return module.exports;
  };
  const { SaveToListSheet } = load('components/save-to-list-sheet.tsx');
  const props = {
    visible: true, mode: 'move', patioIds, patioName: '', sourceCollectionIds,
    onChanged: () => events.push('changed'),
    onDismiss: () => { events.push('dismissed'); props.visible = false; },
    onMoved: () => events.push('moved'),
  };
  let tree;
  const render = () => {
    let renders = 0;
    do {
      dirty = false;
      cursor = 0;
      tree = SaveToListSheet(props);
      layoutEffects.splice(0).forEach((effect) => effect());
      effects.splice(0).forEach((effect) => effect());
      if (++renders > 15) throw new Error('Fixture render did not settle');
    } while (dirty);
  };
  return {
    render,
    async settle() { await new Promise(setImmediate); render(); },
    control: (label) => nodes(tree).find((node) => node.props?.accessibilityLabel === label),
    row: (title) => nodes(tree).find((node) => ['checkbox', 'radio'].includes(node.props?.accessibilityRole) && node.props.accessibilityLabel.startsWith(`${title},`)),
    title: () => nodes(tree).find((node) => node.props?.accessibilityRole === 'header').props.children,
    stored: () => JSON.parse(storage.get(COLLECTIONS_KEY)),
    get writeAttempts() { return writeAttempts; },
    get committedWrites() { return committedWrites; },
    failWrite() { failNextWrite = true; },
    holdWrite() {
      let release;
      writeGate = new Promise((resolve) => { release = resolve; });
      return () => { writeGate = null; release(); };
    },
    events, alerts, storage,
  };
}

test('moving from Todos requires explicit sources covering every selected place before continuing', async () => {
  const f = fixture({ patioIds: ['only-a', 'only-b'] });
  f.render(); await f.settle();
  assert.equal(f.title(), 'Origen');
  assert.equal(f.control('Continuar al destino').props.disabled, true);
  assert.equal(f.row('Fin de semana'), undefined, 'Lists without selected places are not source candidates');
  f.row('Cerca').props.onPress(); f.render();
  assert.equal(f.row('Cerca').props.accessibilityRole, 'checkbox');
  assert.equal(f.control('Continuar al destino').props.disabled, true, 'One source only covers part of the selection');
  f.row('Comida').props.onPress(); f.render();
  assert.equal(f.control('Continuar al destino').props.disabled, false);
  f.control('Continuar al destino').props.onPress(); f.render();
  assert.equal(f.title(), 'Destino');
  assert.equal(f.row('Cerca'), undefined);
  assert.equal(f.row('Comida'), undefined);
  assert.equal(f.control('Mover lugares').props.disabled, true);
  f.row('Fin de semana').props.onPress(); f.render();
  assert.equal(f.control('Mover lugares').props.disabled, false);
  assert.equal(f.writeAttempts, 0, 'Choosing a destination does not mutate membership');
  f.control('Volver a origen').props.onPress(); f.render();
  assert.equal(f.row('Cerca').props.accessibilityState.checked, true);
  assert.equal(f.row('Comida').props.accessibilityState.checked, true);
  f.control('Continuar al destino').props.onPress(); f.render();
  assert.equal(f.control('Mover lugares').props.disabled, true, 'Returning clears the previous destination');
  f.control('Cerrar').props.onPress();
  assert.deepEqual(f.events, ['dismissed'], 'Cancellation never reports a completed move');
  assert.equal(f.writeAttempts, 0);
});

test('B remains a destination for a shared place and double confirmation removes only chosen source A', async () => {
  const f = fixture();
  f.render(); await f.settle();
  f.row('Cerca').props.onPress(); f.render();
  f.control('Continuar al destino').props.onPress(); f.render();
  assert.equal(f.row('Comida').props.accessibilityRole, 'radio');
  f.row('Comida').props.onPress(); f.render();
  assert.equal(f.writeAttempts, 0);
  const release = f.holdWrite();
  const confirm = f.control('Mover lugares').props.onPress;
  confirm(); confirm();
  await f.settle();
  assert.equal(f.control('Mover lugares').props.accessibilityState.busy, true);
  assert.equal(f.writeAttempts, 1);
  f.control('Cerrar').props.onPress();
  assert.deepEqual(f.events, [], 'A pending write cannot dismiss the sheet');
  release(); await f.settle();
  assert.equal(f.committedWrites, 1);
  assert.deepEqual(f.stored().find((item) => item.id === 'a').patioIds, ['only-a']);
  assert.deepEqual(f.stored().find((item) => item.id === 'b').patioIds, ['shared', 'only-b']);
  assert.deepEqual(f.stored().find((item) => item.id === 'c').patioIds, ['shared']);
  assert.equal(f.storage.get('favorites-sentinel'), '["shared"]');
  assert.deepEqual(f.events, ['changed', 'dismissed', 'moved']);
});

test('a failed move retains the selected destination and retries without premature dismissal or success', async () => {
  const f = fixture({ sourceCollectionIds: ['a'] });
  f.render(); await f.settle();
  assert.equal(f.title(), 'Destino', 'An explicit active source skips source selection');
  f.row('Comida').props.onPress(); f.render();
  f.failWrite();
  f.control('Mover lugares').props.onPress(); await f.settle();
  assert.equal(f.alerts.length, 1);
  assert.equal(f.committedWrites, 0);
  assert.deepEqual(f.events, []);
  assert.equal(f.row('Comida').props.accessibilityState.checked, true);
  assert.equal(f.control('Mover lugares').props.disabled, false);
  assert.equal(f.control('Mover lugares').props.accessibilityState.busy, false);
  assert.deepEqual(f.stored().find((item) => item.id === 'a').patioIds, ['shared', 'only-a']);
  f.control('Mover lugares').props.onPress(); await f.settle();
  assert.equal(f.writeAttempts, 2);
  assert.equal(f.committedWrites, 1);
  assert.deepEqual(f.events, ['changed', 'dismissed', 'moved']);
});
