/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

// Run the real route handlers and components; UIKit dismissal is an explicit
// boundary so a picker cannot be presented over a still-visible native modal.
function fixture(file, overrides = {}) {
  const slots = [];
  let cursor = 0;
  let effects = [];
  const react = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = initial;
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; }];
    },
    useRef(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = { current: initial };
      return slots[i];
    },
    useCallback: fn => fn,
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || deps.some((v, j) => !Object.is(v, slots[i][j]))) {
        slots[i] = deps;
        effects.push(fn);
      }
    },
  };
  const jsx = (type, props) => ({ type, props: props ?? {} });
  const animation = () => ({ start: fn => fn?.({ finished: true }) });
  const routes = [];
  const mocks = {
    react,
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-native': {
      ...Object.fromEntries(['View', 'Text', 'TouchableOpacity', 'Modal', 'ActivityIndicator'].map(x => [x, x])),
      Platform: { OS: 'ios' },
      InteractionManager: { runAfterInteractions: fn => { fn(); return { cancel() {} }; } },
      StyleSheet: { create: x => x, absoluteFillObject: {}, hairlineWidth: 0.5 },
      Animated: { Value: class { setValue() {} interpolate() { return 1; } }, View: 'Animated.View', spring: animation, timing: animation },
    },
    'expo-router': { router: { push: x => routes.push(x), replace: x => routes.push(x) }, Stack: { Screen: 'Screen' }, useLocalSearchParams: () => ({}) },
    '@expo/vector-icons': { Ionicons: 'Icon' },
    'expo-blur': { BlurView: 'BlurView' },
    'expo-camera': { CameraView: 'CameraView' },
    'react-native-gesture-handler': {
      GestureDetector: 'GestureDetector',
      Gesture: { Pinch: () => { const g = { runOnJS: () => g, onStart: () => g, onUpdate: () => g }; return g; } },
    },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ bottom: 34 }), SafeAreaView: 'SafeAreaView' },
    '@/lib/theme': { Radius: { card: 18 }, useTheme: () => ({ theme: { isDark: false } }) },
    '@/lib/fondero-palette': { fonderoPalette: () => ({ text: '#111', textSecondary: '#555' }) },
    '@/lib/sheet-motion': { SHEET_DISMISS_MS: 190, SHEET_SPRING: {} },
    '@/lib/typography': { noWidow: x => x },
    '@/components/agent-spinner': { AgentSpinner: 'AgentSpinner' },
    '@/components/menu-composer': { MenuComposer: 'MenuComposer' },
    ...overrides,
  };
  const source = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', source)(id => {
    if (!(id in mocks)) throw new Error(`Missing mock ${id}`);
    return mocks[id];
  }, module, module.exports);
  const Component = module.exports.default ?? module.exports.NewMenuSheet;
  return { routes, render(props) {
    cursor = 0; effects = [];
    const tree = Component(props);
    effects.forEach(fn => fn());
    return tree;
  } };
}
function nodes(tree) {
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...[tree.props?.children].flat(Infinity).flatMap(nodes)];
}

test('Photos route waits for native sheet dismissal and duplicate presses cannot open the camera', () => {
  const f = fixture('components/new-menu-sheet.tsx');
  const props = { visible: true, onClose: () => { props.visible = false; } };
  const tree = f.render(props);
  const buttons = nodes(tree);
  buttons.find(n => n.props.accessibilityLabel === 'Elegir de Fotos').props.onPress();
  buttons.find(n => n.props.accessibilityLabel === 'Tomar foto').props.onPress();
  assert.deepEqual(f.routes, []);
  f.render(props);
  const hidden = f.render(props);
  assert.equal(hidden.type, 'Modal');
  assert.equal(hidden.props.visible, false);
  assert.deepEqual(f.routes, [], 'animation completion is not UIKit dismissal');
  hidden.props.onDismiss();
  hidden.props.onDismiss();
  assert.deepEqual(f.routes, [{ pathname: '/foto-menu', params: { source: 'library' } }]);
});

test('Photos entry opens the library and never renders camera controls, even with camera permission already granted', () => {
  let picked = 0;
  let prepared = 0;
  const controller = { choosePhoto: async () => { picked++; }, prepareCamera: async () => { prepared++; }, state: 'idle', cameraAllowed: true, cancelRead() {} };
  const f = fixture('app/foto-menu.tsx', {
    'expo-router': { router: {}, Stack: { Screen: 'Screen' }, useLocalSearchParams: () => ({ source: 'library' }) },
    '@/lib/controllers/useFotoMenuController': { useFotoMenuController: () => controller },
  });
  const tree = f.render();
  assert.equal(picked, 1);
  assert.equal(prepared, 0);
  assert.equal(nodes(tree).some(n => n.type === 'CameraView'), false);
  assert.equal(nodes(tree).some(n => n.props.accessibilityLabel === 'Tomar foto'), false);
  controller.state = 'review';
  const review = f.render();
  review.props.onRetake();
  assert.equal(picked, 2);
  assert.equal(prepared, 0);
});

test('Missing source never opens the camera: only an explicit camera choice mounts it', () => {
  let picked = 0;
  let prepared = 0;
  const controller = { choosePhoto: async () => { picked++; }, prepareCamera: async () => { prepared++; }, state: 'idle', cameraAllowed: true, cancelRead() {} };
  const route = params => fixture('app/foto-menu.tsx', {
    'expo-router': { router: {}, Stack: { Screen: 'Screen' }, useLocalSearchParams: () => params },
    '@/lib/controllers/useFotoMenuController': { useFotoMenuController: () => controller },
  });
  const missing = route({}).render();
  assert.equal(picked, 1);
  assert.equal(prepared, 0);
  assert.equal(nodes(missing).some(n => n.type === 'CameraView'), false);
  const camera = route({ source: 'camera' }).render();
  assert.equal(prepared, 1);
  const view = nodes(camera).find(n => n.type === 'CameraView');
  assert.equal(view.props.zoom, 0, 'camera starts unzoomed and accepts pinch zoom');
  assert.equal(camera.type, 'GestureDetector');
});
