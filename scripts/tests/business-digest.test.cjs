/* global __dirname */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
function load(relative) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', output)(() => ({}), module, module.exports);
  return module.exports;
}
const digest = load('supabase/functions/_shared/digest.ts');
const { routeForNotification } = load('lib/notification-routes.ts');

const row = (overrides = {}) => ({
  negocio_id: 'n1', owner_id: 'u1', nombre: 'Fonda Lupita', views_today: 34,
  published_today: true, active_month: true, horario_semanal: null, ...overrides,
});

test('18:00 summary: only places someone saw today, in the v4 copy', () => {
  const messages = digest.summaryMessages([row(), row({ negocio_id: 'n2', owner_id: 'u2', views_today: 0 }), row({ negocio_id: 'n3', owner_id: 'u3', views_today: 1 })]);
  assert.deepEqual(messages.map((message) => message.body), ['34 personas vieron tu menú.', '1 persona vio tu menú.']);
  assert.equal(messages[0].title, 'Hoy');
  assert.deepEqual(routeForNotification(messages[0].data), { pathname: '/hoy' });
});

test('Mexico City weekday', () => {
  // 2026-11-09 05:00 UTC is still Sunday night in CDMX (UTC−6).
  assert.equal(digest.cdmxWeekday(new Date('2026-11-09T05:00:00Z')), 0);
  assert.equal(digest.cdmxWeekday(new Date('2026-11-09T07:00:00Z')), 1);
});
