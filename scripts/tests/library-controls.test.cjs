/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Exercise the actual component handlers; native views and modal completion
// are boundaries, not a claim of physical-device rendering coverage.
function fixture(file, overrides = {}) {
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
    useMemo: (fn) => fn(),
    useEffect(fn, deps) {
      const index = cursor++;
      if (!slots[index] || deps.some((item, i) => !Object.is(item, slots[index].deps[i]))) {
        effects.push(() => { slots[index]?.cleanup?.(); slots[index] = { deps, cleanup: fn() }; });
      }
    },
  };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const animate = () => ({ start: (callback) => callback?.({ finished: true }) });
  const native = Object.fromEntries(['Modal', 'View', 'Text', 'TextInput', 'ScrollView', 'TouchableOpacity', 'TouchableWithoutFeedback', 'KeyboardAvoidingView'].map((name) => [name, name]));
  const mocks = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': {
      ...native, Platform: { OS: 'ios' },
      useWindowDimensions: () => ({ width: 320, height: 568, fontScale: 1 }),
      StyleSheet: { create: (value) => value, hairlineWidth: 0.5 },
      Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) },
      Animated: { Value: class { setValue() {} interpolate() { return 1; } }, View: 'Animated.View', timing: animate, spring: animate, parallel: animate },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-blur': { BlurView: 'BlurView' },
    'expo-haptics': { selectionAsync: async () => {} },
    '@/lib/collections': {},
    '@/lib/theme': { Radius: { card: 18 }, useTheme: () => ({ theme: { isDark: false, text: '#111', bg: '#fff', border: '#eee', accent: '#f60' } }) },
    '@/lib/typography': { noWidow: (value) => value },
    '@/components/search-field': { SearchField: 'SearchField' },
    '@/components/action-sheet': { ACTION_SHEET_MENU_WIDTH: 240, ActionSheet: 'ActionSheet' },
    ...overrides,
  };
  const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)((id) => {
    if (!Object.hasOwn(mocks, id)) throw new Error(`Unexpected import: ${id}`);
    return mocks[id];
  }, module, module.exports);
  return {
    exports: module.exports,
    render(component, props) {
      cursor = 0;
      const result = component(props);
      effects.splice(0).forEach((effect) => effect());
      return result;
    },
  };
}

function nodes(node) {
  if (Array.isArray(node)) return node.flatMap(nodes);
  if (!node || typeof node !== 'object') return [];
  return [node, ...nodes(node.props?.children)];
}

