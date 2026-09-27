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
  const native = Object.fromEntries(['Modal', 'View', 'Text', 'TextInput', 'ScrollView', 'TouchableOpacity', 'TouchableWithoutFeedback', 'KeyboardAvoidingView', 'Pressable'].map((name) => [name, name]));
  const mockNow = { dia: 2, minutos: 600 };
  const mocks = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
    'react-native': {
      ...native, Platform: { OS: 'ios' },
      useWindowDimensions: () => ({ width: 320, height: 568, fontScale: 1 }),
      Dimensions: { get: () => ({ width: 320, height: 568 }) },
      StyleSheet: { create: (value) => value, hairlineWidth: 0.5, absoluteFillObject: {}, absoluteFill: {} },
      Keyboard: { dismiss() {}, addListener: () => ({ remove() {} }) },
      Alert: { alert() {}, prompt() {} },
      Share: { share: async () => {} },
      PanResponder: { create: () => ({ panHandlers: {} }) },
      Animated: { Value: class { setValue() {} interpolate() { return 1; } }, View: 'Animated.View', timing: animate, spring: animate, parallel: animate },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }) },
    '@react-native-community/datetimepicker': { __esModule: true, default: 'DateTimePicker' },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-blur': { BlurView: 'BlurView' },
    'expo-linear-gradient': { LinearGradient: 'LinearGradient' },
    'expo-location': { getForegroundPermissionsAsync: async () => ({ granted: false }) },
    'expo-haptics': {
      selectionAsync: async () => {}, impactAsync: async () => {}, notificationAsync: async () => {},
      ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' }, NotificationFeedbackType: { Success: 'success' },
    },
    '@/lib/collections': {},
    '@/lib/horario': {
      ahoraCDMX: () => mockNow,
      DIA_CORTO: { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 7: 'Dom' },
      DIAS_ORDEN_LUNES: [1, 2, 3, 4, 5, 6, 7],
      estaAbiertoAhora: (weeklyHours) => weeklyHours?.open === true,
      formatHHMM12Fixed: (value) => value,
      hhmmToDate: () => new Date(2026, 8, 16, 10, 0),
      minutosAHHMM: (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`,
    },
    '@/lib/sheet-motion': {
      isVerticalSheetDrag: (dx, dy) => dy > 8 && Math.abs(dy) > Math.abs(dx),
      SHEET_DISMISS_MS: 190,
      SHEET_SPRING: { stiffness: 320, damping: 30, mass: 0.75, useNativeDriver: true },
      shouldDismissSheet: (dy, vy) => dy > 70 || vy > 0.9,
    },
    '@/lib/use-sheet-keyboard': { useSheetKeyboard: () => ({ keyboardInset: 0, keyboardVisible: false, viewportHeight: 568 }) },
    '@/lib/theme': { Radius: { card: 18 }, useTheme: () => ({ theme: { isDark: false, text: '#111', bg: '#fff', border: '#eee', accent: '#f60' } }) },
    '@/lib/tab-bar-visibility': { useTabBarScroll: () => ({ onScroll() {}, reveal() {} }) },
    '@/lib/recent-patios': { recordRecentPatio: async () => {} },
    '@/lib/geo': { distanceKm: () => 0, formatDistance: () => '0 m' },
    '@/lib/typography': { noWidow: (value) => value },
    '@/components/search-field': { SearchField: 'SearchField' },
    '@/components/action-sheet': { ACTION_SHEET_MENU_WIDTH: 240, ActionSheet: 'ActionSheet' },
    '@/components/selection-actions': { SelectionActions: 'SelectionActions' },
    '@/components/patio-card-info': { PatioCardInfo: 'PatioCardInfo' },
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
    native: mocks['react-native'],
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
  assert.equal(panelOf(tree).props.hideTitle, undefined);
  assert.equal(nodes(tree).find((node) => node.props?.accessibilityLabel === 'Menú de hoy'), undefined);

  // Availability is an independent time picker, not a checkbox inside Filters.
  const openControl = () => nodes(tree).find((node) => node.type === 'TouchableOpacity' && node.props?.accessibilityLabel?.startsWith('Abierto'));
  openControl().props.onPress();
  tree = f.render(FoodieFilterBar, props);
  assert.deepEqual(props.filters.openAt, { ahora: true });
  assert.equal(openControl().props.accessibilityState.expanded, false);
  openControl().props.onPress();
  tree = f.render(FoodieFilterBar, props);
  assert.equal(props.filters.openAt, null);
  openControl().props.onLongPress();
  tree = f.render(FoodieFilterBar, props);
  tree = f.render(FoodieFilterBar, props);
  assert.equal(openControl().props.accessibilityState.expanded, true);
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Mié').props.onPress();
  tree = f.render(FoodieFilterBar, props);
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Cerrar selector de horario').props.onPress();
  tree = f.render(FoodieFilterBar, props);
  assert.deepEqual(props.filters.openAt, { dia: 3, minutos: 600 });

  scopeButtons()[1].props.onPress();
  tree = f.render(FoodieFilterBar, props);
  assert.equal(panelOf(tree).type, panelType);
  assert.equal(panelOf(tree).props.title, 'Tus listas');
  assert.equal(panelOf(tree).props.hideTitle, undefined);
  for (const label of ['Cerca', 'Comida']) {
    nodes(tree).find((node) => node.props?.accessibilityRole === 'checkbox' && node.props?.accessibilityLabel?.startsWith(`${label},`)).props.onPress();
    tree = f.render(FoodieFilterBar, props);
  }
  for (const patioId of ['one', 'two']) {
    assert.equal(matchesFoodieFilters(props.filters, { patioId, weeklyHours: { open: true }, categories: [], payments: [], collections: props.collections }), true);
    assert.equal(matchesFoodieFilters(props.filters, { patioId, weeklyHours: { open: false }, categories: [], payments: [], collections: props.collections }), false);
  }
  scopeButtons()[0].props.onPress();
  tree = f.render(FoodieFilterBar, props);
  panelOf(tree).props.onClear();
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, openAt: { dia: 3, minutos: 600 }, collectionIds: ['a', 'b'] });
  assert.equal(legacyCleared, true);
  tree = f.render(FoodieFilterBar, props);
  scopeButtons()[1].props.onPress();
  tree = f.render(FoodieFilterBar, props);
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Todos los lugares').props.onPress();
  tree = f.render(FoodieFilterBar, props);
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, openAt: { dia: 3, minutos: 600 } });
  openControl().props.onPress();
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
  assert.deepEqual(organizeMenu.props.options.map((option) => option.label), ['Alfabético A–Z', 'Cuadrícula', 'Lista']);
  assert.deepEqual(organizeMenu.props.options.map((option) => option.sectionLabel).filter(Boolean), ['Orden', 'Vista']);
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

test('Guardados index scrolls without filtering and hides for search, grid and selection', async () => {
  const indexing = fixture('lib/library-index.ts').exports;
  const places = Array.from({ length: 24 }, (_, i) => ({ id: String(i), name: `${['Árbol', 'Ñoño', 'Tacos', 'Órale'][i % 4]} ${i}`, categories: [], payments: [], weeklyHours: null, area: 'Centro', rating: 'Nuevo' }));
  const delayedReads = [];
  const persisted = [];
  const scrolls = [];
  const f = fixture('app/favoritos.tsx', {
    '@react-native-async-storage/async-storage': { getItem: () => new Promise((resolve) => delayedReads.push(resolve)), setItem: async (key, value) => { persisted.push([key, value]); } },
    'expo-router': { Stack: { Screen: 'Screen' }, router: { push() {}, replace() {} }, useFocusEffect: (callback) => callback() },
    '@/components/alphabet-index': { AlphabetIndex: 'AlphabetIndex' },
    '@/components/bottom-tab-bar': { BottomTabBar: 'BottomTabBar' },
    '@/components/save-to-list-sheet': { SaveToListSheet: 'SaveToListSheet' },
    '@/components/selection-actions': { SelectionActions: 'SelectionActions' },
    '@/components/foodie-filter-bar': { FoodieFilterBar: 'FoodieFilterBar', matchesFoodieFilters: () => true },
    '@/lib/controllers/useFavoritePatiosController': { useFavoritePatiosController: () => ({ patios: places, metaById: {}, removeLocally() {} }), todayDish: () => null },
    '@/lib/foodie-filters-context': { useFoodieFilters: () => ({ filters: { collectionIds: [] }, setFilters() { throw new Error('Index must never change filters'); } }) },
    '@/lib/collections': { getCollections: async () => [] },
    '@/lib/favorites': {}, '@/lib/horario': {}, '@/lib/library-index': indexing,
    '@/lib/library-selection': fixture('lib/library-selection.ts').exports,
    '@/lib/theme': { Radius: { card: 18 }, Fonts: { brand: 'brand' }, useTheme: () => ({ theme: {} }) },
  });
  let tree = f.render(f.exports.default);
  const bar = () => nodes(tree).find((node) => node.type === 'FoodieFilterBar');
  bar().props.organizationOptions.find((option) => option.label === 'Alfabético A–Z').onPress();
  tree = f.render(f.exports.default);
  // A late disk read must not override a choice made since opening the screen.
  delayedReads[0]('list'); delayedReads[1]('recent');
  await new Promise(setImmediate);
  tree = f.render(f.exports.default);
  assert.equal(bar().props.organizationOptions.find((option) => option.selected).label, 'Alfabético A–Z');
  let rail = nodes(tree).find((node) => node.type === 'AlphabetIndex');
  assert.deepEqual(rail.props.letters, ['A', 'Ñ', 'O', 'T']);
  const sections = nodes(tree).filter((node) => node.props?.onLayout && node.type === 'View');
  sections.forEach((section, i) => section.props.onLayout({ nativeEvent: { layout: { y: i * 400 } } }));
  nodes(tree).find((node) => node.type === 'ScrollView').props.ref.current = { scrollTo: (position) => scrolls.push(position) };
  rail.props.onSelect('Ñ');
  assert.deepEqual(scrolls.at(-1), { y: 400, animated: false });
  assert.equal(nodes(tree).filter((node) => node.props?.accessibilityLabel?.startsWith('Abrir ')).length, 24);
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Buscar en Guardados').props.onChangeText('Ñoño 5');
  tree = f.render(f.exports.default);
  assert.equal(nodes(tree).some((node) => node.type === 'AlphabetIndex'), false);
  assert.equal(nodes(tree).filter((node) => node.props?.accessibilityLabel?.startsWith('Abrir ')).length, 1);
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Buscar en Guardados').props.onChangeText('');
  tree = f.render(f.exports.default);
  assert.ok(nodes(tree).some((node) => node.type === 'AlphabetIndex'));
  bar().props.onViewModeChange('grid');
  tree = f.render(f.exports.default);
  assert.equal(nodes(tree).some((node) => node.type === 'AlphabetIndex'), false);
  bar().props.onViewModeChange('list');
  tree = f.render(f.exports.default);
  assert.ok(nodes(tree).some((node) => node.type === 'AlphabetIndex'));
  nodes(tree).find((node) => node.props?.onLongPress).props.onLongPress();
  tree = f.render(f.exports.default);
  assert.equal(nodes(tree).some((node) => node.type === 'AlphabetIndex'), false);
  assert.ok(nodes(tree).some((node) => node.type === 'SelectionActions'));
  await new Promise(setImmediate);
  assert.equal(persisted.find(([key]) => key === '@patio_favorites_sort')[1], 'az');
});

test('selected categories remain removable across screens and combine alternatives within each filter group', () => {
  const f = fixture('components/foodie-filter-bar.tsx');
  const { FoodieFilterBar, EMPTY_FOODIE_FILTERS, matchesFoodieFilters } = f.exports;
  const props = {
    filters: { ...EMPTY_FOODIE_FILTERS, openAt: { dia: 2, minutos: 600 }, categories: ['Guisados'], collectionIds: ['a'] },
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
  const place = { patioId: 'one', weeklyHours: { open: true }, categories: ['Tacos'], payments: ['Tarjeta'], collections: props.collections };
  for (const category of ['Guisados', 'Tacos']) {
    for (const payment of ['Efectivo', 'Tarjeta']) {
      assert.equal(matchesFoodieFilters(props.filters, { ...place, categories: [category], payments: [payment] }), true);
    }
  }
  for (const mismatch of [
    { categories: ['Panadería'] }, { payments: ['Transferencia'] },
    { weeklyHours: { open: false } }, { patioId: 'outside-list' },
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
  const openAt = { dia: 2, minutos: 600 };
  const props = {
    filters: { ...EMPTY_FOODIE_FILTERS, openAt, categories: ['Guisados'], payments: ['Tarjeta'], collectionIds: ['a'] },
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
  assert.equal(panel().props.title, 'Filtros');
  assert.equal(panel().props.hideTitle, undefined);
  assert.deepEqual(nodes(panel().props.children).filter((node) => node.props?.accessibilityRole === 'checkbox').map((node) => node.props.accessibilityLabel), []);
  assert.equal(control('Menú de hoy'), undefined);
  assert.match(nodes(tree).find((node) => node.props?.accessibilityLabel?.startsWith('Abierto')).props.accessibilityLabel, /^Abierto,/);
  assert.equal(control('Tipo de lugar').props.accessibilityRole, 'button');
  assert.equal(control('Pago').props.accessibilityRole, 'button');
  assert.match(control('Tipo de lugar').props.accessibilityValue.text, /Guisados/);
  assert.match(control('Pago').props.accessibilityValue.text, /Tarjeta/);

  press('Tipo de lugar');
  assertSameSheet();
  assert.equal(panel().props.title, 'Tipo de lugar');
  assert.equal(panel().props.hideTitle, undefined);
  assert.equal(control('Menú de hoy'), undefined);
  assert.equal(control('Tarjeta'), undefined);
  assert.equal(control('Guisados').props.accessibilityState.checked, true);
  panel().props.onClear();
  render();
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, openAt, payments: ['Tarjeta'], collectionIds: ['a'] });
  assert.equal(legacyCleared, 0);
  assert.equal(panel().props.onClear, undefined);
  press('Tacos');
  const selected = props.filters;
  back();
  assertSameSheet();
  assert.equal(panel().props.title, 'Filtros');
  assert.equal(panel().props.hideTitle, undefined);
  assert.equal(props.filters, selected, 'Back changes navigation only');
  assert.match(control('Tipo de lugar').props.accessibilityValue.text, /Tacos/);
  assert.match(control('Pago').props.accessibilityValue.text, /Tarjeta/);

  press('Pago');
  assertSameSheet();
  assert.equal(control('Tacos'), undefined);
  assert.equal(control('Tarjeta').props.accessibilityState.checked, true);
  panel().props.onClear();
  render();
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, openAt, categories: ['Tacos'], collectionIds: ['a'] });
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
  assert.deepEqual(props.filters, { ...EMPTY_FOODIE_FILTERS, openAt, collectionIds: ['a'] });
  assert.equal(legacyCleared, 1);
});

test('creating an empty list preserves the current results until that list is explicitly selected', async () => {
  for (const activeListIds of [[], ['a']]) {
    const created = { id: 'new', title: 'Fin de semana', patioIds: [] };
    const calls = [];
    const f = fixture('components/foodie-filter-bar.tsx', {
      '@/lib/collections': { normalizeCollectionTitle: (title) => title.replace(/\s+/g, ' ').trim().slice(0, 60), createCollection: async (title) => { calls.push(title); return created; } },
      'expo-haptics': { selectionAsync: async () => {}, notificationAsync: async () => {}, NotificationFeedbackType: { Success: 'success' } },
    });
    const { FoodieFilterBar, EMPTY_FOODIE_FILTERS, matchesFoodieFilters } = f.exports;
    const originalFilters = { ...EMPTY_FOODIE_FILTERS, openAt: { dia: 2, minutos: 600 }, collectionIds: activeListIds };
    const props = {
      filters: originalFilters, categories: [],
      collections: [{ id: 'a', title: 'Cerca', patioIds: ['one'] }],
      onChange: (next) => { props.filters = next; },
      onCollectionCreated: (collection) => { props.collections = [...props.collections, collection]; },
    };
    let tree = f.render(FoodieFilterBar, props);
    const control = (label) => nodes(tree).find((node) => node.props?.accessibilityLabel === label);
    const collectionControl = (label) => nodes(tree).find((node) => node.props?.accessibilityRole === 'checkbox' && node.props?.accessibilityLabel?.startsWith(`${label},`));
    const panel = () => nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'FilterSheet');
    let promptActions;
    f.native.Alert.prompt = (_title, _message, actions) => { promptActions = actions; };
    nodes(tree).find((node) => node.props?.accessibilityLabel?.startsWith('Tus listas')).props.onPress();
    tree = f.render(FoodieFilterBar, props);
    const listPanel = panel();
    assert.equal(listPanel.props.title, 'Tus listas');
    assert.equal(listPanel.props.hideTitle, undefined);
    assert.equal(typeof listPanel.props.onCreate, 'function');
    listPanel.props.onCreate();
    assert.ok(promptActions, 'iOS opens the native naming prompt');
    promptActions.find((action) => action.text === 'Crear').onPress('  Fin de semana  ');
    await new Promise(setImmediate);
    tree = f.render(FoodieFilterBar, props);
    assert.deepEqual(calls, ['Fin de semana']);
    assert.equal(props.filters, originalFilters);
    assert.equal(collectionControl('Fin de semana').props.accessibilityState.checked, false);
    assert.equal((activeListIds.length ? collectionControl('Cerca') : control('Todos los lugares')).props.accessibilityState.checked, true);
    const place = { patioId: 'one', weeklyHours: { open: true }, categories: [], payments: [], collections: props.collections };
    assert.equal(matchesFoodieFilters(props.filters, place), true);
    // A subsequent explicit selection is still available and uses list union.
    collectionControl('Fin de semana').props.onPress();
    tree = f.render(FoodieFilterBar, props);
    assert.equal(collectionControl('Fin de semana').props.accessibilityState.checked, true);
    assert.equal(matchesFoodieFilters(props.filters, place), activeListIds.length > 0);
  }
});

test('list selection keeps five action slots and moving waits for explicit destination confirmation', async () => {
  const moves = [];
  const overlays = [];
  let completeMove;
  const f = fixture('components/foodie-filter-bar.tsx', {
    '@/lib/collections': {
      movePatiosToCollection: (patioIds, sourceIds, destinationId) => {
        moves.push({ patioIds, sourceIds, destinationId });
        return new Promise((resolve) => { completeMove = resolve; });
      },
    },
  });
  const { FoodieFilterBar, EMPTY_FOODIE_FILTERS } = f.exports;
  const props = {
    filters: { ...EMPTY_FOODIE_FILTERS }, categories: [],
    collections: [
      { id: 'a', title: 'Cerca', patioIds: ['one'] },
      { id: 'b', title: 'Comida', patioIds: ['one', 'two'] },
      { id: 'empty', title: 'Fin de semana', patioIds: [] },
    ],
    onChange: (next) => { props.filters = next; },
    onCollectionUpdated: (updated) => { props.collections = props.collections.map((item) => item.id === updated.id ? updated : item); },
    onOverlayVisibilityChange: (visible) => overlays.push(visible),
  };
  let tree;
  const render = () => { tree = f.render(FoodieFilterBar, props); };
  const panel = () => nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'FilterSheet');
  const row = (title) => nodes(panel().props.children).find((node) => node.props?.accessibilityRole === 'checkbox' && node.props.accessibilityLabel.startsWith(`${title},`));
  const actions = () => nodes(panel().props.footer).find((node) => node.type === 'SelectionActions').props.actions;
  const confirm = () => nodes(panel().props.footer).find((node) => node.props?.accessibilityLabel === 'Mover lugares');
  const destination = () => nodes(panel().props.children).find((node) => node.props?.accessibilityLabel === 'Destino Comida');
  const expectedActions = ['Fijar', 'Compartir', 'Mover', 'Renombrar', 'Eliminar'];
  const assertSlots = () => assert.deepEqual(actions().map((action) => action.label), expectedActions);

  render();
  assert.equal(overlays.at(-1), false);
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Tus listas').props.onPress();
  render();
  assert.equal(overlays.at(-1), true);
  row('Cerca').props.onLongPress();
  render();
  assertSlots();
  assert.equal(actions().find((action) => action.label === 'Renombrar').disabled, false);
  assert.deepEqual(props.filters.collectionIds, [], 'Selecting sources never changes active filters');

  row('Cerca').props.onPress();
  render();
  assertSlots();
  assert.ok(actions().every((action) => action.disabled), 'Zero selected keeps every slot disabled');
  row('Fin de semana').props.onPress();
  render();
  assertSlots();
  assert.equal(actions().find((action) => action.label === 'Mover').disabled, true, 'An empty source has no places to move');
  row('Cerca').props.onPress();
  render();
  assertSlots();
  assert.equal(actions().find((action) => action.label === 'Renombrar').disabled, true, 'Multiple selections retain the rename slot');
  row('Fin de semana').props.onPress();
  render();

  actions().find((action) => action.label === 'Mover').onPress();
  render();
  assert.equal(panel().props.title, 'Destino');
  assert.equal(nodes(panel().props.footer).some((node) => node.type === 'SelectionActions'), false);
  assert.equal(confirm().props.disabled, true);
  assert.equal(destination().props.accessibilityRole, 'radio');
  assert.equal(nodes(panel().props.children).some((node) => node.props?.accessibilityLabel === 'Destino Cerca'), false);
  destination().props.onPress();
  render();
  assert.equal(destination().props.accessibilityState.checked, true);
  assert.equal(confirm().props.disabled, false);
  assert.deepEqual(moves, [], 'Choosing a destination does not write membership');

  panel().props.onBack();
  render();
  assert.equal(row('Cerca').props.accessibilityState.checked, true);
  assertSlots();
  actions().find((action) => action.label === 'Mover').onPress();
  render();
  assert.equal(confirm().props.disabled, true, 'Returning starts with no stale destination');
  destination().props.onPress();
  render();
  const submit = confirm().props.onPress;
  submit();
  submit();
  render();
  assert.deepEqual(moves, [{ patioIds: ['one'], sourceIds: ['a'], destinationId: 'b' }]);
  assert.equal(confirm().props.accessibilityState.busy, true);
  completeMove(props.collections.map((item) => item.id === 'a' ? { ...item, patioIds: [] } : item));
  await new Promise(setImmediate);
  render();
  assert.equal(panel().props.title, 'Tus listas');
  assert.equal(panel().props.footer, undefined);
  panel().props.onClose();
  render();
  assert.equal(overlays.at(-1), false);
});
