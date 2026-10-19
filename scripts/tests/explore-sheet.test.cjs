/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Execute the actual hook/screen. Native animations deliberately finish later
// (even after cancellation), so a stale completion can expose a UI race.
function fixture(overrides = {}) {
  const slots = []; const effects = []; const animations = [];
  let cursor = 0; let dirty = false; let unmounted = false; let writesAfterUnmount = 0;
  const changed = (a, b) => !a || !b || a.length !== b.length || b.some((value, i) => !Object.is(value, a[i]));
  const react = {
    useState(initial) {
      const i = cursor++;
      slots[i] ??= { value: typeof initial === 'function' ? initial() : initial };
      return [slots[i].value, (update) => {
        if (unmounted) { writesAfterUnmount++; return; }
        const next = typeof update === 'function' ? update(slots[i].value) : update;
        if (!Object.is(next, slots[i].value)) { slots[i].value = next; dirty = true; }
      }];
    },
    useRef(initial) { const i = cursor++; slots[i] ??= { current: initial }; return slots[i]; },
    useMemo(fn, deps) { const i = cursor++; if (changed(slots[i]?.deps, deps)) slots[i] = { value: fn(), deps }; return slots[i].value; },
    useCallback(fn, deps) { return react.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const i = cursor++;
      if (changed(slots[i]?.deps, deps)) {
        const previous = slots[i];
        slots[i] = { deps, cleanup: previous?.cleanup };
        effects.push(() => { previous?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  react.useLayoutEffect = react.useEffect;
  class Value {
    constructor(value) { this.value = value; this.driver = null; this.active = null; }
    setValue(value) { this.value = value; }
    interpolate() { return this; }
    stopAnimation() { this.active?.stop(); }
  }
  const animate = (kind) => (value, config) => {
    if (value.driver !== null) assert.equal(config.useNativeDriver, value.driver, 'An animated value must keep its driver');
    value.driver = config.useNativeDriver;
    const animation = {
      kind, value, config, stopped: false,
      start(callback) { this.callback = callback; value.active = this; animations.push(this); },
      stop() { this.stopped = true; },
      finish(finished = true) { if (finished) value.value = config.toValue; this.callback?.({ finished }); },
    };
    return animation;
  };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const mocks = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': {
      Animated: { Value, timing: animate('timing'), spring: animate('spring'), add: () => 0, View: 'Animated.View', loop: () => ({ start() {}, stop() {} }) },
      PanResponder: { create: (handlers) => ({ panHandlers: handlers }) },
      Keyboard: { dismiss() {} }, Easing: { quad: (v) => v, out: (v) => v },
      StyleSheet: { create: (v) => v, hairlineWidth: 0.5, absoluteFillObject: {} },
      useWindowDimensions: () => ({ height: 844, width: 390, fontScale: 1 }),
      View: 'View', Text: 'Text', ScrollView: 'ScrollView', TouchableOpacity: 'TouchableOpacity',
    },
    'expo-haptics': { impactAsync: async () => {}, selectionAsync: async () => {}, ImpactFeedbackStyle: { Light: 'light' } },
    ...overrides,
  };
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} }; cache.set(file, module);
    const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8'), {
      compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', '__DEV__', output)((id) => {
      if (Object.hasOwn(mocks, id)) return mocks[id];
      if (id.startsWith('@/')) return load(`${id.slice(2)}.ts`);
      throw new Error(`Unexpected dependency: ${id}`);
    }, module, module.exports, false);
    return module.exports;
  }
  return {
    load, animations,
    render(component, props) {
      let result; let passes = 0;
      do {
        assert.ok(++passes < 20, 'Effects must settle without a render loop');
        dirty = false; cursor = 0; result = component(props);
        effects.splice(0).forEach((effect) => effect());
      } while (dirty);
      return result;
    },
    unmount() { unmounted = true; slots.forEach((slot) => slot?.cleanup?.()); },
    get writesAfterUnmount() { return writesAfterUnmount; },
  };
}

function sheetFixture() {
  let closes = 0; let reveals = 0;
  const f = fixture();
  const hook = f.load('lib/use-explore-sheet.ts').useExploreSheet;
  const options = {
    isFiltering: true, sheetMode: null, searchActive: true, keyboardVisible: false,
    windowHeight: 844, mediumGap: 400, emptyResults: false,
    closeSheet: () => { closes++; options.sheetMode = null; options.searchActive = false; },
    revealNavigation: () => { reveals++; },
  };
  return { ...f, options, render: () => f.render(hook, options), get closes() { return closes; }, get reveals() { return reveals; }, get writesAfterUnmount() { return f.writesAfterUnmount; } };
}

