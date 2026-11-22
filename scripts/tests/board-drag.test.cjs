/* global __dirname */
// Arrastrar para ordenar (components/board-drag.tsx): nada se queda flotando
// ni «pegado» (2026-11-21). Corre el hook real con gestos y animaciones falsos.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');

function harness({ onMoveDish = () => {} } = {}) {
  const slots = [];
  const effects = [];
  let cursor = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useCallback: (fn) => fn,
    useEffect(fn, deps) {
      const index = cursor++;
      if (!slots[index] || !deps || deps.some((item, i) => !Object.is(item, slots[index].deps[i]))) {
        effects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps: deps ?? [], cleanup: fn() }; });
      }
    },
  };
  const pans = [];
  const makePan = () => {
    const pan = { handlers: {} };
    for (const name of ['minDistance', 'activateAfterLongPress', 'blocksExternalGesture', 'runOnJS', 'enabled']) pan[name] = () => pan;
    for (const name of ['onStart', 'onUpdate', 'onEnd', 'onFinalize', 'onTouchesUp', 'onTouchesCancelled']) pan[name] = (cb) => { pan.handlers[name] = cb; return pan; };
    pans.push(pan);
    return pan;
  };
  let spring = null;
  let clock = 1000;
  class TestDate extends Date { static now() { return clock; } }
  const mocks = {
    react,
    'expo-haptics': { selectionAsync: async () => {}, impactAsync: async () => {}, ImpactFeedbackStyle: { Light: 'l', Medium: 'm' } },
    'react-native': {
      AppState: { addEventListener: () => ({ remove() {} }) },
      Dimensions: { get: () => ({ width: 390, height: 800 }) },
      LayoutAnimation: { configureNext() {}, create: () => ({}) },
    },
    'react-native-gesture-handler': { Gesture: { Pan: makePan } },
    'react-native-reanimated': {
      runOnJS: (fn) => fn,
      useAnimatedStyle: () => ({}),
      useReducedMotion: () => false,
      useSharedValue: (value) => react.useRef({ value }).current,
      withSpring: (to, _config, callback) => { spring = callback; return to; },
      withTiming: (to) => to,
    },
  };
  const file = path.join(root, 'components/board-drag.tsx');
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', '__DEV__', 'Date', output)((id) => {
    if (!(id in mocks)) throw new Error(`Missing mock: ${id}`);
    return mocks[id];
  }, module, module.exports, false, TestDate);

  const sections = [
    { id: 's1', platillos: [{ id: 'a' }, { id: 'b' }] },
    { id: 's2', platillos: [{ id: 'c' }] },
  ];
  const props = { sections, scrollRef: { current: null }, onMoveDish, onMoveSection: () => {} };
  const render = () => {
    cursor = 0;
    const api = module.exports.useBoardDrag(props);
    while (effects.length) effects.shift()();
    return api;
  };
  let api = render();
  const layout = (fn, id, y, height) => fn(id)({ nativeEvent: { layout: { y, height } } });
  layout(api.onSectionLayout, 's1', 0, 300);
  layout(api.onHeaderLayout, 's1', 0, 60);
  layout(api.onDishLayout, 'a', 60, 80);
  layout(api.onDishLayout, 'b', 140, 80);
  layout(api.onSectionLayout, 's2', 320, 200);
  layout(api.onHeaderLayout, 's2', 0, 60);
  layout(api.onDishLayout, 'c', 60, 80);
  const row = (dishId, sectionId) => {
    api = render();
    api.rowFor({ kind: 'dish', dishId, sectionId }, 500);
    return pans[pans.length - 1].handlers;
  };
  return {
    row,
    get api() { api = render(); return api; },
    settle: () => { const callback = spring; spring = null; callback?.(true); },
    setClock: (value) => { clock = value; },
  };
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

test('a dish lifted, moved and released lands in its new place and nothing stays lifted', () => {
  const moves = [];
  const h = harness({ onMoveDish: (...args) => moves.push(args) });
  const gesture = h.row('a', 's1');
  gesture.onStart({ absoluteY: 100 });
  assert.deepEqual(h.api.drag, { kind: 'dish', dishId: 'a', sectionId: 's1' });
  gesture.onUpdate({ absoluteY: 260 });
  gesture.onEnd({ velocityY: 0 }, true);
  h.settle();
  assert.equal(h.api.drag, null);
  assert.deepEqual(moves, [['a', 's1', 1]]);
});

