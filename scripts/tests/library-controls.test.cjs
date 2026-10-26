/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

function pureModule(file) {
  const filename = path.resolve(__dirname, '../..', file);
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)((id) => pureModule(path.resolve(path.dirname(filename), `${id}.ts`)), module, module.exports);
  return module.exports;
}
const layoutMetrics = pureModule('lib/layout-metrics.ts');
const surfaceStyles = pureModule('lib/surface-styles.ts');

// Exercise the actual component handlers; native views and modal completion
// are boundaries, not a claim of physical-device rendering coverage.
function fixture(file, overrides = {}) {
  const slots = [];
  const effects = [];
  let cursor = 0;
  let deferUpdates = false;
  const deferredUpdates = [];
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = typeof initial === 'function' ? initial() : initial;
      return [slots[index], (value) => {
        const apply = () => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; };
        if (deferUpdates) deferredUpdates.push(apply);
        else apply();
      }];
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
  const jsx = (type, props) => type?.name === 'LibraryListRow' ? type(props) : ({ type, props: props ?? {} });
  const animate = () => ({ start: (callback) => callback?.({ finished: true }) });
  const native = Object.fromEntries(['ActivityIndicator', 'Modal', 'View', 'Text', 'TextInput', 'ScrollView', 'TouchableOpacity', 'TouchableWithoutFeedback', 'KeyboardAvoidingView', 'Pressable'].map((name) => [name, name]));
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
    '@expo/vector-icons': { Ionicons: 'Icon', MaterialCommunityIcons: 'MaterialIcon' },
    'expo-symbols': { SymbolView: 'SymbolView' },
    '@/components/pin-icon': { PinIcon: 'PinIcon' },
    '@/components/place-icon': { PlaceIcon: 'Icon' },
    'expo-blur': { BlurView: 'BlurView' },
    '@/components/bottom-content-fade': { BottomContentFade: 'BottomContentFade' },
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
    '@/lib/layout-metrics': layoutMetrics,
    '@/lib/surface-styles': surfaceStyles,
    '@/lib/theme': { Radius: { card: 18 }, useTheme: () => ({ theme: { isDark: false, text: '#111', bg: '#fff', border: '#eee', accent: '#f60' } }) },
    '@/lib/tab-bar-visibility': { useTabBarScroll: () => ({ onScroll() {}, reveal() {} }) },
    '@/lib/recent-patios': { recordRecentPatio: async () => {} },
    '@/lib/patio-sort': { patioDistance: () => null, patioMinimumPrice: () => null, sortPatiosByMetric: (items) => [...items] },
    '@/components/patio-status-indicator': { PatioStatusIndicator: 'PatioStatusIndicator' },
    '@/components/patio-identity-icon': { PatioIdentityIcon: 'PatioIdentityIcon' },
    '@/lib/patio-card-info': { patioCardAccessibilityLabel: (patio) => `Abrir ${patio.name}` },
    '@/lib/geo': { distanceKm: () => 0, formatDistance: () => '0 m' },
    '@/lib/typography': { noWidow: (value) => value },
    '@/components/foodie-loading': { FoodieLoading: 'FoodieLoading' },
    '@/components/search-field': { SearchField: 'SearchField' },
    '@/components/action-sheet': { ACTION_SHEET_MENU_WIDTH: 240, ActionSheet: 'ActionSheet' },
    '@/components/library-sheet': { LibrarySheet: function LibrarySheet() {} },
    '@/components/library-list-row': { LibraryListRow: (props) => ({ type: 'TouchableOpacity', props: { ...props, accessibilityRole: 'checkbox', accessibilityLabel: `${props.title}, ${props.count} ${props.count === 1 ? props.unit : props.unit === 'lugar' ? 'lugares' : 'menús'}`, accessibilityState: { checked: props.checked }, children: [] } }) },
    '@/components/rename-dialog': { RenameDialog: 'RenameDialog' },
    '@/components/scroll-edge-fade': { ScrollEdgeFade: 'ScrollEdgeFade' },
    '@/lib/use-scroll-edges': { useScrollEdges: () => ({ top: false, bottom: false, onScroll() {}, onLayout() {}, onContentSizeChange() {} }) },
    '@/lib/use-known-location': { useKnownLocation: () => [null, () => {}] },
    '@/components/selection-actions': { SelectionActions: 'SelectionActions' },
    '@/components/patio-card-info': { PatioCardInfo: 'PatioCardInfo', PatioCardPrice: 'PatioCardPrice' },
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
    deferStateUpdates() { deferUpdates = true; },
    flushStateUpdates() {
      deferUpdates = false;
      deferredUpdates.splice(0).forEach((apply) => apply());
    },
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