function swipe(sheet, dy = 100, vy = 1) {
  const handler = sheet.sheetPanResponder.panHandlers;
  handler.onPanResponderGrant();
  handler.onPanResponderMove(null, { dx: 0, dy, vy });
  handler.onPanResponderRelease(null, { dx: 0, dy, vy });
}

test('swiping mole results restores navigation, preserves search and runs exactly one exit', () => {
  const f = sheetFixture(); let sheet = f.render();
  assert.equal(sheet.showNavigation, false);
  sheet.sheetVisibleHeightRef.current = 320;
  const before = f.animations.length;
  swipe(sheet); sheet = f.render();
  assert.equal(sheet.showSheet, false);
  assert.equal(sheet.showNavigation, true);
  assert.equal(sheet.sheetView.mounted, true, 'Native removal waits for the exit');
  assert.equal(f.closes, 0, 'Hiding results must not clear the controller query or pins');
  assert.ok(f.reveals > 0);
  const exits = f.animations.slice(before).filter((a) => a.kind === 'timing');
  assert.equal(exits.length, 1);
  assert.equal(exits[0].config.toValue, 320);
  exits[0].finish(); sheet = f.render();
  assert.equal(sheet.sheetView.mounted, false);
  assert.equal(sheet.showNavigation, true);
  assert.equal(f.animations.slice(before).filter((a) => a.kind === 'timing').length, 1);
});

test('reopening the same search rejects an old exit completion and restores results', () => {
  const f = sheetFixture(); let sheet = f.render();
  swipe(sheet); sheet = f.render();
  const exit = f.animations.findLast((a) => a.kind === 'timing');
  sheet.reopenSheet(); sheet = f.render();
  assert.equal(exit.stopped, true);
  assert.equal(sheet.showSheet, true);
  assert.equal(sheet.showNavigation, false);
  exit.finish(true); sheet = f.render();
  assert.equal(sheet.sheetView.mounted, true, 'Delayed old completion cannot remove a reopened list');
  assert.equal(f.closes, 0);
});

test('a swipe and immediate resubmit before React renders cannot leave the list hidden', () => {
  const f = sheetFixture(); let sheet = f.render();
  swipe(sheet);
  sheet.reopenSheet(); sheet = f.render();
  assert.equal(sheet.showSheet, true);
  assert.equal(sheet.showNavigation, false);
  assert.equal(sheet.sheetView.mounted, true);
  assert.equal(f.animations.filter((a) => a.kind === 'timing').length, 0);
});

test('stable gesture handlers use the current search mode and current detent geometry', () => {
  const f = sheetFixture();
  f.options.isFiltering = false; f.options.sheetMode = 'nearby'; f.options.searchActive = false;
  const first = f.render();
  f.options.isFiltering = true; f.options.sheetMode = null; f.options.searchActive = true; f.options.mediumGap = 500;
  let sheet = f.render();
  assert.equal(sheet.sheetPanResponder, first.sheetPanResponder);
  swipe(first); sheet = f.render();
  assert.equal(sheet.showSheet, false);
  assert.equal(sheet.showNavigation, true);
  assert.equal(f.closes, 0, 'The responder must use the new search, not its original nearby mode');
});

test('an expanded sheet survives geometry updates; closing prevents further resize animation', () => {
  const f = sheetFixture(); let sheet = f.render();
  sheet.activateSheetHandle(); sheet = f.render();
  assert.equal(sheet.sheetDetent, 'large');
  f.options.mediumGap = 450; sheet = f.render();
  assert.equal(sheet.sheetDetent, 'large');
  assert.equal(f.animations.findLast((a) => a.value === sheet.sheetTopExtra).config.toValue, 0);
  sheet.dismissSheet(); sheet = f.render();
  const count = f.animations.length;
  f.options.mediumGap = 470; f.render();
  assert.equal(f.animations.length, count, 'Hidden results must not restart their layout animation');
});

test('unmounting during dismissal cancels animations and ignores late native completions', () => {
  const f = sheetFixture(); let sheet = f.render();
  sheet.dismissSheet(); sheet = f.render();
  const exit = f.animations.findLast((a) => a.kind === 'timing');
  f.unmount();
  assert.equal(exit.stopped, true);
  exit.finish(true);
  assert.equal(f.writesAfterUnmount, 0);
});

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}

