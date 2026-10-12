/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');
const key = 'patio:menu-collections:v1';
const nodes = (node) => Array.isArray(node) ? node.flatMap(nodes) : node && typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
function fixture(mode = 'assign', initial = []) {
  const slots = []; let cursor = 0; const effects = []; let dirty = false;
  const react = {
    useState(value) { const i = cursor++; if (!(i in slots)) slots[i] = typeof value === 'function' ? value() : value; return [slots[i], (next) => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; dirty = true; }]; },
    useRef(value) { const i = cursor++; if (!(i in slots)) slots[i] = { current: value }; return slots[i]; },
    useEffect(fn, deps) { const i = cursor++; if (!slots[i] || deps.some((item, j) => !Object.is(item, slots[i][j]))) { slots[i] = deps; effects.push(fn); } },
  };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const storage = new Map([[key, JSON.stringify(initial)]]); const alerts = []; const prompts = [];
  let writes = 0; let failWriteNumber = 0; let gate;
  const mocks = {
    react, 'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': { ...Object.fromEntries(['View', 'Text', 'TextInput', 'TouchableOpacity'].map((x) => [x, x])), Platform: { OS: 'android' }, Keyboard: { dismiss() {} }, StyleSheet: { create: (s) => s }, Alert: { alert: (...args) => alerts.push(args), prompt: (...args) => prompts.push(args) } },
    'expo-haptics': { selectionAsync: async () => {}, notificationAsync: async () => {}, NotificationFeedbackType: { Success: 'success' } },
    '@/components/library-sheet': { LibrarySheet: 'LibrarySheet' }, '@/components/library-list-row': { LibraryListRow: 'LibraryListRow' }, '@/components/rename-dialog': { RenameDialog: 'RenameDialog' },
    '@/lib/theme': { useTheme: () => ({ theme: {} }) }, '@/lib/typography': { noWidow: (s) => s },
    '@react-native-async-storage/async-storage': { getItem: async (k) => storage.get(k) ?? null, setItem: async (k, value) => { writes++; if (gate) await gate; if (writes === failWriteNumber) throw new Error('Disk full'); storage.set(k, value); } },
  };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
    new Function('require', 'module', 'exports', code)((id) => Object.hasOwn(mocks, id) ? mocks[id] : id.startsWith('@/lib/') ? load(`${id.slice(2)}.ts`) : id.startsWith('./') ? load(`${path.posix.join(path.posix.dirname(file), id)}.ts`) : (() => { throw new Error(`Unexpected ${id}`); })(), module, module.exports);
    return module.exports;
  }
  const events = []; const component = load('components/menu-lists-sheet.tsx').MenuListsSheet;
  const update = (item) => { props.collections = props.collections.some((c) => c.id === item.id) ? props.collections.map((c) => c.id === item.id ? item : c) : [item, ...props.collections]; };
  const props = { visible: true, mode, collections: initial, targetFechas: ['one', 'two'], sourceCollectionIds: [], selectedIds: [], onClose: () => events.push('closed'), onMoved: () => events.push('moved'), onCollectionCreated: update, onCollectionUpdated: update, onCollectionRemoved: (id) => { props.collections = props.collections.filter((c) => c.id !== id); }, onToggleFilter: (id) => events.push(['filter', id]) };
  let tree;
  function render() { let count = 0; do { dirty = false; cursor = 0; tree = component(props); effects.splice(0).forEach((fn) => fn()); if (++count > 10) throw new Error('Render loop'); } while (dirty); }
  return { props, load, render, async settle() { await new Promise(setImmediate); render(); }, panel: () => nodes(tree).find((n) => n.type === 'LibrarySheet'), row: (title) => nodes(tree).find((n) => n.type === 'LibraryListRow' && n.props.title === title), dialog: () => nodes(tree).find((n) => n.type === 'RenameDialog'), storage, events, alerts, prompts, stored: () => JSON.parse(storage.get(key)), failNextWrite: () => { failWriteNumber = writes + 1; }, failSecondWrite: () => { failWriteNumber = writes + 2; }, hold: () => { let release; gate = new Promise((r) => { release = r; }); return () => { gate = null; release(); }; }, get writes() { return writes; } };
}
const collection = (id, title, fechas) => ({ id, title, fechas, createdAt: '2026-10-09' });

