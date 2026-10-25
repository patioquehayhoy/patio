/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { test } = require('node:test');
const output = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '../../lib/business-category-icons.ts'), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
new Function('exports', output)(loaded.exports);
const { businessCategoryIcon, BUSINESS_CATEGORY_ICONS, mapMarkerDetail } = loaded.exports;

test('the original icon catalogue is preserved except for literal tacos and corn', () => {
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  const foodGlyphs = { taco: 0xe001, corn: 0xe002, chips: 0xe003, cake: 0xe004, coffee: 0xe005, juice: 0xe006 };
  const font = fs.readFileSync(path.resolve(__dirname, '../../assets/fonts/PatioGiros.ttf'));
  assert.ok(font.length > 500, 'PatioGiros font ships with the app');
  assert.match(fs.readFileSync(path.resolve(__dirname, '../../components/business-category-icon.tsx'), 'utf8'), /taco: 0xe001, corn: 0xe002, chips: 0xe003, cake: 0xe004, coffee: 0xe005, juice: 0xe006/);
  assert.equal(Object.keys(BUSINESS_CATEGORY_ICONS).length, 12);
  for (const [type, name] of Object.entries(BUSINESS_CATEGORY_ICONS)) {
    assert.ok((name in foodGlyphs ? foodGlyphs : glyphs)[name], `${type}: glyph must exist in the shipped font`);
    assert.equal(businessCategoryIcon(type), name);
  }
  for (const label of ['Tacos al pastor', 'Taquería']) assert.equal(businessCategoryIcon(label), 'taco');
  for (const label of ['Elotes', 'Esquites']) assert.equal(businessCategoryIcon(label), 'corn');
  assert.equal(businessCategoryIcon('Panadería'), 'cake');
  assert.equal(businessCategoryIcon('Cafetería'), 'coffee');
  assert.equal(businessCategoryIcon('Café de olla', 'map'), 'coffee');
  assert.equal(businessCategoryIcon('Empanadas'), 'fast-food-outline');
  assert.equal(businessCategoryIcon('Botanas'), 'chips');
  assert.equal(businessCategoryIcon('Botanas', 'map'), 'chips');
  assert.equal(businessCategoryIcon('Jugos y fruta'), 'juice');
  assert.equal(businessCategoryIcon('Jugos y fruta', 'map'), 'juice');
  assert.equal(businessCategoryIcon('Giro desconocido'), 'ellipsis-horizontal');
  assert.equal(businessCategoryIcon('Fondita', 'map'), 'location-outline');
  assert.equal(businessCategoryIcon('Restaurante', 'map'), 'location-outline');
  assert.equal(businessCategoryIcon('Tacos', 'map'), 'taco');
  assert.equal(businessCategoryIcon('Elotes', 'map'), 'corn');
});

test('map detail progresses from grouped points to individual points to category pictograms', () => {
  assert.equal(mapMarkerDetail(0.1), 'cluster');
  assert.equal(mapMarkerDetail(0.012), 'dot');
  assert.equal(mapMarkerDetail(0.004), 'icon');
  assert.equal(mapMarkerDetail(0.018), 'dot');
  assert.equal(mapMarkerDetail(0.006), 'icon');
  for (const invalid of [0, -1, NaN, Infinity]) assert.equal(mapMarkerDetail(invalid), 'dot');
});
