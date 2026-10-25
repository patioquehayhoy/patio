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

test('every giro uses Ionicons, the same family as the rest of the app', () => {
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');
  assert.equal(Object.keys(BUSINESS_CATEGORY_ICONS).length, 12);
  for (const [type, name] of Object.entries(BUSINESS_CATEGORY_ICONS)) {
    assert.ok(glyphs[name] || name === 'patio-jugos', `${type}: ${name} must exist in Ionicons`);
    assert.equal(businessCategoryIcon(type), name);
  }
  assert.equal(new Set(Object.values(BUSINESS_CATEGORY_ICONS)).size, 12, 'each giro has its own icon');
  for (const label of ['Tacos al pastor', 'Taquería']) assert.equal(businessCategoryIcon(label), 'flame-outline');
  for (const label of ['Elotes', 'Esquites']) assert.equal(businessCategoryIcon(label), 'leaf-outline');
  assert.equal(businessCategoryIcon('Panadería'), 'ice-cream-outline');
  assert.equal(businessCategoryIcon('Cafetería'), 'cafe-outline');
  assert.equal(businessCategoryIcon('Empanadas'), 'fast-food-outline');
  assert.equal(businessCategoryIcon('Jugos y fruta', 'map'), 'patio-jugos');
  assert.equal(businessCategoryIcon('Tamales'), 'ellipsis-horizontal');
  assert.equal(businessCategoryIcon('Tamales', 'map'), 'location-outline');
  assert.equal(businessCategoryIcon('Fondita', 'map'), 'location-outline');
});

test('map detail progresses from grouped points to individual points to category pictograms', () => {
  assert.equal(mapMarkerDetail(0.1), 'cluster');
  assert.equal(mapMarkerDetail(0.012), 'dot');
  assert.equal(mapMarkerDetail(0.004), 'icon');
  assert.equal(mapMarkerDetail(0.018), 'dot');
  assert.equal(mapMarkerDetail(0.006), 'icon');
  for (const invalid of [0, -1, NaN, Infinity]) assert.equal(mapMarkerDetail(invalid), 'dot');
});