test('menu membership distinguishes partial selection, retains failure, and retries the actual storage operation', async () => {
  const f = fixture('assign', [collection('a', 'Cerca', ['one', 'unrelated'])]); f.render();
  assert.equal(f.row('Cerca').props.checked, 'mixed');
  f.failNextWrite(); f.row('Cerca').props.onPress(); await f.settle();
  assert.deepEqual(f.stored()[0].fechas, ['one', 'unrelated']); assert.equal(f.alerts.length, 1);
  f.row('Cerca').props.onPress(); await f.settle();
  assert.deepEqual(f.stored()[0].fechas, ['one', 'unrelated', 'two']); assert.equal(f.row('Cerca').props.checked, true);
});

test('new menu list retries assignment without creating a duplicate after a partial failure', async () => {
  const f = fixture(); f.render(); f.panel().props.onCreate(); f.render();
  f.panel().props.editor.props.children[0].props.onChangeText('Especiales'); f.render();
  f.failSecondWrite(); f.panel().props.editor.props.children[1].props.onPress(); await f.settle();
  assert.equal(f.stored().length, 1); assert.deepEqual(f.stored()[0].fechas, []);
  const id = f.stored()[0].id;
  f.panel().props.editor.props.children[1].props.onPress(); await f.settle();
  assert.equal(f.stored().length, 1); assert.equal(f.stored()[0].id, id); assert.deepEqual(f.stored()[0].fechas, ['one', 'two']);
});

test('pending menu writes reject duplicate gestures and dismissal until they complete', async () => {
  const f = fixture('assign', [collection('a', 'Cerca', [])]); f.render();
  const release = f.hold(); f.row('Cerca').props.onPress(); f.row('Cerca').props.onPress();
  assert.equal(f.panel().props.onClose(), false); await new Promise(setImmediate); assert.equal(f.writes, 1);
  release(); await f.settle(); assert.deepEqual(f.stored()[0].fechas, ['one', 'two']); assert.deepEqual(f.events, []);
});

test('menu move from Todos requires sources covering every selected menu and preserves destination on failure', async () => {
  const f = fixture('move', [collection('a', 'A', ['one', 'keep-a']), collection('b', 'B', ['two', 'keep-b']), collection('c', 'C', ['keep-c'])]); f.render();
  const confirm = () => f.panel().props.footer.props.children;
  assert.equal(f.panel().props.title, 'Origen'); assert.equal(confirm().props.disabled, true);
  f.row('A').props.onPress(); f.render(); assert.equal(confirm().props.disabled, true);
  f.row('B').props.onPress(); f.render(); assert.equal(confirm().props.disabled, false);
  confirm().props.onPress(); f.render(); assert.equal(f.panel().props.title, 'Destino');
  f.row('C').props.onPress(); f.render(); f.failNextWrite(); confirm().props.onPress(); await f.settle();
  assert.equal(f.row('C').props.checked, true); assert.deepEqual(f.events, []); assert.deepEqual(f.stored()[0].fechas, ['one', 'keep-a']);
  confirm().props.onPress(); await f.settle(); assert.deepEqual(f.events, ['closed', 'moved']);
  assert.deepEqual(f.stored().map((c) => c.fechas), [['keep-a'], ['keep-b'], ['keep-c', 'one', 'two']]);
});

test('corrupt menu lists cannot be overwritten by create, rename, or move', async () => {
  const f = fixture(); f.storage.set(key, '{broken'); const m = f.load('lib/menu-collections.ts');
  for (const operation of [() => m.createMenuCollection('Nueva'), () => m.renameMenuCollection('a', 'Nueva'), () => m.moveMenusToCollection(['one'], ['a'], 'b')]) await assert.rejects(operation, /Tus datos se conservan/);
  assert.equal(f.storage.get(key), '{broken'); assert.equal(f.writes, 0);
});

test('moving a menu retains unchosen source memberships and rejects stale/missing destinations atomically', async () => {
  const f = fixture('move', [collection('a', 'A', ['one']), collection('b', 'B', ['one']), collection('c', 'C', [])]); const m = f.load('lib/menu-collections.ts');
  await assert.rejects(() => m.moveMenusToCollection(['one', 'missing'], ['a'], 'c')); assert.equal(f.writes, 0);
  await assert.rejects(() => m.moveMenusToCollection(['one'], ['a'], 'missing')); assert.equal(f.writes, 0);
  await m.moveMenusToCollection(['one'], ['a'], 'c'); assert.deepEqual(f.stored().map((c) => c.fechas), [[], ['one'], ['one']]);
});
