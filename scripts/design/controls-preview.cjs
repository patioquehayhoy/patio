/* global __dirname */
// Actual shared components on React Native Web. Open-state animation, native blur
// and SF Symbols are boundary adapters; this is not a physical-device capture.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const web = require('react-native-web');
const root = path.resolve(__dirname, '../..');
const e = React.createElement;
let theme, frame;
const cache = new Map();
const ion = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
const material = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json');
const icon = (glyphs, family) => ({ name, size, color }) => e(web.Text, { style: { fontFamily: family, fontSize: size, color } }, String.fromCodePoint(glyphs[name]));
function Text({ style, ...props }) {
  const flat = web.StyleSheet.flatten(style) || {};
  return e(web.Text, { ...props, style: [style, {
    ...(flat.fontSize ? { fontSize: flat.fontSize * frame.fontScale } : {}),
    ...(flat.lineHeight ? { lineHeight: flat.lineHeight * frame.fontScale } : {}),
  }] });
}
function load(relative) {
  const file = path.resolve(root, relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const resolve = (id) => {
    if (id === 'react-native') return { ...web, Text, Modal: web.View,
      useWindowDimensions: () => frame,
      Animated: { ...web.Animated, Value: class { setValue() {} interpolate() { return 1; } }, View: ({ style, ...props }) => { const flat = web.StyleSheet.flatten(style); return e(web.View, { ...props, style: { ...flat, transform: undefined } }); } } };
    if (id === '@expo/vector-icons') return { Ionicons: icon(ion, 'Ionicons'), MaterialCommunityIcons: icon(material, 'MaterialCommunityIcons') };
    if (id === 'expo-symbols') return { SymbolView: ({ fallback }) => fallback };
    if (id === 'expo-blur') return { BlurView: ({ style }) => e(web.View, { style }) };
    if (id === 'expo-linear-gradient') return { LinearGradient: ({ colors, locations, style }) => e('div', { 'aria-hidden': true, style: { ...web.StyleSheet.flatten(style), pointerEvents: 'none', backgroundImage: `linear-gradient(to bottom, ${colors.map((color, i) => `${color} ${Math.round((locations?.[i] ?? i / Math.max(1, colors.length - 1)) * 100)}%`).join(', ')})` } }) };
    if (id === 'expo-haptics') return {};
    if (id === 'react-native-safe-area-context') return { useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }) };
    if (id === '@/lib/theme') return { useTheme: () => ({ theme }) };
    if (id === '@/lib/use-sheet-keyboard') return { useSheetKeyboard: () => ({ keyboardInset: 0, keyboardVisible: false, viewportHeight: frame.height }) };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/') ? path.resolve(root, id.slice(2)) : path.resolve(path.dirname(file), id);
      return load(['.ts', '.tsx'].map(s => base + s).find(fs.existsSync));
    }
    return require(id);
  };
  new Function('require', 'module', 'exports', source)(resolve, module, module.exports);
  return module.exports;
}
const { Colors } = load('lib/colors.ts');
const { LibrarySheet } = load('components/library-sheet.tsx');
const { LibraryListRow } = load('components/library-list-row.tsx');
const { SelectionActions } = load('components/selection-actions.tsx');
const noop = () => {};
function sample({ width = 393, scale = 1, dark = false, selecting = false, selected = false, filters = false }) {
  frame = { width, height: 740, fontScale: scale };
  theme = { bg: dark ? Colors.bgDark : Colors.bg, surface: dark ? Colors.surfaceDark : Colors.surface, surface2: dark ? Colors.surface2Dark : Colors.surface2,
    text: dark ? Colors.textDark : Colors.text, textSecondary: dark ? Colors.textSecondaryDark : Colors.textSecondary, textMute: dark ? Colors.textMuteDark : Colors.textMute,
    border: dark ? Colors.borderDark : Colors.border, glass: dark ? Colors.glassDark : Colors.glass, accent: dark ? Colors.accentDark : Colors.accent, isDark: dark };
  const title = filters ? 'Filtros' : selecting ? selected ? '1 lista seleccionada' : 'Organizar listas' : 'Listas';
  const children = filters ? e(web.View, { style: { marginHorizontal: 16, marginTop: 12, backgroundColor: theme.surface, borderRadius: 14 } }, ['Tipo de lugar', 'Pago'].map((label, i) => e(web.View, { key: label, style: { minHeight: 52, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 } }, e(icon(ion, 'Ionicons'), { name: i ? 'card-outline' : 'location-outline', size: 20, color: theme.textSecondary }), e(Text, { style: { flex: 1, fontSize: 15, color: theme.text } }, label), e(icon(ion, 'Ionicons'), { name: 'chevron-forward', size: 16, color: theme.textMute }))))
    : e(web.View, { style: { marginHorizontal: 16, marginTop: 12, backgroundColor: theme.surface, borderRadius: 14 } }, ['Seleccionar todas', 'Roma-Condesa', 'Una lista con nombre largo para probar alineación', 'Bares'].map((label, i) => e(LibraryListRow, { key: label, title: label, count: i ? 12 : 0, unit: 'lugar', checked: selected && i === 1, pinned: i === 1, divider: i > 0, onPress: noop })));
  const footer = selecting ? e(web.View, { style: { paddingHorizontal: 16, paddingTop: 8 } }, e(SelectionActions, { actions: [
    ['Fijar', 'pin-outline'], ['Compartir', 'share-outline'], ['Mover', 'folder-open-outline'], ['Renombrar', 'pencil'], ['Eliminar', 'trash-outline'],
  ].map(([label, icon]) => ({ label, icon, disabled: !selected, onPress: noop })) })) : undefined;
  const body = renderToStaticMarkup(e(web.View, { style: { width, height: frame.height, backgroundColor: theme.bg } }, e(LibrarySheet, { visible: true, title, hideClose: selecting,
    onClose: noop, preferredHeight: filters ? 250 : 560, theme, footer, children,
    headerActions: selecting ? e(web.TouchableOpacity, { style: { minHeight: 44, justifyContent: 'center' } }, e(Text, { style: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: theme.text } }, 'Listo')) : undefined })));
  return `<section style="width:${width}px"><h2>${title} · ${width} pt · ${scale * 100}% · ${dark ? 'oscuro' : 'claro'}</h2>${body}</section>`;
}
function generate(destination) {
  const cases = [{ filters: true }, {}, { selecting: true }, { selecting: true, selected: true }, { width: 320, scale: 1.6, selecting: true, selected: true }, { dark: true, selecting: true, selected: true }].map(sample).join('');
  const fonts = ['Ionicons', 'MaterialCommunityIcons'].map(name => `@font-face{font-family:${name};src:url(data:font/ttf;base64,${fs.readFileSync(path.join(root, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts', name + '.ttf')).toString('base64')})}`).join('');
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `<!doctype html><html lang="es"><meta charset="utf-8"><title>Patio · revisión de paneles</title><style>${web.StyleSheet.getSheet().textContent}${fonts}body{margin:0;padding:20px;background:#deded8;font-family:system-ui}h1{font-size:22px}h2{font-size:14px;margin:12px 0}main{display:flex;flex-wrap:wrap;align-items:flex-start;gap:20px}section{flex:none}p{max-width:900px}</style><h1>Patio · paneles y selección</h1><p>Componentes compartidos reales en React Native Web. Animación fijada en abierto, vidrio y símbolos nativos adaptados. No sustituye QA en el celular.</p><main>${cases}</main></html>`);
}
if (require.main === module) generate(process.argv[2] || '/tmp/patio-controls-preview.html');
module.exports = { generate };
