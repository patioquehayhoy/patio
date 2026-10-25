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

test('every giro uses one family: the PatioGiros font glyphs', () => {
  const codepoints = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../design-source/patio-giros/codepoints.json'), 'utf8'));
  const component = fs.readFileSync(path.resolve(__dirname, '../../components/business-category-icon.tsx'), 'utf8');
  assert.ok(fs.readFileSync(path.resolve(__dirname, '../../assets/fonts/PatioGiros.ttf')).length > 1000, 'PatioGiros font ships with the app');
  for (const [name, code] of Object.entries(codepoints)) {
    assert.match(component, new RegExp(`${name}: 0x${code.toString(16)}\\b`), `${name} codepoint matches the built font`);
  }
  assert.equal(Object.keys(BUSINESS_CATEGORY_ICONS).length, 12);
  for (const [type, name] of Object.entries(BUSINESS_CATEGORY_ICONS)) {
    assert.ok(codepoints[name], `${type}: glyph must exist in the shipped font`);
    assert.equal(businessCategoryIcon(type), name);
  }
  for (const label of ['Tacos al pastor', 'Taquería']) assert.equal(businessCategoryIcon(label), 'tacos');
  for (const label of ['Elotes', 'Esquites']) assert.equal(businessCategoryIcon(label), 'elotes');
  assert.equal(businessCategoryIcon('Panadería'), 'postres');
  assert.equal(businessCategoryIcon('Cafetería'), 'cafeteria');
  assert.equal(businessCategoryIcon('Empanadas'), 'antojitos');
  assert.equal(businessCategoryIcon('Botanas', 'map'), 'botanas');
  assert.equal(businessCategoryIcon('Jugos y fruta', 'map'), 'jugos');
  assert.equal(businessCategoryIcon('Tamales'), 'otro');
  assert.equal(businessCategoryIcon('Tamales', 'map'), 'pin');
  assert.equal(businessCategoryIcon('Fondita', 'map'), 'pin');
  assert.equal(businessCategoryIcon('Restaurante', 'map'), 'pin');
});

test('map detail progresses from grouped points to individual points to category pictograms', () => {
  assert.equal(mapMarkerDetail(0.1), 'cluster');
  assert.equal(mapMarkerDetail(0.012), 'dot');
  assert.equal(mapMarkerDetail(0.004), 'icon');
  assert.equal(mapMarkerDetail(0.018), 'dot');
  assert.equal(mapMarkerDetail(0.006), 'icon');
  for (const invalid of [0, -1, NaN, Infinity]) assert.equal(mapMarkerDetail(invalid), 'dot');
});