test('the real map screen restores its tabs after swipe and reopens results on submit/focus', () => {
  const patios = [{ id: 'mole-place', name: 'Cocina del Barrio', categories: ['Fondita'], latitude: 19.4, longitude: -99.2 }];
  const initialRegion = { latitude: 19.4, longitude: -99.2, latitudeDelta: 0.012, longitudeDelta: 0.012 };
  const controller = {
    activeSavedCategories: [], aiMode: false, aiNote: '', allPatios: patios, savedIds: [], mapFilteredPatios: patios,
    searchActive: true, query: 'mole', isFiltering: true, searchPending: false, initialLoading: false,
    sheetMode: null, topMatchPerPatio: [{ patio: patios[0], item: { name: 'Mole' } }], visiblePatios: patios, idleMode: false, searchInputRef: { current: null },
    closeSheet() { throw new Error('Search swipe must preserve mole'); }, closeSearch() {}, clearSavedMapFilter() {},
    distanceLabelForPatio() {}, handleQueryChange(text) { controller.query = text; }, handleSubmitSearch() {}, searchFor() {}, openSearch() {}, setAiMode() {}, setVisibleRegion() {},
  };
  const filters = {}; const filterContext = { filters, setFilters() {} };
  const tabScroll = { onScroll() {}, reveal() {} };
  const components = Object.fromEntries(['PatioIdentityIcon', 'PatioCardInfo', 'FoodieLoading', 'BottomTabBar', 'SearchField'].map((name) => [name, name]));
  const f = fixture({
    'expo-router': { router: { push() {} }, Stack: { Screen: 'Stack.Screen' }, useLocalSearchParams: () => ({}) },
    'react-native-maps': { __esModule: true, default: 'MapView', Marker: 'Marker' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 44, bottom: 34 }) },
    'expo-blur': { BlurView: 'BlurView' }, 'expo-linear-gradient': { LinearGradient: 'LinearGradient' }, '@expo/vector-icons': { Ionicons: 'Icon' },
    '@/components/place-icon': { PlaceIcon: 'Icon' },
    '@/lib/controllers/useFoodieExploreController': { FOODIE_INITIAL_REGION: initialRegion, useFoodieExploreController: () => controller },
    '@/lib/theme': { Radius: { sheet: 28 }, Fonts: { brand: 'brand' }, useTheme: () => ({ theme: { accent: '#F2612F', isDark: false } }) },
    '@/lib/map-style': { MAP_STYLE_DARK: [], MAP_STYLE_LIGHT: [] },
    '@/components/patio-identity-icon': components, '@/components/patio-card-info': components, '@/components/foodie-loading': components,
    '@/components/bottom-tab-bar': components, '@/components/search-field': components,
    '@/components/foodie-filter-bar': { FoodieFilterBar: 'FoodieFilterBar', matchesFoodieFilters: () => true },
    '@/lib/foodie-filters-context': { useFoodieFilters: () => filterContext },
    '@/lib/tab-bar-visibility': { useTabBarScroll: () => tabScroll },
    '@/lib/use-sheet-keyboard': { useSheetKeyboard: () => ({ keyboardInset: 0, keyboardVisible: false }) },
    '@/lib/use-map-location': { useMapLocation: () => ({ centerOnLocation() {}, cancelLocation() {}, locating: false, location: null }) },
    '@/lib/use-scroll-edges': { useScrollEdges: () => ({ onLayout() {}, onContentSizeChange() {}, onScroll() {} }) },
    '@/lib/recent-patios': { recordRecentPatio: async () => {} },
    '@/lib/patio-card-info': { patioCardAccessibilityLabel: (patio) => `Abrir ${patio.name}` },
    '@/lib/collections': { getCollections: async () => [] },
    '@/lib/typography': { noWidow: (v) => v },
  });
  const screen = f.load('app/explorar.tsx').default;
  let tree = f.render(screen); let items = nodes(tree);
  assert.ok(!items.some((n) => n.type === 'BottomTabBar'));
  const header = items.find((n) => n.props.accessibilityLabel === 'Expandir resultados');
  swipe({ sheetPanResponder: { panHandlers: header.props } }, 600);
  tree = f.render(screen); items = nodes(tree);
  assert.equal(controller.query, 'mole');
  assert.equal(controller.isFiltering, true);
  assert.ok(items.some((n) => n.type === 'BottomTabBar'));
  const closingLayer = items.find((n) => n.type === 'Animated.View' && n.props.style?.transform);
  assert.equal(closingLayer.props.pointerEvents, 'none', 'The closing overlay must not swallow navigation touches');
  items.find((n) => n.type === 'SearchField').props.onSubmitEditing();
  tree = f.render(screen); items = nodes(tree);
  assert.ok(!items.some((n) => n.type === 'BottomTabBar'));
  assert.ok(items.some((n) => n.props.accessibilityLabel === 'Expandir resultados'));
  items.find((n) => n.props.accessibilityLabel === 'Expandir resultados').props.onAccessibilityEscape();
  f.render(screen);
  items.find((n) => n.type === 'SearchField').props.onFocus();
  tree = f.render(screen);
  assert.ok(!nodes(tree).some((n) => n.type === 'BottomTabBar'));
  f.unmount();
});