test('map and library expose Filters and Your lists directly and clear each scope independently', () => {
  const f = fixture('components/foodie-filter-bar.tsx');
  const { FoodieFilterBar, EMPTY_FOODIE_FILTERS, matchesFoodieFilters } = f.exports;
  let legacyCleared = false;
  const props = {
    filters: { ...EMPTY_FOODIE_FILTERS }, categories: ['Tacos'],
    collections: [{ id: 'a', title: 'Cerca', patioIds: ['one'] }, { id: 'b', title: 'Comida', patioIds: ['two'] }],
    onChange: (next) => { props.filters = next; },
    additionalFilter: { label: 'Tacos guardados', onClear: () => { legacyCleared = true; } },
  };
  let tree = f.render(FoodieFilterBar, props);
  const scopeButtons = () => nodes(tree).filter((node) => node.type === 'TouchableOpacity' && (/^Filtros/.test(node.props.accessibilityLabel ?? '') || /^Tus listas/.test(node.props.accessibilityLabel ?? '')));
  assert.deepEqual(scopeButtons().map((button) => button.props.accessibilityLabel), ['Filtros, 1 activos', 'Tus listas']);
  const panelOf = (value) => nodes(value).find((node) => typeof node.type === 'function' && node.type.name === 'FilterSheet');
  assert.equal(panelOf(tree).props.visible, false);
  scopeButtons()[0].props.onPress();
  tree = f.render(FoodieFilterBar, props);
  const panelType = panelOf(tree).type;
  assert.equal(panelOf(tree).props.visible, true);
  assert.equal(panelOf(tree).props.title, 'Filtros');
  for (const label of ['Menú de hoy', 'Abiertos ahora']) {
    nodes(tree).find((node) => node.props?.accessibilityLabel === label).props.onPress();
    tree = f.render(FoodieFilterBar, props);
    assert.equal(nodes(tree).find((node) => node.props?.accessibilityLabel === label).props.accessibilityState.checked, true);
  }
  scopeButtons()[1].props.onPress();
  tree = f.render(FoodieFilterBar, props);
  assert.equal(panelOf(tree).type, panelType);
  assert.equal(panelOf(tree).props.title, 'Tus listas');
  for (const label of ['Cerca', 'Comida']) {
    nodes(tree).find((node) => node.props?.accessibilityLabel === label).props.onPress();
    tree = f.render(FoodieFilterBar, props);
  }
  for (const patioId of ['one', 'two']) {
    assert.equal(matchesFoodieFilters(props.filters, { patioId, hasTodayMenu: true, isOpenNow: true, categories: [], payments: [], collections: props.collections }), true);
    assert.equal(matchesFoodieFilters(props.filters, { patioId, hasTodayMenu: true, isOpenNow: false, categories: [], payments: [], collections: props.collections }), false);
  }
  scopeButtons()[0].props.onPress();
  tree = f.render(FoodieFilterBar, props);
  panelOf(tree).props.onClear();
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, collectionIds: ['a', 'b'] });
  assert.equal(legacyCleared, true);
  tree = f.render(FoodieFilterBar, props);
  scopeButtons()[1].props.onPress();
  tree = f.render(FoodieFilterBar, props);
  panelOf(tree).props.onClear();
  assert.deepEqual(props.filters, EMPTY_FOODIE_FILTERS);
});

test('library keeps the two shared scope controls beside contextual view and ordering', () => {
  const f = fixture('components/foodie-filter-bar.tsx');
  const props = { filters: f.exports.EMPTY_FOODIE_FILTERS, onChange() {}, categories: [], collections: [], viewMode: 'list', onViewModeChange() {}, organizationOptions: [{ label: 'Alfabético A–Z', icon: 'text-outline', sectionLabel: 'Orden', selected: true, onPress() {} }] };
  let tree = f.render(f.exports.FoodieFilterBar, props);
  const buttons = nodes(tree).filter((node) => node.type === 'TouchableOpacity' && ['Filtros', 'Tus listas', 'Organizar Guardados'].includes(node.props.accessibilityLabel));
  assert.deepEqual(buttons.map((button) => button.props.accessibilityLabel), ['Filtros', 'Tus listas', 'Organizar Guardados']);
  buttons[2].props.onPress();
  tree = f.render(f.exports.FoodieFilterBar, props);
  const organizeMenu = nodes(tree).find((node) => node.type === 'ActionSheet');
  assert.deepEqual(organizeMenu.props.options.map((option) => option.sectionLabel).filter(Boolean), ['Vista', 'Orden']);
});

test('menu symbols render before labels and selection marks keep a leading slot', () => {
  const source = fs.readFileSync(path.resolve(__dirname, '../..', 'components/action-sheet.tsx'), 'utf8');
  const icon = source.indexOf('<Ionicons name={option.icon}');
  const label = source.indexOf('<Text style={s.rowText}>');
  assert.ok(icon > 0 && label > icon);
  assert.match(source, /selectionMark.*option\.selected/);
});