test('one rating star acknowledges a valid personal vote while retaining the public average', () => {
  const f = fixture('components/patio-card-info.tsx', { '@/lib/patio-card-info': pureModule('lib/patio-card-info.ts') });
  const props = { patio: { name: 'Cocina con un nombre muy largo', area: 'Centro', menu: [], rating: '4.7', ratingCount: 213, isVerifiedBusiness: true }, personalRating: 2, showPersonalRating: true, variant: 'grid', showPrice: false };
  let tree = f.render(f.exports.PatioCardInfo, props);
  const star = (value) => nodes(value).filter((node) => node.type === 'Icon' && node.props.name === 'star');
  assert.equal(star(tree).length, 1);
  assert.equal(star(tree)[0].props.color, '#f60');
  assert.ok(nodes(tree).some((node) => node.props?.children === '4.7'));
  assert.ok(nodes(tree).some((node) => /Calificación pública, 4.7.*213 reseñas.*Tu calificación, 2.0/.test(node.props?.accessibilityLabel ?? '')));
  assert.equal(nodes(tree).find((node) => node.props?.accessibilityLabel === props.patio.name).props.numberOfLines, 1);
  for (const personalRating of [null, 0, 6, NaN]) {
    tree = f.render(f.exports.PatioCardInfo, { ...props, personalRating, variant: 'list' });
    assert.equal(star(tree).length, 1);
    assert.notEqual(star(tree)[0].props.color, '#f60');
    assert.ok(nodes(tree).some((node) => node.props?.children === '4.7 (213)'));
  }
});

test('location uses a middle dot only between real area and distance and speaks the full values', () => {
  const f = fixture('components/patio-card-info.tsx');
  const area = 'San Miguel Chapultepec Primera Sección';
  const render = (props) => f.render(f.exports.PatioCardLocation, props);
  let tree = render({ area, distanceLabel: '12.5 km', variant: 'detail' });
  assert.equal(tree.props.accessibilityLabel, `${area}. Distancia, 12.5 km`);
  assert.equal(nodes(tree).filter((node) => node.props?.children === '·').length, 1);
  assert.equal(nodes(tree).filter((node) => node.type === 'Icon').length, 0);
  assert.equal(nodes(render({ area, distanceLabel: null })).filter((node) => node.props?.children === '·').length, 0);
  tree = render({ area: ' ', distanceLabel: '750 m' });
  assert.equal(tree.props.accessibilityLabel, 'Distancia, 750 m');
  assert.equal(nodes(tree).filter((node) => node.props?.children === '·').length, 0);
  assert.equal(render({ area: '', distanceLabel: null }), null);
});

test('compact prices never show an incomplete extraordinary amount and the expanded page keeps exact prices', () => {
  const f = fixture('components/patio-card-info.tsx', { '@/lib/patio-card-info': pureModule('lib/patio-card-info.ts') });
  const patio = { menu: [], price: '$12,500–25,000' };
  let tree = f.render(f.exports.PatioCardPrice, { patio });
  const text = nodes(tree).find((node) => node.type === 'Text');
  assert.equal(text.props.children, 'Ver precios');
  assert.equal(text.props.numberOfLines, 1);
  assert.match(text.props.accessibilityLabel, /12,500.*25,000/);
  tree = f.render(f.exports.PatioCardPrice, { patio, compact: false });
  assert.equal(nodes(tree).find((node) => node.type === 'Text').props.children, '$12,500–25,000');
  tree = f.render(f.exports.PatioCardPrice, { patio: { ...patio, price: '$1,250–2,950' } });
  assert.equal(nodes(tree).find((node) => node.type === 'Text').props.children, '$1,250–2,950');
});

test('sheet geometry respects the available viewport instead of forcing a minimum behind the keyboard', () => {
  const { librarySheetHeight, libraryFooterMaxHeight } = layoutMetrics;
  const base = { preferred: 340, natural: 900, header: 68, footer: 150, safeBottom: 34, fontScale: 2 };
  const roomy = librarySheetHeight({ ...base, available: 680 });
  assert.ok(roomy >= base.header + base.footer + base.safeBottom + 52 * base.fontScale);
  for (const available of [0, 88, 160, 300]) {
    const height = librarySheetHeight({ ...base, available });
    assert.ok(height >= 0 && height <= available);
    const footer = libraryFooterMaxHeight(height, base.header, base.safeBottom, base.fontScale);
    assert.ok(footer >= 0);
    if (height > base.header + base.safeBottom) {
      assert.ok(base.header + base.safeBottom + footer < height, 'Scrolling content retains visible space');
    }
  }
});

