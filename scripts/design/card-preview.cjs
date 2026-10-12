/* global __dirname */
// A standalone review artifact rendered from the actual shared card components.
// Native map, blur and platform font rendering still require device review.
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const web = require('react-native-web');
const root = path.resolve(__dirname, '../..');
const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
let currentTheme;
let frame = { width: 393, height: 852, fontScale: 1 };
const cache = new Map();

function Text({ style, ...props }) {
  const flat = web.StyleSheet.flatten(style) || {};
  return React.createElement(web.Text, { ...props, style: [style, {
    ...(flat.fontSize ? { fontSize: flat.fontSize * frame.fontScale } : {}),
    ...(flat.lineHeight ? { lineHeight: flat.lineHeight * frame.fontScale } : {}),
  }] });
}
function Ionicons({ name, size, color, ...props }) {
  return React.createElement(web.Text, { ...props, style: { fontFamily: 'Ionicons', fontSize: size, color } }, String.fromCodePoint(glyphs[name]));
}
function load(relative) {
  const filename = path.resolve(root, relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} };
  cache.set(filename, module);
  const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const resolve = (id) => {
    if (id === 'react-native') return { ...web, Text, useWindowDimensions: () => frame };
    if (id === '@expo/vector-icons') return { Ionicons };
    if (id === '@/lib/theme') return { useTheme: () => ({ theme: currentTheme }) };
    if (id.startsWith('@/') || id.startsWith('.')) {
      const base = id.startsWith('@/') ? path.resolve(root, id.slice(2)) : path.resolve(path.dirname(filename), id);
      const target = ['.ts', '.tsx'].map((suffix) => base + suffix).find(fs.existsSync);
      if (!target) throw new Error(`Unknown local module: ${id}`);
      return load(target);
    }
    return require(id);
  };
  new Function('require', 'module', 'exports', code)(resolve, module, module.exports);
  return module.exports;
}
const { Colors } = load('lib/colors.ts');
const { crearHorarioBase } = load('lib/horario.ts');
const { patioGridColumns } = load('lib/layout-metrics.ts');
const { PatioCardInfo, PatioCardPrice } = load('components/patio-card-info.tsx');
const { PatioIdentityIcon } = load('components/patio-identity-icon.tsx');
const e = React.createElement;
const cases = [
  { name: 'Patio', price: '$95', own: null, verified: true },
  { name: 'Patio', price: '$75–165', own: 5, verified: true },
  { name: 'Patio', price: '$1,250–2,950', own: 3, verified: true },
  { name: 'Cocina Lupita', price: '$145–185', own: 2, verified: true },
  { name: 'Café Patio de Siempre y Cocina Tradicional del Barrio', price: '$75–165', own: 5, verified: true },
  { name: 'Café Patio de Siempre y Cocina Tradicional del Barrio', price: '$1,250–2,950', own: null, verified: true },
  { name: 'La Cocina de Doña Esperanza y sus Hijas, Antojitos de Temporada y Sabores Tradicionales del Barrio de San Miguel desde 1987', price: '$12,500–25,000', own: 3, area: 'San Miguel Chapultepec Primera Sección', distance: '12.5 km', count: 12543, verified: true },
  { name: 'Lugar laboratorio con un nombre extraordinariamente largo 38', price: '$45–120', own: null, verified: false, distance: '50 m' },
  { name: 'Cocina Carmelita', price: '$', own: null, verified: false, noHours: true, area: '', distance: null, rating: 'Nuevo' },
];
function theme(dark) {
  return { isDark: dark, bg: dark ? Colors.bgDark : Colors.bg, surface: dark ? Colors.surfaceDark : Colors.surface,
    text: dark ? Colors.textDark : Colors.text, textSecondary: dark ? Colors.textSecondaryDark : Colors.textSecondary,
    textMute: dark ? Colors.textMuteDark : Colors.textMute, accent: dark ? Colors.accentDark : Colors.accent,
    border: dark ? Colors.borderDark : Colors.border };
}
function section({ label, dark = false, width = 393, fontScale = 1, grid = false }) {
  currentTheme = theme(dark); frame = { width, height: 852, fontScale };
  const cols = grid ? patioGridColumns(width, fontScale) : 1;
  const cards = cases.map((item, index) => {
    const patio = { id: String(index), ...item, categories: [], menu: [], area: item.area ?? 'Irrigación',
      weeklyHours: item.noHours ? null : crearHorarioBase('00:00', '23:59'), rating: item.rating ?? '4.5', ratingCount: item.count ?? 70, isVerifiedBusiness: item.verified ?? true };
    const info = e(PatioCardInfo, { patio, variant: grid ? 'grid' : 'list', showPrice: !grid,
      showPersonalRating: true, personalRating: item.own, distanceLabel: item.distance === undefined ? '750 m' : item.distance });
    const card = grid ? e(web.View, { style: { width: cols === 2 ? (width - 44) / 2 : width - 32,
      padding: 12, borderRadius: 18, backgroundColor: currentTheme.surface, borderWidth: 0.5, borderColor: currentTheme.border } },
      e(web.View, { style: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40 * fontScale, marginBottom: 4 } },
        e(PatioIdentityIcon, { patio }), e(PatioCardPrice, { patio, style: { flex: 1, minWidth: 0 } })), info)
      : e(web.View, { style: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 12,
        borderBottomWidth: 0.5, borderColor: currentTheme.border } }, e(PatioIdentityIcon, { patio }), info);
    return e('div', { key: index, 'data-example-id': index, 'data-kind': grid ? 'grid' : 'list', style: { display: 'contents' } }, card);
  });
  const html = renderToStaticMarkup(e(web.View, { style: { padding: 16, flexDirection: grid ? 'row' : 'column',
    flexWrap: grid ? 'wrap' : 'nowrap', gap: grid ? 12 : 0, width } }, cards));
  return `<section class="sample" data-scale="${fontScale}" style="width:${width}px;background:${currentTheme.bg};color:${currentTheme.text}"><h2>${label}</h2>${html}</section>`;
}
function generate(destination) {
  const samples = [
    { label: 'Lista · claro' }, { label: 'Cuadrícula · claro', grid: true },
    { label: 'Lista · oscuro', dark: true }, { label: 'Cuadrícula · oscuro', grid: true, dark: true },
    { label: 'Lista · 320 pt', width: 320 }, { label: 'Cuadrícula · letra al 160%', grid: true, fontScale: 1.6 },
  ].map(section).join('');
  const font = fs.readFileSync(path.join(root, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf')).toString('base64');
  const html = `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Patio · nombres largos y calificaciones</title>
    <style>${web.StyleSheet.getSheet().textContent}
    @font-face{font-family:Ionicons;src:url(data:font/ttf;base64,${font}) format('truetype')}
    body{margin:0;background:#e7e7e1;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111214}
    header{max-width:1100px;margin:28px auto;padding:0 24px}h1{font-size:24px;margin:0 0 8px}p{font-size:14px;line-height:1.5;margin:6px 0}
    main{display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;justify-content:center;padding:0 20px 40px}
    .sample{flex:none;overflow:hidden;border-radius:20px}.sample h2{font-size:14px;font-weight:600;padding:16px 16px 0;margin:0}
    </style><header><h1>Patio · columnas estables</h1><p>Nombre, colonia y calificación en una línea cada uno. El sello tiene su propia columna; el precio conserva el borde derecho.</p><p>Mismo nombre con distintos precios, nombres extensos, colonia larga, distancia, reseñas y datos ausentes. Los rangos extraordinarios abren sus precios completos.</p><p>Una estrella naranja indica calificación propia; el número conserva el promedio público. Ejemplos sintéticos del componente real. Mapas, vidrio y fuentes nativas se prueban en el celular.</p></header><main>${samples}</main></html>`;
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, html);
  return destination;
}
if (require.main === module) console.log(generate(process.argv[2] || path.join(root, 'docs/design/previews/patio-cards-stable-columns-2026-10-12.html')));
module.exports = { generate };