test('iOS opens a subsequent panel only after actual native menu dismissal, once', () => {
  const f = fixture('components/action-sheet.tsx');
  let opened = 0;
  const props = {
    visible: true, anchorRef: { current: { measureInWindow: (done) => done(240, 90, 60, 44) } },
    options: Array.from({ length: 12 }, (_, i) => ({ label: `Option ${i}`, sectionLabel: i === 0 ? 'Vista' : undefined, icon: 'list-outline', afterDismiss: true, onPress: () => { opened++; } })),
    onDismiss: () => { props.visible = false; },
  };
  f.render(f.exports.ActionSheet, props);
  let tree = f.render(f.exports.ActionSheet, props);
  const menu = nodes(tree).find((node) => node.type === 'Animated.View');
  const layout = menu.props.style[1];
  assert.ok(layout.top + layout.maxHeight <= 568 - 34);
  assert.ok(layout.left >= 8 && layout.left + layout.width <= 320 - 8);
  assert.ok(nodes(tree).some((node) => node.type === 'ScrollView'));
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Option 0').props.onPress();
  assert.equal(opened, 0);
  tree = f.render(f.exports.ActionSheet, props);
  assert.equal(tree.props.visible, false);
  tree.props.onDismiss();
  tree.props.onDismiss();
  assert.equal(opened, 1);
});

test('alphabetical sections preserve all records and Spanish Ñ while folding accents', () => {
  const { alphabeticalSections, libraryInitial } = fixture('lib/library-index.ts').exports;
  const places = [{ name: 'Ñoño' }, { name: 'Árbol' }, { name: 'Nopal' }, { name: 'ábaco' }, { name: '3 tacos' }, { name: 'Órale' }, { name: '' }, { name: 'A\u0301rbol' }];
  const original = [...places];
  const sections = alphabeticalSections(places);
  assert.deepEqual(sections.map((section) => section.letter), ['A', 'N', 'Ñ', 'O', '#']);
  assert.deepEqual(sections[0].items.map((item) => item.name), ['ábaco', 'Árbol', 'A\u0301rbol']);
  assert.equal(sections.flatMap((section) => section.items).length, places.length);
  assert.deepEqual(places, original);
  assert.equal(libraryInitial('  n\u0303andú'), 'Ñ');
});

test('index dragging clamps to real sections even beyond rail edges', () => {
  const { indexAtPosition } = fixture('lib/library-index.ts').exports;
  assert.equal(indexAtPosition(-20, 120, 6), 0);
  assert.equal(indexAtPosition(50, 120, 6), 2);
  assert.equal(indexAtPosition(200, 120, 6), 5);
  assert.equal(indexAtPosition(0, 0, 0), 0);
});