test('list editor and action footer remain scrollable as the keyboard reduces the available frame', () => {
  let keyboard = { keyboardInset: 0, keyboardVisible: false, viewportHeight: 568 };
  const f = fixture('components/library-sheet.tsx', {
    '@/lib/use-sheet-keyboard': { useSheetKeyboard: () => keyboard },
  });
  const props = { visible: true, onClose() {}, title: 'Listas', hideTitle: true, preferredHeight: 340,
    theme: {}, editing: true, editor: { type: 'TextInput', props: { accessibilityLabel: 'Nombre de la lista' } },
    children: 'List choices', footer: { type: 'TouchableOpacity', props: { accessibilityLabel: 'Mover lugares' } } };
  let tree = f.render(f.exports.LibrarySheet, props);
  const scrolls = () => nodes(tree).filter((node) => node.type === 'ScrollView');
  scrolls()[0].props.onContentSizeChange(320, 480);
  scrolls()[1].props.onContentSizeChange(320, 152);
  keyboard = { keyboardInset: 348, keyboardVisible: true, viewportHeight: 220 };
  tree = f.render(f.exports.LibrarySheet, props);
  assert.equal(scrolls().length, 2);
  assert.ok(nodes(scrolls()[0]).some((node) => node.props?.accessibilityLabel === 'Nombre de la lista'));
  assert.ok(nodes(scrolls()[1]).some((node) => node.props?.accessibilityLabel === 'Mover lugares'));
  const frame = nodes(tree).find((node) => node.type === 'Animated.View' && node.props.accessibilityViewIsModal).props.style[1];
  assert.ok(frame.height - keyboard.keyboardInset <= keyboard.viewportHeight - 44 - 16);
  assert.ok(scrolls()[1].props.style.maxHeight > 0 && scrolls()[1].props.style.maxHeight < 152);
});

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
  const panelOf = (value) => nodes(value).find((node) => typeof node.type === 'function' && node.type.name === 'LibrarySheet');
  assert.equal(panelOf(tree).props.visible, false);
  scopeButtons()[0].props.onPress();
  tree = f.render(FoodieFilterBar, props);
  const panelType = panelOf(tree).type;
  assert.equal(panelOf(tree).props.visible, true);
  assert.equal(panelOf(tree).props.title, 'Filtros');
  assert.equal(panelOf(tree).props.hideTitle, false);
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
  assert.equal(panelOf(tree).props.title, 'Listas');
  assert.equal(panelOf(tree).props.hideTitle, false);
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

