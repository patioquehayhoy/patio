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

test('morning summary: only places someone saw yesterday', () => {
  const messages = digest.summaryMessages([row(), row({ negocio_id: 'n2', owner_id: 'u2', views_today: 0 }), row({ negocio_id: 'n3', owner_id: 'u3', views_today: 1 })]);
  assert.deepEqual(messages.map((message) => message.body), ['34 personas vieron tu menú.', '1 persona vio tu menú.']);
  assert.equal(messages[0].title, 'Ayer');
  assert.deepEqual(routeForNotification(messages[0].data), { pathname: '/hoy' });
  const unpublished = digest.summaryMessages([row({ published_today: false })]);
  assert.deepEqual(routeForNotification(unpublished[0].data), { pathname: '/menu-editar', params: { desde: 'ultimo' } });
});

test('Mexico City weekday', () => {
  // 2026-11-09 05:00 UTC is still Sunday night in CDMX (UTC−6).
  assert.equal(digest.cdmxWeekday(new Date('2026-11-09T05:00:00Z')), 0);
  assert.equal(digest.cdmxWeekday(new Date('2026-11-09T07:00:00Z')), 1);
});

test('the morning summary arrives at the hour of the phone publish reminder, never on closed days', () => {
  const week = Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: dia === 0, abre: dia === 0 ? null : '13:00', cierra: null }));
  const breakfast = week.map((day) => ({ ...day, abre: day.cerrado ? null : '07:00' }));
  const rows = [row({ negocio_id: 'lunch', horario_semanal: week }), row({ negocio_id: 'breakfast', horario_semanal: breakfast }), row({ negocio_id: 'none' })];
  // Lunes 23 nov 2026: 18:00 UTC = 12:00 CDMX; 13:00 UTC = 7:00; 16:00 UTC = 10:00.
  assert.deepEqual(digest.dueThisHour(rows, new Date('2026-11-23T18:00:00Z')).map((r) => r.negocio_id), ['lunch']);
  assert.deepEqual(digest.dueThisHour(rows, new Date('2026-11-23T13:00:00Z')).map((r) => r.negocio_id), ['breakfast']);
  assert.deepEqual(digest.dueThisHour(rows, new Date('2026-11-23T16:00:00Z')).map((r) => r.negocio_id), ['none']);
  // Domingo cerrado: nada para lunch ni breakfast.
  assert.deepEqual(digest.dueThisHour(rows, new Date('2026-11-22T18:00:00Z')).map((r) => r.negocio_id), []);
});

test('server and phone use the same publish reminder rule', () => {
  const file = fs.readFileSync(path.join(root, 'lib/publish-timing.ts'), 'utf8');
  for (const [abre, expected] of [['13:00', 720], ['07:30', 420], ['08:30', 450], ['11:15', 615]]) {
    const horario = [{ dia: 1, cerrado: false, abre, cierra: '18:00' }];
    assert.equal(digest.publishReminderMinute(horario, 1), expected);
  }
  assert.match(file, /PUBLISH_LEAD_MIN = 60/);
  assert.match(file, /PUBLISH_EARLIEST_MIN = 7 \* 60/);
  assert.match(file, /PUBLISH_LATEST_MIN = 12 \* 60/);
});

test('followers are not pushed when a place publishes after closing or at night', () => {
  const { followersShouldHear } = load('supabase/functions/_shared/publication-window.ts');
  const week = Array.from({ length: 7 }, (_, dia) => ({ dia, cerrado: dia === 0, abre: '13:00', cierra: '18:00' }));
  // Lunes 23 nov 2026 (CDMX = UTC−6).
  assert.equal(followersShouldHear(week, new Date('2026-11-23T15:00:00Z')), true);  // 9:00, antes de abrir
  assert.equal(followersShouldHear(week, new Date('2026-11-23T21:00:00Z')), true);  // 15:00, abierto
  assert.equal(followersShouldHear(week, new Date('2026-11-24T00:30:00Z')), false); // 18:30, ya cerró
  assert.equal(followersShouldHear(week, new Date('2026-11-22T18:00:00Z')), false); // domingo cerrado
  const night = week.map((day) => ({ ...day, abre: '20:00', cierra: '03:00' }));
  assert.equal(followersShouldHear(night, new Date('2026-11-24T04:00:00Z')), true); // 22:00, turno de noche
  assert.equal(followersShouldHear(null, new Date('2026-11-24T04:00:00Z')), false); // 22:00 sin horario
  assert.equal(followersShouldHear(null, new Date('2026-11-23T18:00:00Z')), true);
});