test('Guardados index scrolls without filtering and disappears in grid and selection modes', async () => {
  const indexing = fixture('lib/library-index.ts').exports;
  const places = Array.from({ length: 12 }, (_, i) => ({ id: String(i), name: `${['Árbol', 'Ñoño', 'Tacos'][i % 3]} ${i}`, categories: [], payments: [], weeklyHours: null, area: 'Centro', rating: 'Nuevo' }));
  const delayedReads = [];
  const persisted = [];
  const scrolls = [];
  const f = fixture('app/favoritos.tsx', {
    '@react-native-async-storage/async-storage': { getItem: () => new Promise((resolve) => delayedReads.push(resolve)), setItem: async (key, value) => { persisted.push([key, value]); } },
    'expo-router': { Stack: { Screen: 'Screen' }, router: { push() {}, replace() {} } },
    '@/components/alphabet-index': { AlphabetIndex: 'AlphabetIndex' },
    '@/components/bottom-tab-bar': { BottomTabBar: 'BottomTabBar' },
    '@/components/save-to-list-sheet': { SaveToListSheet: 'SaveToListSheet' },
    '@/components/foodie-filter-bar': { FoodieFilterBar: 'FoodieFilterBar', matchesFoodieFilters: () => true },
    '@/lib/controllers/useFavoritePatiosController': { useFavoritePatiosController: () => ({ patios: places, metaById: {}, removeLocally() {} }), todayDish: () => null },
    '@/lib/foodie-filters-context': { useFoodieFilters: () => ({ filters: {}, setFilters() { throw new Error('Index must never change filters'); } }) },
    '@/lib/collections': { getCollections: async () => [] },
    '@/lib/favorites': {}, '@/lib/horario': {}, '@/lib/library-index': indexing,
    '@/lib/theme': { Radius: { card: 18 }, Fonts: { brand: 'brand' }, useTheme: () => ({ theme: {} }) },
  });
  let tree = f.render(f.exports.default);
  const bar = () => nodes(tree).find((node) => node.type === 'FoodieFilterBar');
  bar().props.organizationOptions.find((option) => option.label === 'Alfabético A–Z').onPress();
  tree = f.render(f.exports.default);
  // A late disk read must not override a choice made since opening the screen.
  delayedReads[0]('list'); delayedReads[1]('today');
  await new Promise(setImmediate);
  tree = f.render(f.exports.default);
  assert.equal(bar().props.organizationOptions.find((option) => option.selected).label, 'Alfabético A–Z');
  let rail = nodes(tree).find((node) => node.type === 'AlphabetIndex');
  assert.deepEqual(rail.props.letters, ['A', 'Ñ', 'T']);
  const sections = nodes(tree).filter((node) => node.props?.onLayout && node.type === 'View');
  sections.forEach((section, i) => section.props.onLayout({ nativeEvent: { layout: { y: i * 400 } } }));
  nodes(tree).find((node) => node.type === 'ScrollView').props.ref.current = { scrollTo: (position) => scrolls.push(position) };
  rail.props.onSelect('Ñ');
  assert.deepEqual(scrolls.at(-1), { y: 400, animated: false });
  assert.equal(nodes(tree).filter((node) => node.props?.accessibilityLabel?.startsWith('Abrir ')).length, 12);
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Buscar en Guardados').props.onChangeText('Ñoño 4');
  tree = f.render(f.exports.default);
  assert.equal(nodes(tree).some((node) => node.type === 'AlphabetIndex'), false);
  assert.equal(nodes(tree).filter((node) => node.props?.accessibilityLabel?.startsWith('Abrir ')).length, 1);
  bar().props.onViewModeChange('grid');
  tree = f.render(f.exports.default);
  assert.equal(nodes(tree).some((node) => node.type === 'AlphabetIndex'), false);
  bar().props.onViewModeChange('list');
  tree = f.render(f.exports.default);
  nodes(tree).find((node) => node.props?.onLongPress).props.onLongPress();
  tree = f.render(f.exports.default);
  assert.equal(nodes(tree).some((node) => node.type === 'AlphabetIndex'), false);
  await new Promise(setImmediate);
  assert.equal(persisted.find(([key]) => key === '@patio_favorites_sort')[1], 'az');
});

test('selected categories remain removable across screens and combine alternatives within each filter group', () => {
  const f = fixture('components/foodie-filter-bar.tsx');
  const { FoodieFilterBar, EMPTY_FOODIE_FILTERS, matchesFoodieFilters } = f.exports;
  const props = {
    filters: { ...EMPTY_FOODIE_FILTERS, today: true, open: true, categories: ['Guisados'], collectionIds: ['a'] },
    categories: ['Tacos'],
    collections: [{ id: 'a', title: 'Cerca', patioIds: ['one'] }],
    onChange: (next) => { props.filters = next; },
  };
  let tree = f.render(FoodieFilterBar, props);
  nodes(tree).find((node) => node.props?.accessibilityLabel?.startsWith('Filtros')).props.onPress();
  tree = f.render(FoodieFilterBar, props);
  const checkbox = (label) => nodes(tree).find((node) => node.props?.accessibilityRole === 'checkbox' && node.props.accessibilityLabel === label);
  const openGroup = (label) => {
    nodes(tree).find((node) => node.props?.accessibilityLabel === label).props.onPress();
    tree = f.render(FoodieFilterBar, props);
  };
  const goBack = () => {
    nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'FilterSheet').props.onBack();
    tree = f.render(FoodieFilterBar, props);
  };
  assert.equal(checkbox('Guisados'), undefined);
  openGroup('Tipo de lugar');
  assert.equal(checkbox('Guisados').props.accessibilityState.checked, true);
  checkbox('Tacos').props.onPress();
  tree = f.render(FoodieFilterBar, props);
  assert.equal(checkbox('Tacos').props.accessibilityState.checked, true);
  goBack();
  openGroup('Pago');
  for (const label of ['Efectivo', 'Tarjeta']) {
    checkbox(label).props.onPress();
    tree = f.render(FoodieFilterBar, props);
    assert.equal(checkbox(label).props.accessibilityState.checked, true);
  }
  const place = { patioId: 'one', hasTodayMenu: true, isOpenNow: true, categories: ['Tacos'], payments: ['Tarjeta'], collections: props.collections };
  for (const category of ['Guisados', 'Tacos']) {
    for (const payment of ['Efectivo', 'Tarjeta']) {
      assert.equal(matchesFoodieFilters(props.filters, { ...place, categories: [category], payments: [payment] }), true);
    }
  }
  for (const mismatch of [
    { categories: ['Panadería'] }, { payments: ['Transferencia'] },
    { hasTodayMenu: false }, { isOpenNow: false }, { patioId: 'outside-list' },
  ]) {
    assert.equal(matchesFoodieFilters(props.filters, { ...place, ...mismatch }), false);
  }
  goBack();
  openGroup('Tipo de lugar');
  checkbox('Guisados').props.onPress();
  tree = f.render(FoodieFilterBar, props);
  assert.deepEqual(props.filters.categories, ['Tacos']);
  assert.equal(checkbox('Guisados'), undefined);
  assert.equal(matchesFoodieFilters(props.filters, { ...place, categories: ['Guisados'] }), false);
  assert.equal(matchesFoodieFilters(props.filters, place), true);
});