test('map location uses the shared trailing control slot and exposes pending feedback', () => {
  const f = fixture('components/foodie-filter-bar.tsx');
  let centered = 0;
  const props = { filters: f.exports.EMPTY_FOODIE_FILTERS, onChange() {}, categories: [], collections: [],
    locationAction: { onPress: () => { centered += 1; }, busy: false } };
  const findLocation = (tree) => nodes(tree).find((node) => node.props?.accessibilityLabel === 'Centrar en mi ubicación');
  let tree = f.render(f.exports.FoodieFilterBar, props);
  const location = findLocation(tree);
  assert.equal(location.type, 'TouchableOpacity');
  assert.equal(Object.assign({}, ...location.props.style).width, 40);
  assert.deepEqual(location.props.accessibilityState, { busy: false, disabled: false });
  assert.ok(nodes(location).some((node) => node.props?.name === 'navigate-outline'));
  location.props.onPress();
  assert.equal(centered, 1);
  props.locationAction.busy = true;
  tree = f.render(f.exports.FoodieFilterBar, props);
  assert.equal(findLocation(tree).props.disabled, true);
  assert.deepEqual(findLocation(tree).props.accessibilityState, { busy: true, disabled: true });
  assert.ok(nodes(findLocation(tree)).some((node) => node.type === 'ActivityIndicator'));

  tree = f.render(f.exports.FoodieFilterBar, { ...props, viewMode: 'list', onViewModeChange() {} });
  assert.equal(findLocation(tree), undefined);
  const organize = nodes(tree).find((node) => node.props?.accessibilityLabel === 'Organizar Guardados');
  assert.equal(Object.assign({}, ...organize.props.style).width, 40);
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
    '@/lib/theme': { Radius: { card: 18 }, Fonts: { brand: 'brand' }, Type: new Proxy({}, { get: () => ({}) }), useTheme: () => ({ theme: {} }) },
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
  // The last row must clear the measured action bar, including large text.
  const actionContainer = nodes(tree).find((node) => node.type === 'View' && node.props.onLayout
    && nodes(node.props.children).some((child) => child.type === 'SelectionActions'));
  actionContainer.props.onLayout({ nativeEvent: { layout: { height: 152 } } });
  tree = f.render(f.exports.default);
  const contentPadding = nodes(tree).find((node) => node.type === 'ScrollView').props.contentContainerStyle.at(-1).paddingBottom;
  assert.ok(contentPadding >= 34 + 8 + 152 + 16);
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
    nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'LibrarySheet').props.onBack();
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
  const panel = () => nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'LibrarySheet');
  const press = (label) => { control(label).props.onPress(); render(); };
  const back = () => { panel().props.onBack(); render(); };
  render();
  nodes(tree).find((node) => node.props?.accessibilityLabel?.startsWith('Filtros')).props.onPress();
  render();
  const sheetType = panel().type;
  const assertSameSheet = () => {
    assert.equal(nodes(tree).filter((node) => typeof node.type === 'function' && node.type.name === 'LibrarySheet').length, 1);
    assert.equal(panel().type, sheetType);
    assert.equal(panel().props.visible, true);
  };
  assert.equal(panel().props.title, 'Filtros');
  assert.equal(panel().props.hideTitle, false);
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
  assert.equal(panel().props.hideTitle, false);
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
  assert.equal(panel().props.hideTitle, false);
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
    let fail = true;
    const f = fixture('components/foodie-filter-bar.tsx', {
      '@/lib/collections': { normalizeCollectionTitle: (title) => title.replace(/\s+/g, ' ').trim().slice(0, 60), createCollection: async (title) => { calls.push(title); if (fail) { fail = false; throw new Error('Offline'); } return created; } },
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
    const panel = () => nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'LibrarySheet');
    f.native.Alert.prompt = () => { throw new Error('Creation must use the app theme, not a system prompt'); };
    nodes(tree).find((node) => node.props?.accessibilityLabel?.startsWith('Tus listas')).props.onPress();
    tree = f.render(FoodieFilterBar, props);
    const listPanel = panel();
    assert.equal(listPanel.props.title, 'Listas');
    assert.equal(listPanel.props.hideTitle, false);
    assert.equal(typeof listPanel.props.onCreate, 'function');
    listPanel.props.onCreate();
    tree = f.render(FoodieFilterBar, props);
    assert.equal(panel().props.title, 'Nueva lista');
    assert.equal(panel().props.children, null);
    assert.equal(nodes(panel().props.editor).filter((node) => node.type === 'Text' && node.props.children === 'Nombre de la lista').length, 0);
    assert.equal(panel().props.stabilizeEditor, true);
    nodes(panel().props.editor).find((node) => node.props?.accessibilityLabel === 'Nombre de la lista').props.onChangeText('  Fin de semana  ');
    tree = f.render(FoodieFilterBar, props);
    nodes(panel().props.editor).find((node) => node.props?.accessibilityLabel === 'Crear lista').props.onPress();
    await new Promise(setImmediate);
    tree = f.render(FoodieFilterBar, props);
    assert.equal(panel().props.title, 'Nueva lista', 'Failed creation retains the themed editor');
    assert.equal(nodes(panel().props.editor).find((node) => node.props?.accessibilityLabel === 'Nombre de la lista').props.value, '  Fin de semana  ');
    nodes(panel().props.editor).find((node) => node.props?.accessibilityLabel === 'Crear lista').props.onPress();
    await new Promise(setImmediate);
    tree = f.render(FoodieFilterBar, props);
    assert.deepEqual(calls, ['Fin de semana', 'Fin de semana']);
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
  const panel = () => nodes(tree).find((node) => typeof node.type === 'function' && node.type.name === 'LibrarySheet');
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
  nodes(panel().props.headerActions).find((node) => node.props?.accessibilityLabel === 'Organizar listas').props.onPress();
  render();
  assert.equal(panel().props.title, 'Organizar listas');
  assert.ok(nodes(panel().props.headerActions).some((node) => node.props?.accessibilityLabel === 'Terminar de organizar listas'));
  assert.equal(panel().props.leadingAction, undefined);
  row('Cerca').props.onPress();
  render();
  assertSlots();
  assert.equal(actions().find((action) => action.label === 'Renombrar').disabled, false);
  assert.equal(panel().props.title, '1 lista seleccionada');
  assert.equal(nodes(panel().props.children).find((node) => node.props?.accessibilityLabel === 'Seleccionar todas las listas').props.accessibilityState.checked, 'mixed');
  assert.ok(!nodes(panel().props.children).some((node) => String(node.props?.children).startsWith('Elige las listas')));
  assert.equal(actions().find((action) => action.label === 'Fijar').icon, 'pin-outline');
  assert.deepEqual(props.filters.collectionIds, [], 'Selecting sources never changes active filters');

  row('Cerca').props.onPress();
  render();
  assertSlots();
  assert.ok(actions().every((action) => action.disabled), 'Zero selected keeps every slot disabled');
  assert.equal(panel().props.title, 'Organizar listas');
  assert.equal(panel().props.hideClose, true);
  row('Fin de semana').props.onPress();
  render();
  assertSlots();
  assert.equal(actions().find((action) => action.label === 'Mover').disabled, true, 'Empty lists cannot start an empty move');
  actions().find((action) => action.label === 'Mover').onPress();
  render();
  assert.equal(moves.length, 0, 'Empty lists never issue a move');
  assert.notEqual(panel().props.title, 'Destino');
  row('Cerca').props.onPress();
  render();
  assertSlots();
  assert.equal(actions().find((action) => action.label === 'Renombrar').disabled, true, 'Rename requires exactly one list');
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
  assert.equal(panel().props.title, 'Listas');
  assert.equal(panel().props.footer, undefined);
  panel().props.onClose();
  render();
  assert.equal(overlays.at(-1), false);
});