test('if the finger leaves the screen and the gesture never says it ended, it still lands', async () => {
  const moves = [];
  const h = harness({ onMoveDish: (...args) => moves.push(args) });
  const gesture = h.row('a', 's1');
  gesture.onStart({ absoluteY: 100 });
  gesture.onUpdate({ absoluteY: 260 });
  gesture.onTouchesUp({ numberOfTouches: 0 });
  await wait(150);
  h.settle();
  assert.equal(h.api.drag, null);
  assert.deepEqual(moves, [['a', 's1', 1]]);
});

test('holding another dish while the last one settles lands the last one at once and lifts the new one', () => {
  const moves = [];
  const h = harness({ onMoveDish: (...args) => moves.push(args) });
  const first = h.row('a', 's1');
  first.onStart({ absoluteY: 100 });
  first.onUpdate({ absoluteY: 260 });
  first.onEnd({ velocityY: 0 }, true);
  const second = h.row('c', 's2');
  second.onStart({ absoluteY: 420 });
  assert.deepEqual(moves, [['a', 's1', 1]]);
  assert.deepEqual(h.api.drag, { kind: 'dish', dishId: 'c', sectionId: 's2' });
});

test('an error while moving never leaves the copy floating', () => {
  const h = harness({ onMoveDish: () => { throw new Error('boom'); } });
  const gesture = h.row('a', 's1');
  gesture.onStart({ absoluteY: 100 });
  gesture.onUpdate({ absoluteY: 260 });
  gesture.onEnd({ velocityY: 0 }, true);
  h.settle();
  assert.equal(h.api.drag, null);
});

test('an orphaned lift is released by the next touch, but a dish you are still moving is not', () => {
  const h = harness();
  const gesture = h.row('a', 's1');
  h.setClock(1000);
  gesture.onStart({ absoluteY: 100 });
  gesture.onUpdate({ absoluteY: 180 });
  h.setClock(1200);
  h.api.releaseIfOrphaned();
  assert.notEqual(h.api.drag, null);
  h.setClock(1700);
  h.api.releaseIfOrphaned();
  h.settle();
  assert.equal(h.api.drag, null);
});

test('another row (or a second finger) never drops or cancels the dish you are holding', () => {
  const moves = [];
  const h = harness({ onMoveDish: (...args) => moves.push(args) });
  const held = h.row('a', 's1');
  held.onStart({ absoluteY: 100 });
  held.onUpdate({ absoluteY: 260 });
  const other = h.row('c', 's2');
  other.onStart({ absoluteY: 420 });
  other.onUpdate({ absoluteY: 600 });
  other.onEnd({ velocityY: 0 }, false);
  other.onFinalize();
  other.onTouchesCancelled();
  other.onTouchesUp({ numberOfTouches: 0 });
  assert.deepEqual(h.api.drag, { kind: 'dish', dishId: 'a', sectionId: 's1' });
  held.onEnd({ velocityY: 0 }, true);
  h.settle();
  assert.equal(h.api.drag, null);
  assert.deepEqual(moves, [['a', 's1', 1]]);
});

test('a late finger-up never drops what you lifted after it', async () => {
  const h = harness();
  const gesture = h.row('a', 's1');
  gesture.onStart({ absoluteY: 100 });
  gesture.onTouchesUp({ numberOfTouches: 0 });
  gesture.onEnd({ velocityY: 0 }, true);
  gesture.onStart({ absoluteY: 100 });
  await wait(150);
  assert.deepEqual(h.api.drag, { kind: 'dish', dishId: 'a', sectionId: 's1' });
});

test('if the system cancels the touch, the dish goes back to where it was', () => {
  const moves = [];
  const h = harness({ onMoveDish: (...args) => moves.push(args) });
  const gesture = h.row('a', 's1');
  gesture.onStart({ absoluteY: 100 });
  gesture.onUpdate({ absoluteY: 260 });
  gesture.onTouchesCancelled();
  h.settle();
  assert.equal(h.api.drag, null);
  assert.deepEqual(moves, []);
});