test('compact filter overview summarizes selections and returns from each group without losing other criteria', () => {
  const f = fixture('components/foodie-filter-bar.tsx');
  const { FoodieFilterBar, EMPTY_FOODIE_FILTERS } = f.exports;
  let legacyCleared = 0;
  const props = {
    filters: { ...EMPTY_FOODIE_FILTERS, today: true, open: true, categories: ['Guisados'], payments: ['Tarjeta'], collectionIds: ['a'] },
    categories: ['Tacos'],
    collections: [{ id: 'a', title: 'Cerca', patioIds: ['one'] }],
    onChange: (next) => { props.filters = next; },
    additionalFilter: { label: 'Favoritos del mapa', onClear: () => { legacyCleared++; } },
  };
  let tree;
  const render = () => { tree = f.render(FoodieFilterBar, props); };
  const control = (label) => nodes(tree).find((node) => node.props?.accessibilityLabel === label);
  const panel = () => nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'FilterSheet');
  const press = (label) => { control(label).props.onPress(); render(); };
  const back = () => { panel().props.onBack(); render(); };
  render();
  nodes(tree).find((node) => node.props?.accessibilityLabel?.startsWith('Filtros')).props.onPress();
  render();
  const sheetType = panel().type;
  const assertSameSheet = () => {
    assert.equal(nodes(tree).filter((node) => typeof node.type === 'function' && node.type.name === 'FilterSheet').length, 1);
    assert.equal(panel().type, sheetType);
    assert.equal(panel().props.visible, true);
  };
  assert.deepEqual(nodes(panel().props.children).filter((node) => node.props?.accessibilityRole === 'checkbox').map((node) => node.props.accessibilityLabel), ['Menú de hoy', 'Abiertos ahora']);
  assert.equal(control('Tipo de lugar').props.accessibilityRole, 'button');
  assert.equal(control('Pago').props.accessibilityRole, 'button');
  assert.match(control('Tipo de lugar').props.accessibilityValue.text, /Guisados/);
  assert.match(control('Pago').props.accessibilityValue.text, /Tarjeta/);

  press('Tipo de lugar');
  assertSameSheet();
  assert.equal(control('Menú de hoy'), undefined);
  assert.equal(control('Tarjeta'), undefined);
  assert.equal(control('Guisados').props.accessibilityState.checked, true);
  panel().props.onClear();
  render();
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, today: true, open: true, payments: ['Tarjeta'], collectionIds: ['a'] });
  assert.equal(legacyCleared, 0);
  assert.equal(panel().props.onClear, undefined);
  press('Tacos');
  const selected = props.filters;
  back();
  assertSameSheet();
  assert.equal(panel().props.title, 'Filtros');
  assert.equal(props.filters, selected, 'Back changes navigation only');
  assert.match(control('Tipo de lugar').props.accessibilityValue.text, /Tacos/);
  assert.match(control('Pago').props.accessibilityValue.text, /Tarjeta/);

  press('Pago');
  assertSameSheet();
  assert.equal(control('Tacos'), undefined);
  assert.equal(control('Tarjeta').props.accessibilityState.checked, true);
  panel().props.onClear();
  render();
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, today: true, open: true, categories: ['Tacos'], collectionIds: ['a'] });
  assert.equal(legacyCleared, 0);
  back();
  assert.doesNotMatch(control('Pago').props.accessibilityValue.text, /Tarjeta/);
  assert.match(control('Tipo de lugar').props.accessibilityValue.text, /Tacos/);

  panel().props.onClose();
  render();
  assert.equal(panel().props.visible, false);
  nodes(tree).find((node) => node.props?.accessibilityLabel?.startsWith('Filtros')).props.onPress();
  render();
  assert.equal(panel().props.title, 'Filtros');
  assert.match(control('Tipo de lugar').props.accessibilityValue.text, /Tacos/);
  panel().props.onClear();
  render();
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, collectionIds: ['a'] });
  assert.equal(legacyCleared, 1);
});