test('selection header keeps its title and one explicit cancel action without a duplicate close button', () => {
  const f = fixture('components/library-sheet.tsx');
  const props = { visible: true, onClose() {}, title: 'Seleccionar listas', preferredHeight: 340, hideClose: true,
    leadingAction: { type: 'TouchableOpacity', props: { accessibilityLabel: 'Cancelar selección' } }, theme: {}, children: 'Listas' };
  let tree = f.render(f.exports.LibrarySheet, props);
  assert.ok(nodes(tree).some((node) => node.props?.accessibilityRole === 'header' && node.props.children === 'Seleccionar listas'));
  assert.equal(nodes(tree).filter((node) => node.props?.accessibilityLabel === 'Cancelar selección').length, 1);
  assert.equal(nodes(tree).filter((node) => node.type === 'Icon' && node.props?.name === 'close').length, 0);
  tree = f.render(f.exports.LibrarySheet, { ...props, hideClose: false, leadingAction: undefined, title: 'Listas' });
  assert.equal(nodes(tree).filter((node) => node.type === 'Icon' && node.props?.name === 'close').length, 1);
});

test('pin and unpin use thumbtacks on native symbols and fallback, never a saved bookmark', () => {
  const f = fixture('components/pin-icon.tsx');
  for (const remove of [false, true]) {
    const tree = f.render(f.exports.PinIcon, { remove, size: 22, color: '#111214' });
    assert.equal(tree.props.name, remove ? 'pin.slash' : 'pin');
    assert.equal(tree.props.fallback.props.name, remove ? 'pin-off-outline' : 'pin-outline');
    assert.equal(tree.props.fallback.type, 'MaterialIcon');
  }
});


test('sheet centers its heading between natural actions and gives long controls a separate title row', () => {
  const f = fixture('components/library-sheet.tsx');
  const props = { visible: true, onClose() {}, title: 'Listas', preferredHeight: 340, theme: {}, children: 'Content' };
  let tree = f.render(f.exports.LibrarySheet, props);
  const groups = () => nodes(tree).filter((node) => node.type === 'View' && node.props.onLayout && Object.assign({}, ...[node.props.style].flat().filter(Boolean)).gap === 4);
  groups()[0].props.onLayout({ nativeEvent: { layout: { width: 44 } } });
  groups()[1].props.onLayout({ nativeEvent: { layout: { width: 80 } } });
  tree = f.render(f.exports.LibrarySheet, props);
  const titleSlot = nodes(tree).find((node) => node.type === 'View' && Array.isArray(node.props.style) && node.props.style[0]?.position === 'absolute' && node.props.style[1]?.left === 80);
  assert.deepEqual(titleSlot.props.style[1], { left: 80, right: 80 }, 'Asymmetric actions reserve symmetric title insets without constraining their own width');
  groups()[1].props.onLayout({ nativeEvent: { layout: { width: 140 } } });
  tree = f.render(f.exports.LibrarySheet, props);
  const titleRow = nodes(tree).find((node) => node.type === 'View' && node.props.style?.paddingBottom === 8 && node.props.style?.paddingTop === 4);
  assert.ok(titleRow, 'Constrained width moves the heading to its own row instead of clipping it');
  assert.equal(nodes(titleRow).find((node) => node.props.accessibilityRole === 'header').props.children, 'Listas');
});


test('short Listas title stays in one toolbar row at iPhone width with Organizar and add', () => {
  const f = fixture('components/library-sheet.tsx');
  f.native.useWindowDimensions = () => ({ width: 393, height: 852, fontScale: 1 });
  const props = { visible: true, onClose() {}, title: 'Listas', preferredHeight: 340, theme: {}, children: 'Content' };
  let tree = f.render(f.exports.LibrarySheet, props);
  const groups = nodes(tree).filter((node) => node.type === 'View' && node.props.onLayout && Object.assign({}, ...[node.props.style].flat().filter(Boolean)).gap === 4);
  groups[0].props.onLayout({ nativeEvent: { layout: { width: 44 } } });
  groups[1].props.onLayout({ nativeEvent: { layout: { width: 138 } } });
  const probe = nodes(tree).find((node) => node.type === 'Text' && node.props.accessibilityElementsHidden);
  probe.props.onLayout({ nativeEvent: { layout: { width: 54 } } });
  tree = f.render(f.exports.LibrarySheet, props);
  assert.equal(nodes(tree).filter((node) => node.props?.accessibilityRole === 'header').length, 1);
  assert.ok(!nodes(tree).some((node) => node.type === 'View' && node.props.style?.paddingBottom === 8 && node.props.style?.paddingTop === 4));
  f.native.useWindowDimensions = () => ({ width: 393, height: 852, fontScale: 1.8 });
  tree = f.render(f.exports.LibrarySheet, props);
  assert.ok(nodes(tree).some((node) => node.type === 'View' && node.props.style?.paddingBottom === 8 && node.props.style?.paddingTop === 4));
});


test('action footer overlays a passive fade and reserves enough scroll clearance for the last row', () => {
  const f = fixture('components/library-sheet.tsx');
  const props = { visible: true, onClose() {}, title: 'Organizar listas', preferredHeight: 500, theme: { isDark: false }, children: 'Rows', footer: 'Actions' };
  let tree = f.render(f.exports.LibrarySheet, props);
  const scrolls = nodes(tree).filter((node) => node.type === 'ScrollView');
  scrolls[1].props.onContentSizeChange(393, 60);
  tree = f.render(f.exports.LibrarySheet, props);
  const body = nodes(tree).find((node) => node.type === 'ScrollView' && node.props.contentContainerStyle);
  assert.equal(body.props.contentContainerStyle.paddingBottom, 76);
  const fade = nodes(tree).find((node) => node.type === 'BottomContentFade');
  assert.ok(fade.props.height > 60);
  const footer = nodes(tree).find((node) => node.type === 'View' && node.props.pointerEvents === 'box-none');
  assert.equal(footer.props.style.position, 'absolute');
  assert.equal(footer.props.style.bottom, 34);
});