test('creating an empty list preserves the current results until that list is explicitly selected', async () => {
  for (const activeListIds of [[], ['a']]) {
    const created = { id: 'new', title: 'Fin de semana', patioIds: [] };
    const calls = [];
    const f = fixture('components/foodie-filter-bar.tsx', {
      '@/lib/collections': { createCollection: async (title) => { calls.push(title); return created; } },
      'expo-haptics': { selectionAsync: async () => {}, notificationAsync: async () => {}, NotificationFeedbackType: { Success: 'success' } },
    });
    const { FoodieFilterBar, EMPTY_FOODIE_FILTERS, matchesFoodieFilters } = f.exports;
    const originalFilters = { ...EMPTY_FOODIE_FILTERS, today: true, collectionIds: activeListIds };
    const props = {
      filters: originalFilters, categories: [],
      collections: [{ id: 'a', title: 'Cerca', patioIds: ['one'] }],
      onChange: (next) => { props.filters = next; },
      onCollectionCreated: (collection) => { props.collections = [...props.collections, collection]; },
    };
    let tree = f.render(FoodieFilterBar, props);
    const control = (label) => nodes(tree).find((node) => node.props?.accessibilityLabel === label);
    nodes(tree).find((node) => node.props?.accessibilityLabel?.startsWith('Tus listas')).props.onPress();
    tree = f.render(FoodieFilterBar, props);
    const listPanel = nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'FilterSheet');
    assert.equal(listPanel.props.hideTitle, true);
    assert.equal(control('Nueva lista'), undefined);
    listPanel.props.onCreate();
    tree = f.render(FoodieFilterBar, props);
    control('Nombre de la lista').props.onChangeText('  Fin de semana  ');
    tree = f.render(FoodieFilterBar, props);
    await control('Crear lista').props.onPress();
    tree = f.render(FoodieFilterBar, props);
    assert.deepEqual(calls, ['Fin de semana']);
    assert.equal(props.filters, originalFilters);
    assert.equal(control('Fin de semana').props.accessibilityState.checked, false);
    assert.equal(control(activeListIds.length ? 'Cerca' : 'Todos los lugares').props.accessibilityState.checked, true);
    const place = { patioId: 'one', hasTodayMenu: true, isOpenNow: true, categories: [], payments: [], collections: props.collections };
    assert.equal(matchesFoodieFilters(props.filters, place), true);
    // A subsequent explicit selection is still available and uses list union.
    control('Fin de semana').props.onPress();
    tree = f.render(FoodieFilterBar, props);
    assert.equal(control('Fin de semana').props.accessibilityState.checked, true);
    assert.equal(matchesFoodieFilters(props.filters, place), activeListIds.length > 0);
  }
});