test('renaming a place list stays in the themed sheet, retains failure and closes without leaving an overlay active', async () => {
  const overlays = [];
  let fail = true;
  const f = fixture('components/foodie-filter-bar.tsx', {
    '@/lib/collections': {
      normalizeCollectionTitle: (s) => s.trim(),
      renameCollection: async (id, title) => { if (fail) { fail = false; throw new Error('Offline'); } return { id, title, patioIds: ['one'] }; },
    },
  });
  const props = { filters: f.exports.EMPTY_FOODIE_FILTERS, categories: [], collections: [{ id: 'a', title: 'Cerca', patioIds: ['one'] }],
    onChange() {}, onCollectionUpdated: (item) => { props.collections = [item]; }, onOverlayVisibilityChange: (value) => overlays.push(value) };
  let tree;
  const render = () => { tree = f.render(f.exports.FoodieFilterBar, props); };
  const panel = () => nodes(tree).find((node) => node.type?.name === 'LibrarySheet');
  const editor = (label) => nodes(panel().props.editor).find((node) => node.props?.accessibilityLabel === label);
  render();
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Tus listas').props.onPress(); render();
  nodes(panel().props.headerActions).find((node) => node.props?.accessibilityLabel === 'Organizar listas').props.onPress(); render();
  nodes(panel().props.children).find((node) => node.props?.accessibilityLabel?.startsWith('Cerca,')).props.onPress(); render();
  nodes(panel().props.footer).find((node) => node.type === 'SelectionActions').props.actions.find((action) => action.label === 'Renombrar').onPress(); render();
  assert.equal(panel().props.title, 'Renombrar lista');
  editor('Nombre de la lista').props.onChangeText('Mi zona'); render();
  editor('Guardar nombre de la lista').props.onPress(); await new Promise(setImmediate); render();
  assert.equal(panel().props.title, 'Renombrar lista');
  assert.equal(editor('Nombre de la lista').props.value, 'Mi zona');
  editor('Guardar nombre de la lista').props.onPress(); await new Promise(setImmediate); render();
  assert.equal(props.collections[0].title, 'Mi zona');
  panel().props.onClose(); render();
  assert.equal(overlays.at(-1), false);
});

test('contextual list actions fit the viewport and isolate the sheet below from accessibility', () => {
  const f = fixture('components/foodie-filter-bar.tsx');
  const props = { filters: f.exports.EMPTY_FOODIE_FILTERS, categories: [], collections: [{ id: 'a', title: 'Cerca', patioIds: [] }], onChange() {} };
  let tree = f.render(f.exports.FoodieFilterBar, props);
  const panel = () => nodes(tree).find((node) => node.type?.name === 'LibrarySheet');
  nodes(tree).find((node) => node.props?.accessibilityLabel === 'Tus listas').props.onPress(); tree = f.render(f.exports.FoodieFilterBar, props);
  const row = nodes(panel().props.children).find((node) => node.props?.accessibilityLabel?.startsWith('Cerca,'));
  row.props.moreRef({ measureInWindow: (done) => done(260, 470, 44, 44) });
  row.props.onMore(); tree = f.render(f.exports.FoodieFilterBar, props);
  const menu = nodes(panel().props.overlay).find((node) => node.type === 'View' && node.props.accessibilityViewIsModal);
  const geometry = menu.props.style[1];
  assert.ok(geometry.left >= 8 && geometry.left + geometry.width <= 312);
  assert.ok(geometry.maxHeight > 0 && geometry.maxHeight <= 568 - 44 - 34 - 16);
  assert.ok(nodes(menu).some((node) => node.type === 'ScrollView'));
  const sheet = fixture('components/library-sheet.tsx');
  const rendered = sheet.render(sheet.exports.LibrarySheet, { visible: true, onClose() {}, title: 'Listas', preferredHeight: 400, theme: {}, children: 'Rows', overlay: panel().props.overlay });
  assert.ok(nodes(rendered).some((node) => node.type === 'Animated.View' && node.props.accessibilityElementsHidden === true));
});


test('renaming can resize temporarily without overwriting the organization height and Back dismisses a contextual menu first', () => {
  const f = fixture('components/library-sheet.tsx');
  const props = { visible: true, onClose() {}, title: 'Listas', viewKey: 'lists', preferredHeight: 400, theme: {}, children: 'Rows' };
  let tree = f.render(f.exports.LibrarySheet, props);
  const frame = () => nodes(tree).find((node) => node.type === 'Animated.View' && node.props.accessibilityViewIsModal).props.style[1];
  const original = frame().height;
  tree = f.render(f.exports.LibrarySheet, { ...props, title: 'Renombrar lista', viewKey: 'rename', preferredHeight: 180, preserveBrowsingHeight: true });
  assert.ok(frame().height < original);
  tree = f.render(f.exports.LibrarySheet, { ...props, editing: true });
  assert.equal(frame().height, original);
  let dismissedMenu = 0;
  tree = f.render(f.exports.LibrarySheet, { ...props, overlay: 'Menu', onOverlayClose: () => { dismissedMenu++; } });
  nodes(tree).find((node) => node.type === 'Modal').props.onRequestClose();
  assert.equal(dismissedMenu, 1);
});


test('new list keeps the physical sheet height through mount and keyboard and does not reuse old toolbar measurements', () => {
  let keyboard = { keyboardInset: 0, keyboardVisible: false, viewportHeight: 568 };
  const f = fixture('components/library-sheet.tsx', { '@/lib/use-sheet-keyboard': { useSheetKeyboard: () => keyboard } });
  const props = { visible: true, onClose() {}, title: 'Listas', viewKey: 'lists', preferredHeight: 460, theme: {}, children: 'Rows' };
  let tree = f.render(f.exports.LibrarySheet, props);
  const frame = () => nodes(tree).find((node) => node.type === 'Animated.View' && node.props.accessibilityViewIsModal).props.style[1];
  nodes(tree).find((node) => node.type === 'ScrollView').props.onContentSizeChange(320, 650);
  const groups = nodes(tree).filter((node) => node.type === 'View' && node.props.onLayout && Object.assign({}, ...[node.props.style].flat().filter(Boolean)).gap === 4);
  groups[1].props.onLayout({ nativeEvent: { layout: { width: 140 } } });
  tree = f.render(f.exports.LibrarySheet, props);
  const physicalHeight = frame().height;
  const naming = { ...props, title: 'Nueva lista', viewKey: 'lists-create', preferredHeight: 180, stabilizeEditor: true, children: 'Field' };
  tree = f.render(f.exports.LibrarySheet, naming);
  assert.equal(frame().height, physicalHeight, 'Mounting the field never flashes the large fallback then shrinks');
  assert.ok(!nodes(tree).some((node) => node.type === 'View' && node.props.style?.paddingBottom === 8 && node.props.style?.paddingTop === 4), 'Naming has fresh side measurements');
  nodes(tree).find((node) => node.type === 'ScrollView').props.onContentSizeChange(320, 130);
  tree = f.render(f.exports.LibrarySheet, naming);
  assert.equal(frame().height, physicalHeight, 'Measuring the field does not resize the sheet');
  keyboard = { keyboardInset: 300, keyboardVisible: true, viewportHeight: 268 };
  tree = f.render(f.exports.LibrarySheet, naming);
  assert.equal(frame().height, physicalHeight, 'Keyboard consumes internal space before moving the top edge');
  assert.ok(frame().height - keyboard.keyboardInset >= 180);
  keyboard = { keyboardInset: 0, keyboardVisible: false, viewportHeight: 568 };
  tree = f.render(f.exports.LibrarySheet, props);
  assert.equal(frame().height, physicalHeight, 'Returning reuses the measured list height');
});


test('shared bottom fade uses the current theme and never intercepts input or accessibility', () => {
  for (const bg of ['#F8F8F5', '#0A0B0D']) {
    const f = fixture('components/bottom-content-fade.tsx', { '@/lib/theme': { useTheme: () => ({ theme: { bg } }) } });
    const tree = f.render(f.exports.BottomContentFade, { height: 100, bottom: -34, inset: 16 });
    assert.deepEqual(tree.props.colors, [`${bg}00`, bg, bg]);
    assert.equal(tree.props.pointerEvents, 'none');
    assert.equal(tree.props.accessibilityElementsHidden, true);
    assert.equal(tree.props.style.bottom, -34);
    assert.equal(tree.props.style.left, -16);
    assert.equal(tree.props.style.right, -16);
  }
});


test('opening lists keeps both header measurements after native layout events are released', () => {
  const f = fixture('components/library-sheet.tsx');
  f.native.useWindowDimensions = () => ({ width: 393, height: 852, fontScale: 1 });
  const props = { visible: true, onClose() {}, title: 'Listas', viewKey: 'lists', preferredHeight: 460, theme: {}, children: 'Rows' };
  let tree = f.render(f.exports.LibrarySheet, props);
  const groups = nodes(tree).filter((node) => node.type === 'View' && node.props.onLayout && Object.assign({}, ...[node.props.style].flat().filter(Boolean)).gap === 4);
  f.deferStateUpdates();
  for (const [index, width] of [44, 134].entries()) {
    const event = { nativeEvent: { layout: { width } } };
    groups[index].props.onLayout(event);
    // React Native releases the synthetic event before queued updates render.
    event.nativeEvent = null;
  }
  assert.doesNotThrow(() => f.flushStateUpdates());
  tree = f.render(f.exports.LibrarySheet, props);
  const titleSlot = nodes(tree).find((node) => node.type === 'View' && Array.isArray(node.props.style) && node.props.style[0]?.position === 'absolute');
  assert.equal(titleSlot.props.style[1].left, 134);
  assert.equal(titleSlot.props.style[1].right, 134);
  assert.equal(titleSlot.props.accessibilityElementsHidden, false);
});
